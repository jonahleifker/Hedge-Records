import { useState } from 'react';
import { X } from 'lucide-react';
import { TRADE_TYPES, CONTRACT_MONTHS, COMMODITIES } from '../utils/constants';

const empty = (commodity) => ({
  tradeDate: new Date().toISOString().split('T')[0],
  tradeNumber: '',
  commodity: commodity || 'Corn',
  contractMonth: (CONTRACT_MONTHS[commodity || 'Corn'] || [])[0] || '',
  tradeType: 'Hedge',
  cashPrice: '',
  futuresPrice: '',
  basis: '',
  sizeInBushels: '',
});

export function AddTradeModal({ onClose, onSave, defaultCommodity }) {
  const [form, setForm] = useState(empty(defaultCommodity));
  const [error, setError] = useState('');

  const set = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate basis when both prices are present
      if ((field === 'cashPrice' || field === 'futuresPrice')) {
        const cp = parseFloat(field === 'cashPrice' ? value : next.cashPrice);
        const fp = parseFloat(field === 'futuresPrice' ? value : next.futuresPrice);
        if (!isNaN(cp) && !isNaN(fp)) {
          next.basis = (cp - fp).toFixed(2);
        }
      }
      // Reset contract month when commodity changes
      if (field === 'commodity') {
        next.contractMonth = (CONTRACT_MONTHS[value] || [])[0] || '';
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!form.tradeDate) return setError('Trade date is required.');
    if (!form.tradeNumber.trim()) return setError('Trade number is required.');
    if (!form.contractMonth) return setError('Contract month is required.');
    if (!form.sizeInBushels || isNaN(parseInt(form.sizeInBushels))) return setError('Size in bushels is required.');

    const record = {
      ...form,
      id: crypto.randomUUID(),
      sizeInBushels: Math.abs(parseInt(form.sizeInBushels)),
      cashPrice: form.cashPrice ? parseFloat(form.cashPrice).toFixed(2) : '',
      futuresPrice: form.futuresPrice ? parseFloat(form.futuresPrice).toFixed(2) : '',
      basis: form.basis ? parseFloat(form.basis).toFixed(2) : '',
    };

    onSave(record);
    onClose();
  };

  const months = CONTRACT_MONTHS[form.commodity] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Trade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Trade Date">
              <input type="date" value={form.tradeDate} onChange={e => set('tradeDate', e.target.value)}
                className={inputClass} />
            </Field>
            <Field label="Trade Number">
              <input type="text" placeholder="e.g. CN-1016" value={form.tradeNumber} onChange={e => set('tradeNumber', e.target.value)}
                className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Commodity">
              <select value={form.commodity} onChange={e => set('commodity', e.target.value)} className={inputClass}>
                {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Contract Month">
              <select value={form.contractMonth} onChange={e => set('contractMonth', e.target.value)} className={inputClass}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Trade Type">
            <div className="flex flex-wrap gap-2">
              {TRADE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tradeType', t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.tradeType === t
                      ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Cash Price (¢)">
              <input type="number" step="0.25" placeholder="0.00" value={form.cashPrice}
                onChange={e => set('cashPrice', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Futures Price (¢)">
              <input type="number" step="0.25" placeholder="0.00" value={form.futuresPrice}
                onChange={e => set('futuresPrice', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Basis (¢)">
              <input type="number" step="0.25" placeholder="auto" value={form.basis}
                onChange={e => set('basis', e.target.value)} className={`${inputClass} bg-gray-50`} />
            </Field>
          </div>

          <Field label="Size (Bushels)">
            <input type="number" step="5000" min="0" placeholder="e.g. 5000" value={form.sizeInBushels}
              onChange={e => set('sizeInBushels', e.target.value)} className={inputClass} />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              placeholder="Add notes about this trade..."
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-[#0f1f3d] hover:bg-[#1e3a5f] rounded-lg shadow-sm transition-colors">
            Add Trade
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d] transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
