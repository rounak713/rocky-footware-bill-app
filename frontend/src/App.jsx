import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POSBilling from './pages/POSBilling';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';

// Role-based protection: only ADMIN can access
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'STAFF') return <Navigate to="/billing" replace />;
  return children;
};

// Protected layout: renders the sidebar shell + page content
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400 animate-pulse text-lg font-semibold">Loading Rocky Footwear…</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 print:bg-white print:block">
      <Sidebar />
      <main className="flex-1 overflow-y-auto print:overflow-visible print:m-0 print:p-0 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            {/* Billing is open to all logged in users */}
            <Route path="/billing"   element={<POSBilling />} />
            
            {/* These routes require ADMIN pass */}
            <Route path="/"          element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
            <Route path="/invoices"  element={<AdminRoute><Invoices /></AdminRoute>} />
            <Route path="/customers" element={<AdminRoute><Customers /></AdminRoute>} />
            <Route path="/reports"   element={<AdminRoute><Reports /></AdminRoute>} />
          </Route>
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
