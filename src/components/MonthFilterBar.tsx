import { MONTH_NAMES } from '../types/expense';

interface MonthFilterBarProps {
  selectedMonth: string | 'ALL';
  onSelectMonth: (month: string | 'ALL') => void;
  monthlyTotals: Record<string, number>;
  currencySymbol?: string;
}

export function MonthFilterBar({
  selectedMonth,
  onSelectMonth,
  monthlyTotals,
  currencySymbol = '৳',
}: MonthFilterBarProps) {
  const formatAmount = (num: number) => {
    if (num >= 1000) {
      return `${currencySymbol}${(num / 1000).toFixed(1)}k`;
    }
    return `${currencySymbol}${Math.round(num)}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none touch-pan-x overscroll-x-contain">
      <div className="flex items-center gap-1.5 min-w-max p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-xs">
        {/* Full Year Option */}
        <button
          onClick={() => onSelectMonth('ALL')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
            selectedMonth === 'ALL'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/40'
          }`}
        >
          <span>All Year</span>
        </button>

        {/* 12 Months */}
        {MONTH_NAMES.map((month) => {
          const total = monthlyTotals[month] || 0;
          const isSelected = selectedMonth === month;
          const shortName = month.slice(0, 3);

          return (
            <button
              key={month}
              onClick={() => onSelectMonth(month)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <span>{shortName}</span>
              {total > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                    isSelected
                      ? 'bg-emerald-700/80 text-emerald-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formatAmount(total)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
