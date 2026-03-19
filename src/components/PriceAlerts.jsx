import { useState, useEffect, useMemo } from 'react';
import { Bell, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { COMMODITIES } from '../utils/constants';
import { fetchHistoricalData } from '../utils/yahooFinance';

const STORAGE_KEY = 'stonex_price_alerts';

function loadAlerts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveAlerts(alerts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch { /* ignore */ }
}

export function PriceAlerts() {
  const [alerts, setAlerts] = useState(loadAlerts);
  const [livePrices, setLivePrices] = useState({});
  const [newCommodity, setNewCommodity] = useState('Corn');
  const [newTarget, setNewTarget] = useState('');
  const [newDirection, setNewDirection] = useState('above');

  // Fetch live prices for all commodities
  useEffect(() => {
    COMMODITIES.forEach(c => {
      fetchHistoricalData(c, '1mo').then(data => {
        if (data && data.length > 0) {
          setLivePrices(prev => ({ ...prev, [c]: data[data.length - 1].close }));
        }
      }).catch(() => {});
    });
  }, []);

  const addAlert = () => {
    const target = parseFloat(newTarget);
    if (isNaN(target) || target <= 0) return;
    const alert = {
      id: crypto.randomUUID(),
      commodity: newCommodity,
      targetPrice: target,
      direction: newDirection,
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    const updated = [...alerts, alert];
    setAlerts(updated);
    saveAlerts(updated);
    setNewTarget('');
  };

  const removeAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  // Check triggers
  const checkedAlerts = useMemo(() => {
    return alerts.map(a => {
      const live = livePrices[a.commodity];
      if (live === undefined) return { ...a, isTriggered: false };
      const isTriggered = a.direction === 'above' ? live >= a.targetPrice : live <= a.targetPrice;
      return { ...a, isTriggered };
    });
  }, [alerts, livePrices]);

  const triggeredCount = checkedAlerts.filter(a => a.isTriggered).length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="mr-3 text-[#0f1f3d]" size={24} />
            Price Alerts
          </h2>
          <p className="text-gray-500 text-sm mt-1">Set target prices and get notified when they're hit</p>
        </div>
        {triggeredCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200 text-sm font-medium">
            <AlertTriangle size={16} />
            {triggeredCount} alert{triggeredCount !== 1 ? 's' : ''} triggered
          </div>
        )}
      </div>

      {/* Add Alert Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">New Alert</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Commodity</label>
            <select value={newCommodity} onChange={e => setNewCommodity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
              {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Direction</label>
            <select value={newDirection} onChange={e => setNewDirection(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="above">Goes Above</option>
              <option value="below">Goes Below</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Target Price (¢/bu)</label>
            <input type="number" step="0.25" value={newTarget} onChange={e => setNewTarget(e.target.value)}
              placeholder="e.g. 500.00"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 w-32" />
          </div>
          <button onClick={addAlert}
            className="flex items-center px-4 py-2 bg-[#0f1f3d] text-white font-medium rounded-lg hover:bg-[#1e3a5f] transition-colors shadow-sm text-sm">
            <Plus size={16} className="mr-1" /> Add Alert
          </button>
        </div>
      </div>

      {/* Live Prices */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {COMMODITIES.map(c => (
          <div key={c} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{c} (Live)</p>
            <p className="text-2xl font-bold text-gray-800">
              {livePrices[c] !== undefined ? `${livePrices[c].toFixed(2)}¢` : '...'}
            </p>
          </div>
        ))}
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Alerts ({checkedAlerts.length})</p>
        </div>
        {checkedAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No alerts set. Create one above.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {checkedAlerts.map(a => (
              <div key={a.id} className={`px-5 py-3 flex items-center justify-between ${a.isTriggered ? 'bg-amber-50' : ''}`}>
                <div className="flex items-center gap-3">
                  {a.isTriggered ? (
                    <CheckCircle size={18} className="text-amber-500" />
                  ) : (
                    <Bell size={18} className="text-gray-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {a.commodity} {a.direction === 'above' ? '≥' : '≤'} {a.targetPrice.toFixed(2)}¢
                    </p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(a.createdAt).toLocaleDateString()}
                      {a.isTriggered && <span className="ml-2 text-amber-600 font-medium">⚡ TRIGGERED</span>}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeAlert(a.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
