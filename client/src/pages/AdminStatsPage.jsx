import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import AdminSidebar from '../components/ui/AdminSidebar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getTopProducts, getSalesByCategory, getMonthlyRevenue, getPeakHours, exportOrders } from '../services/api';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminStatsPage() {
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [peakData, setPeakData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTopProducts().then(r => setTopProducts(r.data)),
      getSalesByCategory().then(r => setCategoryData(r.data)),
      getMonthlyRevenue().then(r => setMonthlyData(r.data)),
      getPeakHours().then(r => setPeakData(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const { data } = await exportOrders({});
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'commandes.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  if (loading) return <AdminSidebar><LoadingSpinner /></AdminSidebar>;

  return (
    <AdminSidebar>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-1">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Top 10 produits vendus</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="product_name" width={150} fontSize={10} tick={{ width: 140 }} />
                <Tooltip formatter={(val, name) => name === 'total_revenue' ? formatCurrency(val) : val} />
                <Bar dataKey="total_sold" fill="#1e40af" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Aucune donnée de vente</p>}
        </div>

        {/* Sales by category */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Ventes par catégorie</h3>
          {categoryData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    fontSize={10}
                  >
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>}
        </div>

        {/* Monthly revenue */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Chiffre d'affaires mensuel</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Line type="monotone" dataKey="revenue" stroke="#1e40af" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>}
        </div>

        {/* Peak hours */}
        <div className="card p-4">
          <h3 className="font-semibold mb-3">Heures de pointe</h3>
          {peakData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={12} tickFormatter={(h) => `${h}h`} />
                <YAxis fontSize={12} />
                <Tooltip labelFormatter={(h) => `${h}h`} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>}
        </div>
      </div>
    </AdminSidebar>
  );
}
