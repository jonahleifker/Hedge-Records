import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { fetchHistoricalData } from '../utils/yahooFinance';
import { COMMODITIES } from '../utils/constants';
import { Activity } from 'lucide-react';

const TIME_RANGES = [
  { id: '1mo', label: '1M' },
  { id: '3mo', label: '3M' },
  { id: '6mo', label: '6M' },
  { id: '1y', label: '1Y' },
];

export function FuturesView() {
  const [activeCommodity, setActiveCommodity] = useState('Wheat');
  const [activeRange, setActiveRange] = useState('3mo');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchHistoricalData(activeCommodity, activeRange);
        if (!mounted) return;
        
        if (data && data.length > 0) {
          setChartData(data);
        } else {
          setError('Failed to load market data or market is currently closed.');
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => { mounted = false; };
  }, [activeCommodity, activeRange]);

  // Derived Statistics for Header
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const percentChange = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Chart configuration for ApexCharts Candlestick
  const options = {
    chart: {
      type: 'candlestick',
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: false // Better UX on candlesticks when switching dataloads instantly
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#00c48c',
          downward: '#ff4d4f'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    xaxis: {
      type: 'datetime', // Revert to datetime so tickAmount and overlap calculation work natively
      tickPlacement: 'on',
      tickAmount: 6, // Apex will grab ~6 evenly spaced timestamps across the data
      labels: {
        style: { colors: '#6B7280' },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM', // Just the short month block 'Jan', 'Feb' etc.
          day: 'MMM dd', 
          hour: 'HH:mm'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { colors: '#6B7280' },
        formatter: (value) => value.toFixed(2)
      }
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: 'light',
      style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' },
      y: { formatter: (val) => val.toFixed(2) + " ¢" }
    }
  };

  const series = [{
    name: activeCommodity,
    data: chartData
  }];

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="mr-3 text-[#0f1f3d]" size={24} />
            Global Futures Market
          </h2>
          <p className="text-gray-500 text-sm mt-1">Real-time Historical Settlements (Yahoo Finance)</p>
        </div>
      </div>

      {/* Commodity Selector */}
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
        {COMMODITIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveCommodity(c)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors border shadow-sm flex-shrink-0 ${
              activeCommodity === c 
                ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          {TIME_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => setActiveRange(range.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeRange === range.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Header & Chart Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col flex-1 min-h-[550px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f1f3d]"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#ff4d4f]">
            <p className="font-medium text-lg mb-2">Notice</p>
            <p className="text-gray-600 max-w-md text-center">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-500">{activeCommodity} (Front Month)</h3>
              <div className="flex items-end mt-1">
                <span className="text-4xl font-bold text-gray-900">{currentPrice.toFixed(2)}</span>
                <span className="text-gray-500 ml-2 mb-1">¢/bu</span>
                
                  {Math.abs(priceChange) > 0.001 ? (
                    <div className={`ml-4 mb-1 flex items-center font-medium ${isPositive ? 'text-[#00c48c]' : 'text-[#ff4d4f]'}`}>
                      {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
                    </div>
                  ) : (
                    <span className="ml-4 mb-1 text-sm text-gray-400">Previous Close</span>
                  )}
              </div>
            </div>

            {/* ApexCharts Area */}
            <div className="flex-1 w-full relative min-h-[400px]">
              <Chart 
                options={options} 
                series={series} 
                type="candlestick" 
                height="100%" 
                width="100%" 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
