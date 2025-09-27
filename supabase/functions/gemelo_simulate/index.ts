import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulation parameters
const BASE_INFLOW = 25.0; // m³/s normal flow
const BASE_RESERVOIR = 120.0; // m normal level
const BASE_EFFICIENCY = 0.85; // turbine efficiency
const TURBINE_CAPACITY = 15.0; // MW max capacity

function generateTimeSeries(scenario: string, severity: number, days: number) {
  const dataPoints = [];
  const forecastPoints = [];
  const startTime = new Date();
  
  // Severity multiplier (0 = no impact, 1 = maximum impact)
  let inflowMultiplier = 1.0;
  let variability = 0.1;
  
  if (scenario === 'sequia') {
    inflowMultiplier = 1.0 - (severity * 0.6); // Up to 60% reduction
    variability = 0.05; // Less variability in drought
  } else if (scenario === 'lluvia') {
    inflowMultiplier = 1.0 + (severity * 0.8); // Up to 80% increase
    variability = 0.3; // More variability in rain
  }
  
  console.log(`Simulating ${scenario} with severity ${severity} for ${days} days`);
  console.log(`Inflow multiplier: ${inflowMultiplier}, Variability: ${variability}`);
  
  // Generate hourly data for the specified days
  for (let hour = 0; hour < days * 24; hour++) {
    const timestamp = new Date(startTime.getTime() + hour * 60 * 60 * 1000);
    
    // Add daily and seasonal patterns
    const dailyPattern = 1.0 + 0.2 * Math.sin((hour % 24) * Math.PI / 12);
    const seasonalPattern = 1.0 + 0.1 * Math.sin(hour * Math.PI / (24 * 30));
    
    // Add random variability
    const randomFactor = 1.0 + (Math.random() - 0.5) * variability;
    
    // Calculate inflow
    const inflow = BASE_INFLOW * inflowMultiplier * dailyPattern * seasonalPattern * randomFactor;
    
    // Calculate reservoir level based on inflow/outflow balance
    const outflow = Math.min(inflow * 0.9, BASE_INFLOW * 1.2); // Conservative outflow
    const levelChange = (inflow - outflow) * 0.01; // Simplified level calculation
    const reservoirLevel = Math.max(80, Math.min(150, BASE_RESERVOIR + levelChange * hour / 24));
    
    // Calculate turbine operation
    const gatesPct = Math.min(100, Math.max(20, (outflow / (BASE_INFLOW * 1.2)) * 100));
    const turbineMW = Math.min(TURBINE_CAPACITY, outflow * 0.4 * BASE_EFFICIENCY);
    const energyMWh = turbineMW * 1; // 1 hour of generation
    
    const dataPoint = {
      plant_id: null, // Will be set when inserting
      ts: timestamp.toISOString(),
      inflow_m3s: Math.round(inflow * 1000) / 1000,
      outflow_m3s: Math.round(outflow * 1000) / 1000,
      reservoir_level_m: Math.round(reservoirLevel * 100) / 100,
      gates_pct: Math.round(gatesPct * 10) / 10,
      turbine_mw: Math.round(turbineMW * 1000) / 1000,
      energy_mwh: Math.round(energyMWh * 10000) / 10000
    };
    
    dataPoints.push(dataPoint);
    
    // Generate forecasts for next 7 days every 6 hours
    if (hour % 6 === 0 && hour < (days - 7) * 24) {
      for (let forecastHour = 1; forecastHour <= 7 * 24; forecastHour++) {
        const forecastTime = new Date(timestamp.getTime() + forecastHour * 60 * 60 * 1000);
        const forecastInflow = inflow * (1 + (Math.random() - 0.5) * 0.2); // Add uncertainty
        const forecastEnergy = Math.min(TURBINE_CAPACITY, forecastInflow * 0.4 * BASE_EFFICIENCY);
        
        forecastPoints.push({
          plant_id: null,
          ts: timestamp.toISOString(),
          horizon_h: forecastHour,
          inflow_pred_m3s: Math.round(forecastInflow * 1000) / 1000,
          energy_pred_mwh: Math.round(forecastEnergy * 10000) / 10000
        });
      }
    }
  }
  
  return { dataPoints, forecastPoints };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, severity, days } = await req.json();
    
    console.log('Starting simulation:', { scenario, severity, days });
    
    if (!scenario || typeof severity !== 'number' || !days) {
      return new Response(JSON.stringify({ 
        error: 'scenario, severity (number), and days are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['sequia', 'lluvia'].includes(scenario)) {
      return new Response(JSON.stringify({ 
        error: 'scenario must be "sequia" or "lluvia"' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (severity < 0 || severity > 1) {
      return new Response(JSON.stringify({ 
        error: 'severity must be between 0 and 1' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the first plant (for demo purposes)
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('id')
      .limit(1)
      .single();

    if (plantError || !plant) {
      return new Response(JSON.stringify({ error: 'No plant found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate simulation data
    const { dataPoints, forecastPoints } = generateTimeSeries(scenario, severity, days);
    
    // Set plant_id for all data points
    dataPoints.forEach(point => point.plant_id = plant.id);
    forecastPoints.forEach(point => point.plant_id = plant.id);

    console.log(`Generated ${dataPoints.length} hydro state points and ${forecastPoints.length} forecast points`);

    // Insert hydro state data in batches
    const batchSize = 100;
    let insertedHydroStates = 0;
    
    for (let i = 0; i < dataPoints.length; i += batchSize) {
      const batch = dataPoints.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('hydro_state')
        .insert(batch)
        .select();
      
      if (error) {
        console.error('Error inserting hydro state batch:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        // Continue with next batch
      } else {
        insertedHydroStates += batch.length;
        console.log(`Successfully inserted ${batch.length} hydro state records`);
      }
    }

    // Insert forecast data in batches
    let insertedForecasts = 0;
    
    for (let i = 0; i < forecastPoints.length; i += batchSize) {
      const batch = forecastPoints.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('forecasts')
        .insert(batch)
        .select();
      
      if (error) {
        console.error('Error inserting forecast batch:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        // Continue with next batch
      } else {
        insertedForecasts += batch.length;
        console.log(`Successfully inserted ${batch.length} forecast records`);
      }
    }

    // Create simulation summary alert
    const severityText = severity < 0.3 ? 'leve' : severity < 0.7 ? 'moderada' : 'severa';
    const summaryMessage = scenario === 'sequia' 
      ? `Simulación de sequía ${severityText}: Reducción del caudal del ${Math.round(severity * 60)}%. Considere activar fuentes de respaldo.`
      : `Simulación de lluvia ${severityText}: Aumento del caudal del ${Math.round(severity * 80)}%. Monitoree niveles del embalse.`;

    await supabase
      .from('alerts')
      .insert({
        plant_id: plant.id,
        kind: `SIMULATION_${scenario.toUpperCase()}`,
        severity: severity > 0.7 ? 'critical' : 'info',
        message: summaryMessage
      });

    console.log('Simulation completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      scenario,
      severity,
      days,
      inserted_hydro_states: insertedHydroStates,
      inserted_forecasts: insertedForecasts,
      message: summaryMessage,
      timeseries: dataPoints.slice(0, 24) // Return first 24 hours for preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemelo_simulate function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});