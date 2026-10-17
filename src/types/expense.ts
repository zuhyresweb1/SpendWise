export type ExpenseCategory =
  | 'Housing'
  | 'Groceries'
  | 'Dining & Drinks'
  | 'Transportation'
  | 'Utilities'
  | 'Entertainment'
  | 'Health & Medical'
  | 'Shopping'
  | 'Travel'
  | 'Education'
  | 'Subscriptions'
  | 'Personal Care'
  | 'Gifts & Donations'
  | 'Investments'
  | 'Miscellaneous';

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Cash'
  | 'Bank Transfer'
  | 'Apple Pay / Google Pay'
  | 'Other';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // e.g., "October"
  year: number; // e.g., 2026
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  sheetRowIndex?: number; // 1-based index in the Google Sheet (header is row 1)
}

export interface MonthData {
  monthName: string;
  monthIndex: number; // 0-11
  total: number;
  count: number;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const CATEGORY_DETAILS: Record<
  ExpenseCategory,
  { color: string; bg: string; icon: string; border: string }
> = {
  'Housing': { color: '#4f46e5', bg: '#eef2ff', icon: 'Home', border: '#c7d2fe' },
  'Groceries': { color: '#059669', bg: '#ecfdf5', icon: 'ShoppingBag', border: '#a7f3d0' },
  'Dining & Drinks': { color: '#d97706', bg: '#fffbeb', icon: 'Utensils', border: '#fde68a' },
  'Transportation': { color: '#0284c7', bg: '#f0f9ff', icon: 'Car', border: '#bae6fd' },
  'Utilities': { color: '#7c3aed', bg: '#f5f3ff', icon: 'Zap', border: '#ddd6fe' },
  'Entertainment': { color: '#db2777', bg: '#fdf2f8', icon: 'Film', border: '#fbcfe8' },
  'Health & Medical': { color: '#e11d48', bg: '#fff1f2', icon: 'HeartPulse', border: '#fecdd3' },
  'Shopping': { color: '#ea580c', bg: '#fff7ed', icon: 'Tag', border: '#ffedd5' },
  'Travel': { color: '#0891b2', bg: '#ecfeff', icon: 'Plane', border: '#a5f3fc' },
  'Education': { color: '#2563eb', bg: '#eff6ff', icon: 'GraduationCap', border: '#bfdbfe' },
  'Subscriptions': { color: '#9333ea', bg: '#faf5ff', icon: 'CreditCard', border: '#e9d5ff' },
  'Personal Care': { color: '#c026d3', bg: '#fdf4ff', icon: 'Sparkles', border: '#f5d0fe' },
  'Gifts & Donations': { color: '#16a34a', bg: '#f0fdf4', icon: 'Gift', border: '#bbf7d0' },
  'Investments': { color: '#15803d', bg: '#f0fdf4', icon: 'TrendingUp', border: '#86efac' },
  'Miscellaneous': { color: '#64748b', bg: '#f8fafc', icon: 'Folder', border: '#cbd5e1' },
};
