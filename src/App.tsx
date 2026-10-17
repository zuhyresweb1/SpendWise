import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  findOrCreateExpenseSpreadsheet,
  fetchExpensesFromSheet,
  appendExpenseToSheet,
  updateExpenseInSheet,
  deleteExpenseFromSheet,
  SpreadsheetInfo,
} from './services/sheets';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  MONTH_NAMES,
  CATEGORY_DETAILS,
  MonthData,
  CategorySummary,
} from './types/expense';
import { Navbar } from './components/Navbar';
import { MonthFilterBar } from './components/MonthFilterBar';
import { StatsCards } from './components/StatsCards';
import { ExpenseCharts } from './components/ExpenseCharts';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetModal } from './components/BudgetModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SheetsSyncBanner } from './components/SheetsSyncBanner';
import { CheckCircle2, AlertCircle, X, ShieldAlert, Plus } from 'lucide-react';

const CURRENT_YEAR = 2026;
const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];
const CURRENCY_SYMBOL = '৳';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sheets state
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Expense filters & data (all demo data removed)
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('spendwise_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude any previous demo items
        return parsed.filter((e: Expense) => !e.id.startsWith('exp-demo-'));
      } catch (e) {
        console.error('Failed to parse local expenses', e);
      }
    }
    return [];
  });

  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<string | 'ALL'>('October');

  // Budget states (persisted by year-month)
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('spendwise_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local budgets', e);
      }
    }
    return {};
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Confirmation Modal for Workspace API mutations (Google Workspace requirement)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Save expenses to localStorage as backup
  useEffect(() => {
    localStorage.setItem('spendwise_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Save budgets to localStorage
  useEffect(() => {
    localStorage.setItem('spendwise_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Connect Google Sheets when token becomes available
  const syncWithGoogleSheets = useCallback(
    async (token: string, existingExpensesList?: Expense[]) => {
      setIsSyncing(true);
      try {
        // 1. Locate or create dedicated spreadsheet
        const { spreadsheet: sheetInfo, isNew } = await findOrCreateExpenseSpreadsheet(token);
        setSpreadsheet(sheetInfo);

        if (isNew) {
          // If newly created, seed with any current local expenses
          const toSync = existingExpensesList || expenses;
          for (let i = 0; i < toSync.length; i++) {
            await appendExpenseToSheet(token, sheetInfo.id, toSync[i]);
          }
          showToast(`Created Google Sheet: "${sheetInfo.name}" in your Google Drive!`, 'success');
        } else {
          // Read expenses from existing sheet
          const sheetExpenses = await fetchExpensesFromSheet(token, sheetInfo.id);
          if (sheetExpenses.length > 0) {
            setExpenses(sheetExpenses);
            showToast(`Loaded ${sheetExpenses.length} expenses from Google Sheets`, 'success');
          } else if (expenses.length > 0) {
            // Sheet is empty, sync current local expenses to it
            for (let i = 0; i < expenses.length; i++) {
              await appendExpenseToSheet(token, sheetInfo.id, expenses[i]);
            }
            showToast(`Exported ${expenses.length} records to your Google Sheet`, 'success');
          }
        }
        setLastSynced(new Date());
      } catch (err: any) {
        console.error('Error syncing with Google Sheets:', err);
        showToast(err?.message || 'Could not connect to Google Sheets', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
    [expenses, showToast]
  );

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        setAccessToken(token);
        syncWithGoogleSheets(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, [syncWithGoogleSheets]);

  // Interactive Sign In
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`Signed in as ${result.user.displayName || result.user.email}`, 'success');
        await syncWithGoogleSheets(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showToast(err?.message || 'Google Sign-In failed', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setSpreadsheet(null);
      showToast('Signed out of Google account', 'info');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Manual refresh / re-sync
  const handleRefresh = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      showToast('Please sign in with Google to synchronize with Google Sheets', 'info');
      return;
    }
    await syncWithGoogleSheets(token);
  };

  // Filtered expenses for active Year & Month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.year !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && e.month !== selectedMonth) return false;
      return true;
    });
  }, [expenses, selectedYear, selectedMonth]);

  // Monthly totals for selected year (all 12 months)
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    MONTH_NAMES.forEach((m) => {
      totals[m] = 0;
    });

    expenses.forEach((e) => {
      if (e.year === selectedYear && totals[e.month] !== undefined) {
        totals[e.month] += e.amount;
      }
    });
    return totals;
  }, [expenses, selectedYear]);

  // Monthly Data array for charts
  const monthlyData: MonthData[] = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => ({
      monthName: name,
      monthIndex: idx,
      total: monthlyTotals[name] || 0,
      count: expenses.filter((e) => e.year === selectedYear && e.month === name).length,
    }));
  }, [monthlyTotals, expenses, selectedYear]);

  // Total expense for selected filter
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  // Average spend per transaction
  const averageSpend = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return totalExpense / filteredExpenses.length;
  }, [filteredExpenses, totalExpense]);

  // Highest single expense
  const highestExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return null;
    return [...filteredExpenses].sort((a, b) => b.amount - a.amount)[0];
  }, [filteredExpenses]);

  // Category summary & distribution
  const categorySummaries: CategorySummary[] = useMemo(() => {
    const map = new Map<ExpenseCategory, { amount: number; count: number }>();

    filteredExpenses.forEach((e) => {
      const cur = map.get(e.category) || { amount: 0, count: 0 };
      map.set(e.category, {
        amount: cur.amount + e.amount,
        count: cur.count + 1,
      });
    });

    const list: CategorySummary[] = [];
    map.forEach((val, cat) => {
      list.push({
        category: cat,
        amount: val.amount,
        percentage: totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0,
        count: val.count,
        color: CATEGORY_DETAILS[cat]?.color || '#64748b',
      });
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpense]);

  const topCategory = categorySummaries.length > 0 ? categorySummaries[0] : null;

  // Payment method totals
  const paymentMethodTotals: Record<PaymentMethod, number> = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      'Credit Card': 0,
      'Debit Card': 0,
      'Cash': 0,
      'Bank Transfer': 0,
      'Apple Pay / Google Pay': 0,
      'Other': 0,
    };
    filteredExpenses.forEach((e) => {
      if (totals[e.paymentMethod] !== undefined) {
        totals[e.paymentMethod] += e.amount;
      }
    });
    return totals;
  }, [filteredExpenses]);

  // Current budget for selected period
  const currentPeriodBudget = useMemo(() => {
    if (selectedMonth === 'ALL') {
      // Sum of all 12 month budgets for this year if set
      let annualBudget = 0;
      MONTH_NAMES.forEach((m) => {
        annualBudget += budgets[`${selectedYear}_${m}`] || 0;
      });
      return annualBudget > 0 ? annualBudget : null;
    }
    return budgets[`${selectedYear}_${selectedMonth}`] || null;
  }, [budgets, selectedYear, selectedMonth]);

  // Set / Update budget
  const handleSaveBudget = (amount: number) => {
    if (selectedMonth === 'ALL') {
      // Distribute evenly or save for each month
      const perMonth = amount / 12;
      const updated = { ...budgets };
      MONTH_NAMES.forEach((m) => {
        updated[`${selectedYear}_${m}`] = perMonth;
      });
      setBudgets(updated);
      showToast(`Set annual budget of ${CURRENCY_SYMBOL}${amount.toLocaleString()}`, 'success');
    } else {
      setBudgets((prev) => ({
        ...prev,
        [`${selectedYear}_${selectedMonth}`]: amount,
      }));
      showToast(`Budget for ${selectedMonth} ${selectedYear} set to ${CURRENCY_SYMBOL}${amount.toLocaleString()}`, 'success');
    }
  };

  // Add or Edit Expense Handler
  const handleSaveExpense = async (
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'sheetRowIndex'>
  ) => {
    setIsSavingExpense(true);
    const token = accessToken || (await getAccessToken());

    try {
      if (editingExpense) {
        // UPDATE existing expense
        const updatedExpense: Expense = {
          ...editingExpense,
          ...expenseData,
        };

        // Update local state
        setExpenses((prev) =>
          prev.map((e) => (e.id === editingExpense.id ? updatedExpense : e))
        );

        // Sync with Google Sheets if connected
        if (token && spreadsheet && editingExpense.sheetRowIndex) {
          try {
            await updateExpenseInSheet(
              token,
              spreadsheet.id,
              updatedExpense,
              editingExpense.sheetRowIndex
            );
            setLastSynced(new Date());
            showToast('Updated expense and synchronized with Google Sheets!', 'success');
          } catch (sheetErr: any) {
            console.error('Failed to update Google Sheet row:', sheetErr);
            showToast('Expense updated locally. Google Sheet sync pending.', 'info');
          }
        } else {
          showToast('Expense updated successfully!', 'success');
        }
      } else {
        // CREATE new expense
        const newExpense: Expense = {
          ...expenseData,
          id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
        };

        // If Google Sheets is connected, append row directly
        if (token && spreadsheet) {
          try {
            const { sheetRowIndex } = await appendExpenseToSheet(
              token,
              spreadsheet.id,
              newExpense
            );
            newExpense.sheetRowIndex = sheetRowIndex;
            setLastSynced(new Date());
            showToast('Expense recorded and appended to Google Sheets!', 'success');
          } catch (sheetErr: any) {
            console.error('Failed to append to Google Sheet:', sheetErr);
            showToast('Expense saved locally. Google Sheets sync pending.', 'info');
          }
        } else {
          showToast('Expense saved to dashboard!', 'success');
        }

        setExpenses((prev) => [newExpense, ...prev]);
      }
    } finally {
      setIsSavingExpense(false);
      setEditingExpense(null);
    }
  };

  // Delete Expense Request (Triggers confirmation dialog)
  const handleDeleteRequest = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm Delete Action (Destructive Workspace operation)
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    const token = accessToken || (await getAccessToken());

    try {
      // 1. Delete from Google Sheet if connected & has row index
      if (token && spreadsheet && expenseToDelete.sheetRowIndex) {
        try {
          await deleteExpenseFromSheet(
            token,
            spreadsheet.id,
            expenseToDelete.sheetRowIndex
          );
          setLastSynced(new Date());
          showToast(`Deleted "${expenseToDelete.title}" from Google Sheets and dashboard`, 'success');
        } catch (sheetErr: any) {
          console.error('Error deleting from Google Sheets:', sheetErr);
          showToast('Deleted locally. Please re-sync Google Sheet.', 'info');
        }
      } else {
        showToast(`Deleted "${expenseToDelete.title}"`, 'success');
      }

      // 2. Remove from local state
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      setIsConfirmDeleteOpen(false);
      setExpenseToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const periodLabel =
    selectedMonth === 'ALL'
      ? `Full Year ${selectedYear}`
      : `${selectedMonth} ${selectedYear}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900/95 text-rose-100 border-rose-700'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        spreadsheet={spreadsheet}
        isSyncing={isSyncing}
        selectedYear={selectedYear}
        availableYears={AVAILABLE_YEARS}
        onSelectYear={(yr) => setSelectedYear(yr)}
        onOpenAddModal={() => {
          setEditingExpense(null);
          setIsAddModalOpen(true);
        }}
        onRefreshData={handleRefresh}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
        lastSynced={lastSynced}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Month Selector Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Financial Overview
            </h1>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              ({periodLabel})
            </span>
          </div>

          <MonthFilterBar
            selectedMonth={selectedMonth}
            onSelectMonth={(m) => setSelectedMonth(m)}
            monthlyTotals={monthlyTotals}
            currencySymbol={CURRENCY_SYMBOL}
          />
        </div>

        {/* Google Sheets Sync Banner / Promo */}
        <SheetsSyncBanner
          isSignedIn={!!user}
          spreadsheet={spreadsheet}
          isSyncing={isSyncing}
          onRefresh={handleRefresh}
          onSignIn={handleSignIn}
          isLoggingIn={isLoggingIn}
          lastSynced={lastSynced}
        />

        {/* Executive Stats Cards */}
        <StatsCards
          totalExpense={totalExpense}
          periodLabel={periodLabel}
          transactionCount={filteredExpenses.length}
          averageSpend={averageSpend}
          topCategory={topCategory}
          highestExpense={highestExpense}
          monthlyBudget={currentPeriodBudget}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          currencySymbol={CURRENCY_SYMBOL}
        />

        {/* Visual Charts & Breakdown */}
        <ExpenseCharts
          monthlyData={monthlyData}
          categorySummaries={categorySummaries}
          paymentMethodTotals={paymentMethodTotals}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => setSelectedMonth(m)}
          currencySymbol={CURRENCY_SYMBOL}
        />

        {/* Detailed Transactions List */}
        <ExpenseList
          expenses={filteredExpenses}
          onEditExpense={(exp) => {
            setEditingExpense(exp);
            setIsAddModalOpen(true);
          }}
          onDeleteExpense={handleDeleteRequest}
          onOpenAddModal={() => {
            setEditingExpense(null);
            setIsAddModalOpen(true);
          }}
          periodLabel={periodLabel}
          currencySymbol={CURRENCY_SYMBOL}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            SpendWise • Automated Google Sheets Financial Architecture
          </p>
          <p className="flex items-center gap-2">
            <span>Synchronized with Google Drive</span>
            {spreadsheet && (
              <a
                href={spreadsheet.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Access Your Google Sheet
              </a>
            )}
          </p>
        </div>
      </footer>

      {/* Floating Action Button for Mobile screens */}
      <button
        onClick={() => {
          setEditingExpense(null);
          setIsAddModalOpen(true);
        }}
        className="sm:hidden fixed bottom-6 right-5 z-40 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-3.5 rounded-full shadow-2xl shadow-emerald-700/50 flex items-center gap-2 font-bold text-sm transition-all focus:outline-hidden ring-4 ring-white dark:ring-slate-900"
        aria-label="Add new expense"
      >
        <Plus className="w-5 h-5" />
        <span className="pr-1">Add Expense</span>
      </button>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        defaultYear={selectedYear}
        defaultMonth={selectedMonth === 'ALL' ? 'October' : selectedMonth}
        isSaving={isSavingExpense}
        currencySymbol={CURRENCY_SYMBOL}
      />

      {/* Budget Goal Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={currentPeriodBudget}
        periodLabel={periodLabel}
        onSaveBudget={handleSaveBudget}
        currencySymbol={CURRENCY_SYMBOL}
      />

      {/* Confirmation Modal for Google Workspace Destructive Operation */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Expense Entry?"
        message="Are you sure you want to permanently delete this expense? This action will remove the transaction from your dashboard and delete the corresponding row in your Google Sheet."
        details={
          expenseToDelete
            ? [
                { label: 'Description', value: expenseToDelete.title },
                {
                  label: 'Amount',
                  value: `${CURRENCY_SYMBOL}${expenseToDelete.amount.toFixed(2)}`,
                },
                { label: 'Date', value: expenseToDelete.date },
                { label: 'Category', value: expenseToDelete.category },
                {
                  label: 'Sheet Row',
                  value: expenseToDelete.sheetRowIndex
                    ? `Row ${expenseToDelete.sheetRowIndex}`
                    : 'Auto-mapped',
                },
              ]
            : []
        }
        confirmText="Delete Expense"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmDeleteOpen(false);
          setExpenseToDelete(null);
        }}
      />
    </div>
  );
}
