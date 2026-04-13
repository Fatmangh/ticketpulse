import { LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Badge } from '../ui/Badge';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-surface-card/80 backdrop-blur-md border-b border-surface-border no-print">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Ticket className="text-accent" size={24} />
          <span className="text-lg font-bold font-display">TicketPulse</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <Badge variant={user.role === 'ADMIN' ? 'info' : 'success'}>
                {user.role}
              </Badge>
              <span className="text-sm text-text-secondary hidden sm:inline">
                {user.name} <span className="font-mono text-xs">({user.agentId})</span>
              </span>
            </>
          )}
          <ThemeToggle />
          {user && (
            <button
              onClick={logout}
              className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
