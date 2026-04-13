import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { Sale } from '../../types';

export function Receipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sales/${id}`).then((res) => {
      setSale(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12 text-text-secondary">Loading...</div>;
  if (!sale) return <div className="text-center py-12 text-text-secondary">Sale not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 no-print">
        <button onClick={() => navigate('/agent')} className="p-2 rounded-lg hover:bg-surface-border/30 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Receipt</h1>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle size={24} />
          <span className="font-semibold text-lg">Sale Complete</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Order #</span>
            <span className="font-mono">{sale.orderNumber.slice(0, 12)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Type</span>
            <span>{sale.ticketType?.icon} {sale.ticketType?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Quantity</span>
            <span>{sale.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Unit Price</span>
            <span className="font-mono">${sale.unitPrice.toFixed(2)}</span>
          </div>
          <hr className="border-surface-border" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="font-mono">${sale.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Commission (8%)</span>
            <span className="font-mono text-accent">${sale.commissionAmount.toFixed(2)}</span>
          </div>
          <hr className="border-surface-border" />
          <div className="flex justify-between">
            <span className="text-text-secondary">Customer</span>
            <span>{sale.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Email</span>
            <span className="text-xs">{sale.customerEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Payment</span>
            <Badge variant={sale.paymentMethod === 'CASH' ? 'warning' : 'info'}>
              {sale.paymentMethod}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Status</span>
            <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'danger'}>
              {sale.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Email Sent</span>
            <Badge variant={sale.emailSent ? 'success' : 'warning'}>
              {sale.emailSent ? 'Yes' : 'Pending'}
            </Badge>
          </div>
        </div>

        {/* Tickets */}
        {sale.tickets && sale.tickets.length > 0 && (
          <div className="pt-2">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Tickets ({sale.tickets.length})</h3>
            <div className="space-y-1">
              {sale.tickets.map((ticket) => (
                <div key={ticket.id} className="flex justify-between text-xs bg-surface-bg rounded-lg px-3 py-2">
                  <span className="font-mono">#{ticket.ticketNumber}</span>
                  <Badge variant={
                    ticket.status === 'ACTIVE' ? 'success' :
                    ticket.status === 'SCANNED' ? 'info' : 'danger'
                  }>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 no-print">
        <Button variant="secondary" onClick={() => window.print()} className="flex-1">
          <Printer size={18} />
          Print
        </Button>
        <Button onClick={() => navigate('/agent/new-sale')} className="flex-1">
          New Sale
        </Button>
      </div>
    </div>
  );
}
