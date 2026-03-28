import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, BookOpen, Home, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top bar */}
      <header className="bg-primary-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-7 h-7" />
            <span className="text-xl font-bold">Kulturama</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/suivi" className="text-sm hover:underline hidden sm:block">
              Suivi commande
            </Link>
            <Link to="/panier" className="relative p-2">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
        <div className="flex justify-around py-2">
          <Link to="/" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive('/') ? 'text-primary-600' : 'text-gray-500'}`}>
            <Home className="w-5 h-5" />
            <span className="text-xs">Accueil</span>
          </Link>
          <Link to="/catalogue" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive('/catalogue') ? 'text-primary-600' : 'text-gray-500'}`}>
            <Search className="w-5 h-5" />
            <span className="text-xs">Catalogue</span>
          </Link>
          <Link to="/panier" className={`flex flex-col items-center gap-1 px-3 py-1 relative ${isActive('/panier') ? 'text-primary-600' : 'text-gray-500'}`}>
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <span className="text-xs">Panier</span>
          </Link>
          <Link to="/suivi" className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive('/suivi') ? 'text-primary-600' : 'text-gray-500'}`}>
            <Package className="w-5 h-5" />
            <span className="text-xs">Suivi</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
