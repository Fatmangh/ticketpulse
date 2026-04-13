import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface InventoryData {
  date: string;
  totalTickets: number;
  soldToday: number;
  remaining: number;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/inventory/today');
      setInventory(res.data);
    } catch (err) {
      setError('Failed to fetch inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const setTotalTickets = useCallback(async (totalTickets: number) => {
    await api.put('/inventory/today', { totalTickets });
    await fetchInventory();
  }, [fetchInventory]);

  return { inventory, loading, error, refetch: fetchInventory, setTotalTickets };
}
