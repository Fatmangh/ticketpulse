import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Sale, TodaySummary } from '../types';

export function useSales(filters?: { status?: string; date?: string; agentId?: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.date) params.set('date', filters.date);
      if (filters?.agentId) params.set('agentId', filters.agentId);
      const qs = params.toString();
      const res = await api.get(`/sales${qs ? `?${qs}` : ''}`);
      setSales(res.data);
    } catch (err) {
      setError('Failed to fetch sales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.date, filters?.agentId]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { sales, loading, error, refetch: fetchSales };
}

export function useMyToday() {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/sales/my/today');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch today summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
