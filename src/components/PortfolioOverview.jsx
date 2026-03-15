import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Wheat, FileSpreadsheet, Leaf } from 'lucide-react';
import { CONTRACT_MONTHS } from '../utils/constants';

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

export function PortfolioOverview({ data, onNavigate }) {
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 text-[#0f1f3d]" size={26} />
            Portfolio Overview
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {totalTrades} total trades · {totalBushels.toLocaleString()} net bushels across all commodities
          </p>
        </div>
      </div>

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
