import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  currentTotal: number;
  onSave: (total: number) => Promise<void>;
}

export function InventoryModal({ open, onClose, currentTotal, onSave }: InventoryModalProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(String(currentTotal));
      setError('');
    }
  }, [open, currentTotal]);

  const handleSave = async () => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      setError('Must be a non-negative number');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(num);
      onClose();
    } catch {
      setError('Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Set Today's Inventory">
      <div className="space-y-4">
        <Input
          label="Total Tickets Available"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min={0}
          error={error || undefined}
        />
        <p className="text-xs text-text-secondary">
          This sets the maximum number of tickets that can be sold today across all agents.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
