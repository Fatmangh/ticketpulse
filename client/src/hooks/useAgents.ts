import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Agent } from '../types';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/agents');
      setAgents(res.data);
    } catch (err) {
      setError('Failed to fetch agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = useCallback(async (data: { name: string; email?: string; phone?: string; ticketAlloc?: number }) => {
    const res = await api.post('/agents', data);
    await fetchAgents();
    return res.data;
  }, [fetchAgents]);

  const toggleStatus = useCallback(async (id: string) => {
    await api.patch(`/agents/${id}/status`);
    await fetchAgents();
  }, [fetchAgents]);

  const resetPin = useCallback(async (id: string) => {
    const res = await api.post(`/agents/${id}/reset-pin`);
    return res.data as { agentId: string; pin: string };
  }, []);

  const updateAgent = useCallback(async (id: string, data: Partial<{ name: string; email: string | null; phone: string | null; ticketAlloc: number }>) => {
    await api.patch(`/agents/${id}`, data);
    await fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents, createAgent, toggleStatus, resetPin, updateAgent };
}
