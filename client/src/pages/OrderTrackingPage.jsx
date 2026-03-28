import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, CheckCircle, Clock, Truck, MapPin, XCircle } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { trackOrder, trackByPhone } from '../services/api';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
const STEP_ICONS = { pending: Clock, confirmed: CheckCircle, preparing: Package, ready: MapPin, delivered: Truck };

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('order')) {
      handleSearch(null, searchParams.get('order'));
    }
  }, []);

  const handleSearch = async (e, value) => {
    if (e) e.preventDefault();
    const q = (value || query).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setOrder(null);
    setOrders([]);

    try {
      if (q.startsWith('LIB-')) {
        const { data } = await trackOrder(q);
        setOrder(data);
      } else {
        const { data } = await trackByPhone(q);
        if (data.length === 0) {
          setError('Aucune commande trouvée pour ce numéro');
        } else {
          setOrders(data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Commande non trouvée');
    }
    setLoading(false);
  };

  const currentStep = order ? STEPS.indexOf(order.order_status) : -1;

  return (
    <div className="min-h-screen pb-20 sm:pb-0 bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Suivi de commande</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="N° commande (LIB-...) ou téléphone"
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary flex items-center gap-1">
            <Search className="w-4 h-4" />
            Rechercher
          </button>
        </form>

        {loading && <LoadingSpinner />}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Single order view */}
        {order && !order.items && null}
        {order && order.order_status !== 'cancelled' && (
          <div className="card p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-lg text-primary-600">{order.order_number}</h2>
                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
              </div>
              <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
            </div>

            {/* Progress timeline */}
            <div className="relative mb-6">
              <div className="flex justify-between">
                {STEPS.map((step, i) => {
                  const Icon = STEP_ICONS[step];
                  const isActive = i <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] sm:text-xs text-center ${isActive ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                        {ORDER_STATUS_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10">
                <div className="h-full bg-primary-600 transition-all" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
              </div>
            </div>

            {/* Order items */}
            {order.items && (
              <div className="border-t pt-3">
                <h3 className="font-medium text-sm mb-2">Articles commandés</h3>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 mt-3 text-sm text-gray-500">
              <p>Paiement: {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</p>
              <p>Client: {order.customer_name} - {order.customer_phone}</p>
            </div>
          </div>
        )}

        {order && order.order_status === 'cancelled' && (
          <div className="card p-5 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <h2 className="font-bold text-lg">{order.order_number}</h2>
            <p className="text-red-600">Cette commande a été annulée</p>
          </div>
        )}

        {/* List of orders by phone */}
        {orders.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{orders.length} commande(s) trouvée(s)</p>
            {orders.map(o => (
              <button
                key={o.id}
                onClick={() => { setQuery(o.order_number); handleSearch(null, o.order_number); }}
                className="card p-4 w-full text-left hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between">
                  <span className="font-bold text-primary-600">{o.order_number}</span>
                  <span className="font-bold">{formatCurrency(o.total_amount)}</span>
                </div>
                <div className="flex justify-between mt-1 text-sm text-gray-500">
                  <span>{formatDate(o.created_at)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    o.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                    o.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ORDER_STATUS_LABELS[o.order_status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
