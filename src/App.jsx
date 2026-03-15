import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { useHedgeRecords } from './hooks/useHedgeRecords';
import { UploadTrades } from './components/UploadTrades';
import { CommodityView } from './components/CommodityView';
import { FuturesView } from './components/FuturesView';
import { PortfolioOverview } from './components/PortfolioOverview';

function App() {
  const [currentTab, setCurrentTab] = useState('Overview');
  const { data, isInitializing, addRecords, updateRecord, deleteRecord, clearRecords } = useHedgeRecords();

  const isCommodityTab = ['Wheat', 'Corn', 'Soybeans'].includes(currentTab);

  const handleAddRecord = (record) => {
    addRecords(record.commodity, [record]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9] font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} data={data} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
          <h1 className="text-xl font-medium text-gray-800">
            {currentTab === 'Overview' ? 'Portfolio Overview'
              : currentTab === 'Upload Trades' ? 'Daily Trade Ingestion'
              : `${currentTab} Dashboard`}
          </h1>
          {data?.lastUpdated && (
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              Last Updated: {new Date(data.lastUpdated).toLocaleString()}
            </div>
          )}
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
            <PortfolioOverview data={data} onNavigate={setCurrentTab} />
          ) : currentTab === 'Upload Trades' ? (
            <UploadTrades addRecords={addRecords} />
          ) : currentTab === 'Futures' ? (
            <FuturesView />
          ) : isCommodityTab ? (
            <CommodityView
              commodity={currentTab}
              records={data[currentTab] || []}
              updateRecord={updateRecord}
              deleteRecord={deleteRecord}
              clearRecords={clearRecords}
              addRecords={addRecords}
              onAddRecord={handleAddRecord}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
