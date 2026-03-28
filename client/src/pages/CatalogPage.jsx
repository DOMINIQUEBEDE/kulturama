import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ShoppingCart, BookOpen, ChevronDown, X } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getProducts, getCategories } from '../services/api';
import { formatCurrency } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: 'name',
    available: false,
    page: 1
  });

  const [searchInput, setSearchInput] = useState(filters.search);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20, page: filters.page };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.sort) params.sort = filters.sort;
      if (filters.available) params.available = 'true';
      const { data } = await getProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="min-h-screen pb-20 sm:pb-0 bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Search and filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-10"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-1">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Catégorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
                className="input-field"
              >
                <option value="">Toutes</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name} ({c.product_count})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Trier par</label>
              <select
                value={filters.sort}
                onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="input-field"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.available}
                  onChange={(e) => setFilters(f => ({ ...f, available: e.target.checked, page: 1 }))}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm">En stock uniquement</span>
              </label>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setFilters(f => ({ ...f, category: '', page: 1 }))}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !filters.category ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            Tout
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setFilters(f => ({ ...f, category: String(c.id), page: 1 }))}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.category === String(c.id) ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-3">{pagination.total || 0} produit(s) trouvé(s)</p>

        {/* Products grid */}
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map(product => (
              <div key={product.id} className="card hover:shadow-md transition-shadow">
                <div className="aspect-[3/2] bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
                  <BookOpen className="w-8 h-8 text-primary-300" />
                  {product.stock_quantity > 0 ? (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full" />
                  ) : (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded font-medium">Rupture</span>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2 mb-1 min-h-[2rem]">{product.name}</h3>
                  <p className="text-xs text-gray-400 mb-1">{product.category_name}</p>
                  <p className="font-bold text-primary-600 text-sm">{formatCurrency(product.price)}</p>
                  <p className="text-xs text-gray-400 mb-2">{product.stock_quantity} en stock</p>
                  <button
                    onClick={() => addItem(product)}
                    disabled={product.stock_quantity <= 0}
                    className="w-full btn-primary text-xs py-1.5 flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters(f => ({ ...f, page }))}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  pagination.page === page ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
