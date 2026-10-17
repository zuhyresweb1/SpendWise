import { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  CheckCircle2,
  Delete,
  RotateCcw,
} from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  CATEGORY_DETAILS,
  MONTH_NAMES,
} from '../types/expense';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'sheetRowIndex'>) => Promise<void>;
  editingExpense?: Expense | null;
  defaultYear?: number;
  defaultMonth?: string;
  isSaving: boolean;
  currencySymbol?: string;
}

const CATEGORIES = Object.keys(CATEGORY_DETAILS) as ExpenseCategory[];
const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
  'Apple Pay / Google Pay',
  'Other',
];

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  defaultYear = 2026,
  defaultMonth,
  isSaving,
  currencySymbol = '৳',
}: ExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setDate(editingExpense.date);
      setCategory(editingExpense.category);
      setPaymentMethod(editingExpense.paymentMethod);
      setNotes(editingExpense.notes || '');
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      setTitle('');
      setAmount('');
      setDate(todayStr);
      setCategory('Groceries');
      setPaymentMethod('Credit Card');
      setNotes('');
    }
    setError(null);

    // Auto focus the amount input when modal opens
    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 150);
    }
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  // Handle amount input change with safe formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow digits, decimal point, and empty string
    val = val.replace(/[^0-9.]/g, '');
    // Allow only one decimal point
    const parts = val.split('.');
    if (parts.length > 2) {
      val = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    // Max 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      val = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    setAmount(val);
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    const next = (current + addVal).toFixed(2);
    // Remove .00 if whole number for clean display
    setAmount(next.endsWith('.00') ? Math.round(Number(next)).toString() : next);
    amountInputRef.current?.focus();
  };

  const handleClearAmount = () => {
    setAmount('');
    amountInputRef.current?.focus();
  };

  // Compute month & year from chosen date
  const parseDateDetails = (dateStr: string) => {
    if (!dateStr) return { month: 'January', year: defaultYear };
    const parts = dateStr.split('-');
    const yearVal = parseInt(parts[0], 10) || defaultYear;
    const monthIndex = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
    const monthVal = MONTH_NAMES[Math.max(0, Math.min(11, monthIndex))] || 'January';
    return { month: monthVal, year: yearVal };
  };

  const setPresetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount (e.g. 25.00)');
      amountInputRef.current?.focus();
      return;
    }

    if (!title.trim()) {
      setError('Please provide a description or title for this expense');
      return;
    }

    if (!date) {
      setError('Please select a valid date');
      return;
    }

    const { month, year } = parseDateDetails(date);

    try {
      await onSave({
        title: title.trim(),
        amount: parsedAmount,
        date,
        month,
        year,
        category,
        paymentMethod,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense');
    }
  };

  const { month, year } = parseDateDetails(date);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Sticky Modal Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-600/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saves directly into your Google Sheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="expense-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MONEY / AMOUNT SECTION - Enhanced with massive high-visibility input and quick helpers */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="expense-amount-input" className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Expense Amount</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>

              {amount && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Clickable Amount Box */}
            <div
              onClick={() => amountInputRef.current?.focus()}
              className="relative flex items-center w-full bg-white dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-500/80 rounded-2xl px-4 py-3 shadow-sm hover:border-emerald-600 transition-all cursor-text focus-within:ring-4 focus-within:ring-emerald-500/20"
            >
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 select-none mr-2 pointer-events-none">
                {currencySymbol}
              </span>
              <input
                ref={amountInputRef}
                id="expense-amount-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl sm:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-hidden"
              />
            </div>

            {/* Quick Add Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Quick add:</span>
              {[50, 100, 500, 1000, 5000].map((addVal) => (
                <button
                  key={addVal}
                  type="button"
                  onClick={() => handleQuickAddAmount(addVal)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 hover:border-emerald-300 transition-all active:scale-95"
                >
                  +{currencySymbol}{addVal.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label htmlFor="expense-title-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="expense-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grocery shopping, Gas station, Dinner, Rent"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Date, Month & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="expense-date-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPresetDate(0)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Today
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setPresetDate(1)}
                    className="text-slate-500 hover:underline font-medium"
                  >
                    Yesterday
                  </button>
                </div>
              </div>
              <input
                id="expense-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Period
              </label>
              <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between h-[42px]">
                <span>Month: <strong className="text-emerald-600 dark:text-emerald-400">{month}</strong></span>
                <span>Year: <strong className="text-slate-900 dark:text-white">{year}</strong></span>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Expense Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-500/50'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                    }`}
                  >
                    <CategoryIcon category={cat} size={13} className="p-1 shrink-0" />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    paymentMethod === pm
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Details */}
          <div>
            <label htmlFor="expense-notes-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Merchant Reference <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="expense-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Order #1234, tax deduction, split bill"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </form>

        {/* Sticky Modal Footer */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Syncs to Google Sheets</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="expense-form"
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSaving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
