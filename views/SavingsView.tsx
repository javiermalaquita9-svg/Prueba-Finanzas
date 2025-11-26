import React, { useState } from 'react';
import { Target, Save, Calendar, TrendingUp, ShoppingBag, Plus, Check, X, Award, Trash2 } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { Transaction, WishlistItem, Acquisition } from '../types';
import { formatCurrency, getMonthKey } from '../utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface SavingsViewProps {
  transactions: Transaction[];
  wishlist: WishlistItem[];
  setWishlist: (list: WishlistItem[]) => void;
  acquisitions: Acquisition[];
  setAcquisitions: (list: Acquisition[]) => void;
}

export const SavingsView = ({ transactions, wishlist, setWishlist, acquisitions, setAcquisitions }: SavingsViewProps) => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [wishItem, setWishItem] = useState({ name: '', link: '', price: '' });

  const savingsTransactions = transactions.filter(t => t.type === 'ahorro');
  const filteredSavings = savingsTransactions.filter(t => t.date.startsWith(filterDate));
  const totalSavings = savingsTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const handleWishAdd = () => {
    if (!wishItem.name || !wishItem.price) return;
    const newItem: WishlistItem = {
      id: Date.now(),
      name: wishItem.name,
      link: wishItem.link,
      price: parseFloat(wishItem.price)
    };
    setWishlist([...wishlist, newItem]);
    setWishItem({ name: '', link: '', price: '' });
  };

  const deleteWishItem = (id: number) => setWishlist(wishlist.filter(w => w.id !== id));
  
  const handlePurchase = (id: number) => {
    const item = wishlist.find(w => w.id === id);
    if (!item) return;
    const purchasedItem: Acquisition = { ...item, purchaseDate: new Date().toISOString().split('T')[0] };
    setAcquisitions([purchasedItem, ...acquisitions]);
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  const deleteAcquisition = (id: number) => {
    if (window.confirm('¿Eliminar del historial de compras?')) setAcquisitions(acquisitions.filter(a => a.id !== id));
  };

  const handleWishPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWishItem({ ...wishItem, price: e.target.value.replace(/[^0-9]/g, '') });
  };

  const getChartData = () => {
    const [year, month] = filterDate.split('-');
    const centerDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const data = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDate.getFullYear(), centerDate.getMonth() + i, 1);
      const key = getMonthKey(d);
      const monthName = d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
      const total = transactions
        .filter(t => t.type === 'ahorro' && t.date.startsWith(key))
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      data.push({ 
        name: monthName, 
        total, 
        isCurrent: i === 0,
        isFuture: d > new Date()
      });
    }
    return data;
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-purple-200 font-medium mb-1 flex items-center gap-2">
            <Target size={20} /> Ahorro Total Acumulado
          </h2>
          <p className="text-5xl font-bold tracking-tight">{formatCurrency(totalSavings)}</p>
        </div>
        <div className="z-10 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
          <Save size={40} className="text-purple-100" />
        </div>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-purple-600" /> Registro Mensual
          </h3>
          <input
            type="month"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-slate-100">
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Descripción</th>
                <th className="pb-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSavings.map(t => (
                <tr key={t.id} className="text-sm hover:bg-slate-50">
                  <td className="py-4 text-slate-500">{t.date}</td>
                  <td className="py-4 font-medium text-slate-700">{t.description}</td>
                  <td className="py-4 text-right font-bold text-purple-600">+{formatCurrency(t.amount)}</td>
                </tr>
              ))}
              {filteredSavings.length === 0 && (
                <tr>
                   <td colSpan={3} className="py-4 text-center text-slate-400">Sin ahorros este mes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 h-[450px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Comportamiento de Ahorro
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrent ? '#9333ea' : entry.isFuture ? '#cbd5e1' : '#d8b4fe'} 
                      strokeDasharray={entry.isFuture ? '4 4' : undefined}
                      stroke={entry.isFuture ? '#94a3b8' : 'none'}
                      strokeWidth={entry.isFuture ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 flex flex-col h-[450px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-rose-500" /> Lista de Deseos
          </h3>
          <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-100">
            <div className="space-y-3">
              <input
                placeholder="Nombre del producto..."
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                value={wishItem.name}
                onChange={(e) => setWishItem({ ...wishItem, name: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  placeholder="Link (opcional)..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  value={wishItem.link}
                  onChange={(e) => setWishItem({ ...wishItem, link: e.target.value })}
                />
                <input
                  placeholder="Precio..."
                  className="w-28 px-3 py-2 border border-slate-300 rounded text-sm"
                  value={wishItem.price ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseInt(wishItem.price)) : ''}
                  onChange={handleWishPriceChange}
                />
              </div>
              <Button onClick={handleWishAdd} variant="custom" className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm py-2">
                <Plus size={16} /> Agregar a la lista
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {wishlist.map(item => {
              const progress = Math.min((totalSavings / item.price) * 100, 100);
              const canAfford = totalSavings >= item.price;
              return (
                <div key={item.id} className="p-3 bg-white border border-slate-100 rounded hover:shadow-sm transition-shadow group relative">
                  <div className="flex justify-between items-start mb-2 pl-6">
                    <button
                      onClick={() => handlePurchase(item.id)}
                      className="absolute left-2 top-3 w-5 h-5 rounded border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors"
                      title="¡Ya lo compré!"
                    >
                      <Check size={12} strokeWidth={4} className="opacity-0 hover:opacity-100" />
                    </button>
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-700 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-600">{formatCurrency(item.price)}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteWishItem(item.id)} className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-1 pl-6">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Progreso</span>
                      <span className={canAfford ? "text-emerald-600 font-bold" : ""}>{canAfford ? "¡Lo puedes comprar!" : `${progress.toFixed(1)}%`}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${canAfford ? 'bg-emerald-500' : 'bg-purple-400'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      
      <Card className="p-6 border-t-4 border-t-emerald-400">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Award size={22} className="text-emerald-500" /> Mis Metas Cumplidas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-slate-100">
                <th className="pb-3 font-medium">Fecha Compra</th>
                <th className="pb-3 font-medium">Producto</th>
                <th className="pb-3 font-medium text-right">Precio</th>
                <th className="pb-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {acquisitions.map(item => (
                <tr key={item.id} className="text-sm hover:bg-emerald-50/30">
                  <td className="py-4 text-slate-500">{item.purchaseDate}</td>
                  <td className="py-4 font-medium text-slate-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check size={14} />
                    </span>
                    {item.name}
                  </td>
                  <td className="py-4 text-right font-bold text-slate-600">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right">
                    <button onClick={() => deleteAcquisition(item.id)} className="text-slate-300 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
