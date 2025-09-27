import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Threshold values for alerts
const THRESHOLDS = {
  CO2: { warning: 350, critical: 400 },
  NOx: { warning: 40, critical: 50 },
  PM25: { warning: 25, critical: 35 },
  TEMP: { warning: 35, critical: 40 },
  HUM: { warning: 85, critical: 95 },
  SO2: { warning: 0.5, critical: 1.0 },
  NO: { warning: 0.05, critical: 0.1 },
  NO2: { warning: 0.08, critical: 0.15 },
  CO: { warning: 5.0, critical: 15.0 },
  PM10: { warning: 50, critical: 100 },
  O3: { warning: 0.12, critical: 0.2 }
};

async function checkThresholds(telemetryData: any, sensorData: any) {
  const alerts = [];
  
  const checks = [
    { value: telemetryData.co2_ppm, type: 'CO2', unit: 'ppm' },
    { value: telemetryData.nox_ppm, type: 'NOx', unit: 'ppm' },
    { value: telemetryData.pm25_ug_m3, type: 'PM25', unit: 'µg/m³' },
    { value: telemetryData.temp_c, type: 'TEMP', unit: '°C' },
    { value: telemetryData.humidity_pct, type: 'HUM', unit: '%' },
    { value: telemetryData.so2_ppm, type: 'SO2', unit: 'ppm' },
    { value: telemetryData.no_ppm, type: 'NO', unit: 'ppm' },
    { value: telemetryData.no2_ppm, type: 'NO2', unit: 'ppm' },
    { value: telemetryData.co_ppm, type: 'CO', unit: 'ppm' },
    { value: telemetryData.pm10_ug_m3, type: 'PM10', unit: 'µg/m³' },
    { value: telemetryData.o3_ppm, type: 'O3', unit: 'ppm' }
  ];

  for (const check of checks) {
    if (check.value !== null && check.value !== undefined) {
      const threshold = THRESHOLDS[check.type as keyof typeof THRESHOLDS];
      
      if (check.value >= threshold.critical) {
        alerts.push({
          plant_id: sensorData.plant_id,
          kind: `${check.type}_CRITICAL`,
          severity: 'critical' as const,
          message: `${check.type} crítico: ${check.value} ${check.unit} (límite: ${threshold.critical} ${check.unit})`
        });
      } else if (check.value >= threshold.warning) {
        alerts.push({
          plant_id: sensorData.plant_id,
          kind: `${check.type}_WARNING`,
          severity: 'warning' as const,
          message: `${check.type} elevado: ${check.value} ${check.unit} (límite: ${threshold.warning} ${check.unit})`
        });
      }
    }
  }

  // Insert alerts if any
  if (alerts.length > 0) {
    const { error } = await supabase
      .from('alerts')
      .insert(alerts);
    
    if (error) {
      console.error('Error inserting alerts:', error);
    } else {
      console.log(`Created ${alerts.length} alerts`);
    }
  }

  return alerts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received payload:', body);
    
    // Handle simulation payload
    if (body.simulation) {
      const { severity = 0.9, sensor_type = 'air_quality' } = body;
      
      // Get first active sensor for simulation
      const { data: sensors, error: sensorsError } = await supabase
        .from('sensors')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
        
      if (sensorsError || !sensors) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'No sensors available for simulation' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Generate high values based on severity
      const simulatedData = {
        sensor_id: sensors.id,
        ts: new Date().toISOString(),
        co2_ppm: Math.round(400 + (severity * 800)), // 400-1200 ppm
        nox_ppm: Math.round(50 + (severity * 100)), // 50-150 ppm  
        pm25_ug_m3: Math.round(35 + (severity * 150)), // 35-185 µg/m³
        temp_c: Math.round(25 + (severity * 20)), // 25-45°C
        humidity_pct: Math.round(30 + (severity * 50)), // 30-80%
        so2_ppm: Math.round((0.5 + (severity * 1.5)) * 1000) / 1000, // 0.5-2.0 ppm
        no_ppm: Math.round((0.05 + (severity * 0.15)) * 1000) / 1000, // 0.05-0.2 ppm
        no2_ppm: Math.round((0.08 + (severity * 0.22)) * 1000) / 1000, // 0.08-0.3 ppm
        co_ppm: Math.round((5 + (severity * 20)) * 100) / 100, // 5-25 ppm
        pm10_ug_m3: Math.round(50 + (severity * 150)), // 50-200 µg/m³
        o3_ppm: Math.round((0.12 + (severity * 0.18)) * 1000) / 1000 // 0.12-0.3 ppm
      };
      
      console.log('Simulating peak with data:', simulatedData);
      
      // Insert simulated telemetry
      const { data, error } = await supabase
        .from('telemetry')
        .insert(simulatedData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting simulated telemetry:', error);
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Failed to insert simulated data' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check thresholds and create alerts
      const alerts = await checkThresholds(simulatedData, sensors);

      return new Response(JSON.stringify({ 
        ok: true,
        inserted: 1,
        telemetry_id: data.id,
        alerts_created: alerts.length,
        alerts: alerts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle regular sensor data payload
    const { 
      sensor_id, timestamp, CO2_ppm, NOx_ppm, PM25_ug_m3, temp_C, humidity_pct,
      SO2_ppm, NO_ppm, NO2_ppm, CO_ppm, PM10_ug_m3, O3_ppm 
    } = body;
    
    console.log('Ingesting sensor data:', { sensor_id, timestamp, CO2_ppm, NOx_ppm, PM25_ug_m3, temp_C, humidity_pct });
    
    if (!sensor_id) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'sensor_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get sensor info
    const { data: sensor, error: sensorError } = await supabase
      .from('sensors')
      .select('*, plants(*)')
      .eq('id', sensor_id)
      .single();

    if (sensorError || !sensor) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Sensor not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare telemetry data
    const telemetryData = {
      sensor_id,
      ts: timestamp || new Date().toISOString(),
      co2_ppm: CO2_ppm || null,
      nox_ppm: NOx_ppm || null,
      pm25_ug_m3: PM25_ug_m3 || null,
      temp_c: temp_C || null,
      humidity_pct: humidity_pct || null,
      so2_ppm: SO2_ppm || null,
      no_ppm: NO_ppm || null,
      no2_ppm: NO2_ppm || null,
      co_ppm: CO_ppm || null,
      pm10_ug_m3: PM10_ug_m3 || null,
      o3_ppm: O3_ppm || null
    };

    // Insert telemetry data
    const { data, error } = await supabase
      .from('telemetry')
      .insert(telemetryData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting telemetry:', error);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Failed to insert telemetry data' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check thresholds and create alerts
    const alerts = await checkThresholds(telemetryData, sensor);

    console.log('Telemetry data inserted successfully');

    return new Response(JSON.stringify({ 
      ok: true,
      inserted: 1,
      telemetry_id: data.id,
      alerts_created: alerts.length,
      alerts: alerts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sensors_ingest function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});