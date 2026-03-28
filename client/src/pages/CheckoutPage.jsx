import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, Smartphone, Banknote } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { formatCurrency } from '../utils/format';

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Paiement a la livraison/retrait', icon: Banknote, color: 'text-green-600' },
  { id: 'orange_money', label: 'Orange Money', icon: Smartphone, color: 'text-orange-500' },
  { id: 'mtn_momo', label: 'MTN MoMo', icon: Smartphone, color: 'text-yellow-500' },
  { id: 'wave', label: 'Wave', icon: CreditCard, color: 'text-blue-500' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    payment_method: 'cash',
    notes: ''
  });

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.full_name.trim()) return setError('Le nom est requis');
    if (!form.phone.trim()) return setError('Le numéro de téléphone est requis');
    if (items.length === 0) return setError('Le panier est vide');

    setLoading(true);
    try {
      const { data } = await createOrder({
        customer: {
          full_name: form.full_name,
          phone: form.phone,
          email: form.email || null,
          address: form.address || null
        },
        items: items.map(item => ({ product_id: item.id, quantity: item.quantity })),
        payment_method: form.payment_method,
        notes: form.notes || null
      });
      setOrderResult(data);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la commande');
    }
    setLoading(false);
  };

  if (orderResult) {
    return (
      <div className="min-h-screen pb-20 sm:pb-0">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande confirmée !</h1>
          <p className="text-gray-600 mb-6">Votre commande a bien été enregistrée</p>
          <div className="card p-4 text-left mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">N° commande</span>
                <span className="font-bold text-primary-600">{orderResult.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant total</span>
                <span className="font-bold">{formatCurrency(orderResult.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">En attente</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link to={`/suivi?order=${orderResult.order_number}`} className="btn-primary text-center">
              Suivre ma commande
            </Link>
            <Link to="/catalogue" className="btn-secondary text-center">
              Continuer les achats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/panier');
    return null;
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0 bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Link to="/panier" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Link>

        <h1 className="text-xl font-bold mb-4">Finaliser la commande</h1>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer info */}
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Vos informations</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Nom complet *</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} className="input-field" placeholder="Votre nom complet" required />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Téléphone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="+225 XX XX XXX XXX" required />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Email (optionnel)</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="votre@email.com" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Adresse / Quartier</label>
                <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="Quartier, ville" />
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Récapitulatif ({items.length} articles)</h2>
            <div className="space-y-2 mb-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Mode de paiement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.payment_method === option.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={option.id}
                      checked={form.payment_method === option.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <label className="text-sm text-gray-600 mb-1 block">Notes (optionnel)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input-field"
              rows={2}
              placeholder="Instructions particulières..."
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
            {loading ? 'Traitement...' : `Confirmer la commande - ${formatCurrency(totalAmount)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
