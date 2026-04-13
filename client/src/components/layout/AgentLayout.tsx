import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Header } from './Header';

const navItems = [
  { to: '/agent', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/agent/new-sale', icon: PlusCircle, label: 'New Sale' },
  { to: '/agent/refund', icon: RotateCcw, label: 'Refund' },
];

export function AgentLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'AGENT') return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Header />
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
      <nav className="sticky bottom-0 bg-surface-card border-t border-surface-border no-print">
        <div className="flex justify-around max-w-2xl mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors
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
