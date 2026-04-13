import { useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import type { Sale } from '../../types';

export function RefundLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Sale[]>([]);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setMessage('');
    try {
      const res = await api.get(`/refunds/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
      if (res.data.length === 0) {
        setMessage('No eligible sales found');
      }
    } catch {
      setMessage('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleRefund = async (saleId: string) => {
    if (!confirm('Are you sure you want to process this refund? This will void all tickets.')) return;

    setProcessing(saleId);
    setMessage('');
    try {
      await api.post(`/refunds/${saleId}`);
      setResults((prev) => prev.filter((s) => s.id !== saleId));
      setMessage('Refund processed successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Refund failed';
      setMessage(msg);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Refund Lookup</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search by order #, email, or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={searching}>
          <Search size={18} />
        </Button>
      </form>

      {message && (
        <div className={`rounded-lg px-4 py-2 text-sm ${
          message.includes('success')
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
            : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-2">
        {results.map((sale) => (
          <div key={sale.id} className="bg-surface-card border border-surface-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{sale.ticketType?.icon} {sale.ticketType?.name}</p>
                <p className="text-sm text-text-secondary">{sale.customerName} &middot; {sale.customerEmail}</p>
                <p className="text-xs text-text-secondary font-mono">Order: {sale.orderNumber.slice(0, 12)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">${sale.totalAmount.toFixed(2)}</p>
                <p className="text-xs text-text-secondary">{sale.quantity} tickets</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Badge variant={sale.paymentMethod === 'CASH' ? 'warning' : 'info'}>
                  {sale.paymentMethod}
                </Badge>
                <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={processing === sale.id}
                onClick={() => handleRefund(sale.id)}
              >
                <AlertTriangle size={14} />
                Refund
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
