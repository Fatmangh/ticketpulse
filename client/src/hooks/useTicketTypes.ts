import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useSocket } from '../context/SocketContext';
import type { TicketType } from '../types';

export function useTicketTypes() {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchTypes = useCallback(async () => {
    try {
      const res = await api.get('/ticket-types');
      setTicketTypes(res.data);
    } catch (err) {
      console.error('Failed to fetch ticket types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const onCreated = (tk: TicketType) => {
      setTicketTypes((prev) => [...prev, tk].sort((a, b) => a.sortOrder - b.sortOrder));
    };

    const onUpdated = (tk: TicketType) => {
      setTicketTypes((prev) =>
        prev.map((t) => (t.id === tk.id ? tk : t)).sort((a, b) => a.sortOrder - b.sortOrder),
      );
    };

    const onDeleted = ({ id }: { id: string }) => {
      setTicketTypes((prev) => prev.filter((t) => t.id !== id));
    };

    socket.on('ticketType:created', onCreated);
    socket.on('ticketType:updated', onUpdated);
    socket.on('ticketType:deleted', onDeleted);

    return () => {
      socket.off('ticketType:created', onCreated);
      socket.off('ticketType:updated', onUpdated);
      socket.off('ticketType:deleted', onDeleted);
    };
  }, [socket]);

  const activeTicketTypes = ticketTypes.filter((t) => t.active);

  const createTicketType = useCallback(async (data: { name: string; price: number; description?: string; icon?: string }) => {
    const res = await api.post('/ticket-types', data);
    return res.data as TicketType;
  }, []);

  const updateTicketType = useCallback(async (id: string, data: Partial<{ name: string; price: number; description: string | null; icon: string; sortOrder: number }>) => {
    const res = await api.patch(`/ticket-types/${id}`, data);
    return res.data as TicketType;
  }, []);

  const toggleTicketType = useCallback(async (id: string, active: boolean) => {
    const res = await api.patch(`/ticket-types/${id}/status`, { active });
    return res.data as TicketType;
  }, []);

  const deleteTicketType = useCallback(async (id: string) => {
    await api.delete(`/ticket-types/${id}`);
  }, []);

  return {
    ticketTypes,
    activeTicketTypes,
    loading,
    refetch: fetchTypes,
    createTicketType,
    updateTicketType,
    toggleTicketType,
    deleteTicketType,
  };
}
