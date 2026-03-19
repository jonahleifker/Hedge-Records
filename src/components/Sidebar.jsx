import { UploadCloud, Wheat, FileSpreadsheet, Leaf, LayoutDashboard, LineChart, BarChart3, ChevronDown, Users, Bell, ClipboardList, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { COMMODITIES } from '../utils/constants';
import { useMemo, useState } from 'react';
import { ACCOUNTS } from '../hooks/useHedgeRecords';

const COMMODITY_ICONS = { Wheat, Corn: FileSpreadsheet, Soybeans: Leaf };

function calcNetPosition(records) {
  return (records || []).reduce((net, r) => {
    const size = parseInt(r.sizeInBushels) || 0;
    if (r.tradeType === 'Hedge' || r.tradeType === 'Rolled In') return net + size;
    if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') return net - size;
    return net;
  }, 0);
}

export function Sidebar({ currentTab, setCurrentTab, data, activeAccount, setActiveAccount, userRole, setUserRole }) {
  const [showAccounts, setShowAccounts] = useState(false);

  const netPositions = useMemo(() => {
    if (!data) return {};
    return {
      Wheat: calcNetPosition(data.Wheat),
      Corn: calcNetPosition(data.Corn),
      Soybeans: calcNetPosition(data.Soybeans),
    };
  }, [data]);

  const activeAccountName = ACCOUNTS.find(a => a.id === activeAccount)?.name || 'Select Account';
  const isBroker = userRole === 'broker';

  const navBtn = (id, label, Icon, extra = '') => (
    <button
      onClick={() => setCurrentTab(id)}
      className={clsx(
        'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors',
        extra,
        currentTab === id
          ? 'bg-[#1e3a5f] text-white font-medium shadow-sm border border-[#2a4d7c]'
          : 'text-gray-300 hover:bg-[#152a4f] hover:text-white'
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-64 bg-[#0f1f3d] h-screen flex flex-col text-white flex-shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3 border-b border-[#1e3a5f]">
        <div className="w-8 h-8 rounded-lg bg-[#00c48c] flex items-center justify-center text-[#0f1f3d]">
          <LayoutDashboard size={20} />
        </div>
        <h1 className="text-xl font-semibold tracking-wide">StoneX</h1>
      </div>

      {/* Account Selector */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Account</p>
        <div className="relative">
          <button
            onClick={() => setShowAccounts(v => !v)}
            onBlur={() => setTimeout(() => setShowAccounts(false), 150)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1e3a5f] border border-[#2a4d7c] hover:bg-[#264872] transition-colors text-sm font-medium text-white"
          >
            <span className="truncate">{activeAccountName}</span>
            <ChevronDown size={15} className={`flex-shrink-0 ml-1 transition-transform duration-200 ${showAccounts ? 'rotate-180' : ''}`} />
          </button>
          {showAccounts && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#152a4f] border border-[#2a4d7c] rounded-xl shadow-xl z-30 overflow-hidden">
              {ACCOUNTS.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => { setActiveAccount(acc.id); setShowAccounts(false); }}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
                    acc.id === activeAccount
                      ? 'bg-[#00c48c]/20 text-[#00c48c] font-semibold'
                      : 'text-gray-300 hover:bg-[#1e3a5f] hover:text-white'
                  )}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">Workflow</p>
        <ul className="space-y-1 mb-6">
          <li>{navBtn('Overview', 'Overview', BarChart3)}</li>
          <li>{navBtn('All Accounts', 'All Accounts', Users, 'mt-1')}</li>
          {isBroker && <li>{navBtn('Upload Trades', 'Upload Trades', UploadCloud, 'mt-1')}</li>}
          <li>{navBtn('Futures', 'Futures Market', LineChart, 'mt-1')}</li>
        </ul>

        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">Commodities</p>
        <ul className="space-y-1 mb-6">
          {COMMODITIES.map((com) => {
            const Icon = COMMODITY_ICONS[com];
            const net = netPositions[com];
            const hasData = data && (data[com]?.length > 0);
            return (
              <li key={com}>
                <button
                  onClick={() => setCurrentTab(com)}
                  className={clsx(
                    'w-full flex items-center px-3 py-2.5 rounded-lg transition-colors',
                    currentTab === com
                      ? 'bg-[#1e3a5f] text-white font-medium shadow-sm border border-[#2a4d7c]'
                      : 'text-gray-300 hover:bg-[#152a4f] hover:text-white'
                  )}
                >
                  {Icon && <Icon size={18} className="flex-shrink-0" />}
                  <span className="ml-3 flex-1 text-left">{com}</span>
                  {hasData && (
                    <span className={clsx(
                      'text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
                      net >= 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'
                    )}>
                      {net >= 0 ? '+' : ''}{(net / 1000).toFixed(0)}k
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">Tools</p>
        <ul className="space-y-1">
          <li>{navBtn('Price Alerts', 'Price Alerts', Bell)}</li>
          {isBroker && <li>{navBtn('Audit Log', 'Audit Log', ClipboardList, 'mt-1')}</li>}
        </ul>
      </div>

      {/* Role Toggle + Footer */}
      <div className="p-4 border-t border-[#1e3a5f] space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Shield size={14} className="text-gray-400 flex-shrink-0" />
          <div className="flex-1 flex bg-[#152a4f] rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => setUserRole('broker')}
              className={clsx(
                'flex-1 py-1.5 text-center transition-colors font-medium',
                isBroker ? 'bg-[#00c48c] text-[#0f1f3d]' : 'text-gray-400 hover:text-white'
              )}
            >
              Broker
            </button>
            <button
              onClick={() => setUserRole('client')}
              className={clsx(
                'flex-1 py-1.5 text-center transition-colors font-medium',
                !isBroker ? 'bg-[#00c48c] text-[#0f1f3d]' : 'text-gray-400 hover:text-white'
              )}
            >
              Client
            </button>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg bg-[#152a4f] text-xs text-gray-400 leading-relaxed">
          <p>Logged in as</p>
          <p className="text-white font-medium truncate">{isBroker ? 'Risk Manager' : 'Client Viewer'}</p>
        </div>
      </div>
    </div>
  );
}
