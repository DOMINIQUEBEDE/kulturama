import { useState, useEffect } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminSidebar from '../components/ui/AdminSidebar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getOrders, getOrder, updateOrderStatus } from '../services/api';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../utils/format';
import socket, { connectSocket, joinAdmin } from '../services/socket';

const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });

  const fetchOrders = async () => {
    try {
      const params = { page: filters.page, limit: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      const { data } = await getOrders(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [filters.page, filters.status]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    connectSocket();
    joinAdmin();
    socket.on('new_order', fetchOrders);
    socket.on('order_updated', fetchOrders);
    return () => { socket.off('new_order'); socket.off('order_updated'); };
  }, []);

  const viewOrder = async (id) => {
    try {
      const { data } = await getOrder(id);
      setSelected(data);
    } catch (err) { console.error(err); }
  };

  const changeStatus = async (id, order_status) => {
    try {
      await updateOrderStatus(id, { order_status });
      fetchOrders();
      if (selected?.id === id) viewOrder(id);
    } catch (err) { console.error(err); }
  };

  const changePaymentStatus = async (id, payment_status) => {
    try {
      await updateOrderStatus(id, { payment_status });
      fetchOrders();
      if (selected?.id === id) viewOrder(id);
    } catch (err) { console.error(err); }
  };

  return (
    <AdminSidebar>
      <h1 className="text-2xl font-bold mb-4">Commandes</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (N°, client, tel...)"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="input-field w-full sm:w-48"
        >
          <option value="">Tous les statuts</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Orders table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">N° Commande</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Paiement</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p>{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs">{PAYMENT_METHOD_LABELS[order.payment_method]}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.order_status}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${ORDER_STATUS_COLORS[order.order_status]}`}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => viewOrder(order.id)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucune commande</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="p-1 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm">Page {pagination.page} / {pagination.totalPages}</span>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pagination.totalPages}
                className="p-1 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold">{selected.order_number}</h2>
                <p className="text-sm text-gray-500">{formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Client:</span> {selected.customer_name}</div>
                <div><span className="text-gray-500">Tel:</span> {selected.customer_phone}</div>
                {selected.customer_email && <div><span className="text-gray-500">Email:</span> {selected.customer_email}</div>}
                {selected.customer_address && <div><span className="text-gray-500">Adresse:</span> {selected.customer_address}</div>}
              </div>
            </div>

            <h3 className="font-semibold text-sm mb-2">Articles</h3>
            <div className="space-y-1 mb-4">
              {selected.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-2 mb-4">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(selected.total_amount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Statut commande</label>
                <select
                  value={selected.order_status}
                  onChange={(e) => changeStatus(selected.id, e.target.value)}
                  className="input-field text-sm"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Statut paiement</label>
                <select
                  value={selected.payment_status}
                  onChange={(e) => changePaymentStatus(selected.id, e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                  <option value="refunded">Remboursé</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminSidebar>
  );
}
