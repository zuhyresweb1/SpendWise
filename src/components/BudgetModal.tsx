import { useState } from 'react';
import { Target, X, Check } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number | null;
  periodLabel: string;
  onSaveBudget: (budget: number) => void;
  currencySymbol?: string;
}

export function BudgetModal({
  isOpen,
  onClose,
  currentBudget,
  periodLabel,
  onSaveBudget,
  currencySymbol = '৳',
}: BudgetModalProps) {
  const [budgetVal, setBudgetVal] = useState(currentBudget ? currentBudget.toString() : '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetVal);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid non-negative number');
      return;
    }
    onSaveBudget(parsed);
    onClose();
  };

  const presetBudgets = [5000, 10000, 20000, 30000, 50000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Set Spending Budget
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target for {periodLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Budget Goal
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 pointer-events-none select-none">
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 3000"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
              Quick presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetBudgets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBudgetVal(val.toString())}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors"
                >
                  {currencySymbol}{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
