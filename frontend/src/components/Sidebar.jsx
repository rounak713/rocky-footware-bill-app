import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  BarChart3, LogOut, Footprints, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/billing',    icon: ShoppingCart,    label: 'Billing'    },
  { to: '/inventory',  icon: Package,         label: 'Inventory'  },
  { to: '/invoices',   icon: FileText,        label: 'Invoices'   },
  { to: '/customers',  icon: Users,            label: 'Customers'  },
  { to: '/reports',    icon: BarChart3,        label: 'Reports'    },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 h-16 md:relative md:h-auto md:w-64 md:min-h-screen bg-slate-900 flex md:flex-col text-white shadow-[0_-4px_25px_rgba(0,0,0,0.2)] md:shadow-2xl shrink-0 print:hidden">
      {/* Logo - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Footprints size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-lg leading-tight">Rocky Footwear</h1>
          <p className="text-xs text-slate-400">Retail POS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start items-center md:items-stretch overflow-x-auto overflow-y-hidden md:overflow-visible px-2 md:px-3 py-0 md:py-6 space-x-1 md:space-x-0 md:space-y-1 scrollbar-hide">
        {navItems
          .filter(item => {
            if (user?.role === 'STAFF') {
              return item.to === '/billing';
            }
            return true;
          })
          .map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-semibold text-[10px] md:text-sm transition-all duration-150 whitespace-nowrap
               ${isActive
                  ? 'text-blue-400 md:bg-blue-600 md:text-white md:shadow-lg md:shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 md:hover:bg-slate-800 md:hover:text-white'
                }`
            }
          >
            <Icon size={20} className={({isActive}) => isActive ? 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] md:drop-shadow-none' : ''} />
            <span className="md:block">{label}</span>
          </NavLink>
        ))}
        {/* Mobile LogOut Button */}
        <button
          onClick={logout}
          className="md:hidden flex flex-col items-center gap-1 px-3 py-2 text-slate-400 hover:text-red-400 text-[10px] font-semibold transition"
        >
          <LogOut size={20} />
          <span>Exit</span>
        </button>
      </nav>

      {/* User footer - Desktop Only */}
      <div className="hidden md:block px-4 py-5 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
