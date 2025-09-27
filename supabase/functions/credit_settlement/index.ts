import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { generator_id, consumption_wh, generation_wh } = await req.json();
    console.log('Credits settlement request:', { generator_id, consumption_wh, generation_wh });

    if (!generator_id || consumption_wh === undefined || generation_wh === undefined) {
      throw new Error('Missing required fields: generator_id, consumption_wh, generation_wh');
    }

    // Validate positive values
    if (consumption_wh < 0 || generation_wh < 0) {
      throw new Error('Energy values must be positive');
    }

    // Get generator info
    const { data: generator, error: generatorError } = await supabase
      .from('generators')
      .select('*')
      .eq('id', generator_id)
      .single();

    if (generatorError || !generator) {
      throw new Error('Generator not found');
    }

    // Calculate surplus energy (generation - consumption)
    const excedente_wh = generation_wh - consumption_wh;
    console.log('Calculated surplus:', excedente_wh, 'Wh');

    // Only process if there's surplus energy
    if (excedente_wh <= 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No surplus energy to convert to credits',
        excedente_wh: 0,
        credits_awarded: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert surplus to credits (1 credit = 100 Wh by default)
    const credits_per_wh = 0.01; // 1 credit per 100 Wh
    const credits_awarded = Math.floor(excedente_wh * credits_per_wh);
    
    console.log('Credits to award:', credits_awarded);

    // Use database transaction for atomic operations
    const { data: transactionData, error: transactionError } = await supabase.rpc('process_credits_settlement', {
      p_generator_id: generator_id,
      p_consumption_wh: consumption_wh,
      p_generation_wh: generation_wh,
      p_excedente_wh: excedente_wh,
      p_credits_awarded: credits_awarded,
      p_owner_user_id: generator.owner_user_id
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      
      // Fallback to manual transaction
      const timestamp = new Date().toISOString();
      const client_tx_id = `settlement_${generator_id}_${Date.now()}`;

      // Insert excedente record
      const { error: excedenteError } = await supabase
        .from('excedentes')
        .insert({
          generator_id,
          consumption_wh,
          generation_wh,
          excedente_wh,
          ts: timestamp
        });

      if (excedenteError) {
        throw new Error(`Failed to record surplus: ${excedenteError.message}`);
      }

      // Update wallet balance using RPC for atomic operation
      const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
        p_user_id: generator.owner_user_id,
        p_credits: credits_awarded
      });

      if (walletError) {
        throw new Error(`Failed to update wallet: ${walletError.message}`);
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          from_user: null, // System generated
          to_user: generator.owner_user_id,
          credits: credits_awarded,
          source: 'generator',
          client_tx_id,
          proof_hash: `settlement_${generator_id}_${timestamp}`,
          ts: timestamp
        });

      if (txError) {
        throw new Error(`Failed to record transaction: ${txError.message}`);
      }
    }

    console.log('Credits settlement completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Credits settlement completed',
      generator_id,
      excedente_wh,
      credits_awarded,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Credits settlement error:', error);
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