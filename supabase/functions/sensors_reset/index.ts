import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Thresholds to identify simulated data (extreme values)
const SIMULATION_THRESHOLDS = {
  CO2: 800,    // Values above 800 ppm are likely simulated
  NOx: 100,    // Values above 100 ppm are likely simulated
  PM25: 100,   // Values above 100 µg/m³ are likely simulated
  SO2: 1.5,    // Values above 1.5 ppm are likely simulated
  NO: 0.15,    // Values above 0.15 ppm are likely simulated
  NO2: 0.25,   // Values above 0.25 ppm are likely simulated
  CO: 20,      // Values above 20 ppm are likely simulated
  PM10: 150,   // Values above 150 µg/m³ are likely simulated
  O3: 0.25,    // Values above 0.25 ppm are likely simulated
  TEMP: 50,    // Values above 50°C are likely simulated
  HUM: 95      // Values above 95% are likely simulated
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reset_type = 'simulation_only' } = await req.json();
    
    console.log('Starting sensor data reset:', { reset_type });

    let deletedTelemetry = 0;
    let deletedAlerts = 0;

    if (reset_type === 'simulation_only') {
      // Delete only simulated telemetry data (extreme values)
      const { data: extremeTelemetry, error: selectError } = await supabase
        .from('telemetry')
        .select('id')
        .or(
          `co2_ppm.gte.${SIMULATION_THRESHOLDS.CO2},` +
          `nox_ppm.gte.${SIMULATION_THRESHOLDS.NOx},` +
          `pm25_ug_m3.gte.${SIMULATION_THRESHOLDS.PM25},` +
          `so2_ppm.gte.${SIMULATION_THRESHOLDS.SO2},` +
          `no_ppm.gte.${SIMULATION_THRESHOLDS.NO},` +
          `no2_ppm.gte.${SIMULATION_THRESHOLDS.NO2},` +
          `co_ppm.gte.${SIMULATION_THRESHOLDS.CO},` +
          `pm10_ug_m3.gte.${SIMULATION_THRESHOLDS.PM10},` +
          `o3_ppm.gte.${SIMULATION_THRESHOLDS.O3},` +
          `temp_c.gte.${SIMULATION_THRESHOLDS.TEMP},` +
          `humidity_pct.gte.${SIMULATION_THRESHOLDS.HUM}`
        );

      if (selectError) {
        throw new Error(`Error selecting extreme telemetry: ${selectError.message}`);
      }

      if (extremeTelemetry && extremeTelemetry.length > 0) {
        const extremeIds = extremeTelemetry.map(t => t.id);
        
        const { error: deleteError } = await supabase
          .from('telemetry')
          .delete()
          .in('id', extremeIds);

        if (deleteError) {
          throw new Error(`Error deleting extreme telemetry: ${deleteError.message}`);
        }

        deletedTelemetry = extremeTelemetry.length;
        console.log(`Deleted ${deletedTelemetry} extreme telemetry records`);
      }

      // Delete simulation-related alerts
      const { data: simulationAlerts, error: alertsSelectError } = await supabase
        .from('alerts')
        .select('id')
        .or(
          'kind.like.*CRITICAL*,' +
          'kind.like.*WARNING*,' +
          'kind.like.*SIMULATION*,' +
          'message.like.*crítico*,' +
          'message.like.*elevado*'
        );

      if (alertsSelectError) {
        throw new Error(`Error selecting simulation alerts: ${alertsSelectError.message}`);
      }

      if (simulationAlerts && simulationAlerts.length > 0) {
        const alertIds = simulationAlerts.map(a => a.id);
        
        const { error: deleteAlertsError } = await supabase
          .from('alerts')
          .delete()
          .in('id', alertIds);

        if (deleteAlertsError) {
          throw new Error(`Error deleting simulation alerts: ${deleteAlertsError.message}`);
        }

        deletedAlerts = simulationAlerts.length;
        console.log(`Deleted ${deletedAlerts} simulation alerts`);
      }

    } else if (reset_type === 'all_recent') {
      // Delete all telemetry from last 24 hours (more aggressive reset)
      const { data: recentTelemetry, error: recentSelectError } = await supabase
        .from('telemetry')
        .select('id')
        .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentSelectError) {
        throw new Error(`Error selecting recent telemetry: ${recentSelectError.message}`);
      }

      if (recentTelemetry && recentTelemetry.length > 0) {
        const recentIds = recentTelemetry.map(t => t.id);
        
        const { error: deleteRecentError } = await supabase
          .from('telemetry')
          .delete()
          .in('id', recentIds);

        if (deleteRecentError) {
          throw new Error(`Error deleting recent telemetry: ${deleteRecentError.message}`);
        }

        deletedTelemetry = recentTelemetry.length;
        console.log(`Deleted ${deletedTelemetry} recent telemetry records`);
      }

      // Delete all recent alerts
      const { data: recentAlerts, error: recentAlertsError } = await supabase
        .from('alerts')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentAlertsError) {
        throw new Error(`Error selecting recent alerts: ${recentAlertsError.message}`);
      }

      if (recentAlerts && recentAlerts.length > 0) {
        const alertIds = recentAlerts.map(a => a.id);
        
        const { error: deleteAlertsError } = await supabase
          .from('alerts')
          .delete()
          .in('id', alertIds);

        if (deleteAlertsError) {
          throw new Error(`Error deleting recent alerts: ${deleteAlertsError.message}`);
        }

        deletedAlerts = recentAlerts.length;
        console.log(`Deleted ${deletedAlerts} recent alerts`);
      }
    }

    // Generate a summary alert about the reset
    await supabase
      .from('alerts')
      .insert({
        plant_id: (await supabase.from('plants').select('id').limit(1).single()).data?.id,
        kind: 'SYSTEM_RESET',
        severity: 'info',
        message: `Sistema restablecido: ${deletedTelemetry} registros de telemetría y ${deletedAlerts} alertas eliminados`
      });

    console.log('Sensor data reset completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      reset_type,
      deleted_telemetry: deletedTelemetry,
      deleted_alerts: deletedAlerts,
      message: `Datos restablecidos: ${deletedTelemetry} lecturas y ${deletedAlerts} alertas eliminadas`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sensors_reset function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});