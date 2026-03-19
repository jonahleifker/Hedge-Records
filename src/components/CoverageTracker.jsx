import { useState, useMemo, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { Target } from 'lucide-react';

const STORAGE_KEY = 'stonex_expected_production';

export function CoverageTracker({ commodity, records }) {
  const [expectedProduction, setExpectedProduction] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return stored[commodity] || '';
    } catch { return ''; }
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      setExpectedProduction(stored[commodity] || '');
    } catch { /* ignore */ }
  }, [commodity]);

  const saveProduction = (val) => {
    setExpectedProduction(val);
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      stored[commodity] = val;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch { /* ignore */ }
  };

  const hedgedBushels = useMemo(() => {
    let total = 0;
    records.forEach(r => {
      const size = parseInt(r.sizeInBushels) || 0;
      if (r.tradeType === 'Hedge' || r.tradeType === 'Rolled In') total += size;
      if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') total -= size;
    });
    return Math.max(0, total);
  }, [records]);

  const expected = parseInt(expectedProduction) || 0;
  const coveragePct = expected > 0 ? Math.min(100, Math.round((hedgedBushels / expected) * 100)) : 0;
  const hasTarget = expected > 0;

  const chartOptions = {
    chart: { type: 'radialBar', background: 'transparent' },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        track: { background: '#e5e7eb', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '11px', color: '#6b7280', offsetY: -8 },
          value: {
            show: true, fontSize: '24px', fontWeight: 700,
            color: coveragePct >= 75 ? '#059669' : coveragePct >= 40 ? '#d97706' : '#ef4444',
            offsetY: 4, formatter: (val) => `${val}%`
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark', type: 'horizontal',
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: coveragePct >= 75 ? '#10b981' : coveragePct >= 40 ? '#f59e0b' : '#ef4444' },
          { offset: 100, color: coveragePct >= 75 ? '#059669' : coveragePct >= 40 ? '#d97706' : '#dc2626' }
        ]
      }
    },
    stroke: { lineCap: 'round' },
    labels: ['Coverage'],
  };

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Target size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Coverage Tracker</p>
            <p className="text-sm text-gray-400">Hedged vs. Expected Production</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Expected:</span>
          {isEditing ? (
            <input
              autoFocus
              type="number"
              step="5000"
              min="0"
              value={expectedProduction}
              onChange={(e) => saveProduction(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="w-28 px-2 py-1 text-sm border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-right"
              placeholder="e.g. 200000"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors border border-gray-200"
            >
              {expected > 0 ? `${expected.toLocaleString()} bu` : 'Set Target'}
            </button>
          )}
        </div>
      </div>

      {hasTarget ? (
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 flex-shrink-0">
            <Chart options={chartOptions} series={[coveragePct]} type="radialBar" height="100%" />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Expected</p>
              <p className="text-lg font-bold text-gray-800">{expected.toLocaleString()}</p>
              <p className="text-xs text-gray-400">bushels</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hedged</p>
              <p className="text-lg font-bold text-emerald-600">{hedgedBushels.toLocaleString()}</p>
              <p className="text-xs text-gray-400">bushels</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Unhedged</p>
              <p className="text-lg font-bold text-amber-600">{Math.max(0, expected - hedgedBushels).toLocaleString()}</p>
              <p className="text-xs text-gray-400">bushels</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400 text-sm">
          Set an expected production target to see coverage analytics.
        </div>
      )}
    </div>
  );
}
