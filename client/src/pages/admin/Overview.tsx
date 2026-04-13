import { useState, useEffect } from 'react';
import { DollarSign, Ticket, ScanLine, Package, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { InventoryModal } from './InventoryModal';
import type { OverviewStats, Sale } from '../../types';

export function AdminOverview() {
  const socket = useSocket();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [feed, setFeed] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryModal, setInventoryModal] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, feedRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/feed'),
      ]);
      setStats(statsRes.data);
      setFeed(feedRes.data);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchData();
    socket.on('sale:created', handler);
    socket.on('sale:refunded', handler);
    return () => {
      socket.off('sale:created', handler);
      socket.off('sale:refunded', handler);
    };
  }, [socket]);

  const handleSetInventory = async (total: number) => {
    await api.put('/inventory/today', { totalTickets: total });
    await fetchData();
  };

  if (loading) return <div className="flex justify-center py-12 text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="secondary" size="sm" onClick={() => setInventoryModal(true)}>
          <Package size={16} />
          Inventory
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Revenue" value={`$${(stats?.revenue ?? 0).toFixed(2)}`} icon={<DollarSign size={18} />} />
        <StatCard label="Tickets Sold" value={stats?.ticketsSold ?? 0} icon={<Ticket size={18} />} />
        <StatCard label="Commission" value={`$${(stats?.commission ?? 0).toFixed(2)}`} icon={<TrendingUp size={18} />} />
        <StatCard label="Scan Rate" value={`${stats?.scanRate ?? 0}%`} icon={<ScanLine size={18} />} />
      </div>

      {/* Inventory bar */}
      {stats && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Inventory</span>
            <span className="text-sm font-mono">
              {stats.inventory.sold} / {stats.inventory.total}
            </span>
          </div>
          <div className="w-full h-3 bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.inventory.sold / stats.inventory.total) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-text-secondary">
            <span>{stats.inventory.remaining} remaining</span>
            <span>{stats.activeAgents} active agents</span>
          </div>
        </div>
      )}

      {/* Live Feed */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Live Feed</h2>
        <div className="space-y-2">
          {feed.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-8">No sales yet</p>
          )}
          {feed.map((sale) => (
            <div key={sale.id} className="bg-surface-card border border-surface-border rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {sale.ticketType?.icon} {sale.ticketType?.name}
                  <span className="text-text-secondary ml-2">x{sale.quantity}</span>
                </p>
                <p className="text-xs text-text-secondary">
                  {sale.agent?.name} ({sale.agent?.agentId}) &middot;{' '}
                  {new Date(sale.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-sm">${sale.totalAmount.toFixed(2)}</p>
                <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}>
                  {sale.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <InventoryModal
        open={inventoryModal}
        onClose={() => setInventoryModal(false)}
        currentTotal={stats?.inventory.total ?? 500}
        onSave={handleSetInventory}
      />
    </div>
  );
}
