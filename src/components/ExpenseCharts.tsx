import { useState } from 'react';
import { BarChart3, PieChart, CreditCard, Calendar } from 'lucide-react';
import { MonthData, CategorySummary, PaymentMethod } from '../types/expense';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseChartsProps {
  monthlyData: MonthData[];
  categorySummaries: CategorySummary[];
  paymentMethodTotals: Record<PaymentMethod, number>;
  selectedMonth: string | 'ALL';
  onSelectMonth: (month: string) => void;
  currencySymbol?: string;
}

export function ExpenseCharts({
  monthlyData,
  categorySummaries,
  paymentMethodTotals,
  selectedMonth,
  onSelectMonth,
  currencySymbol = '৳',
}: ExpenseChartsProps) {
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);

  const formatMoney = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const maxMonthlySpend = Math.max(...monthlyData.map((m) => m.total), 1);
  const totalYearSpend = monthlyData.reduce((acc, curr) => acc + curr.total, 0);

  const totalPaymentSpend = Object.values(paymentMethodTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Monthly Spending Trend (Spans 2 columns on large screen) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Expense Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Spending trajectory across all 12 months • Click a bar to filter
                </p>
              </div>
            </div>

            {hoveredMonth ? (
              <div className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2">
                <span>{hoveredMonth.monthName}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatMoney(hoveredMonth.total)}
                </span>
                <span className="text-slate-400">({hoveredMonth.count} txns)</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Peak Month: {formatMoney(maxMonthlySpend)}
              </div>
            )}
          </div>

          {/* Bar Chart Container */}
          <div className="pt-6 pb-2">
            <div className="h-48 sm:h-56 flex items-end justify-between gap-1 sm:gap-2">
              {monthlyData.map((item) => {
                const heightPercent = maxMonthlySpend > 0 ? (item.total / maxMonthlySpend) * 100 : 0;
                const isSelected = selectedMonth === item.monthName;
                const isPeak = item.total === maxMonthlySpend && item.total > 0;

                return (
                  <div
                    key={item.monthName}
                    onClick={() => onSelectMonth(item.monthName)}
                    onMouseEnter={() => setHoveredMonth(item)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end"
                  >
                    {/* Amount label on hover/active */}
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.total > 0 ? formatMoney(item.total) : ''}
                    </div>

                    {/* The Bar */}
                    <div className="w-full max-w-[38px] bg-slate-100 dark:bg-slate-800/80 rounded-t-lg relative flex items-end overflow-hidden h-full">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/40'
                            : isPeak
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-300'
                            : item.total > 0
                            ? 'bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:from-emerald-500 group-hover:to-teal-400'
                            : 'bg-transparent'
                        }`}
                        style={{
                          height: `${Math.max(item.total > 0 ? 8 : 2, heightPercent)}%`,
                        }}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`mt-2 text-[11px] font-semibold transition-colors ${
                        isSelected
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                      }`}
                    >
                      {item.monthName.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart Legend / Summary */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Active filter: <strong className="text-slate-800 dark:text-slate-200">{selectedMonth === 'ALL' ? 'Entire Year' : selectedMonth}</strong></span>
          <span>Annual Cumulative: <strong className="text-emerald-600 dark:text-emerald-400">{formatMoney(totalYearSpend)}</strong></span>
        </div>
      </div>

      {/* 2. Category Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Category Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top expense channels in selected period
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
            {categorySummaries.length > 0 ? (
              categorySummaries.slice(0, 6).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={cat.category} size={14} className="p-1" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cat.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(cat.amount)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold w-9 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No categorical data available
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods mini breakdown */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Methods</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(paymentMethodTotals).map(([method, amount]) => {
              if (amount <= 0) return null;
              const pct = totalPaymentSpend > 0 ? Math.round((amount / totalPaymentSpend) * 100) : 0;
              return (
                <div
                  key={method}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 text-[11px] flex items-center gap-1.5"
                >
                  <span className="text-slate-600 dark:text-slate-400">{method}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(amount)}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
