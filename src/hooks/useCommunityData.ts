import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommunityProfile {
  user_id: string;
  display_name: string;
  role: string;
  credits?: number;
  generators_count?: number;
}

export function useCommunityData() {
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeGenerators: 0,
    totalTransactions: 0,
    topGenerator: null as CommunityProfile | null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles (non-sensitive data only)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, role');

      if (profilesError) throw profilesError;

      // Fetch wallets for credit balances
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('user_id, balance_credits');

      if (walletsError) throw walletsError;

      // Fetch generators count per user
      const { data: generatorsData, error: generatorsError } = await supabase
        .from('generators')
        .select('owner_user_id');

      if (generatorsError) throw generatorsError;

      // Count transactions for stats
      const { count: transactionCount, error: transactionError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      if (transactionError) throw transactionError;

      // Merge data
      const walletsMap = new Map(walletsData?.map(w => [w.user_id, w.balance_credits]) || []);
      const generatorsMap = new Map();
      generatorsData?.forEach(g => {
        const count = generatorsMap.get(g.owner_user_id) || 0;
        generatorsMap.set(g.owner_user_id, count + 1);
      });

      const enrichedProfiles = (profilesData || []).map(profile => ({
        ...profile,
        credits: walletsMap.get(profile.user_id) || 0,
        generators_count: generatorsMap.get(profile.user_id) || 0
      }));

      // Find top generator
      const topGenerator = enrichedProfiles
        .filter(p => p.generators_count > 0)
        .sort((a, b) => (b.credits || 0) - (a.credits || 0))[0] || null;

      setProfiles(enrichedProfiles);
      setStats({
        totalMembers: enrichedProfiles.length,
        activeGenerators: [...generatorsMap.keys()].length,
        totalTransactions: transactionCount || 0,
        topGenerator
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching community data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  return {
    profiles,
    stats,
    loading,
    error,
    refetch: fetchCommunityData
  };
}