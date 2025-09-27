import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateProofHash(from_user: string, to_user: string, credits: number, timestamp: string): string {
  const data = `${from_user}${to_user}${credits}${timestamp}`;
  // Simple hash for demo purposes (in production, use crypto)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from_user, to_user, credits, client_tx_id } = await req.json();
    
    console.log('Processing wallet transfer:', { from_user, to_user, credits, client_tx_id });
    
    if (!from_user || !to_user || !credits || !client_tx_id) {
      return new Response(JSON.stringify({ 
        error: 'from_user, to_user, credits, and client_tx_id are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (credits <= 0) {
      return new Response(JSON.stringify({ 
        error: 'credits must be greater than 0' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (from_user === to_user) {
      return new Response(JSON.stringify({ 
        error: 'Cannot transfer credits to yourself' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing transaction with same client_tx_id (idempotency)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('client_tx_id', client_tx_id)
      .single();

    if (existingTx) {
      console.log('Transaction already exists, returning existing result');
      return new Response(JSON.stringify({ 
        success: true,
        transaction_id: existingTx.id,
        message: 'Transaction already processed',
        existing: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start transaction
    const { data, error } = await supabase.rpc('transfer_credits', {
      p_from_user: from_user,
      p_to_user: to_user,
      p_credits: credits,
      p_client_tx_id: client_tx_id
    });

    if (error) {
      console.error('Transfer RPC error:', error);
      
      // Handle specific error cases
      if (error.message.includes('insufficient_balance')) {
        return new Response(JSON.stringify({ 
          error: 'Saldo insuficiente para realizar la transferencia' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (error.message.includes('user_not_found')) {
        return new Response(JSON.stringify({ 
          error: 'Usuario destinatario no encontrado' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw error;
    }

    // If RPC doesn't exist, do manual transaction
    if (!data) {
      // Manual implementation
      const timestamp = new Date().toISOString();
      const proofHash = generateProofHash(from_user, to_user, credits, timestamp);

      // Check sender balance
      const { data: fromWallet, error: fromError } = await supabase
        .from('wallets')
        .select('balance_credits')
        .eq('user_id', from_user)
        .single();

      if (fromError || !fromWallet) {
        return new Response(JSON.stringify({ 
          error: 'Wallet del remitente no encontrado' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (fromWallet.balance_credits < credits) {
        return new Response(JSON.stringify({ 
          error: 'Saldo insuficiente para realizar la transferencia' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check recipient exists
      const { data: toWallet, error: toError } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('user_id', to_user)
        .single();

      if (toError || !toWallet) {
        return new Response(JSON.stringify({ 
          error: 'Usuario destinatario no encontrado' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          client_tx_id,
          from_user,
          to_user,
          credits,
          source: 'wallet_transfer',
          proof_hash: proofHash,
          ts: timestamp
        })
        .select()
        .single();

      if (txError) {
        console.error('Error creating transaction:', txError);
        return new Response(JSON.stringify({ error: 'Error procesando transacción' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update balances
      const { data: currentToBalance } = await supabase
        .from('wallets')
        .select('balance_credits')
        .eq('user_id', to_user)
        .single();

      const [fromUpdate, toUpdate] = await Promise.all([
        supabase
          .from('wallets')
          .update({ balance_credits: fromWallet.balance_credits - credits })
          .eq('user_id', from_user),
        supabase
          .from('wallets')
          .update({ balance_credits: (currentToBalance?.balance_credits || 0) + credits })
          .eq('user_id', to_user)
      ]);

      if (fromUpdate.error || toUpdate.error) {
        console.error('Error updating balances:', fromUpdate.error, toUpdate.error);
        // In production, this would need transaction rollback
        return new Response(JSON.stringify({ error: 'Error actualizando saldos' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Transfer completed successfully');

      return new Response(JSON.stringify({ 
        success: true,
        transaction_id: transaction.id,
        proof_hash: proofHash,
        message: 'Transferencia completada exitosamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      result: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wallet_transfer function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: `Error interno del servidor: ${errorMessage}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});