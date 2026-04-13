import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Login';
import { lazy, Suspense, Component, type ReactNode } from 'react';

// Lazy load heavy pages to isolate errors
const AgentLayout = lazy(() => import('./components/layout/AgentLayout').then(m => ({ default: m.AgentLayout })));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AgentDashboard = lazy(() => import('./pages/agent/Dashboard').then(m => ({ default: m.AgentDashboard })));
const NewSale = lazy(() => import('./pages/agent/NewSale').then(m => ({ default: m.NewSale })));
const Receipt = lazy(() => import('./pages/agent/Receipt').then(m => ({ default: m.Receipt })));
const RefundLookup = lazy(() => import('./pages/agent/RefundLookup').then(m => ({ default: m.RefundLookup })));
const AdminOverview = lazy(() => import('./pages/admin/Overview').then(m => ({ default: m.AdminOverview })));
const ManageAgents = lazy(() => import('./pages/admin/ManageAgents').then(m => ({ default: m.ManageAgents })));
const Transactions = lazy(() => import('./pages/admin/Transactions').then(m => ({ default: m.Transactions })));
const AgentPerformance = lazy(() => import('./pages/admin/AgentPerformance').then(m => ({ default: m.AgentPerformance })));
const TicketTypesPage = lazy(() => import('./pages/admin/TicketTypes').then(m => ({ default: m.TicketTypes })));
const ScannerPage = lazy(() => import('./pages/scanner/Scanner').then(m => ({ default: m.ScannerPage })));

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#E8643A' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#999' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#666', fontSize: 12 }}>{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '8px 16px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Loading() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: '#9B9DA5' }}>Loading...</div>;
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/agent'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/login" element={<Login />} />

                  {/* Agent routes */}
                  <Route path="/agent" element={<AgentLayout />}>
                    <Route index element={<AgentDashboard />} />
                    <Route path="new-sale" element={<NewSale />} />
                    <Route path="receipt/:id" element={<Receipt />} />
                    <Route path="refund" element={<RefundLookup />} />
                  </Route>

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="ticket-types" element={<TicketTypesPage />} />
                    <Route path="agents" element={<ManageAgents />} />
                    <Route path="performance" element={<AgentPerformance />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="scanner" element={<ScannerPage />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
