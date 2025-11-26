import React, { useState, useRef } from 'react';
import { Settings, TrendingUp, TrendingDown, CreditCard, Plus, GripVertical, X, Trash2 } from 'lucide-react';
import { Card, Input } from '../components/UI';
import { UserData, Categories, CardData } from '../types';
import { formatCurrency } from '../utils';

interface ConfigViewProps {
  userData: UserData;
  setUserData: (data: UserData) => void;
  categories: Categories;
  setCategories: React.Dispatch<React.SetStateAction<Categories>>;
  cards: CardData[];
  setCards: (cards: CardData[]) => void;
  handleResetApp: () => void;
}

export const ConfigView = ({ userData, setUserData, categories, setCategories, cards, setCards, handleResetApp }: ConfigViewProps) => {
  const [newIncome, setNewIncome] = useState('');
  const [newExpense, setNewExpense] = useState('');
  const [newCard, setNewCard] = useState({ name: '', limit: '' });

  const dragItem = useRef<{ position: number; type: string } | null>(null);
  const dragOverItem = useRef<{ position: number; type: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, position: number, type: string) => {
    dragItem.current = { position, type };
    if (e.target instanceof HTMLElement) {
        e.target.classList.add('opacity-50');
    }
  };

  const handleDragEnter = (e: React.DragEvent, position: number, type: string) => {
    dragOverItem.current = { position, type };
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
        e.target.classList.remove('opacity-50');
    }
    const source = dragItem.current;
    const destination = dragOverItem.current;

    if (!source || !destination || source.type !== destination.type) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    if (source.type === 'card') {
      const list = [...cards];
      const draggedItemContent = list[source.position];
      list.splice(source.position, 1);
      list.splice(destination.position, 0, draggedItemContent);
      setCards(list);
    } else {
      const typeKey = source.type as keyof Categories;
      const list = [...categories[typeKey]];
      const draggedItemContent = list[source.position];
      list.splice(source.position, 1);
      list.splice(destination.position, 0, draggedItemContent);
      setCategories(prev => ({ ...prev, [typeKey]: list }));
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleAddCategory = (type: keyof Categories, value: string, setValue: (s: string) => void) => {
    if (!value) return;
    setCategories(prev => ({ ...prev, [type]: [...prev[type], value] }));
    setValue('');
  };

  const handleCardLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNewCard({ ...newCard, limit: value });
  };

  const handleAddCard = () => {
    if (!newCard.name || !newCard.limit) return;
    setCards([...cards, { id: Date.now(), name: newCard.name, limit: parseFloat(newCard.limit) }]);
    setNewCard({ name: '', limit: '' });
  };

  const removeCategory = (type: keyof Categories, cat: string) => {
    setCategories(prev => ({ ...prev, [type]: prev[type].filter(c => c !== cat) }));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>
        <div className="text-xs text-slate-400">Arrastra los elementos para reordenarlos</div>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings size={18} /> Perfil de Usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Nombre" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className="mb-0" />

          {/* Phone Field */}
          <div className="flex flex-col gap-1 mb-0 w-full">
            <label className="text-sm font-medium text-slate-600">Teléfono</label>
            <div className="flex items-center border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 bg-white transition-all overflow-hidden">
              <select
                className="px-2 py-2 bg-slate-50 border-r border-slate-200 text-sm focus:outline-none text-slate-700 min-w-[80px]"
                value={userData.countryCode || '+56'}
                onChange={e => setUserData({ ...userData, countryCode: e.target.value })}
              >
                <option value="+56">🇨🇱 +56</option>
                <option value="+54">🇦🇷 +54</option>
                <option value="+51">🇵🇪 +51</option>
                <option value="+57">🇨🇴 +57</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+55">🇧🇷 +55</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+58">🇻🇪 +58</option>
                <option value="+593">🇪🇨 +593</option>
              </select>
              <input
                className="flex-1 px-3 py-2 border-none focus:outline-none text-slate-800"
                value={userData.phone}
                onChange={e => setUserData({ ...userData, phone: e.target.value })}
                placeholder="9 1234 5678"
              />
            </div>
          </div>

          <Input label="Correo" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} className="mb-0" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        <Card className="p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
            <TrendingUp size={18} className="text-emerald-500" /> Categorías de Ingreso
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              placeholder="Nueva categoría..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={newIncome}
              onChange={e => setNewIncome(e.target.value)}
            />
            <button onClick={() => handleAddCategory('ingreso', newIncome, setNewIncome)} className="bg-emerald-100 text-emerald-600 p-2 rounded hover:bg-emerald-200 transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {categories.ingreso.map((cat, index) => (
              <div
                key={cat}
                draggable
                onDragStart={(e) => handleDragStart(e, index, 'ingreso')}
                onDragEnter={(e) => handleDragEnter(e, index, 'ingreso')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded cursor-move hover:bg-white hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2"><GripVertical size={14} className="text-slate-300" /><span className="text-sm font-medium text-slate-600">{cat}</span></div>
                <button onClick={() => removeCategory('ingreso', cat)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
            <TrendingDown size={18} className="text-rose-500" /> Categorías de Gasto
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              placeholder="Nueva categoría..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={newExpense}
              onChange={e => setNewExpense(e.target.value)}
            />
            <button onClick={() => handleAddCategory('gasto', newExpense, setNewExpense)} className="bg-rose-100 text-rose-600 p-2 rounded hover:bg-rose-200 transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {categories.gasto.map((cat, index) => (
              <div
                key={cat}
                draggable
                onDragStart={(e) => handleDragStart(e, index, 'gasto')}
                onDragEnter={(e) => handleDragEnter(e, index, 'gasto')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded cursor-move hover:bg-white hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2"><GripVertical size={14} className="text-slate-300" /><span className="text-sm font-medium text-slate-600">{cat}</span></div>
                <button onClick={() => removeCategory('gasto', cat)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 flex flex-col h-full">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
            <CreditCard size={18} className="text-blue-500" /> Tarjetas de Crédito
          </h3>
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex flex-col gap-2">
              <input placeholder="Nombre..." className="px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
              <input placeholder="Cupo..." type="text" className="px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newCard.limit ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseInt(newCard.limit)) : ''} onChange={handleCardLimitChange} />
            </div>
            <button onClick={handleAddCard} className="w-full bg-blue-50 text-blue-600 p-2 rounded hover:bg-blue-100 transition-colors text-sm font-medium flex justify-center items-center gap-2"><Plus size={16} /> Agregar Tarjeta</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
            {cards.map((card, index) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index, 'card')}
                onDragEnter={(e) => handleDragEnter(e, index, 'card')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded cursor-move hover:bg-white hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-700 truncate">{card.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(card.limit)}</p>
                  </div>
                </div>
                <button onClick={() => setCards(cards.filter(c => c.id !== card.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleResetApp} className="w-full md:w-1/5 py-2 text-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors flex items-center justify-center gap-2">
          <Trash2 size={14} /> Resetear Aplicación
        </button>
      </div>
    </div>
  );
};
