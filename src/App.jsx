import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { useHedgeRecords, ACCOUNTS } from './hooks/useHedgeRecords';
import { UploadTrades } from './components/UploadTrades';
import { CommodityView } from './components/CommodityView';
import { FuturesView } from './components/FuturesView';
import { PortfolioOverview } from './components/PortfolioOverview';
import { MultiClientView } from './components/MultiClientView';
import { PriceAlerts } from './components/PriceAlerts';
import { AuditLog } from './components/AuditLog';

function App() {
  const [currentTab, setCurrentTab] = useState('Overview');
  const [activeAccount, setActiveAccount] = useState(ACCOUNTS[0].id);
  const [userRole, setUserRole] = useState(() => {
    try { return localStorage.getItem('stonex_user_role') || 'broker'; } catch { return 'broker'; }
  });

  const { data, isInitializing, addRecords, updateRecord, deleteRecord, clearRecords } = useHedgeRecords(activeAccount);

  const isCommodityTab = ['Wheat', 'Corn', 'Soybeans'].includes(currentTab);
  const isBroker = userRole === 'broker';

  const handleAddRecord = (record) => {
    addRecords(record.commodity, [record]);
  };

  const handleSetAccount = (id) => {
    setActiveAccount(id);
    setCurrentTab('Overview');
  };

  const handleSetRole = (role) => {
    setUserRole(role);
    try { localStorage.setItem('stonex_user_role', role); } catch { /* ignore */ }
  };

  const accountName = ACCOUNTS.find(a => a.id === activeAccount)?.name || '';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9] font-sans">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        data={data}
        activeAccount={activeAccount}
        setActiveAccount={handleSetAccount}
        userRole={userRole}
        setUserRole={handleSetRole}
      />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
          <h1 className="text-xl font-medium text-gray-800">
            {currentTab === 'Overview' ? 'Portfolio Overview'
              : currentTab === 'Upload Trades' ? 'Daily Trade Ingestion'
              : currentTab === 'Futures' ? 'Futures Dashboard'
              : currentTab === 'All Accounts' ? 'All Accounts'
              : currentTab === 'Price Alerts' ? 'Price Alerts'
              : currentTab === 'Audit Log' ? 'Audit Log'
              : `${currentTab} Dashboard`}
          </h1>
          <div className="flex items-center gap-3">
            <div className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
              isBroker ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-gray-500 bg-gray-100 border-gray-200'
            }`}>
              {isBroker ? '🔑 Broker' : '👁 Client View'}
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 font-medium">
              {accountName}
            </div>
            {data?.lastUpdated && (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                Last Updated: {new Date(data.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </header>

        <div className="h-[calc(100vh-4rem)]">
          {isInitializing || data === null ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#0f1f3d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading trade data...</p>
              </div>
            </div>
          ) : currentTab === 'Overview' ? (
            <PortfolioOverview data={data} onNavigate={setCurrentTab} accountName={accountName} />
          ) : currentTab === 'All Accounts' ? (
            <MultiClientView onNavigateAccount={(id) => { handleSetAccount(id); setCurrentTab('Overview'); }} />
          ) : currentTab === 'Upload Trades' ? (
            isBroker ? <UploadTrades addRecords={addRecords} /> : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Upload is restricted to Broker role.</p>
              </div>
            )
          ) : currentTab === 'Futures' ? (
            <FuturesView />
          ) : currentTab === 'Price Alerts' ? (
            <PriceAlerts />
          ) : currentTab === 'Audit Log' ? (
            <AuditLog accountId={activeAccount} />
          ) : isCommodityTab ? (
            <CommodityView
              commodity={currentTab}
              records={data[currentTab] || []}
              updateRecord={isBroker ? updateRecord : undefined}
              deleteRecord={isBroker ? deleteRecord : undefined}
              clearRecords={isBroker ? clearRecords : undefined}
              addRecords={addRecords}
              onAddRecord={isBroker ? handleAddRecord : undefined}
              isBroker={isBroker}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
