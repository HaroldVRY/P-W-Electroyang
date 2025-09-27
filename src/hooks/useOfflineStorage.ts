import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface OfflineOperation {
  id: string;
  type: 'kiosk_redemption' | 'wallet_transfer';
  data: any;
  client_tx_id: string;
  timestamp: string;
}

export function useOfflineStorage() {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load operations from localStorage
    const stored = localStorage.getItem('offline_operations');
    if (stored) {
      try {
        setOperations(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse offline operations:', error);
        localStorage.removeItem('offline_operations');
      }
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Save operations to localStorage when they change
    localStorage.setItem('offline_operations', JSON.stringify(operations));
  }, [operations]);

  const addOperation = (type: OfflineOperation['type'], data: any) => {
    const operation: OfflineOperation = {
      id: uuidv4(),
      type,
      data,
      client_tx_id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    setOperations(prev => [...prev, operation]);
    return operation;
  };

  const clearOperations = () => {
    setOperations([]);
    localStorage.removeItem('offline_operations');
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  return {
    operations,
    isOnline,
    addOperation,
    clearOperations,
    removeOperation
  };
}