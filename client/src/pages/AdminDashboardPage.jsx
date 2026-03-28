import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, AlertTriangle, Clock, Package, DollarSign } from 'lucide-react';
import AdminSidebar from '../components/ui/AdminSidebar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getDashboard } from '../services/api';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../utils/format';
import socket, { connectSocket, joinAdmin } from '../services/socket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchData = async () => {
    try {
      const { data: d } = await getDashboard();
      setData(d);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    connectSocket();
    joinAdmin();

    socket.on('new_order', (payload) => {
      setNotifications(prev => [{ type: 'order', ...payload, time: new Date() }, ...prev].slice(0, 10));
      fetchData();
      // Play sound
      try { new Audio('data:audio/wav;base64,UklGRl9vT19teleVlfSkZNVAAAA').play(); } catch {}
    });

    socket.on('payment_update', () => fetchData());
    socket.on('stock_alert', (payload) => {
      setNotifications(prev => [{ type: 'stock', ...payload, time: new Date() }, ...prev].slice(0, 10));
    });

    return () => {
      socket.off('new_order');
      socket.off('payment_update');
      socket.off('stock_alert');
    };
  }, []);

  if (loading) return <AdminSidebar><LoadingSpinner /></AdminSidebar>;

  const stats = [
    { label: "Commandes aujourd'hui", value: data.today.count, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: "CA aujourd'hui", value: formatCurrency(data.today.revenue), icon: DollarSign, color: 'bg-green-500' },
    { label: 'CA du mois', value: formatCurrency(data.month.revenue), icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Panier moyen', value: formatCurrency(data.avgCart), icon: ShoppingBag, color: 'bg-indigo-500' },
    { label: 'En attente', value: data.pendingOrdersCount, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Ruptures stock', value: data.lowStockCount, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <AdminSidebar>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.slice(0, 3).map((n, i) => (
            <div key={i} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
              n.type === 'order' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {n.type === 'order' ? <Package className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {n.message || `Nouvelle commande de ${n.order?.customer_name}`}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-4">
              <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Ventes (7 derniers jours)</h3>
          {data.salesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(val) => formatCurrency(val)} labelFormatter={(l) => `Date: ${l}`} />
                <Line type="monotone" dataKey="revenue" stroke="#1e40af" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Dernières commandes</h3>
            <Link to="/admin/commandes" className="text-primary-600 text-sm hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatCurrency(order.total_amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.order_status]}`}>
                    {ORDER_STATUS_LABELS[order.order_status]}
                  </span>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Aucune commande</p>
            )}
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
}
