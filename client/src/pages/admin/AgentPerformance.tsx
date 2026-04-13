import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Ticket, DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import type { Agent } from '../../types';

export function AgentPerformance() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/agents').then((res) => {
      setAgents(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12 text-text-secondary">Loading...</div>;

  const activeAgents = agents.filter((a) => a.active);
  const totalRevenue = activeAgents.reduce((sum, a) => sum + (a.todayStats?.revenue ?? 0), 0);
  const totalCommission = activeAgents.reduce((sum, a) => sum + (a.todayStats?.commission ?? 0), 0);
  const totalTickets = activeAgents.reduce((sum, a) => sum + (a.todayStats?.ticketsSold ?? 0), 0);
  const totalSales = activeAgents.reduce((sum, a) => sum + (a.todayStats?.salesCount ?? 0), 0);

  // Sort by revenue descending
  const ranked = [...activeAgents]
    .filter((a) => a.todayStats && a.todayStats.salesCount > 0)
    .sort((a, b) => (b.todayStats?.revenue ?? 0) - (a.todayStats?.revenue ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={24} className="text-accent" />
        <h1 className="text-2xl font-bold">Agent Performance</h1>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign size={18} />} />
        <StatCard label="Total Commission" value={`$${totalCommission.toFixed(2)}`} icon={<TrendingUp size={18} />} />
        <StatCard label="Tickets Sold" value={totalTickets} icon={<Ticket size={18} />} />
        <StatCard label="Total Sales" value={totalSales} />
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Today's Leaderboard</h2>
        {ranked.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">No sales recorded today</p>
        ) : (
          <div className="space-y-2">
            {ranked.map((agent, index) => {
              const stats = agent.todayStats!;
              const pct = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={agent.id} className="bg-surface-card border border-surface-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-amber-500/20 text-amber-500' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-600/20 text-orange-600' :
                          'bg-surface-border text-text-secondary'}`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">{agent.agentId}</span>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {stats.salesCount} sales &middot; {stats.ticketsSold} tickets
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">${stats.revenue.toFixed(2)}</p>
                      <Badge variant="success">
                        ${stats.commission.toFixed(2)} comm
                      </Badge>
                    </div>
                  </div>
                  {/* Revenue bar */}
                  <div className="w-full h-2 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-text-secondary">
                    <span>Allocation: {agent.ticketAlloc}/day</span>
                    <span>{pct.toFixed(0)}% of revenue</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactive/no-sales agents */}
      {agents.filter((a) => a.active && (!a.todayStats || a.todayStats.salesCount === 0)).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-text-secondary">No Sales Today</h2>
          <div className="flex flex-wrap gap-2">
            {agents
              .filter((a) => a.active && (!a.todayStats || a.todayStats.salesCount === 0))
              .map((agent) => (
                <div key={agent.id} className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm">
                  <span className="font-mono">{agent.agentId}</span>
                  <span className="text-text-secondary ml-2">{agent.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
