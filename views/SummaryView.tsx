import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Trash2 } from 'lucide-react';
import { Card, Button, Input, Select } from '../components/UI';
import { Transaction, Categories, CardData, SummaryData, PaidMonths } from '../types';
import { formatCurrency, getMonthKey } from '../utils';

interface SummaryViewProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  categories: Categories;
  cards: CardData[];
  totalBalance: number;
  summary: SummaryData;
  promptDelete: (id: number) => void;
  paidMonths: PaidMonths;
}

export const SummaryView = ({ transactions, addTransaction, categories, cards, totalBalance, summary, promptDelete, paidMonths }: SummaryViewProps) => {
  const [form, setForm] = useState({
    type: 'gasto' as 'ingreso' | 'gasto' | 'ahorro',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    installments: '',
    firstPaymentDate: ''
  });

  const getOptions = () => {
    if (form.type === 'gasto') {
      const cardNames = cards.map(c => c.name);
      return [...categories.gasto, ...cardNames];
    }
    return categories[form.type] || [];
  };

  const isCreditCardSelected = form.type === 'gasto' && cards.some(c => c.name === form.category);

  // Real-time available limit calculation
  let selectedCardAvailable = 0;
  if (isCreditCardSelected) {
    const card = cards.find(c => c.name === form.category);
    if (card) {
      const cardTrans = transactions.filter(t => t.type === 'gasto' && t.category === card.name);
      const totalDebt = cardTrans.reduce((acc, curr) => acc + curr.amount, 0);

      const paidAmount = cardTrans.reduce((acc, t) => {
        const purchaseDate = new Date(t.date + 'T00:00:00');
        const firstPaymentDate = t.firstPaymentDate ? new Date(t.firstPaymentDate + 'T00:00:00') : purchaseDate;
        const installments = t.installments && t.installments > 0 ? t.installments : 1;
        const monthlyAmount = t.amount / installments;
        let paidForTrans = 0;
        for (let i = 0; i < installments; i++) {
          const paymentMonthDate = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth() + i, 1);
          const paymentMonthKey = getMonthKey(paymentMonthDate);
          if (paidMonths[`${card.name}_${paymentMonthKey}`]) {
            paidForTrans += monthlyAmount;
          }
        }
        return acc + paidForTrans;
      }, 0);

      const usage = Math.max(totalDebt - paidAmount, 0);
      selectedCardAvailable = card.limit - usage;
    }
  }

  useEffect(() => {
    const options = getOptions();
    if (options.length > 0 && form.type !== 'ahorro') {
      setForm(f => ({ ...f, category: options[0] }));
    } else if (form.type === 'ahorro') {
      setForm(f => ({ ...f, category: 'Ahorro General' }));
    }
  }, [form.type, categories, cards]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    const newTrans: Transaction = {
      id: Date.now(),
      type: form.type,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: isCreditCardSelected ? form.firstPaymentDate || form.date : form.date,
      installments: isCreditCardSelected ? (parseInt(form.installments) || 1) : undefined,
      firstPaymentDate: isCreditCardSelected ? form.firstPaymentDate : undefined
    };
    addTransaction(newTrans);
    setForm({ ...form, description: '', amount: '', installments: '', firstPaymentDate: '' });
  };

  const getButtonColor = () => {
    switch (form.type) {
      case 'ingreso': return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200';
      case 'gasto': return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200';
      case 'ahorro': return 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200';
      default: return 'bg-slate-600 text-white';
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setForm({ ...form, amount: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Saldo Total</span>
            <Wallet className="text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalBalance)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Ingresos Totales</span>
            <TrendingUp className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(summary.ingresos)}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Egresos Totales</span>
            <TrendingDown className="text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-rose-600">{formatCurrency(summary.egresos)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-6 h-fit lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Nueva Transacción</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              {(['ingreso', 'gasto', 'ahorro'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type })}
                  className={`flex-1 py-2 text-sm rounded-md capitalize transition-all font-medium ${form.type === type ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {form.type !== 'ahorro' && (
              <Select
                label="Categoría"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {getOptions().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            )}

            {isCreditCardSelected && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><CreditCard size={12} /> Detalles de Cuotas</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Cupo Disp.: {formatCurrency(selectedCardAvailable)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="N° Cuotas"
                    type="number"
                    placeholder="1"
                    value={form.installments}
                    onChange={e => setForm({ ...form, installments: e.target.value })}
                  />
                  <Input
                    label="1er Pago"
                    type="date"
                    value={form.firstPaymentDate}
                    onChange={e => setForm({ ...form, firstPaymentDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Input
              label="Descripción"
              placeholder="Ej. Supermercado"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
            />

            <div className={`grid gap-4 ${isCreditCardSelected ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Input
                label="Monto"
                type="text"
                placeholder="$ 0"
                value={form.amount ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseInt(form.amount)) : ''}
                onChange={handleAmountChange}
                required
                className="font-semibold"
              />
              {!isCreditCardSelected && (
                <Input
                  label="Fecha"
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              )}
            </div>

            <Button
              type="submit"
              className={`w-full py-3 text-lg shadow-md transition-all mt-2 ${getButtonColor()}`}
              variant="custom"
            >
              Registrar {form.type}
            </Button>
          </form>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Últimos Movimientos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-100">
                  <th className="pb-3 font-medium w-24">Fecha</th>
                  <th className="pb-3 font-medium">Descripción</th>
                  <th className="pb-3 font-medium text-right">Monto</th>
                  <th className="pb-3 font-medium text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map(t => (
                  <tr key={t.id} className="text-sm">
                    <td className="py-3 text-slate-500 align-top">{t.date}</td>
                    <td className="py-3 font-medium text-slate-700 align-top">
                      <div className="flex flex-col">
                        <span>{t.description}</span>
                        <span className={`text-xs font-normal mt-0.5 ${t.type === 'ingreso' ? 'text-emerald-600' :
                          t.type === 'ahorro' ? 'text-purple-600' : 'text-slate-400'
                          }`}>
                          {t.category}
                        </span>
                        {t.installments && (
                          <span className="text-xs text-slate-400">
                            {t.installments} cuotas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 text-right font-medium align-top ${t.type === 'ingreso' ? 'text-emerald-600' :
                      t.type === 'ahorro' ? 'text-purple-600' : 'text-slate-700'
                      }`}>
                      {t.type === 'gasto' ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 text-right align-top">
                      <button onClick={() => promptDelete(t.id)} className="text-slate-400 hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No hay movimientos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
