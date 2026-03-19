import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, BarChart3, Shield } from 'lucide-react';
import { ACCOUNTS } from '../hooks/useHedgeRecords';

const COMMODITIES = ['Wheat', 'Corn', 'Soybeans'];

function loadAccountData(accountId) {
  try {
    const key = `stonex_hedge_records_v6_${accountId}`;
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { Wheat: [], Corn: [], Soybeans: [] };
}

function calcAccountStats(data) {
  let netPosition = 0, realizedPnl = 0, totalTrades = 0;

  COMMODITIES.forEach(c => {
    const records = data[c] || [];
    totalTrades += records.length;
    records.forEach(r => {
      const size = parseInt(r.sizeInBushels) || 0;
      if (r.tradeType === 'Hedge' || r.tradeType === 'Rolled In') netPosition += size;
      if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') netPosition -= size;
      if (r.tradeType === 'Liquidation') {
        const sell = parseFloat(r.sellPrice);
        const buy = parseFloat(r.futuresPrice);
        if (!isNaN(sell) && !isNaN(buy)) {
          realizedPnl += ((sell - buy) / 100) * Math.abs(size);
        }
      }
    });
  });

  return { netPosition, realizedPnl, totalTrades };
}

function fmtDollar(v) {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '+';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

const CARD_COLORS = [
  { gradient: 'from-blue-50 to-indigo-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700' },
  { gradient: 'from-emerald-50 to-green-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
  { gradient: 'from-amber-50 to-yellow-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700' },
  { gradient: 'from-purple-50 to-pink-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-700' },
];

export function MultiClientView({ onNavigateAccount }) {
  const accountData = useMemo(() => {
    return ACCOUNTS.map((acc, i) => {
      const data = loadAccountData(acc.id);
      const stats = calcAccountStats(data);
      return { ...acc, ...stats, color: CARD_COLORS[i % CARD_COLORS.length] };
    });
  }, []);

  const totals = useMemo(() => {
    return accountData.reduce((t, a) => ({
      netPosition: t.netPosition + a.netPosition,
      realizedPnl: t.realizedPnl + a.realizedPnl,
      totalTrades: t.totalTrades + a.totalTrades,
    }), { netPosition: 0, realizedPnl: 0, totalTrades: 0 });
  }, [accountData]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 text-[#0f1f3d]" size={26} />
            All Accounts Overview
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {ACCOUNTS.length} accounts · {totals.totalTrades} total trades · {totals.netPosition.toLocaleString()} net bushels
          </p>
        </div>
      </div>

      {/* Aggregate Banner */}
      <div className={`rounded-2xl p-5 flex items-center justify-between shadow-sm border mb-6 ${
        totals.realizedPnl >= 0
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            totals.realizedPnl >= 0 ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <DollarSign size={22} className={totals.realizedPnl >= 0 ? 'text-emerald-600' : 'text-red-500'} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
              Total Realized P&amp;L — All Accounts
            </p>
            <p className={`text-3xl font-bold tracking-tight ${totals.realizedPnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmtDollar(totals.realizedPnl)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accountData.map(acc => {
          const isPositive = acc.netPosition >= 0;
          const pnlPos = acc.realizedPnl >= 0;
          return (
            <div
              key={acc.id}
              onClick={() => onNavigateAccount(acc.id)}
              className={`bg-gradient-to-br ${acc.color.gradient} rounded-2xl border ${acc.color.border} shadow-sm hover:shadow-md transition-all duration-200 p-6 cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${acc.color.icon} flex items-center justify-center`}>
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{acc.name}</h3>
                    <p className="text-xs text-gray-400">{acc.totalTrades} trades</p>
                  </div>
                </div>
                <span className={`flex items-center text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp size={15} className="mr-1" /> : <TrendingDown size={15} className="mr-1" />}
                  {Math.abs(acc.netPosition).toLocaleString()} bu
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net Position</p>
                  <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {acc.netPosition.toLocaleString()} bu
                  </p>
                </div>
                <div className="bg-white/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Realized P&L</p>
                  <p className={`text-lg font-bold ${pnlPos ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fmtDollar(acc.realizedPnl)}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-xs text-center text-gray-400 group-hover:text-gray-600 transition-colors">
                Click to switch to this account →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
