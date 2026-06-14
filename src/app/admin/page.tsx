'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SyncStatus {
  fighters: number;
  events: number;
  fights: number;
  lastOddsUpdate: string | null;
  lastSync: {
    syncType: string;
    status: string;
    itemsProcessed: number;
    errors: number;
    startedAt: string;
    completedAt: string | null;
  } | null;
}

interface BacktestData {
  modelVersion: string;
  fights: number;
  accuracy: number;
  favoriteAccuracy: number;
  edgeVsMarketPts: number;
  brier: number;
  logLoss: number;
  tiers: { label: string; accuracy: number | null; n: number }[];
  calibration: { rangeLabel: string; predicted: number; actual: number; n: number }[];
  roiAll: number;
  roiAllN: number;
  roiValue: number | null;
  roiValueN: number;
}

export default function AdminPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backtest, setBacktest] = useState<BacktestData | null>(null);
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  async function runBacktest() {
    setBacktestRunning(true);
    setBacktestError(null);
    try {
      const res = await fetch('/api/admin/backtest');
      const data = await res.json();
      if (res.ok) setBacktest(data.result);
      else setBacktestError(data.error || 'Backtest failed');
    } catch (e) {
      setBacktestError(`Failed to run backtest: ${e}`);
    } finally {
      setBacktestRunning(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runSync(type: string) {
    setSyncing(type);
    setMessage(null);

    try {
      const res = await fetch(`/api/sync?type=${type}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setMessage(`${type} sync: ${data.message}`);
        // Refresh status after sync
        setTimeout(fetchStatus, 1000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Failed to start sync: ${error}`);
    } finally {
      setSyncing(null);
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1a1a1a] rounded w-48 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-[#1a1a1a] rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-[#0d0d0d]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Data Admin</h1>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back to Site
          </Link>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatusCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            label="Fighters"
            value={status?.fighters || 0}
          />
          <StatusCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Events"
            value={status?.events || 0}
          />
          <StatusCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            label="Fights"
            value={status?.fights || 0}
          />
          <StatusCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Last Odds"
            value={status?.lastOddsUpdate
              ? new Date(status.lastOddsUpdate).toLocaleTimeString()
              : 'Never'}
            small
          />
        </div>

        {/* Last Sync Info */}
        {status?.lastSync && (
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Last Sync</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>{' '}
                <span className="text-white capitalize">{status.lastSync.syncType}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`${
                  status.lastSync.status === 'completed' ? 'text-green-400' :
                  status.lastSync.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {status.lastSync.status}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Processed:</span>{' '}
                <span className="text-white">{status.lastSync.itemsProcessed}</span>
              </div>
              <div>
                <span className="text-gray-500">Errors:</span>{' '}
                <span className={status.lastSync.errors > 0 ? 'text-red-400' : 'text-white'}>
                  {status.lastSync.errors}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Started: {formatDate(status.lastSync.startedAt)}
              {status.lastSync.completedAt && ` • Completed: ${formatDate(status.lastSync.completedAt)}`}
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.startsWith('Error') ? 'bg-red-500/20 border border-red-500/50 text-red-200' :
            'bg-green-500/20 border border-green-500/50 text-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Sync Buttons */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Run Sync</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SyncButton
              label="Sync Odds"
              description="Update betting odds from The Odds API"
              onClick={() => runSync('odds')}
              loading={syncing === 'odds'}
              disabled={syncing !== null}
            />
            <SyncButton
              label="Quick Sync"
              description="Sync events + odds (recommended)"
              onClick={() => runSync('quick')}
              loading={syncing === 'quick'}
              disabled={syncing !== null}
            />
            <SyncButton
              label="Full Sync"
              description="All fighters from UFCStats.com"
              onClick={() => runSync('full')}
              loading={syncing === 'full'}
              disabled={syncing !== null}
              variant="warning"
            />
          </div>

          <p className="text-sm text-gray-500">
            Note: Full sync scrapes all UFC fighters and may take 30-60 minutes. It runs in the background.
          </p>
        </div>

        {/* Model Backtest */}
        <div className="mt-12 border-t border-[#3a3a3a] pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Model Backtest</h2>
            <button
              onClick={runBacktest}
              disabled={backtestRunning}
              className="px-4 py-2 rounded-lg bg-[#d20a0a] hover:bg-[#b00909] text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {backtestRunning ? 'Running…' : 'Run Backtest'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Runs the current prediction model over ~3,400 historical fights (real stats + closing odds + results) to measure accuracy, calibration, and ROI. Re-run after any model change to prove it helped.
          </p>

          {backtestError && (
            <div className="p-4 rounded-lg mb-4 bg-red-500/20 border border-red-500/50 text-red-200">{backtestError}</div>
          )}

          {backtest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatusCard icon={<span className="text-base">🎯</span>} label="Model accuracy" value={`${(backtest.accuracy * 100).toFixed(1)}%`} />
                <StatusCard icon={<span className="text-base">💰</span>} label="Favorite baseline" value={`${(backtest.favoriteAccuracy * 100).toFixed(1)}%`} />
                <StatusCard icon={<span className="text-base">📈</span>} label="Edge vs market" value={`${backtest.edgeVsMarketPts >= 0 ? '+' : ''}${backtest.edgeVsMarketPts.toFixed(1)} pts`} />
                <StatusCard icon={<span className="text-base">🥊</span>} label="Fights tested" value={backtest.fights} />
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-500">Brier:</span> <span className="text-white">{backtest.brier.toFixed(3)}</span></div>
                <div><span className="text-gray-500">LogLoss:</span> <span className="text-white">{backtest.logLoss.toFixed(3)}</span></div>
                <div><span className="text-gray-500">ROI (all picks):</span> <span className={backtest.roiAll >= 0 ? 'text-green-400' : 'text-red-400'}>{(backtest.roiAll * 100).toFixed(1)}%</span></div>
                <div><span className="text-gray-500">ROI (value):</span> <span className={(backtest.roiValue ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}>{backtest.roiValue == null ? '—' : `${(backtest.roiValue * 100).toFixed(1)}%`}</span></div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Accuracy by confidence tier</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {backtest.tiers.map((t) => (
                    <div key={t.label}>
                      <div className="text-white font-bold">{t.accuracy == null ? '—' : `${(t.accuracy * 100).toFixed(1)}%`}</div>
                      <div className="text-gray-500 text-xs">{t.label} (n={t.n})</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Calibration (predicted → actual win rate)</h3>
                <div className="space-y-1 text-xs">
                  {backtest.calibration.map((b) => (
                    <div key={b.rangeLabel} className="flex items-center gap-3">
                      <span className="text-gray-500 w-16">{b.rangeLabel}</span>
                      <span className="text-gray-400 w-28">pred {(b.predicted * 100).toFixed(0)}% → act {(b.actual * 100).toFixed(0)}%</span>
                      <div className="flex-1 bg-[#0d0d0d] rounded h-2 overflow-hidden">
                        <div className="bg-[#c9a227] h-full" style={{ width: `${Math.min(100, b.actual * 100)}%` }} />
                      </div>
                      <span className="text-gray-600 w-12 text-right">n={b.n}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Model {backtest.modelVersion}. Dataset lacks historical streak/record, so the historical / experience / durability factors run neutral here — measures the model&apos;s core.
              </p>
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="mt-12 border-t border-[#3a3a3a] pt-8">
          <h2 className="text-xl font-bold text-white mb-4">Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataSourceCard
              name="UFCStats.com"
              description="Official UFC statistics - fighter data, records, fight history"
              status="active"
            />
            <DataSourceCard
              name="The Odds API"
              description="Live betting odds from multiple bookmakers"
              status={process.env.NEXT_PUBLIC_HAS_ODDS_KEY === 'true' ? 'active' : 'needs_key'}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  icon,
  label,
  value,
  small
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`font-bold text-white ${small ? 'text-lg' : 'text-2xl'}`}>{value}</div>
    </div>
  );
}

function SyncButton({
  label,
  description,
  onClick,
  loading,
  disabled,
  variant = 'default'
}: {
  label: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  variant?: 'default' | 'warning';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-4 rounded-lg border text-left transition-colors ${
        variant === 'warning'
          ? 'border-yellow-500/50 hover:bg-yellow-500/20'
          : 'border-[#3a3a3a] hover:bg-[#2a2a2a]'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        <span className="font-bold text-white">{label}</span>
      </div>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </button>
  );
}

function DataSourceCard({
  name,
  description,
  status
}: {
  name: string;
  description: string;
  status: 'active' | 'needs_key' | 'error';
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-white">{name}</span>
        <span className={`text-xs px-2 py-1 rounded ${
          status === 'active' ? 'bg-green-500/20 text-green-400' :
          status === 'needs_key' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {status === 'active' ? 'Active' : status === 'needs_key' ? 'Needs API Key' : 'Error'}
        </span>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
