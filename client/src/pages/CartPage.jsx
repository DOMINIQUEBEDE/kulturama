import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen pb-20 sm:pb-0">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Votre panier est vide</h2>
          <p className="text-gray-500 mb-6">Parcourez notre catalogue et ajoutez des articles</p>
          <Link to="/catalogue" className="btn-primary inline-flex items-center gap-2">
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0 bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Mon panier ({totalItems})</h1>
          <button onClick={clearCart} className="text-red-500 text-sm hover:underline">
            Vider le panier
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {items.map(item => (
            <div key={item.id} className="card p-3 flex gap-3">
              <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-primary-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</h3>
                <p className="text-sm text-primary-600 font-bold">{formatCurrency(item.price)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-gray-100"
                      disabled={item.quantity >= item.stock_quantity}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="p-1.5 text-red-400 hover:text-red-600 self-start">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Total ({totalItems} articles)</span>
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(totalAmount)}</span>
          </div>
          <Link to="/checkout" className="btn-primary w-full text-center block py-3 text-lg">
            Passer la commande
          </Link>
          <Link to="/catalogue" className="flex items-center justify-center gap-1 mt-3 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Continuer les achats
          </Link>
        </div>
      </div>
    </div>
  );
}
