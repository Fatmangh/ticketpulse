import { useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Trash2, Ticket } from 'lucide-react';
import { useTicketTypes } from '../../hooks/useTicketTypes';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import type { TicketType } from '../../types';

const ICONS = ['🎫','⭐','💎','👥','🎪','🎭','🎵','🎸','🎤','🎬','🏟️','🚢','🎠','🎡','🎢','🏖️','🍽️','🥂','🌅','🎆','✈️','🎯','🎳','🎮','🏄'];

interface FormData {
  name: string;
  price: string;
  description: string;
  icon: string;
}

const emptyForm: FormData = { name: '', price: '', description: '', icon: '🎫' };

export function TicketTypes() {
  const { ticketTypes, activeTicketTypes, createTicketType, updateTicketType, toggleTicketType, deleteTicketType } = useTicketTypes();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (t: TicketType) => {
    setEditingId(t.id);
    setForm({ name: t.name, price: String(t.price), description: t.description ?? '', icon: t.icon });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.name || form.name.length < 2) { setError('Name must be at least 2 characters'); return; }
    if (isNaN(price) || price <= 0) { setError('Price must be greater than 0'); return; }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateTicketType(editingId, {
          name: form.name,
          price,
          description: form.description || null,
          icon: form.icon,
        });
      } else {
        await createTicketType({
          name: form.name,
          price,
          description: form.description || undefined,
          icon: form.icon,
        });
      }
      setShowModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: TicketType) => {
    try {
      await toggleTicketType(t.id, !t.active);
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const handleDelete = async (t: TicketType) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await deleteTicketType(t.id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket size={24} className="text-accent" />
            Ticket Types
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {ticketTypes.length} total &middot; {activeTicketTypes.length} active
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Create
        </Button>
      </div>

      {/* Ticket type cards */}
      <div className="space-y-3">
        {ticketTypes.map((t) => (
          <div key={t.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.name}</span>
                    <Badge variant={t.active ? 'success' : 'warning'}>
                      {t.active ? 'Live' : 'Hidden'}
                    </Badge>
                  </div>
                  {t.description && (
                    <p className="text-sm text-text-secondary mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-accent">${t.price.toFixed(2)}</p>
                <p className="text-xs text-text-secondary">Order: {t.sortOrder}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-surface-border">
              <button
                onClick={() => openEdit(t)}
                className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleToggle(t)}
                className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                title={t.active ? 'Hide' : 'Show'}
              >
                {t.active ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleDelete(t)}
                className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {ticketTypes.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <p>No ticket types yet.</p>
            <Button onClick={openCreate} className="mt-4">Create First Type</Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Ticket Type' : 'Create Ticket Type'}>
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. VIP Experience"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Price ($)"
            type="number"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            min={0}
            step="0.01"
            required
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description for agents"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          {/* Icon picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, icon }))}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-colors
                    ${form.icon === icon
                      ? 'border-accent bg-accent/10'
                      : 'border-surface-border hover:border-accent/30'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">Preview</label>
            <div className="bg-surface-bg border border-surface-border rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{form.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{form.name || 'Ticket Name'}</p>
                {form.description && <p className="text-xs text-text-secondary">{form.description}</p>}
              </div>
              <span className="font-mono font-bold text-accent">
                ${form.price ? parseFloat(form.price).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
