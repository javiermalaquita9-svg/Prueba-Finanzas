import React, { useState } from 'react';
import { FileText, User, Download, Loader2, LayoutDashboard, PieChart as PieChartIcon, Layers, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/UI';
import { Transaction, CardData, UserData, PaidMonths } from '../types';
import { formatCurrency, calculatePaymentMatrix } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ReportsViewProps {
  transactions: Transaction[];
  cards: CardData[];
  userData: UserData;
  paidMonths: PaidMonths;
}

// Declare html2pdf on window
declare global {
  interface Window {
    html2pdf: any;
  }
}

export const ReportsView = ({ transactions, cards, userData, paidMonths }: ReportsViewProps) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
  
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'gasto' && !cards.some(c => c.name === t.category))
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#84cc16', '#d946ef'];

  const { months, matrix, totals, monthlyPaymentStatus } = calculatePaymentMatrix(transactions, cards, paidMonths, 'all');
  const creditCardTransactions = transactions.filter(t => t.type === 'gasto' && cards.some(c => c.name === t.category));

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('report-content');
    if (window.html2pdf && element) {
      await window.html2pdf().set({
        margin: 10,
        filename: `Reporte_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    }
    setIsGeneratingPdf(false);
  };

  return (
    <div className="space-y-8" id="report-content">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reporte Financiero</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User size={14} /> {userData.name} <span className="text-slate-300">|</span> {userData.email}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" data-html2canvas-ignore>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase font-bold pl-1">Desde</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm text-slate-700 focus:outline-none bg-transparent px-1" />
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase font-bold pl-1">Hasta</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm text-slate-700 focus:outline-none bg-transparent px-1" />
            </div>
          </div>
          <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="bg-slate-800 text-white p-3 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-70 flex items-center gap-2">
            {isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <Card className="p-6 lg:col-span-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <LayoutDashboard size={18} /> Últimos Movimientos (Periodo)
          </h3>
          <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 sticky top-0 bg-white">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Descripción</th>
                  <th className="pb-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 text-slate-500 align-top">{t.date}</td>
                    <td className="py-2 text-slate-700 align-top">
                      <div className="font-medium">{t.description}</div>
                      <div className="text-xs text-slate-400">{t.category}</div>
                    </td>
                    <td className={`py-2 text-right font-medium align-top ${t.type === 'ingreso' ? 'text-emerald-600' : t.type === 'ahorro' ? 'text-purple-600' : 'text-slate-600'}`}>
                      {t.type === 'gasto' ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">Sin movimientos en este rango.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-4 flex flex-col min-h-[400px]">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <PieChartIcon size={18} /> Gastos por Categoría
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-slate-400 text-center text-sm">Sin datos para graficar.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-blue-600" /> Proyección de Pagos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 font-medium text-slate-500 bg-slate-50/50 min-w-[120px]">Tarjeta</th>
                  {months.map(m => (
                    <th key={m.key} className="py-3 px-4 font-medium text-slate-500 text-right min-w-[100px]">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {matrix.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-700">{row.name}</td>
                    {row.data.map((cell, j) => (
                      <td key={j} className="py-3 px-4 text-right">
                        <span className={`font-medium ${cell.isPaid ? 'text-emerald-600 decoration-emerald-600' : 'text-slate-600'}`}>
                          {cell.amount > 0 ? formatCurrency(cell.amount) : <span className="text-slate-300">-</span>}
                        </span>
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
                      <td key={index} className="py-3 px-4 text-right relative">
                        <span className={isFullyPaid ? "text-emerald-500 opacity-60" : "text-slate-800"}>
                          {total > 0 ? formatCurrency(total) : '-'}
                        </span>
                        {isFullyPaid && total > 0 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2" data-html2canvas-ignore>
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
            <ShoppingBag size={20} className="text-purple-600" /> Historial de Compras con Tarjeta
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-100">
                  <th className="pb-3 pl-2 font-medium">Descripción</th>
                  <th className="pb-3 font-medium">Tarjeta</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium text-center">Cuotas</th>
                  <th className="pb-3 pr-2 font-medium text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditCardTransactions.length > 0 ? creditCardTransactions.map(t => (
                  <tr key={t.id} className="text-sm hover:bg-slate-50">
                    <td className="py-4 pl-2 font-medium text-slate-700">{t.description}</td>
                    <td className="py-4 text-slate-600">{t.category}</td>
                    <td className="py-4 text-slate-500">{t.date}</td>
                    <td className="py-4 text-center text-slate-600">{t.installments ? <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">{t.installments}</span> : '-'}</td>
                    <td className="py-4 pr-2 text-right font-bold text-slate-700">{formatCurrency(t.amount)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">No hay compras con tarjeta registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
