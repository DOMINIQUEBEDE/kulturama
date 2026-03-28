import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, BarChart3, LogOut, BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/commandes', icon: ShoppingBag, label: 'Commandes' },
  { to: '/admin/stock', icon: Package, label: 'Stock' },
  { to: '/admin/stats', icon: BarChart3, label: 'Statistiques' },
];

export default function AdminSidebar({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-primary-700">
        <div className="flex items-center gap-2 text-white">
          <BookOpen className="w-6 h-6" />
          <span className="font-bold text-lg">Kulturama Admin</span>
        </div>
        {admin && <p className="text-primary-200 text-sm mt-1">{admin.name}</p>}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              location.pathname === to
                ? 'bg-primary-700 text-white'
                : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-primary-700">
        <Link to="/" className="flex items-center gap-3 px-3 py-2 text-primary-200 hover:text-white transition-colors text-sm mb-2" onClick={() => setOpen(false)}>
          <BookOpen className="w-4 h-4" />
          Voir la boutique
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-red-300 hover:text-red-100 transition-colors w-full">
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-primary-800 flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-primary-800">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold">Kulturama Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
