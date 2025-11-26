import React from 'react';
import { LayoutDashboard, DollarSign, CreditCard, PieChart, Settings, Wallet } from 'lucide-react';
import { UserData } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  userData: UserData;
}

export const Sidebar = ({ activeTab, setActiveTab, isMobileMenuOpen, userData }: SidebarProps) => {
  const menuItems = [
    { id: 'resumen', icon: LayoutDashboard, label: 'Resumen' },
    { id: 'ahorros', icon: DollarSign, label: 'Ahorros' },
    { id: 'tarjetas', icon: CreditCard, label: 'Tarjetas' },
    { id: 'reporte', icon: PieChart, label: 'Reporte' },
    { id: 'configuracion', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col print:hidden`}>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="text-emerald-400" /> Mi Billetera
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{userData.name}</p>
            <p className="text-xs text-slate-400 truncate">{userData.email || 'Sin correo'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
