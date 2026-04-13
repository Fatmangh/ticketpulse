import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(agentId.toUpperCase(), pin);
      // Navigate based on role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'ADMIN' ? '/admin' : '/agent', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Ticket className="text-accent" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display">TicketPulse</h1>
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Agent ID"
            placeholder="e.g. A001 or ADMIN"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            autoComplete="username"
            autoFocus
          />
          <Input
            label="PIN"
            type="password"
            placeholder="Enter your PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={6}
            autoComplete="current-password"
            inputMode="numeric"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-text-secondary">
            Demo: Agent <span className="font-mono">A001</span> / PIN <span className="font-mono">1234</span>
            <br />
            Admin: <span className="font-mono">ADMIN</span> / PIN <span className="font-mono">0000</span>
          </p>
        </div>
      </div>
    </div>
  );
}
