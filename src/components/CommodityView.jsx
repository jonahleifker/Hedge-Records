import { useState, useMemo } from 'react';
import { Search, Trash2, Download, Plus, MoreVertical } from 'lucide-react';
import { TRADE_TYPES, CONTRACT_MONTHS } from '../utils/constants';
import { HedgeTable } from './HedgeTable';
import { exportToPDF } from '../utils/pdfExport';
import { AddTradeModal } from './AddTradeModal';

export function CommodityView({ commodity, records, updateRecord, deleteRecord, clearRecords, onAddRecord }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilters, setTypeFilters] = useState(new Set(TRADE_TYPES));
  const [activeMonth, setActiveMonth] = useState('All');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const validMonths = CONTRACT_MONTHS[commodity] || [];

  // Filtered records for table
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (activeMonth !== 'All' && r.contractMonth !== activeMonth) return false;
      if (!typeFilters.has(r.tradeType)) return false;
      if (searchTerm && r.tradeNumber && !r.tradeNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [records, typeFilters, searchTerm, activeMonth]);

  // Stats update based on active filters (month, type, search)
  const stats = useMemo(() => {
    let totalBushels = 0, hedgeCount = 0, liqCount = 0, sumBasis = 0, basisCount = 0, netPosition = 0;
    filteredRecords.forEach(r => {
      const size = parseInt(r.sizeInBushels) || 0;
      const isPos = r.tradeType === 'Hedge' || r.tradeType === 'Rolled In';
      const isNeg = r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out';
      if (isPos) { if (r.tradeType === 'Hedge') hedgeCount++; totalBushels += size; netPosition += size; }
      if (isNeg) { if (r.tradeType === 'Liquidation') liqCount++; totalBushels -= size; netPosition -= size; }
      if (r.basis && !isNaN(parseFloat(r.basis))) { sumBasis += parseFloat(r.basis); basisCount++; }
    });
    return { totalBushels, hedgeCount, liqCount, netPosition, avgBasis: basisCount > 0 ? (sumBasis / basisCount).toFixed(2) : 'N/A' };
  }, [filteredRecords]);

  // Month badge counts (net position per month for the tab pills)
  const monthStats = useMemo(() => {
    const out = {};
    validMonths.forEach(m => {
      const mRecs = records.filter(r => r.contractMonth === m);
      let net = 0;
      mRecs.forEach(r => {
        const size = parseInt(r.sizeInBushels) || 0;
        if (r.tradeType === 'Hedge' || r.tradeType === 'Rolled In') net += size;
        if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') net -= size;
      });
      out[m] = { count: mRecs.length, net };
    });
    return out;
  }, [records, validMonths]);

  const toggleTypeFilter = (type) => {
    const next = new Set(typeFilters);
    if (next.has(type)) next.delete(type); else next.add(type);
    setTypeFilters(next);
  };

  const handleExportPDF = () => {
    const exportRecords = records.filter(r => {
      if (!typeFilters.has(r.tradeType)) return false;
      if (searchTerm && r.tradeNumber && !r.tradeNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
    exportToPDF(commodity, exportRecords);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{commodity} Records</h2>
          <p className="text-gray-500 text-sm mt-1">{filteredRecords.length} of {records.length} records shown</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Primary action: Add Trade */}
          <button
            onClick={() => setShowAddTrade(true)}
            className="flex items-center px-4 py-2 bg-[#0f1f3d] text-white font-medium rounded-lg hover:bg-[#1e3a5f] transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Add Trade
          </button>

          {/* Secondary: Download PDF */}
          <button
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={16} className="mr-2" />
            Download PDF
          </button>

          {/* Overflow menu for destructive actions */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              onBlur={() => setTimeout(() => setShowMenu(false), 150)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 shadow-lg rounded-xl py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { setShowMenu(false); setShowClearConfirm(true); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} className="mr-2" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contract Month Selector with badges */}
      <div className="flex space-x-2 overflow-auto mb-6 pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveMonth('All')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border shadow-sm flex-shrink-0 ${
            activeMonth === 'All'
              ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Months
        </button>
        {validMonths.map(m => {
          const ms = monthStats[m];
          const isActive = activeMonth === m;
          return (
            <button
              key={m}
              onClick={() => setActiveMonth(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border shadow-sm flex-shrink-0 ${
                isActive
                  ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m}
              {ms && ms.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : ms.net >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {(ms.net / 1000).toFixed(0)}k
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Bushels" value={stats.totalBushels.toLocaleString()} />
        <StatCard label="Hedges" value={stats.hedgeCount.toLocaleString()} />
        <StatCard label="Liquidations" value={stats.liqCount.toLocaleString()} />
        <StatCard label="Avg Basis" value={stats.avgBasis} />
        <StatCard
          label="Net Position (Bu)"
          value={stats.netPosition.toLocaleString()}
          valueClass={stats.netPosition > 0 ? "text-[#00c48c]" : stats.netPosition < 0 ? "text-red-500" : ""}
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex items-center space-x-2 w-full lg:w-1/3 relative">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Trade Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TRADE_TYPES.map(type => (
            <label key={type} className="flex items-center space-x-2 text-sm text-gray-700 border border-gray-200 bg-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={typeFilters.has(type)}
                onChange={() => toggleTypeFilter(type)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col min-h-[400px]">
        <HedgeTable
          records={filteredRecords}
          commodity={commodity}
          updateRecord={updateRecord}
          deleteRecord={deleteRecord}
        />
      </div>

      {/* Add Trade Modal */}
      {showAddTrade && (
        <AddTradeModal
          defaultCommodity={commodity}
          onClose={() => setShowAddTrade(false)}
          onSave={(record) => onAddRecord && onAddRecord(record)}
        />
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clear All Records?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete all {records.length} {commodity} records? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => { clearRecords(commodity); setShowClearConfirm(false); }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium shadow-sm"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, valueClass = "text-gray-900" }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
  </div>
);
