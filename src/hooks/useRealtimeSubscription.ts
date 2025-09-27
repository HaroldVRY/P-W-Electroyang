import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionCallback<T> = (payload: T) => void;

interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

export function useRealtimeSubscription<T = any>(
  config: SubscriptionConfig,
  callback: SubscriptionCallback<T>
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channelName = `realtime_${config.table}_${Date.now()}`;
    const newChannel = supabase.channel(channelName);

    newChannel
      .on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter })
        },
        (payload) => {
          console.log('Realtime update:', payload);
          callback(payload as T);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [config.table, config.event, config.filter]);

  return {
    isConnected,
    channel
  };
}