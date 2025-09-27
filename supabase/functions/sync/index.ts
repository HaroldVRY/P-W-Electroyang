import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OfflineOperation {
  id: string;
  type: 'kiosk_redemption' | 'wallet_transfer';
  data: any;
  client_tx_id: string;
  timestamp: string;
}

interface SyncResponse {
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
    data?: any;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operations, user_id } = await req.json();
    console.log('Sync request:', { user_id, operations_count: operations?.length });

    if (!operations || !Array.isArray(operations)) {
      throw new Error('Operations array is required');
    }

    if (!user_id) {
      throw new Error('User ID is required');
    }

    const results: SyncResponse['results'] = [];
    let processed = 0;
    let failed = 0;

    // Process each operation sequentially to maintain order
    for (const operation of operations as OfflineOperation[]) {
      try {
        console.log('Processing operation:', operation.id, operation.type);

        let result;
        switch (operation.type) {
          case 'kiosk_redemption':
            result = await processKioskRedemption(operation, user_id);
            break;
          case 'wallet_transfer':
            result = await processWalletTransfer(operation, user_id);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }

        results.push({
          id: operation.id,
          success: true,
          data: result
        });
        processed++;

      } catch (error) {
        console.error(`Operation ${operation.id} failed:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          id: operation.id,
          success: false,
          error: errorMessage
        });
        failed++;
      }
    }

    console.log('Sync completed:', { processed, failed });

    return new Response(JSON.stringify({
      success: true,
      processed,
      failed,
      results
    } as SyncResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      processed: 0,
      failed: 0,
      results: []
    } as SyncResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processKioskRedemption(operation: OfflineOperation, user_id: string) {
  const { kiosk_id, credits } = operation.data;

  // Call kiosk_redeem function
  const response = await supabase.functions.invoke('kiosk_redeem', {
    body: {
      user_id,
      kiosk_id,
      credits,
      client_tx_id: operation.client_tx_id
    }
  });

  if (response.error) {
    throw new Error(response.error.message || 'Kiosk redemption failed');
  }

  return response.data;
}

async function processWalletTransfer(operation: OfflineOperation, user_id: string) {
  const { to_user, credits } = operation.data;

  // Call wallet_transfer function
  const response = await supabase.functions.invoke('wallet_transfer', {
    body: {
      from_user: user_id,
      to_user,
      credits,
      client_tx_id: operation.client_tx_id
    }
  });

  if (response.error) {
    throw new Error(response.error.message || 'Wallet transfer failed');
  }

  return response.data;
}