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
    const { user_id, kiosk_id, credits, client_tx_id } = await req.json();
    console.log('Kiosk redemption request:', { user_id, kiosk_id, credits, client_tx_id });

    if (!user_id || !kiosk_id || !credits || !client_tx_id) {
      throw new Error('Missing required fields: user_id, kiosk_id, credits, client_tx_id');
    }

    if (credits <= 0) {
      throw new Error('Credits must be positive');
    }

    // Check for existing transaction (idempotency)
    const { data: existingTx } = await supabase
      .from('kiosk_redemptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('kiosk_id', kiosk_id)
      .eq('credits', credits)
      .eq('created_at', new Date().toISOString().split('T')[0]) // Same day
      .maybeSingle();

    if (existingTx) {
      console.log('Existing redemption found, returning success');
      return new Response(JSON.stringify({
        success: true,
        message: 'Redemption already processed',
        redemption: existingTx
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has sufficient balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_credits')
      .eq('user_id', user_id)
      .single();

    if (walletError || !wallet) {
      throw new Error('User wallet not found');
    }

    if (wallet.balance_credits < credits) {
      throw new Error(`Insufficient credits. Available: ${wallet.balance_credits}, Required: ${credits}`);
    }

    // Verify kiosk exists and has inventory (optional check)
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select('*')
      .eq('id', kiosk_id)
      .single();

    if (kioskError || !kiosk) {
      throw new Error('Kiosk not found');
    }

    // Check inventory if applicable (powerbanks example)
    if (kiosk.inventory_powerbanks !== null && kiosk.inventory_powerbanks <= 0) {
      throw new Error('Kiosk is out of stock');
    }

    const timestamp = new Date().toISOString();

    // Perform transaction atomically
    // 1. Deduct credits from user wallet using RPC for atomic operation
    const { error: walletUpdateError } = await supabase.rpc('decrement_wallet_balance', {
      p_user_id: user_id,
      p_credits: credits
    });

    if (walletUpdateError) {
      throw new Error(`Failed to deduct credits: ${walletUpdateError.message}`);
    }

    // 2. Record redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from('kiosk_redemptions')
      .insert({
        user_id,
        kiosk_id,
        credits,
        ts: timestamp
      })
      .select()
      .single();

    if (redemptionError) {
      // Rollback wallet update
      await supabase.rpc('increment_wallet_balance', {
        p_user_id: user_id,
        p_credits: credits
      });
      
      throw new Error(`Failed to record redemption: ${redemptionError.message}`);
    }

    // 3. Update kiosk inventory (if applicable)
    if (kiosk.inventory_powerbanks !== null && kiosk.inventory_powerbanks > 0) {
      const { error: inventoryError } = await supabase
        .from('kiosks')
        .update({
          inventory_powerbanks: kiosk.inventory_powerbanks - 1,
          updated_at: timestamp
        })
        .eq('id', kiosk_id);

      if (inventoryError) {
        console.warn('Failed to update kiosk inventory:', inventoryError.message);
        // Don't fail the transaction for inventory errors
      }
    }

    // 4. Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        from_user: user_id,
        to_user: null, // Kiosk/system
        credits: credits,
        source: 'kiosk_redemption',
        client_tx_id,
        proof_hash: `kiosk_${kiosk_id}_${timestamp}`,
        ts: timestamp
      });

    if (txError) {
      console.warn('Failed to record transaction:', txError.message);
      // Don't fail redemption for transaction record errors
    }

    console.log('Kiosk redemption completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Redemption completed successfully',
      redemption,
      remaining_balance: wallet.balance_credits - credits,
      timestamp
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Kiosk redemption error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});