import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface HydroState {
  id: string;
  ts: string;
  inflow_m3s: number;
  outflow_m3s: number;
  reservoir_level_m: number;
  turbine_mw: number;
  energy_mwh: number;
  gates_pct: number;
}

interface Forecast {
  id: string;
  ts: string;
  horizon_h: number;
  inflow_pred_m3s: number;
  energy_pred_mwh: number;
}

export function useHydroData() {
  const [hydroState, setHydroState] = useState<HydroState[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchHydroData();
  }, []);

  // Real-time subscription for hydro_state updates
  useRealtimeSubscription(
    { table: 'hydro_state', event: 'INSERT' },
    (payload) => {
      const newRecord = payload.new as HydroState;
      setHydroState(prev => [newRecord, ...prev.slice(0, 47)]); // Keep last 48 hours
    }
  );

  // Real-time subscription for forecasts updates
  useRealtimeSubscription(
    { table: 'forecasts', event: 'INSERT' },
    (payload) => {
      const newRecord = payload.new as Forecast;
      setForecasts(prev => [newRecord, ...prev.slice(0, 167)]); // Keep last 7 days * 24 hours
    }
  );

  const fetchHydroData = async () => {
    try {
      setLoading(true);
      
      // Fetch last 24h of hydro state
      const { data: hydroData, error: hydroError } = await supabase
        .from('hydro_state')
        .select('*')
        .order('ts', { ascending: false })
        .limit(48); // 48 hours

      if (hydroError) throw hydroError;

      // Fetch 7-day forecasts
      const { data: forecastData, error: forecastError } = await supabase
        .from('forecasts')
        .select('*')
        .order('ts', { ascending: false })
        .limit(168); // 7 days * 24 hours

      if (forecastError) throw forecastError;

      // If no data exists, seed some demo data
      if (!hydroData || hydroData.length === 0) {
        console.log('No hydro data found, seeding demo data...');
        await simulateScenario('lluvia', 0.3, 1);
        return; // fetchHydroData will be called again by simulateScenario
      }

      setHydroState(hydroData || []);
      setForecasts(forecastData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching hydro data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const simulateScenario = async (scenario: 'sequia' | 'lluvia', severity: number, days: number = 7) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemelo_simulate', {
        body: { scenario, severity, days }
      });

      if (error) throw error;

      // Refresh data after simulation
      await fetchHydroData();
      
      return data;
    } catch (err) {
      console.error('Error simulating scenario:', err);
      throw err;
    }
  };

  return {
    hydroState,
    forecasts,
    loading,
    error,
    simulateScenario,
    refetch: fetchHydroData
  };
}