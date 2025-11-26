export type TransactionType = 'ingreso' | 'gasto' | 'ahorro';

export interface Transaction {
  id: number;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
  installments?: number;
  firstPaymentDate?: string;
}

export interface CardData {
  id: number;
  name: string;
  limit: number;
}

export interface UserData {
  name: string;
  phone: string;
  email: string;
  countryCode: string;
}

export interface Categories {
  ingreso: string[];
  gasto: string[];
}

export interface WishlistItem {
  id: number;
  name: string;
  link: string;
  price: number;
}

export interface Acquisition extends WishlistItem {
  purchaseDate: string;
}

export interface PaidMonths {
  [key: string]: boolean;
}

export interface SummaryData {
  ingresos: number;
  egresos: number;
  ahorros: number;
}
