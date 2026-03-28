import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, BookOpen, ArrowRight } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { getCategories, getProducts } from '../services/api';
import { formatCurrency } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    getCategories().then(r => setCategories(r.data));
    getProducts({ limit: 8, sort: 'name' }).then(r => setFeatured(r.data.products));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/catalogue?search=${encodeURIComponent(search)}`;
    }
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Bienvenue chez Kulturama</h1>
          <p className="text-primary-100 mb-6 text-lg">Votre librairie en ligne - Manuels scolaires, romans, fournitures</p>
          <form onSubmit={handleSearch} className="max-w-lg mx-auto relative">
            <input
              type="text"
              placeholder="Rechercher un livre, un manuel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-300"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <Link to="/catalogue" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/catalogue?category=${cat.id}`}
              className="card p-4 text-center hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="text-sm font-medium mt-2 text-gray-700">{cat.name}</p>
              <p className="text-xs text-gray-400">{cat.product_count} articles</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Nos produits</h2>
          <Link to="/catalogue" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {featured.map(product => (
            <div key={product.id} className="card hover:shadow-md transition-shadow">
              <div className="aspect-[3/2] bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary-300" />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.category_name}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary-600">{formatCurrency(product.price)}</span>
                  {product.stock_quantity > 0 ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="En stock" />
                  ) : (
                    <span className="w-2 h-2 bg-red-500 rounded-full" title="Rupture" />
                  )}
                </div>
                <button
                  onClick={() => addItem(product)}
                  disabled={product.stock_quantity <= 0}
                  className="w-full mt-2 btn-primary text-sm py-1.5 flex items-center justify-center gap-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
