import { Transaction, CardData, PaidMonths } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

export const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const calculatePaymentMatrix = (
  transactions: Transaction[],
  cards: CardData[],
  paidMonths: PaidMonths,
  filterCardName: string = 'all'
) => {
  const today = new Date();
  const months = [];
  // Generate 7 months (Current + 6)
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({
      key: getMonthKey(d),
      label: d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    });
  }

  const cardsToDisplay = filterCardName === 'all'
    ? cards
    : cards.filter(c => c.name === filterCardName);

  const matrix = cardsToDisplay.map(card => {
    const monthlyData = months.map(month => {
      const monthTotal = transactions.reduce((total, t) => {
        if (t.type !== 'gasto' || t.category !== card.name) return total;

        const purchaseDate = new Date(t.date + 'T00:00:00');
        const firstPaymentDate = t.firstPaymentDate ? new Date(t.firstPaymentDate + 'T00:00:00') : purchaseDate;
        const installments = t.installments && t.installments > 0 ? t.installments : 1;
        const monthlyAmount = t.amount / installments;

        for (let i = 0; i < installments; i++) {
          const paymentMonthDate = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth() + i, 1);
          const paymentMonthKey = getMonthKey(paymentMonthDate);
          if (paymentMonthKey === month.key) {
            return total + monthlyAmount;
          }
        }
        return total;
      }, 0);

      return {
        amount: monthTotal,
        isPaid: !!paidMonths[`${card.name}_${month.key}`],
        cardName: card.name,
        monthKey: month.key
      };
    });
    return { name: card.name, data: monthlyData };
  });

  const totals = months.map((_, index) =>
    matrix.reduce((acc, row) => acc + row.data[index].amount, 0)
  );

  const monthlyPaymentStatus = months.map((_, index) => {
    const itemsWithDebt = matrix.filter(row => row.data[index].amount > 0);
    if (itemsWithDebt.length === 0) return false;
    return itemsWithDebt.every(row => row.data[index].isPaid);
  });

  return { months, matrix, totals, monthlyPaymentStatus };
};
