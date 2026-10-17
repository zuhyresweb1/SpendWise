import { FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheets';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SheetsSyncBannerProps {
  isSignedIn: boolean;
  spreadsheet: SpreadsheetInfo | null;
  isSyncing: boolean;
  onRefresh: () => void;
  onSignIn: () => void;
  isLoggingIn: boolean;
  lastSynced: Date | null;
}

export function SheetsSyncBanner({
  isSignedIn,
  spreadsheet,
  isSyncing,
  onRefresh,
  onSignIn,
  isLoggingIn,
  lastSynced,
}: SheetsSyncBannerProps) {
  if (!isSignedIn) {
    return (
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Automated Google Sheets Storage</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Connect your Google Sheets
          </h2>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Sign in with Google to automatically create a dedicated, beautifully formatted Google Spreadsheet in your Google Drive. Every expense you add in this dashboard will be automatically logged and calculated in your Google Sheet in real-time.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <GoogleSignInButton onClick={onSignIn} isLoading={isLoggingIn} />
            <div className="flex items-center gap-2 text-xs text-emerald-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Permission required only for your expense spreadsheet</span>
            </div>
          </div>
        </div>

        {/* Ambient background styling */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {spreadsheet?.name || 'SpendWise - Expenses & Budget Tracker'}
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Live Synced</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
            <span>Includes <strong>📊 Summary & Analytics</strong> & <strong>💳 Expenses</strong> tabs</span>
            {lastSynced && (
              <>
                <span>•</span>
                <span>Last updated {lastSynced.toLocaleTimeString()}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        {spreadsheet && (
          <a
            href={spreadsheet.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Open in Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
