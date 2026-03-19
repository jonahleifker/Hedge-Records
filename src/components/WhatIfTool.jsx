import { useState, useMemo } from 'react';
import { Sliders } from 'lucide-react';

export function WhatIfTool({ commodity, records, livePrice }) {
  const [delta, setDelta] = useState(0);

  const hypotheticalPrice = livePrice !== null ? livePrice + delta : null;

  const { currentMtm, hypotheticalMtm, diff } = useMemo(() => {
    if (livePrice === null) return { currentMtm: 0, hypotheticalMtm: 0, diff: 0 };
    let currentMtm = 0;
    let hypotheticalMtm = 0;
    records.forEach(r => {
      if (r.tradeType !== 'Hedge' && r.tradeType !== 'Rolled In') return;
      const fp = parseFloat(r.futuresPrice);
      const size = parseInt(r.sizeInBushels) || 0;
      if (!isNaN(fp) && size > 0) {
        currentMtm += ((livePrice - fp) / 100) * size;
        hypotheticalMtm += ((hypotheticalPrice - fp) / 100) * size;
      }
    });
    return { currentMtm, hypotheticalMtm, diff: hypotheticalMtm - currentMtm };
  }, [records, livePrice, delta, hypotheticalPrice]);

  if (livePrice === null) return null;

  const fmtDollar = (v) => {
    const sign = v < 0 ? '-' : '+';
    return `${sign}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Sliders size={20} className="text-violet-600" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">What-If Scenario</p>
          <p className="text-sm text-gray-400">Drag the slider to simulate a futures price change</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs text-gray-400 w-10 text-right">-50¢</span>
        <input
          type="range"
          min={-50}
          max={50}
          step={0.25}
          value={delta}
          onChange={(e) => setDelta(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <span className="text-xs text-gray-400 w-10">+50¢</span>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Price</p>
          <p className="text-lg font-bold text-gray-800">{livePrice.toFixed(2)}¢</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scenario Price</p>
          <p className={`text-lg font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {hypotheticalPrice.toFixed(2)}¢ <span className="text-xs font-normal">({delta >= 0 ? '+' : ''}{delta.toFixed(2)})</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current MTM</p>
          <p className={`text-lg font-bold ${currentMtm >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtDollar(currentMtm)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scenario MTM</p>
          <p className={`text-lg font-bold ${hypotheticalMtm >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtDollar(hypotheticalMtm)}
          </p>
        </div>
      </div>

      {delta !== 0 && (
        <div className={`mt-3 text-center text-sm font-medium py-2 rounded-lg ${diff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          A {Math.abs(delta).toFixed(2)}¢ {delta > 0 ? 'increase' : 'decrease'} would {diff >= 0 ? 'improve' : 'reduce'} your portfolio by {fmtDollar(Math.abs(diff))}
        </div>
      )}
    </div>
  );
}
