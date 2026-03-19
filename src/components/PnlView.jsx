import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { CONTRACT_MONTHS } from '../utils/constants';

/**
 * PNL is calculated for each Liquidation record as:
 *   pnl = (sellPrice - futuresPrice) * sizeInBushels / 100
 * Prices are stored in cents/bushel (e.g. 628.50 = $6.285/bu).
 * Division by 100 converts to dollars.
 */
function calcPnl(r) {
  const sell = parseFloat(r.sellPrice);
  const buy = parseFloat(r.futuresPrice);
  const size = parseInt(r.sizeInBushels) || 0;
  if (isNaN(sell) || isNaN(buy)) return null;
  return ((sell - buy) / 100) * size;
}

function fmt(dollars) {
  const abs = Math.abs(dollars);
  const sign = dollars < 0 ? '-' : '+';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function PnlView({ commodity, records }) {
  const months = CONTRACT_MONTHS[commodity] || [];

  const { totalPnl, liqCount, monthData } = useMemo(() => {
    let totalPnl = 0;
    let liqCount = 0;
    const monthData = {};

    months.forEach(m => { monthData[m] = { pnl: 0, count: 0 }; });

    records.forEach(r => {
      if (r.tradeType !== 'Liquidation') return;
      const pnl = calcPnl(r);
      if (pnl === null) return;
      totalPnl += pnl;
      liqCount++;
      if (monthData[r.contractMonth] !== undefined) {
        monthData[r.contractMonth].pnl += pnl;
        monthData[r.contractMonth].count++;
      }
    });

    return { totalPnl, liqCount, monthData };
  }, [records, months]);

  const activeMonths = months.filter(m => monthData[m]?.count > 0);
  const maxAbs = Math.max(...activeMonths.map(m => Math.abs(monthData[m].pnl)), 1);

  if (liqCount === 0) return null;

  const isPositive = totalPnl >= 0;

  return (
    <div className="mb-6">
      {/* Summary Banner */}
      <div className={`rounded-2xl p-5 flex items-center justify-between shadow-sm border ${
        isPositive
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPositive ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <DollarSign size={22} className={isPositive ? 'text-emerald-600' : 'text-red-500'} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
              Realized P&amp;L — {commodity}
            </p>
            <p className={`text-3xl font-bold tracking-tight ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmt(totalPnl)}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
          {isPositive
            ? <TrendingUp size={20} className="text-emerald-500" />
            : <TrendingDown size={20} className="text-red-400" />}
          <span className={isPositive ? 'text-emerald-600' : 'text-red-500'}>
            {liqCount} liquidation{liqCount !== 1 ? 's' : ''} closed
          </span>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {activeMonths.length > 0 && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">P&amp;L by Contract Month</p>
          </div>
          <div className="p-4 space-y-3">
            {activeMonths.map(m => {
              const { pnl, count } = monthData[m];
              const pos = pnl >= 0;
              const barWidth = `${Math.round((Math.abs(pnl) / maxAbs) * 100)}%`;
              return (
                <div key={m} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-14 flex-shrink-0">{m}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pos ? 'bg-emerald-500' : 'bg-red-400'}`}
                      style={{ width: barWidth }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-32 justify-end flex-shrink-0">
                    <span className={`text-sm font-bold tabular-nums ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(pnl)}
                    </span>
                    <span className="text-xs text-gray-400">({count})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
