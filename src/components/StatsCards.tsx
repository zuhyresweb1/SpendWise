import { DollarSign, TrendingUp, PieChart, Target, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';
import { Expense, CategorySummary } from '../types/expense';
import { CategoryIcon } from './CategoryIcon';

interface StatsCardsProps {
  totalExpense: number;
  periodLabel: string;
  transactionCount: number;
  averageSpend: number;
  topCategory: CategorySummary | null;
  highestExpense: Expense | null;
  monthlyBudget: number | null;
  onOpenBudgetModal: () => void;
  currencySymbol?: string;
}

export function StatsCards({
  totalExpense,
  periodLabel,
  transactionCount,
  averageSpend,
  topCategory,
  highestExpense,
  monthlyBudget,
  onOpenBudgetModal,
  currencySymbol = '৳',
}: StatsCardsProps) {
  const formatMoney = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const budgetProgress = monthlyBudget && monthlyBudget > 0
    ? Math.min(Math.round((totalExpense / monthlyBudget) * 100), 100)
    : null;

  const isOverBudget = monthlyBudget && monthlyBudget > 0 && totalExpense > monthlyBudget;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Expenses Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 rounded-2xl p-5 text-white shadow-lg shadow-emerald-700/15">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">
            Total Expense
          </span>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black tracking-tight">
            {formatMoney(totalExpense)}
          </div>
          <p className="mt-1 text-xs text-emerald-100/90 flex items-center gap-1.5">
            <span>{periodLabel}</span>
            <span>•</span>
            <span>{transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}</span>
          </p>
        </div>

        {/* Soft background decor */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>

      {/* 2. Average Spend & Peak Expense */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Average Spend
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatMoney(averageSpend)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Per transaction</span>
            {highestExpense && (
              <span className="truncate max-w-[140px]" title={`Highest: ${highestExpense.title} (${formatMoney(highestExpense.amount)})`}>
                Max: {formatMoney(highestExpense.amount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top Spending Category */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Top Category
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          {topCategory ? (
            <>
              <div className="flex items-center gap-2">
                <CategoryIcon category={topCategory.category} size={16} />
                <span className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {topCategory.category}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatMoney(topCategory.amount)}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                  {topCategory.percentage.toFixed(1)}% of total
                </span>
              </div>
            </>
          ) : (
            <div className="py-2 text-sm text-slate-400 italic">No expenses yet</div>
          )}
        </div>
      </div>

      {/* 4. Budget Goal Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Budget Target
          </span>
          <button
            onClick={onOpenBudgetModal}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
            title="Set budget target"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3">
          {monthlyBudget && monthlyBudget > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatMoney(monthlyBudget)}
                </span>
                <span
                  className={`text-xs font-bold ${
                    isOverBudget
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isOverBudget ? 'Over Budget' : `${formatMoney(monthlyBudget - totalExpense)} left`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : budgetProgress && budgetProgress > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetProgress || 0)}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-400 text-right">
                {budgetProgress}% used
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start gap-1 py-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                No budget set for this period
              </span>
              <button
                onClick={onOpenBudgetModal}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Target className="w-3 h-3" />
                <span>Set Budget Goal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
