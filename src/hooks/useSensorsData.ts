import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface SensorReading {
  id: string;
  sensor_id: string;
  ts: string;
  co2_ppm: number | null;
  nox_ppm: number | null;
  pm25_ug_m3: number | null;
  temp_c: number | null;
  humidity_pct: number | null;
  so2_ppm: number | null;
  no_ppm: number | null;
  no2_ppm: number | null;
  co_ppm: number | null;
  pm10_ug_m3: number | null;
  o3_ppm: number | null;
}

interface Sensor {
  id: string;
  kind: string;
  unit: string;
  is_active: boolean;
  plant_id: string;
}

export function useSensorsData() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [latestReadings, setLatestReadings] = useState<SensorReading[]>([]);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription for new telemetry data
  useRealtimeSubscription(
    { table: 'telemetry', event: 'INSERT' },
    (payload) => {
      const newReading = payload.new as SensorReading;
      setLatestReadings(prev => {
        const filtered = prev.filter(r => r.sensor_id !== newReading.sensor_id);
        return [newReading, ...filtered];
      });
      setHistoricalData(prev => [newReading, ...prev.slice(0, 999)]);
    }
  );

  const fetchSensorsData = async () => {
    try {
      setLoading(true);
      
      // Fetch sensors
      const { data: sensorsData, error: sensorsError } = await supabase
        .from('sensors')
        .select('*')
        .eq('is_active', true);

      if (sensorsError) throw sensorsError;

      // Fetch latest readings per sensor using DISTINCT ON approach
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('telemetry')
        .select('*')
        .order('ts', { ascending: false })
        .limit(50);
      
      if (fallbackError) throw fallbackError;
      
      // Group by sensor_id and get latest
      const latestBySensor = fallbackData?.reduce((acc, reading) => {
        if (!acc[reading.sensor_id] || acc[reading.sensor_id].ts < reading.ts) {
          acc[reading.sensor_id] = reading;
        }
        return acc;
      }, {} as Record<string, SensorReading>) || {};
      
      setLatestReadings(Object.values(latestBySensor));

      // Fetch historical data (last 24h)
      const { data: historicalTelemetry, error: histError } = await supabase
        .from('telemetry')
        .select('*')
        .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('ts', { ascending: false })
        .limit(1000);

      if (histError) throw histError;

      setSensors(sensorsData || []);
      setHistoricalData(historicalTelemetry || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching sensors data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const simulatePeak = async (severity: number = 0.9) => {
    try {
      const { data, error } = await supabase.functions.invoke('sensors_ingest', {
        body: { 
          simulation: true,
          severity,
          sensor_type: 'air_quality'
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      // Refresh data after simulation
      setTimeout(() => fetchSensorsData(), 1000);
      
      return { success: true, data };
    } catch (err) {
      console.error('Error simulating peak:', err);
      throw err;
    }
  };

  const resetToNormal = async (resetType: 'simulation_only' | 'all_recent' = 'simulation_only') => {
    try {
      const { data, error } = await supabase.functions.invoke('sensors_reset', {
        body: { 
          reset_type: resetType
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      // Refresh data after reset
      setTimeout(() => fetchSensorsData(), 1000);
      
      return { success: true, data };
    } catch (err) {
      console.error('Error resetting sensor data:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSensorsData();
  }, []);

  const getHealthStatus = (reading: SensorReading) => {
    if (!reading) return { status: 'unknown', color: 'gray' };

    const thresholds = {
      co2_ppm: { warning: 600, critical: 1000 },
      nox_ppm: { warning: 80, critical: 120 },
      pm25_ug_m3: { warning: 25, critical: 50 },
      so2_ppm: { warning: 0.5, critical: 1.0 },
      no_ppm: { warning: 0.05, critical: 0.1 },
      no2_ppm: { warning: 0.08, critical: 0.15 },
      co_ppm: { warning: 5.0, critical: 15.0 },
      pm10_ug_m3: { warning: 50, critical: 100 },
      o3_ppm: { warning: 0.12, critical: 0.2 }
    };

    let maxSeverity = 'good';
    let score = 0;

    Object.entries(thresholds).forEach(([key, threshold]) => {
      const value = reading[key as keyof typeof thresholds];
      if (value !== null && value !== undefined) {
        if (value > threshold.critical) {
          maxSeverity = 'critical';
          score = Math.max(score, 1.0);
        } else if (value > threshold.warning) {
          maxSeverity = maxSeverity === 'critical' ? 'critical' : 'warning';
          score = Math.max(score, 0.7);
        }
      }
    });

    return {
      status: maxSeverity,
      color: maxSeverity === 'good' ? 'green' : 
             maxSeverity === 'warning' ? 'yellow' : 'red',
      score
    };
  };

  return {
    sensors,
    latestReadings,
    historicalData,
    loading,
    error,
    simulatePeak,
    resetToNormal,
    getHealthStatus,
    refetch: fetchSensorsData
  };
}