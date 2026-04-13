import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, CreditCard, Banknote } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { TicketType, PaymentMethod } from '../../types';

export function NewSale() {
  const navigate = useNavigate();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerEmailConfirm, setCustomerEmailConfirm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tickets/types').then((res) => {
      setTicketTypes(res.data);
      if (res.data.length > 0) setSelectedType(res.data[0]);
    }).catch(() => {});
  }, []);

  const total = selectedType ? selectedType.price * quantity : 0;
  const emailsMatch = customerEmail === customerEmailConfirm && customerEmail.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !emailsMatch) return;

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/sales', {
        ticketTypeId: selectedType.id,
        quantity,
        customerName: customerName || 'Walk-in',
        customerEmail,
        customerEmailConfirm,
        paymentMethod,
      });
      navigate(`/agent/receipt/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Sale failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Sale</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticket Type Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">Ticket Type</label>
          <div className="grid grid-cols-2 gap-2">
            {ticketTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`p-3 rounded-lg border text-left transition-colors
                  ${selectedType?.id === type.id
                    ? 'border-accent bg-accent/10'
                    : 'border-surface-border bg-surface-card hover:border-accent/30'}`}
              >
                <div className="text-lg">{type.icon}</div>
                <div className="font-medium text-sm">{type.name}</div>
                <div className="font-mono font-bold text-accent">${type.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
          {ticketTypes.length === 0 && (
            <p className="text-sm text-text-secondary">Loading ticket types... (Make a sale first via seed data)</p>
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-surface-border bg-surface-card flex items-center justify-center hover:border-accent/30 transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="font-mono text-2xl font-bold w-12 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(50, quantity + 1))}
              className="w-10 h-10 rounded-lg border border-surface-border bg-surface-card flex items-center justify-center hover:border-accent/30 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <Input
          label="Customer Name"
          placeholder="Walk-in"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <Input
          label="Customer Email"
          type="email"
          placeholder="customer@example.com"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
        />
        <Input
          label="Confirm Email"
          type="email"
          placeholder="Re-enter email"
          value={customerEmailConfirm}
          onChange={(e) => setCustomerEmailConfirm(e.target.value)}
          error={customerEmailConfirm && !emailsMatch ? 'Emails do not match' : undefined}
          required
        />

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-colors
                ${paymentMethod === 'CASH'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-surface-border bg-surface-card text-text-secondary hover:border-accent/30'}`}
            >
              <Banknote size={20} />
              <span className="font-medium">Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('CLOVER')}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-colors
                ${paymentMethod === 'CLOVER'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-surface-border bg-surface-card text-text-secondary hover:border-accent/30'}`}
            >
              <CreditCard size={20} />
              <span className="font-medium">Card</span>
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Total</span>
            <span className="font-mono text-3xl font-bold">${total.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!selectedType || !emailsMatch}
        >
          Complete Sale — ${total.toFixed(2)}
        </Button>
      </form>
    </div>
  );
}
