import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Edit3, AlertTriangle, X, Save, Package } from 'lucide-react';
import AdminSidebar from '../components/ui/AdminSidebar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getProducts, getCategories, updateStock, updateProduct, createProduct } from '../services/api';
import { formatCurrency } from '../utils/format';

export default function AdminStockPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', page: 1 });
  const [editingStock, setEditingStock] = useState(null);
  const [stockQty, setStockQty] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', category_id: '', price: '', stock_quantity: 0, description: '' });

  const fetchProducts = async () => {
    try {
      const params = { page: filters.page, limit: 50 };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      const { data } = await getProducts(params);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    getCategories().then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters.page, filters.category]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleStockUpdate = async (productId, type) => {
    if (stockQty <= 0) return;
    try {
      await updateStock(productId, { quantity: stockQty, movement_type: type, reason: type === 'in' ? 'Réapprovisionnement' : 'Retrait manuel' });
      setEditingStock(null);
      setStockQty(0);
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleProductUpdate = async () => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, editingProduct);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) return;
    try {
      await createProduct({ ...newProduct, price: Number(newProduct.price), stock_quantity: Number(newProduct.stock_quantity) || 0 });
      setShowAdd(false);
      setNewProduct({ name: '', category_id: '', price: '', stock_quantity: 0, description: '' });
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  return (
    <AdminSidebar>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion du stock</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
          className="input-field w-full sm:w-56"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-3">{pagination.total || 0} produit(s)</p>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Produit</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Catégorie</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Prix</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Stock</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => {
                const isLow = p.stock_quantity <= p.stock_alert_threshold;
                return (
                  <tr key={p.id} className={isLow ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.isbn && <p className="text-xs text-gray-400">{p.isbn}</p>}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-xs text-gray-500">{p.category_name}</td>
                    <td className="px-3 py-2 font-bold text-sm">{formatCurrency(p.price)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>{p.stock_quantity}</span>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingStock(p.id); setStockQty(0); }}
                          className="p-1 hover:bg-gray-100 rounded text-primary-600"
                          title="Modifier le stock"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct({ ...p })}
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          title="Modifier le produit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inline stock editor */}
                      {editingStock === p.id && (
                        <div className="mt-2 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={stockQty}
                            onChange={(e) => setStockQty(Number(e.target.value))}
                            className="w-16 input-field text-xs py-1"
                          />
                          <button onClick={() => handleStockUpdate(p.id, 'in')} className="px-2 py-1 bg-green-500 text-white rounded text-xs">+</button>
                          <button onClick={() => handleStockUpdate(p.id, 'out')} className="px-2 py-1 bg-red-500 text-white rounded text-xs">-</button>
                          <button onClick={() => setEditingStock(null)} className="p-1"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add product modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Nouveau produit</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Nom du produit" value={newProduct.name} onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))} className="input-field" />
              <select value={newProduct.category_id} onChange={(e) => setNewProduct(p => ({ ...p, category_id: e.target.value }))} className="input-field">
                <option value="">Catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" placeholder="Prix (FCFA)" value={newProduct.price} onChange={(e) => setNewProduct(p => ({ ...p, price: e.target.value }))} className="input-field" />
              <input type="number" placeholder="Stock initial" value={newProduct.stock_quantity} onChange={(e) => setNewProduct(p => ({ ...p, stock_quantity: e.target.value }))} className="input-field" />
              <textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))} className="input-field" rows={2} />
              <button onClick={handleAddProduct} className="btn-primary w-full">Ajouter le produit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit product modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Modifier le produit</h2>
              <button onClick={() => setEditingProduct(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={editingProduct.name} onChange={(e) => setEditingProduct(p => ({ ...p, name: e.target.value }))} className="input-field" />
              <select value={editingProduct.category_id} onChange={(e) => setEditingProduct(p => ({ ...p, category_id: Number(e.target.value) }))} className="input-field">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct(p => ({ ...p, price: Number(e.target.value) }))} className="input-field" placeholder="Prix" />
              <input type="number" value={editingProduct.stock_alert_threshold} onChange={(e) => setEditingProduct(p => ({ ...p, stock_alert_threshold: Number(e.target.value) }))} className="input-field" placeholder="Seuil d'alerte" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!editingProduct.is_active} onChange={(e) => setEditingProduct(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))} />
                <span className="text-sm">Produit actif</span>
              </div>
              <button onClick={handleProductUpdate} className="btn-primary w-full flex items-center justify-center gap-1">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSidebar>
  );
}
