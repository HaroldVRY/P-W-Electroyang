import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface Wallet {
  user_id: string;
  balance_credits: number;
  updated_at: string;
  created_at: string;
}

interface Transaction {
  id: string;
  from_user: string | null;
  to_user: string | null;
  credits: number;
  source: string | null;
  client_tx_id: string;
  proof_hash: string | null;
  ts: string;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet data when user changes
  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  // Real-time subscription for wallet updates
  useRealtimeSubscription(
    { table: 'wallets', event: 'UPDATE' },
    (payload) => {
      const updatedWallet = payload.new as Wallet;
      if (updatedWallet.user_id === user?.id) {
        setWallet(updatedWallet);
      }
    }
  );

  // Real-time subscription for transaction updates
  useRealtimeSubscription(
    { table: 'transactions', event: 'INSERT' },
    (payload) => {
      const newTransaction = payload.new as Transaction;
      if (newTransaction.from_user === user?.id || newTransaction.to_user === user?.id) {
        setTransactions(prev => [newTransaction, ...prev.slice(0, 49)]); // Keep last 50
      }
    }
  );

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order('ts', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setWallet(walletData);
      setTransactions(transactionsData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const transferCredits = async (toUserId: string, credits: number) => {
    if (!user) throw new Error('User not authenticated');

    const clientTxId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { data, error } = await supabase.functions.invoke('wallet_transfer', {
        body: {
          from_user: user.id,
          to_user: toUserId,
          credits,
          client_tx_id: clientTxId
        }
      });

      if (error) throw error;

      // Refresh wallet data
      await fetchWalletData();
      
      return data;
    } catch (err) {
      console.error('Error transferring credits:', err);
      throw err;
    }
  };

  const redeemAtKiosk = async (kioskId: string, credits: number) => {
    if (!user) throw new Error('User not authenticated');

    const clientTxId = `kiosk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { data, error } = await supabase.functions.invoke('kiosk_redeem', {
        body: {
          user_id: user.id,
          kiosk_id: kioskId,
          credits,
          client_tx_id: clientTxId
        }
      });

      if (error) throw error;

      // Refresh wallet data
      await fetchWalletData();
      
      return data;
    } catch (err) {
      console.error('Error redeeming at kiosk:', err);
      throw err;
    }
  };

  return {
    wallet,
    transactions,
    loading,
    error,
    transferCredits,
    redeemAtKiosk,
    refetch: fetchWalletData
  };
}