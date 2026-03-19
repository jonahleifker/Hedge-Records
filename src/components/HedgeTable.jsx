import React, { useState, useMemo } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Edit2, Check, X, ArrowDown, ArrowUp, MessageSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { TRADE_TYPE_COLORS, TRADE_TYPES, CONTRACT_MONTHS } from '../utils/constants';
import { generateTradeConfirmation } from '../utils/tradeConfirmation';

export function HedgeTable({ records, commodity, updateRecord, deleteRecord, livePrice }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'tradeDate', direction: 'desc' });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  // Sorting
  const sortedRecords = useMemo(() => {
    let sortable = [...records];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'tradeDate') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        } else if (['cashPrice', 'futuresPrice', 'basis', 'sizeInBushels'].includes(sortConfig.key)) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [records, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / rowsPerPage) || 1;
  const currentRecords = sortedRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const startEdit = (id, field, value) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (editingCell) {
      updateRecord(commodity, editingCell.id, { [editingCell.field]: editValue });
    }
    cancelEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const toggleNotes = (id) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const columns = [
    { key: 'tradeDate', label: 'Trade Date' },
    { key: 'tradeNumber', label: 'Trade Number' },
    { key: 'contractMonth', label: 'Contract Month' },
    { key: 'tradeType', label: 'Type' },
    { key: 'cashPrice', label: 'Cash Price', align: 'right' },
    { key: 'futuresPrice', label: 'Futures Price', align: 'right' },
    { key: 'basis', label: 'Basis', align: 'right' },
    { key: 'sizeInBushels', label: 'Size (Bu)', align: 'right' },
    { key: 'revenue', label: 'Rev / P&L', align: 'right' },
    { key: 'mtm', label: 'MTM', align: 'right' },
  ];

  const EditableCell = ({ record, field, align = 'left', isEnum = false }) => {
    const isEditing = editingCell?.id === record.id && editingCell?.field === field;
    
    if (isEditing) {
      if (isEnum || field === 'contractMonth') {
        const options = isEnum ? TRADE_TYPES : (CONTRACT_MONTHS[commodity] || []);
        return (
          <select
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      return (
        <input
          autoFocus
          type={field === 'tradeDate' ? 'date' : field.includes('Price') || field === 'basis' || field === 'sizeInBushels' ? 'number' : 'text'}
          step={field === 'sizeInBushels' ? '5000' : field.includes('Price') || field === 'basis' ? '0.25' : '1'}
          value={editValue}
          onChange={(e) => {
            let val = e.target.value;
            if (field === 'sizeInBushels' && val.startsWith('-')) {
               val = val.replace('-', '');
            }
            setEditValue(val);
          }}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full px-2 py-1 text-sm border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-500/20",
            align === 'right' && "text-right"
          )}
        />
      );
    }

    // Computed: Revenue (Realized P&L)
    if (field === 'revenue') {
      if (record.tradeType === 'Liquidation') {
        const sell = parseFloat(record.sellPrice);
        const buy = parseFloat(record.futuresPrice);
        const size = parseInt(record.sizeInBushels) || 0;
        if (!isNaN(sell) && !isNaN(buy)) {
          const rev = ((sell - buy) / 100) * Math.abs(size);
          const isPos = rev >= 0;
          const sign = rev < 0 ? '-' : '+';
          const formatted = `${sign}$${Math.abs(rev).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          return (
            <div className={clsx("flex items-center min-h-[24px] rounded px-1 -mx-1 justify-end font-medium", isPos ? "text-emerald-600" : "text-red-500")}>
              {formatted}
            </div>
          );
        }
      }
      return <div className="text-gray-300 italic flex items-center min-h-[24px] rounded px-1 -mx-1 justify-end">--</div>;
    }

    // Computed: MTM (Unrealized, for open Hedge/Rolled In positions)
    if (field === 'mtm') {
      if ((record.tradeType === 'Hedge' || record.tradeType === 'Rolled In') && livePrice !== null && livePrice !== undefined) {
        const fp = parseFloat(record.futuresPrice);
        const size = parseInt(record.sizeInBushels) || 0;
        if (!isNaN(fp) && size > 0) {
          const mtm = ((livePrice - fp) / 100) * size;
          const isPos = mtm >= 0;
          const sign = mtm < 0 ? '-' : '+';
          const formatted = `${sign}$${Math.abs(mtm).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          return (
            <div className={clsx("flex items-center min-h-[24px] rounded px-1 -mx-1 justify-end font-medium text-xs", isPos ? "text-blue-600" : "text-orange-500")}>
              {formatted}
            </div>
          );
        }
      }
      return <div className="text-gray-300 italic flex items-center min-h-[24px] rounded px-1 -mx-1 justify-end text-xs">--</div>;
    }

    let displayValue = record[field];
    if (field === 'tradeDate' && displayValue) {
      try { displayValue = format(new Date(displayValue), 'MM/dd/yyyy'); } catch { /* ignore */ }
    } else if (field === 'sizeInBushels' && displayValue) {
      let sizeNum = parseInt(displayValue);
      if (record.tradeType === 'Liquidation' || record.tradeType === 'Rolled Out') {
        sizeNum = -Math.abs(sizeNum);
      }
      displayValue = sizeNum.toLocaleString();
    } else if (field.includes('Price') || field === 'basis') {
      if (displayValue !== '' && displayValue !== undefined && displayValue !== null) {
        displayValue = parseFloat(displayValue).toFixed(2);
      }
    }

    // Badge styling for tradeType
    if (field === 'tradeType') {
      const badgeClass = TRADE_TYPE_COLORS[displayValue] || 'text-gray-700 bg-gray-100 border-gray-200';
      return (
        <div 
          onClick={() => startEdit(record.id, field, record[field])}
          className="cursor-pointer group flex items-center"
        >
          <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium border", badgeClass)}>
            {displayValue}
          </span>
          <Edit2 size={12} className="ml-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }

    return (
      <div 
        onClick={() => startEdit(record.id, field, record[field])}
        className={clsx(
          "cursor-pointer group flex items-center min-h-[24px] rounded px-1 -mx-1 hover:bg-gray-50",
          align === 'right' && "justify-end",
          (!displayValue && displayValue !== 0) && "text-gray-300 italic"
        )}
      >
        <span>{displayValue !== '' && displayValue !== undefined && displayValue !== null ? displayValue : 'empty'}</span>
        <Edit2 size={12} className={clsx("text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0", align === 'right' ? 'ml-2' : 'ml-2')} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={clsx(
                    "px-4 py-3 cursor-pointer hover:bg-gray-100 select-none",
                    col.align === 'right' && "text-right"
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="flex items-center inline-flex">
                    {col.label}
                    {sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentRecords.map(row => (
              <React.Fragment key={row.id}>
                <tr className="hover:bg-gray-50 group">
                  {columns.map(col => (
                    <td key={col.key} className={clsx("px-4 py-2.5", col.align === 'right' && "text-right")}>
                      <EditableCell 
                        record={row} 
                        field={col.key} 
                        align={col.align} 
                        isEnum={col.key === 'tradeType'}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleNotes(row.id)}
                        className={clsx(
                          "transition-colors p-1 rounded",
                          expandedNotes.has(row.id) ? "text-blue-500" : "text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100",
                          row.notes ? "opacity-100 text-blue-400" : ""
                        )}
                        title="Notes"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button
                        onClick={() => generateTradeConfirmation(row, commodity)}
                        className="text-gray-400 hover:text-indigo-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Generate Confirmation"
                      >
                        <FileText size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(row.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Delete Row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expandable Notes Row */}
                {expandedNotes.has(row.id) && (
                  <tr key={`${row.id}-notes`} className="bg-blue-50/30">
                    <td colSpan={columns.length + 1} className="px-6 py-2">
                      <div className="flex items-start gap-3">
                        <MessageSquare size={14} className="text-blue-400 mt-1 flex-shrink-0" />
                        <textarea
                          value={row.notes || ''}
                          onChange={(e) => updateRecord(commodity, row.id, { notes: e.target.value })}
                          placeholder="Add notes about this trade..."
                          rows={2}
                          className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {currentRecords.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-500">
                  No records match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between mt-auto">
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-3">Rows per page:</span>
          <select 
            value={rowsPerPage} 
            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded pt-0.5 pb-0.5 px-2 text-gray-700 outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {currentRecords.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, sortedRecords.length)} of {sortedRecords.length} records
        </div>

        <div className="flex items-center space-x-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Delete Row Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Record?</h3>
            <p className="text-gray-600 mb-6 text-sm">Are you sure you want to delete this row? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteRecord(commodity, deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium shadow-sm"
              >
                Delete Row
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
