import React, { useState, useEffect } from 'react';
import { Menu, AlertCircle, LogOut } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { SummaryView } from './views/SummaryView';
import { SavingsView } from './views/SavingsView';
import { CardsView } from './views/CardsView';
import { ReportsView } from './views/ReportsView';
import { ConfigView } from './views/ConfigView';
import { Modal, Button, Input } from './components/UI';
import { Transaction, UserData, Categories, CardData, WishlistItem, Acquisition, PaidMonths } from './types';
import { auth, db } from './firebase'; // Importar auth y db
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando la sesión
  const [activeTab, setActiveTab] = useState('resumen');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [isDeletingAcquisition, setIsDeletingAcquisition] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', date: '' });

  // State (ahora se cargará desde Firestore)
  const [userData, setUserData] = useState<UserData>({ name: 'Usuario', phone: '', email: '', countryCode: '+56' });
  const [categories, setCategories] = useState<Categories>(defaultCategories);
  const [cards, setCards] = useState<CardData[]>(defaultCards);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [paidMonths, setPaidMonths] = useState<PaidMonths>({});

  // Efecto para manejar el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Cargar datos del usuario desde Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data.userData || { name: currentUser.displayName || 'Usuario', email: currentUser.email, phone: '', countryCode: '+56' });
          setCategories(data.categories || defaultCategories);
          setCards(data.cards || defaultCards);
          setTransactions(data.transactions || []);
          setWishlist(data.wishlist || []);
          setAcquisitions(data.acquisitions || []);
          setPaidMonths(data.paidMonths || {});
        } else {
          // Si es un usuario nuevo, creamos su documento con datos por defecto
          const initialData = {
            userData: { name: currentUser.displayName || 'Usuario', email: currentUser.email, phone: '', countryCode: '+56' },
            categories: defaultCategories,
            cards: defaultCards,
            transactions: [],
            wishlist: [],
            acquisitions: [],
            paidMonths: {}
          };
          await setDoc(userDocRef, initialData);
          // Seteamos el estado inicial
          setUserData(initialData.userData);
          setCategories(initialData.categories);
          setCards(initialData.cards);
        }
      } else {
        setUser(null);
        // Limpiar estado si el usuario cierra sesión
        setUserData({ name: 'Usuario', phone: '', email: '', countryCode: '+56' });
        setCategories(defaultCategories);
        setCards(defaultCards);
        setTransactions([]);
        setWishlist([]);
        setAcquisitions([]);
        setPaidMonths({});
      }
      setLoading(false); // Terminamos de cargar
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, []);

  // Efectos de persistencia (ahora guardan en Firestore)
  // Usaremos una función para guardar todo de golpe para eficiencia
  const saveDataToFirestore = async (data: Partial<any>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
  };

  useEffect(() => { if (user) saveDataToFirestore({ userData }); }, [userData, user]);
  useEffect(() => { if (user) saveDataToFirestore({ categories }); }, [categories, user]);
  useEffect(() => { if (user) saveDataToFirestore({ cards }); }, [cards, user]);
  useEffect(() => { if (user) saveDataToFirestore({ transactions }); }, [transactions, user]);
  useEffect(() => { if (user) saveDataToFirestore({ wishlist }); }, [wishlist, user]);
  useEffect(() => { if (user) saveDataToFirestore({ acquisitions }); }, [acquisitions, user]);
  useEffect(() => { if (user) saveDataToFirestore({ paidMonths }); }, [paidMonths, user]);

  // Actions
  const handleResetApp = () => {
    if (window.confirm('ADVERTENCIA: ¿Borrar todos los datos y reiniciar la aplicación?')) {
      if (window.confirm('Esta acción es irreversible. ¿Confirmar?')) {
        // Borrar datos de Firestore y recargar
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          setDoc(userDocRef, {}).then(() => window.location.reload());
        }
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

  // --- Componente de Login ---
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        if (isRegistering) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-slate-900">
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <form onSubmit={handleAuth} className="space-y-6">
            <Input label="Correo Electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full">{isRegistering ? 'Registrarse' : 'Entrar'}</Button>
          </form>
          <p className="text-sm text-center text-slate-500">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button onClick={() => setIsRegistering(!isRegistering)} className="ml-1 font-semibold text-indigo-600 hover:underline">
              {isRegistering ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    );
  };

  // Si está cargando, muestra un spinner o nada
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  // Si no hay usuario, muestra la pantalla de login
  if (!user) {
    return <LoginScreen />;
  }

  // Si hay usuario, muestra la app
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden print:overflow-visible print:h-auto">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center px-4 shadow-md print:hidden">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white mr-4">
          <Menu />
        </button>
        <span className="text-white font-bold text-lg flex-1">Mi Billetera</span>
        <button onClick={() => auth.signOut()} className="text-white">
          <LogOut size={20} />
        </button>
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
