import { UploadCloud, Wheat, FileSpreadsheet, Leaf, LayoutDashboard, LineChart, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { COMMODITIES } from '../utils/constants';
import { useMemo } from 'react';

const COMMODITY_ICONS = { Wheat, Corn: FileSpreadsheet, Soybeans: Leaf };

function calcNetPosition(records) {
  return (records || []).reduce((net, r) => {
    const size = parseInt(r.sizeInBushels) || 0;
    if (r.tradeType === 'Hedge' || r.tradeType === 'Rolled In') return net + size;
    if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') return net - size;
    return net;
  }, 0);
}

export function Sidebar({ currentTab, setCurrentTab, data }) {
  const netPositions = useMemo(() => {
    if (!data) return {};
    return {
      Wheat: calcNetPosition(data.Wheat),
      Corn: calcNetPosition(data.Corn),
      Soybeans: calcNetPosition(data.Soybeans),
    };
  }, [data]);

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
      <div className="p-6 flex items-center space-x-3 border-b border-[#1e3a5f]">
        <div className="w-8 h-8 rounded-lg bg-[#00c48c] flex items-center justify-center text-[#0f1f3d]">
          <LayoutDashboard size={20} />
        </div>
        <h1 className="text-xl font-semibold tracking-wide">StoneX</h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">Workflow</p>
        <ul className="space-y-1 mb-6">
          <li>{navBtn('Overview', 'Overview', BarChart3)}</li>
          <li>{navBtn('Upload Trades', 'Upload Trades', UploadCloud, 'mt-1')}</li>
          <li>{navBtn('Futures', 'Futures Market', LineChart, 'mt-1')}</li>
        </ul>

        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 px-3">Commodities</p>
        <ul className="space-y-1">
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
      </div>

      <div className="p-4 border-t border-[#1e3a5f]">
        <div className="px-3 py-2 rounded-lg bg-[#152a4f] text-xs text-gray-400 leading-relaxed">
          <p>Logged in as</p>
          <p className="text-white font-medium truncate">Risk Manager</p>
        </div>
      </div>
    </div>
  );
}
