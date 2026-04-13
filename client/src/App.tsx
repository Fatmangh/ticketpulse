import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { AgentLayout } from './components/layout/AgentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { AgentDashboard } from './pages/agent/Dashboard';
import { NewSale } from './pages/agent/NewSale';
import { Receipt } from './pages/agent/Receipt';
import { RefundLookup } from './pages/agent/RefundLookup';
import { AdminOverview } from './pages/admin/Overview';
import { ManageAgents } from './pages/admin/ManageAgents';
import { Transactions } from './pages/admin/Transactions';
import { AgentPerformance } from './pages/admin/AgentPerformance';
import { ScannerPage } from './pages/scanner/Scanner';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/agent'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
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
                <Route path="agents" element={<ManageAgents />} />
                <Route path="performance" element={<AgentPerformance />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="scanner" element={<ScannerPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
