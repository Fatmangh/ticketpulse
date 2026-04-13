import { useState, useEffect } from 'react';
import { UserPlus, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { Agent } from '../../types';

export function ManageAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', phone: '', ticketAlloc: '50' });
  const [createdPin, setCreatedPin] = useState<{ agentId: string; pin: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      setAgents(res.data);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/agents', {
        name: newAgent.name,
        email: newAgent.email || undefined,
        phone: newAgent.phone || undefined,
        ticketAlloc: parseInt(newAgent.ticketAlloc) || 50,
      });
      setCreatedPin({ agentId: res.data.agentId, pin: res.data.pin });
      setShowCreate(false);
      setNewAgent({ name: '', email: '', phone: '', ticketAlloc: '50' });
      fetchAgents();
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await api.patch(`/agents/${agent.id}/status`);
      fetchAgents();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleResetPin = async (agent: Agent) => {
    if (!confirm(`Reset PIN for ${agent.name} (${agent.agentId})?`)) return;
    try {
      const res = await api.post(`/agents/${agent.id}/reset-pin`);
      setCreatedPin({ agentId: res.data.agentId, pin: res.data.pin });
    } catch (err) {
      console.error('Failed to reset PIN:', err);
    }
  };

  if (loading) return <div className="flex justify-center py-12 text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Agents</h1>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus size={18} />
          Add Agent
        </Button>
      </div>

      {/* PIN notification */}
      {createdPin && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 space-y-1">
          <p className="font-semibold text-accent">New PIN Generated</p>
          <p className="text-sm">
            Agent <span className="font-mono font-bold">{createdPin.agentId}</span> — PIN:{' '}
            <span className="font-mono font-bold text-2xl">{createdPin.pin}</span>
          </p>
          <p className="text-xs text-text-secondary">Save this PIN — it won't be shown again.</p>
          <Button variant="ghost" size="sm" onClick={() => setCreatedPin(null)}>Dismiss</Button>
        </div>
      )}

      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-surface-card border border-surface-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{agent.agentId}</span>
                  <span className="font-medium">{agent.name}</span>
                  <Badge variant={agent.active ? 'success' : 'danger'}>
                    {agent.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {agent.email && <p className="text-xs text-text-secondary">{agent.email}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleResetPin(agent)}
                  className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                  title="Reset PIN"
                >
                  <Key size={16} />
                </button>
                <button
                  onClick={() => handleToggleStatus(agent)}
                  className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                  title={agent.active ? 'Deactivate' : 'Activate'}
                >
                  {agent.active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                </button>
              </div>
            </div>
            {agent.todayStats && (
              <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                <div className="text-center">
                  <p className="text-text-secondary">Sales</p>
                  <p className="font-mono font-bold">{agent.todayStats.salesCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-text-secondary">Tickets</p>
                  <p className="font-mono font-bold">{agent.todayStats.ticketsSold}</p>
                </div>
                <div className="text-center">
                  <p className="text-text-secondary">Revenue</p>
                  <p className="font-mono font-bold">${agent.todayStats.revenue.toFixed(0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-text-secondary">Comm</p>
                  <p className="font-mono font-bold text-accent">${agent.todayStats.commission.toFixed(0)}</p>
                </div>
              </div>
            )}
            <div className="mt-2 text-xs text-text-secondary">
              Allocation: <span className="font-mono">{agent.ticketAlloc}</span> tickets/day
            </div>
          </div>
        ))}
      </div>

      {/* Create Agent Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Agent">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" value={newAgent.name} onChange={(e) => setNewAgent((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Email" type="email" value={newAgent.email} onChange={(e) => setNewAgent((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Phone" value={newAgent.phone} onChange={(e) => setNewAgent((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Daily Allocation" type="number" value={newAgent.ticketAlloc} onChange={(e) => setNewAgent((p) => ({ ...p, ticketAlloc: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Agent</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
