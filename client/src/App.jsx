import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Client pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

// Admin pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminStockPage from './pages/AdminStockPage';
import AdminStatsPage from './pages/AdminStatsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Client routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/catalogue" element={<CatalogPage />} />
      <Route path="/panier" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/suivi" element={<OrderTrackingPage />} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/commandes" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
      <Route path="/admin/stock" element={<ProtectedRoute><AdminStockPage /></ProtectedRoute>} />
      <Route path="/admin/stats" element={<ProtectedRoute><AdminStatsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
