import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`rounded-xl bg-surface-card border border-surface-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">{label}</span>
        {icon && <span className="text-text-secondary">{icon}</span>}
      </div>
      <div className="font-mono text-2xl font-bold text-text-primary">{value}</div>
      {trend && <p className="text-xs text-text-secondary mt-1">{trend}</p>}
    </div>
  );
}
