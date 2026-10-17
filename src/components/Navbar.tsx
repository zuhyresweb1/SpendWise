import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  RefreshCw,
  LogOut,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheets';
import { GoogleSignInButton } from './GoogleSignInButton';

interface NavbarProps {
  user: User | null;
  spreadsheet: SpreadsheetInfo | null;
  isSyncing: boolean;
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  onOpenAddModal: () => void;
  onRefreshData: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  lastSynced: Date | null;
}

export function Navbar({
  user,
  spreadsheet,
  isSyncing,
  selectedYear,
  availableYears,
  onSelectYear,
  onOpenAddModal,
  onRefreshData,
  onSignIn,
  onSignOut,
  isLoggingIn,
  lastSynced,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  SpendWise
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Google Sheets Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Expenses & Budget Dashboard
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Year Selector */}
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => onSelectYear(Number(e.target.value))}
                className="bg-transparent border-none outline-hidden cursor-pointer font-bold pr-1 text-slate-800 dark:text-slate-100"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Google Sheets Status & Open Link (if authenticated) */}
            {user && spreadsheet && (
              <div className="hidden lg:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium truncate max-w-[130px]">
                  {spreadsheet.name}
                </span>
                <a
                  href={spreadsheet.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline ml-1"
                  title="Open live spreadsheet in Google Sheets"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Sync / Refresh Button */}
            {user && (
              <button
                onClick={onRefreshData}
                disabled={isSyncing}
                title={lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Sync with Google Sheets'}
                className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${
                    isSyncing ? 'animate-spin text-emerald-600' : ''
                  }`}
                />
                <span className="hidden md:inline">
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </span>
              </button>
            )}

            {/* Add Expense Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/30 active:scale-[0.98] transition-all"
              title="Add new expense"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Expense</span>
            </button>

            {/* Authentication state */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <button
                  onClick={onSignOut}
                  title="Sign out of Google"
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={onSignIn}
                isLoading={isLoggingIn}
                className="py-1.5 px-3 text-xs"
              />
            )}
          </div>
        </div>

        {/* Mobile secondary bar for Sheet Link if connected */}
        {user && spreadsheet && (
          <div className="lg:hidden flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium truncate max-w-[190px]">
                {spreadsheet.name}
              </span>
            </div>
            <a
              href={spreadsheet.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              <span>View in Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
