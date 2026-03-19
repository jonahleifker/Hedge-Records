import { useState, useMemo } from 'react';
import { ClipboardList, ChevronDown, Filter } from 'lucide-react';
import { format } from 'date-fns';

const AUDIT_KEY = (accountId) => `stonex_audit_log_${accountId}`;

export function loadAuditLog(accountId) {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY(accountId)) || '[]'); } catch { return []; }
}

export function appendAuditEntry(accountId, entry) {
  try {
    const log = loadAuditLog(accountId);
    log.unshift({ ...entry, timestamp: new Date().toISOString(), id: crypto.randomUUID() });
    // Cap at 500 entries
    if (log.length > 500) log.length = 500;
    localStorage.setItem(AUDIT_KEY(accountId), JSON.stringify(log));
  } catch { /* ignore */ }
}

const ACTION_COLORS = {
  add: 'text-emerald-700 bg-emerald-100',
  update: 'text-blue-700 bg-blue-100',
  delete: 'text-red-700 bg-red-100',
  clear: 'text-amber-700 bg-amber-100',
};

export function AuditLog({ accountId }) {
  const [filter, setFilter] = useState('all');
  const log = useMemo(() => loadAuditLog(accountId), [accountId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return log;
    return log.filter(e => e.action === filter);
  }, [log, filter]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="mr-3 text-[#0f1f3d]" size={24} />
            Audit Trail
          </h2>
          <p className="text-gray-500 text-sm mt-1">{log.length} logged actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none">
            <option value="all">All Actions</option>
            <option value="add">Additions</option>
            <option value="update">Updates</option>
            <option value="delete">Deletions</option>
            <option value="clear">Clears</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>No audit entries yet.</p>
            <p className="text-xs mt-1">Changes to trade records will be logged here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filtered.map(entry => (
              <div key={entry.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[entry.action] || 'text-gray-700 bg-gray-100'}`}>
                      {entry.action.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{entry.commodity}</span>
                    {entry.tradeNumber && (
                      <span className="text-xs text-gray-400">#{entry.tradeNumber}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{entry.description}</p>
                {entry.field && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Field: <span className="font-medium">{entry.field}</span>
                    {entry.oldValue !== undefined && <span> · Old: <span className="text-red-500">{String(entry.oldValue)}</span></span>}
                    {entry.newValue !== undefined && <span> · New: <span className="text-emerald-600">{String(entry.newValue)}</span></span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
