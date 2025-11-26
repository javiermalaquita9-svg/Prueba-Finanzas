import React, { useState, useEffect } from 'react';
import { Menu, AlertCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { SummaryView } from './views/SummaryView';
import { SavingsView } from './views/SavingsView';
import { CardsView } from './views/CardsView';
import { ReportsView } from './views/ReportsView';
import { ConfigView } from './views/ConfigView';
import { Modal, Button, Input } from './components/UI';
import { Transaction, UserData, Categories, CardData, WishlistItem, Acquisition, PaidMonths } from './types';

// Default Data
const defaultCategories = {
  ingreso: ['Salario', 'Ventas', 'Freelance'],
  gasto: ['Alimentación', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Educación', 'Pago Tarjeta']
};
const defaultCards = [
  { id: 1, name: 'Visa Principal', limit: 1000000 },
  { id: 2, name: 'Mastercard', limit: 500000 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [isDeletingAcquisition, setIsDeletingAcquisition] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', date: '' });

  // Persistent State
  const [userData, setUserData] = useState<UserData>(() => {
    const s = localStorage.getItem('gf_userData');
    const p = s ? JSON.parse(s) : { name: 'Usuario', phone: '', email: '' };
    if (!p.countryCode) p.countryCode = '+56';
    return p;
  });

  const [categories, setCategories] = useState<Categories>(() => 
    JSON.parse(localStorage.getItem('gf_categories') || JSON.stringify(defaultCategories))
  );

  const [cards, setCards] = useState<CardData[]>(() => 
    JSON.parse(localStorage.getItem('gf_cards') || JSON.stringify(defaultCards))
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    JSON.parse(localStorage.getItem('gf_transactions') || '[]')
  );

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => 
    JSON.parse(localStorage.getItem('gf_wishlist') || '[]')
  );

  const [acquisitions, setAcquisitions] = useState<Acquisition[]>(() => 
    JSON.parse(localStorage.getItem('gf_acquisitions') || '[]')
  );

  const [paidMonths, setPaidMonths] = useState<PaidMonths>(() => 
    JSON.parse(localStorage.getItem('gf_paid_months') || '{}')
  );

  // Persistence Effects
  useEffect(() => localStorage.setItem('gf_userData', JSON.stringify(userData)), [userData]);
  useEffect(() => localStorage.setItem('gf_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('gf_cards', JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem('gf_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('gf_wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('gf_acquisitions', JSON.stringify(acquisitions)), [acquisitions]);
  useEffect(() => localStorage.setItem('gf_paid_months', JSON.stringify(paidMonths)), [paidMonths]);

  // Actions
  const handleResetApp = () => {
    if (window.confirm('ADVERTENCIA: ¿Borrar todos los datos y reiniciar la aplicación?')) {
      if (window.confirm('Esta acción es irreversible. ¿Confirmar?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const addTransaction = (newTrans: Transaction) => setTransactions([newTrans, ...transactions]);

  const promptDelete = (id: number, isAcquisition = false) => {
    setTransactionToDelete(id);
    setIsDeletingAcquisition(isAcquisition);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      if (isDeletingAcquisition) {
        setAcquisitions(acquisitions.filter(a => a.id !== transactionToDelete));
      } else {
        setTransactions(transactions.filter(t => t.id !== transactionToDelete));
      }
      setTransactionToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const saveEdit = () => {
    if (!transactionToEdit) return;
    setTransactions(transactions.map(t => 
      t.id === transactionToEdit.id 
        ? { ...t, description: editForm.description, amount: parseFloat(editForm.amount), date: editForm.date } 
        : t
    ));
    setEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const summary = transactions.reduce((acc, curr) => {
    const amount = curr.amount;
    if (curr.type === 'ingreso') acc.ingresos += amount;
    if (curr.type === 'gasto') acc.egresos += amount;
    if (curr.type === 'ahorro') acc.ahorros += amount;
    return acc;
  }, { ingresos: 0, egresos: 0, ahorros: 0 });

  const totalBalance = summary.ingresos - summary.egresos - summary.ahorros;

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <SummaryView 
          transactions={transactions} 
          addTransaction={addTransaction} 
          categories={categories} 
          cards={cards} 
          totalBalance={totalBalance} 
          summary={summary} 
          promptDelete={(id) => promptDelete(id, false)}
          paidMonths={paidMonths}
        />;
      case 'ahorros':
        return <SavingsView 
          transactions={transactions} 
          wishlist={wishlist} 
          setWishlist={setWishlist} 
          acquisitions={acquisitions} 
          setAcquisitions={setAcquisitions} 
        />;
      case 'tarjetas':
        return <CardsView 
          cards={cards} 
          transactions={transactions} 
          paidMonths={paidMonths} 
          setPaidMonths={setPaidMonths} 
          setActiveTab={setActiveTab} 
        />;
      case 'reporte':
        return <ReportsView 
          transactions={transactions} 
          cards={cards} 
          userData={userData} 
          paidMonths={paidMonths}
        />;
      case 'configuracion':
        return <ConfigView 
          userData={userData} 
          setUserData={setUserData} 
          categories={categories} 
          setCategories={setCategories} 
          cards={cards} 
          setCards={setCards} 
          handleResetApp={handleResetApp} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden print:overflow-visible print:h-auto">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 shadow-md print:hidden">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white mr-4">
          <Menu />
        </button>
        <span className="text-white font-bold text-lg">Mi Billetera</span>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
        isMobileMenuOpen={isMobileMenuOpen} 
        userData={userData} 
      />

      {/* Main Content Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0 print:overflow-visible print:h-auto print:static">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 capitalize">
              {activeTab === 'configuracion' ? 'Configuración' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-500">
              {activeTab === 'resumen' && 'Bienvenido de vuelta, aquí está tu estado financiero.'}
              {activeTab === 'ahorros' && 'Gestiona tus metas y fondo de ahorro.'}
              {activeTab === 'tarjetas' && 'Controla tus cupos de crédito y pagos.'}
              {activeTab === 'reporte' && 'Visualiza en qué estás gastando tu dinero.'}
              {activeTab === 'configuracion' && 'Personaliza tu experiencia.'}
            </p>
          </header>
          {renderContent()}
        </div>
      </main>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Eliminar Registro">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <p className="text-slate-600 mb-6">¿Estás seguro de que deseas eliminar este elemento?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setDeleteModalOpen(false)} variant="secondary">Cancelar</Button>
            <Button onClick={confirmDelete} variant="danger">Sí, Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Transacción">
        <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
          <Input 
            label="Descripción" 
            value={editForm.description} 
            onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Monto" 
              type="number" 
              value={editForm.amount} 
              onChange={e => setEditForm({ ...editForm, amount: e.target.value })} 
            />
            <Input 
              label="Fecha" 
              type="date" 
              value={editForm.date} 
              onChange={e => setEditForm({ ...editForm, date: e.target.value })} 
            />
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <Button onClick={() => setEditModalOpen(false)} variant="secondary">Cancelar</Button>
            <Button type="submit" variant="primary">Guardar Cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
