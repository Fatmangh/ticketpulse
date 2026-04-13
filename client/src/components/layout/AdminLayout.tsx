import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, ScanLine, BarChart3, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Header } from './Header';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/ticket-types', icon: Ticket, label: 'Tickets' },
  { to: '/admin/agents', icon: Users, label: 'Agents' },
  { to: '/admin/performance', icon: BarChart3, label: 'Performance' },
  { to: '/admin/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/admin/scanner', icon: ScanLine, label: 'Scanner' },
];

export function AdminLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/agent" replace />;

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-surface-border bg-surface-card p-4 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-border/30'}`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden sticky bottom-0 bg-surface-card border-t border-surface-border no-print">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 px-3 text-xs font-medium transition-colors
                ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
