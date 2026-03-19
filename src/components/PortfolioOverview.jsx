import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Wheat, FileSpreadsheet, Leaf, DollarSign, Download } from 'lucide-react';
import { CONTRACT_MONTHS } from '../utils/constants';
import { generateExecutiveSummary } from '../utils/executiveSummary';

const COMMODITY_ICONS = {
  Wheat: Wheat,
  Corn: FileSpreadsheet,
  Soybeans: Leaf,
};

const COMMODITY_COLORS = {
  Wheat:    { accent: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
  Corn:     { accent: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-700' },
  Soybeans: { accent: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
};

function calcStats(records) {
  let totalBushels = 0, hedgeCount = 0, liqCount = 0, sumBasis = 0, basisCount = 0, netPosition = 0;
  records.forEach(r => {
    const size = parseInt(r.sizeInBushels) || 0;
    const isPos = r.tradeType === 'Hedge' || r.tradeType === 'Rolled In';
    const isNeg = r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out';
    if (isPos) { if (r.tradeType === 'Hedge') hedgeCount++; totalBushels += size; netPosition += size; }
    if (isNeg) { if (r.tradeType === 'Liquidation') liqCount++; totalBushels -= size; netPosition -= size; }
    if (r.basis && !isNaN(parseFloat(r.basis))) { sumBasis += parseFloat(r.basis); basisCount++; }
  });
  return { totalBushels, hedgeCount, liqCount, netPosition, avgBasis: basisCount > 0 ? (sumBasis / basisCount).toFixed(2) : 'N/A' };
}

function calcRealizedPnl(records) {
  return records.reduce((sum, r) => {
    if (r.tradeType !== 'Liquidation') return sum;
    const sell = parseFloat(r.sellPrice);
    const buy = parseFloat(r.futuresPrice);
    const size = parseInt(r.sizeInBushels) || 0;
    if (isNaN(sell) || isNaN(buy)) return sum;
    return sum + ((sell - buy) / 100) * size;
  }, 0);
}

function fmtPnl(v) {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '+';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function MonthBreakdown({ commodity, records }) {
  const months = CONTRACT_MONTHS[commodity] || [];
  return (
    <div className="mt-4 space-y-2">
      {months.map(month => {
        const monthRecords = records.filter(r => r.contractMonth === month);
        const stats = calcStats(monthRecords);
        const hasData = monthRecords.length > 0;
        return (
          <div key={month} className="flex items-center justify-between text-xs">
            <span className="text-gray-500 w-16 flex-shrink-0">{month}</span>
            <div className="flex-1 mx-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              {hasData && (
                <div
                  className="h-full rounded-full bg-current"
                  style={{
                    width: `${Math.min(100, Math.abs(stats.netPosition) / 50000 * 100)}%`,
                    color: COMMODITY_COLORS[commodity].accent,
                    backgroundColor: COMMODITY_COLORS[commodity].accent,
                  }}
                />
              )}
            </div>
            <span className={`w-20 text-right font-medium ${hasData ? 'text-gray-700' : 'text-gray-300'}`}>
              {hasData ? stats.netPosition.toLocaleString() + ' bu' : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CommodityCard({ commodity, records, onNavigate }) {
  const stats = useMemo(() => calcStats(records), [records]);
  const colors = COMMODITY_COLORS[commodity];
  const Icon = COMMODITY_ICONS[commodity];
  const isLong = stats.netPosition >= 0;

  return (
    <div
      onClick={() => onNavigate(commodity)}
      className={`bg-white rounded-2xl border ${colors.border} shadow-sm hover:shadow-md transition-all duration-200 p-6 cursor-pointer group`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className={`w-11 h-11 rounded-xl ${colors.iconBg} ${colors.iconColor} flex items-center justify-center`}>
          <Icon size={22} />
        </div>
        <span className={`flex items-center text-sm font-semibold ${isLong ? 'text-emerald-600' : 'text-red-500'}`}>
          {isLong ? <TrendingUp size={15} className="mr-1" /> : <TrendingDown size={15} className="mr-1" />}
          {isLong ? 'Long' : 'Short'} {Math.abs(stats.netPosition).toLocaleString()} bu
        </span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-1">{commodity}</h3>
      <p className="text-sm text-gray-400 mb-4">{records.length} trade{records.length !== 1 ? 's' : ''} · Avg Basis {stats.avgBasis}</p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Bu', value: stats.totalBushels.toLocaleString() },
          { label: 'Hedges', value: stats.hedgeCount },
          { label: 'Liq.', value: stats.liqCount },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{s.label}</p>
            <p className="text-base font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Position by Month</p>
        <MonthBreakdown commodity={commodity} records={records} />
      </div>

      <div className="mt-4 text-xs text-center text-gray-400 group-hover:text-gray-600 transition-colors">
        Click to view records →
      </div>
    </div>
  );
}

export function PortfolioOverview({ data, onNavigate, accountName }) {
  const commodities = ['Wheat', 'Corn', 'Soybeans'];

  const totalBushels = useMemo(() => {
    return commodities.reduce((sum, c) => {
      const stats = calcStats(data[c] || []);
      return sum + stats.totalBushels;
    }, 0);
  }, [data]);

  const totalTrades = useMemo(() => {
    return commodities.reduce((sum, c) => sum + (data[c]?.length || 0), 0);
  }, [data]);

  const totalPnl = useMemo(() => {
    return commodities.reduce((sum, c) => sum + calcRealizedPnl(data[c] || []), 0);
  }, [data]);

  const hasPnl = commodities.some(c => (data[c] || []).some(r => r.tradeType === 'Liquidation' && r.sellPrice));
  const pnlPositive = totalPnl >= 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 text-[#0f1f3d]" size={26} />
            Portfolio Overview
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {totalTrades} total trades · {totalBushels.toLocaleString()} net bushels across all commodities
          </p>
        </div>
        <button
          onClick={() => generateExecutiveSummary(data, accountName || 'Account')}
          className="flex items-center px-4 py-2 bg-[#0f1f3d] text-white font-medium rounded-lg hover:bg-[#1e3a5f] transition-colors shadow-sm text-sm"
        >
          <Download size={16} className="mr-2" />
          Executive Summary
        </button>
      </div>

      {/* Aggregate PNL Banner */}
      {hasPnl && (
        <div className={`rounded-2xl p-5 flex items-center justify-between shadow-sm border mb-6 ${
          pnlPositive
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              pnlPositive ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              <DollarSign size={22} className={pnlPositive ? 'text-emerald-600' : 'text-red-500'} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Total Realized P&amp;L — All Commodities</p>
              <p className={`text-3xl font-bold tracking-tight ${pnlPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {fmtPnl(totalPnl)}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
            {pnlPositive
              ? <TrendingUp size={20} className="text-emerald-500" />
              : <TrendingDown size={20} className="text-red-400" />}
            <span className={pnlPositive ? 'text-emerald-600' : 'text-red-500'}>
              Across {commodities.length} commodities
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {commodities.map(c => (
          <CommodityCard
            key={c}
            commodity={c}
            records={data[c] || []}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
