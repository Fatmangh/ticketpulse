import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Ticket, TrendingUp, PlusCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { TodaySummary, Sale } from '../../types';

export function AgentDashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/sales/my/today');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
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

  if (loading) {
    return <div className="flex justify-center py-12 text-text-secondary">Loading...</div>;
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-text-secondary text-sm">Today's performance</p>
        </div>
        <Button onClick={() => navigate('/agent/new-sale')}>
          <PlusCircle size={18} />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Revenue"
          value={`$${(summary?.totalRevenue ?? 0).toFixed(2)}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Tickets Sold"
          value={summary?.totalTickets ?? 0}
          icon={<Ticket size={18} />}
        />
        <StatCard
          label="Commission"
          value={`$${(summary?.totalCommission ?? 0).toFixed(2)}`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Sales"
          value={summary?.totalSales ?? 0}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Sales</h2>
        <div className="space-y-2">
          {data?.sales.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-8">No sales today yet</p>
          )}
          {data?.sales.map((sale: Sale) => (
            <div
              key={sale.id}
              onClick={() => navigate(`/agent/receipt/${sale.id}`)}
              className="bg-surface-card border border-surface-border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-accent/30 transition-colors"
            >
              <div>
                <p className="font-medium">
                  {sale.ticketType?.icon} {sale.ticketType?.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {sale.quantity}x &middot; {sale.customerName} &middot;{' '}
                  {new Date(sale.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">${sale.totalAmount.toFixed(2)}</p>
                <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}>
                  {sale.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
