import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import type { Sale } from '../../types';

export function Transactions() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'COMPLETED' | 'REFUNDED'>('all');

  useEffect(() => {
    const params = filter === 'all' ? '' : `?status=${filter}`;
    api.get(`/sales${params}`).then((res) => {
      setSales(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="flex justify-center py-12 text-text-secondary">Loading...</div>;

  const total = sales.filter((s) => s.status === 'COMPLETED').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCommission = sales.filter((s) => s.status === 'COMPLETED').reduce((sum, s) => sum + s.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-1 text-sm">
          {(['all', 'COMPLETED', 'REFUNDED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg transition-colors capitalize
                ${filter === f ? 'bg-accent text-white' : 'text-text-secondary hover:bg-surface-border/30'}`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-text-secondary">
          Total: <span className="font-mono font-bold text-text-primary">${total.toFixed(2)}</span>
        </span>
        <span className="text-text-secondary">
          Commission: <span className="font-mono font-bold text-accent">${totalCommission.toFixed(2)}</span>
        </span>
        <span className="text-text-secondary">
          Count: <span className="font-mono font-bold text-text-primary">{sales.length}</span>
        </span>
      </div>

      <div className="space-y-2">
        {sales.map((sale) => (
          <div key={sale.id} className="bg-surface-card border border-surface-border rounded-lg p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{sale.ticketType?.icon} {sale.ticketType?.name}</span>
                <span className="text-xs text-text-secondary">x{sale.quantity}</span>
              </div>
              <p className="text-xs text-text-secondary">
                {sale.agent?.name} ({sale.agent?.agentId}) &middot; {sale.customerName}
              </p>
              <p className="text-xs text-text-secondary font-mono">
                {sale.orderNumber.slice(0, 12)} &middot;{' '}
                {new Date(sale.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-mono font-bold">${sale.totalAmount.toFixed(2)}</p>
              <div className="flex gap-1">
                <Badge variant={sale.paymentMethod === 'CASH' ? 'warning' : 'info'}>
                  {sale.paymentMethod}
                </Badge>
                <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}>
                  {sale.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
