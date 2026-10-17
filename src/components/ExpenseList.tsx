import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  Plus,
  Receipt,
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '../types/expense';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onOpenAddModal: () => void;
  periodLabel: string;
  currencySymbol?: string;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc';

export function ExpenseList({
  expenses,
  onEditExpense,
  onDeleteExpense,
  onOpenAddModal,
  periodLabel,
  currencySymbol = '৳',
}: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Extract unique categories in current expenses
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [expenses]);

  // Filter & Sort
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = exp.title.toLowerCase().includes(q);
          const matchNotes = (exp.notes || '').toLowerCase().includes(q);
          const matchCat = exp.category.toLowerCase().includes(q);
          const matchPay = exp.paymentMethod.toLowerCase().includes(q);
          const matchAmount = exp.amount.toString().includes(q);
          if (!matchTitle && !matchNotes && !matchCat && !matchPay && !matchAmount) {
            return false;
          }
        }
        // Category
        if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [expenses, searchQuery, selectedCategory, sortBy]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const formatMoney = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Expense Transactions
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing records for <strong className="text-slate-700 dark:text-slate-300">{periodLabel}</strong> • Filtered Total: <strong className="text-emerald-600 dark:text-emerald-400">{formatMoney(filteredTotal)}</strong>
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none outline-hidden cursor-pointer font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-slate-800">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-none outline-hidden cursor-pointer font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="date-desc" className="bg-white dark:bg-slate-800">Date (Newest)</option>
              <option value="date-asc" className="bg-white dark:bg-slate-800">Date (Oldest)</option>
              <option value="amount-desc" className="bg-white dark:bg-slate-800">Amount (High to Low)</option>
              <option value="amount-asc" className="bg-white dark:bg-slate-800">Amount (Low to High)</option>
              <option value="title-asc" className="bg-white dark:bg-slate-800">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense Items List */}
      {filteredExpenses.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="p-4 sm:px-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-4 group"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <CategoryIcon category={expense.category} size={18} className="shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {expense.title}
                    </h4>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {expense.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDateLabel(expense.date)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>{expense.paymentMethod}</span>
                    </span>
                    {expense.notes && (
                      <>
                        <span className="hidden md:inline">•</span>
                        <span className="hidden md:inline italic truncate max-w-[200px]" title={expense.notes}>
                          "{expense.notes}"
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Amount & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {formatMoney(expense.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {expense.month} {expense.year}
                  </span>
                </div>

                {/* Edit / Delete Buttons - always visible on mobile, reveal on hover on desktop */}
                <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditExpense(expense)}
                    className="p-2 sm:p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors active:scale-95"
                    title="Edit expense"
                    aria-label="Edit expense"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteExpense(expense)}
                    className="p-2 sm:p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors active:scale-95"
                    title="Delete expense"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-4 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <Receipt className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No expenses found
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No transactions matched your current search filters. Try clearing filters.'
              : `You haven't recorded any expenses for ${periodLabel} yet.`}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            {searchQuery || selectedCategory !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/30 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Expense</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
