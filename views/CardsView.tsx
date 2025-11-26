import React, { useState } from 'react';
import { CreditCard, Check, Layers, CheckCircle2, Banknote, ShoppingBag } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { Transaction, CardData, PaidMonths } from '../types';
import { formatCurrency, calculatePaymentMatrix, getMonthKey } from '../utils';

interface CardsViewProps {
  cards: CardData[];
  transactions: Transaction[];
  paidMonths: PaidMonths;
  setPaidMonths: React.Dispatch<React.SetStateAction<PaidMonths>>;
  setActiveTab: (tab: string) => void;
}

export const CardsView = ({ cards, transactions, paidMonths, setPaidMonths, setActiveTab }: CardsViewProps) => {
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');

  const toggleMonthPayment = (cardName: string, monthKey: string) => {
    const key = `${cardName}_${monthKey}`;
    setPaidMonths(prev => {
      const n = { ...prev };
      if (n[key]) delete n[key];
      else n[key] = true;
      return n;
    });
  };

  const { months, matrix, totals, monthlyPaymentStatus } = calculatePaymentMatrix(transactions, cards, paidMonths, selectedCardFilter);

  const filteredTransactions = transactions.filter(t => {
    const isExpense = t.type === 'gasto';
    const matchesCard = selectedCardFilter === 'all'
      ? cards.some(c => c.name === t.category)
      : t.category === selectedCardFilter;
    return isExpense && matchesCard;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Mis Tarjetas</h2>
        <Button onClick={() => setActiveTab('configuracion')} variant="secondary" className="text-sm">Gestionar Tarjetas</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {cards.map(card => {
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
          const avail = card.limit - usage;
          const perc = card.limit > 0 ? Math.min((usage / card.limit) * 100, 100) : 0;
          const isSel = selectedCardFilter === card.name;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardFilter(isSel ? 'all' : card.name)}
              className={`flex-none w-72 snap-center relative overflow-hidden rounded-xl p-5 text-white shadow-lg flex flex-col justify-between h-36 cursor-pointer transition-all transform hover:scale-[1.02] ${isSel ? 'ring-4 ring-emerald-400 ring-offset-2 bg-slate-900' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 rounded-full bg-slate-700 opacity-50 blur-2xl"></div>
              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Tarjeta</p>
                  <p className="text-lg font-bold tracking-wide truncate">{card.name}</p>
                </div>
                {isSel ? <Check className="text-emerald-400" size={24} /> : <CreditCard className="text-emerald-400 opacity-80" size={24} />}
              </div>
              <div className="z-10">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Disponible</span>
                  <span className="font-bold">{formatCurrency(avail)}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${perc > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${perc}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Uso: {formatCurrency(usage)}</span>
                  <span>Cupo Total: {formatCurrency(card.limit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCardFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCardFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Todas
        </button>
        {cards.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCardFilter(c.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCardFilter === c.name ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <Card className="p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Layers size={20} className="text-blue-600" /> Proyección de Pagos (Próximos 6 Meses)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-4 pr-10 font-medium text-slate-500 bg-slate-50/50 min-w-[120px]">Tarjeta</th>
                {months.map(m => (
                  <th key={m.key} className="py-3 px-4 pr-10 font-medium text-slate-500 text-right min-w-[100px]">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {matrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-700">{row.name}</td>
                  {row.data.map((cell, j) => (
                    <td key={j} className="py-3 px-4 pr-10 text-right relative group">
                      <span className={`font-medium ${cell.isPaid ? 'text-emerald-600 decoration-emerald-600' : 'text-slate-600'}`}>
                        {cell.amount > 0 ? formatCurrency(cell.amount) : <span className="text-slate-300">-</span>}
                      </span>
                      {cell.amount > 0 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleMonthPayment(cell.cardName, cell.monthKey)}
                            className={`p-1 rounded-full transition-all ${cell.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'}`}
                          >
                            {cell.isPaid ? <CheckCircle2 size={14} /> : <Banknote size={14} />}
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                <td className="py-3 px-4 text-slate-800">Total a Pagar</td>
                {totals.map((total, index) => {
                  const isFullyPaid = monthlyPaymentStatus[index];
                  return (
                    <td key={index} className="py-3 px-4 pr-10 text-right relative">
                      <span className={isFullyPaid ? "text-emerald-500 opacity-60" : "text-slate-800"}>
                        {total > 0 ? formatCurrency(total) : '-'}
                      </span>
                      {isFullyPaid && total > 0 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShoppingBag size={20} className="text-purple-600" /> Detalle de Compras
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm border-b border-slate-100">
                <th className="pb-3 pl-2 font-medium">Descripción</th>
                <th className="pb-3 font-medium">Tarjeta</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium text-center">Cuotas</th>
                <th className="pb-3 font-medium text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="text-sm hover:bg-slate-50">
                  <td className="py-4 pl-2 font-medium text-slate-700">
                    {t.description}
                    <span className="block text-xs text-slate-400 font-normal">{t.category}</span>
                  </td>
                  <td className="py-4 text-slate-600">{t.category}</td>
                  <td className="py-4 text-slate-500">{t.date}</td>
                  <td className="py-4 text-center text-slate-600">
                    {t.installments ? <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">{t.installments} cuotas</span> : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="py-4 text-right font-bold text-slate-700">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
