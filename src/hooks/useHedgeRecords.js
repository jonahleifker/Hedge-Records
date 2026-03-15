import { useState, useEffect, useCallback } from 'react';
import { CONTRACT_MONTHS } from '../utils/constants';
import { fetchHistoricalData } from '../utils/yahooFinance';

const STORAGE_KEY = 'stonex_hedge_records_v4';

const generateMockTrades = async (commodity, prefix, basePriceFallback) => {
  const trades = [];
  const now = new Date();
  
  let positionByMonth = {};
  const validMonths = CONTRACT_MONTHS[commodity];
  
  let historyMap = new Map();
  try {
    const realHistory = await fetchHistoricalData(commodity, '1mo');
    realHistory.forEach(day => historyMap.set(day.dateStr, day.close));
  } catch {
    // If Yahoo Finance fails, we'll use the fallback price throughout
  }

  for (let i = 0; i < 15; i++) {
    const frontMonth = 'May 26';
    const deferredMonths = validMonths.filter(m => m !== frontMonth);
    
    let month;
    if (Math.random() < 0.25 || deferredMonths.length === 0) {
      month = frontMonth;
    } else {
      month = deferredMonths[Math.floor(Math.random() * deferredMonths.length)];
    }

    const currentPos = positionByMonth[month] || 0;
    
    const date = new Date(now);
    date.setDate(date.getDate() - (30 - (i * 2)));
    
    let type = 'Hedge';
    let size = 0;
    let multipliers = 1;

    if (currentPos === 0) {
      type = (month === frontMonth) ? 'Rolled In' : 'Hedge';
      multipliers = Math.floor(Math.random() * 5) + 1;
      size = multipliers * 5000;
      positionByMonth[month] = currentPos + size;
    } else {
      const isAdding = Math.random() > 0.3;
      if (isAdding) {
        type = (month === frontMonth) ? 'Rolled In' : 'Hedge';
        multipliers = Math.floor(Math.random() * 3) + 1; 
        size = multipliers * 5000;
        positionByMonth[month] = currentPos + size;
      } else {
        type = 'Liquidation';
        const maxMultipliers = currentPos / 5000;
        multipliers = Math.floor(Math.random() * maxMultipliers) + 1;
        size = multipliers * 5000;
        positionByMonth[month] = currentPos - size;
      }
    }

    const dateStrKey = date.toISOString().split('T')[0];
    const realFuturesPrice = historyMap.get(dateStrKey);
    
    let futures;
    if (realFuturesPrice !== undefined) {
      futures = realFuturesPrice;
    } else {
      let rawFutures = basePriceFallback - (Math.random() * 15 + 5); 
      futures = Math.round(rawFutures * 4) / 4;
    }

    let rawBasis = -(Math.random() * 20 + 40); 
    let basis = Math.round(rawBasis * 4) / 4;
    
    let cash = futures + basis;

    trades.push({
      id: crypto.randomUUID(),
      tradeDate: date.toISOString().split('T')[0],
      tradeNumber: `${prefix}-${1000 + i}`,
      tradeType: type,
      cashPrice: cash.toFixed(2),
      futuresPrice: futures.toFixed(2),
      basis: basis.toFixed(2),
      sizeInBushels: size,
      commodity,
      contractMonth: month,
    });
  }
  
  return trades.sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate));
};

export function useHedgeRecords() {
  const [data, setData] = useState(null); // null means not yet loaded
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialization: load from localStorage, or generate once if empty
  useEffect(() => {
    const initializeData = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // If there is ANY stored data, use it — no more legacy migrations
          if (parsed && (parsed.Wheat || parsed.Corn || parsed.Soybeans)) {
            console.log('Restoring data from localStorage.');
            setData(parsed);
            setIsInitializing(false);
            return;
          }
        }

        // Only reaches here on a truly fresh install
        console.log('First run — generating initial mock data from Yahoo Finance...');
        const [wheatData, cornData, soyData] = await Promise.all([
          generateMockTrades('Wheat', 'WH', 625.00),
          generateMockTrades('Corn', 'CN', 480.00),
          generateMockTrades('Soybeans', 'SY', 1150.00)
        ]);

        const newData = {
          Wheat: wheatData,
          Corn: cornData,
          Soybeans: soyData,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        setData(newData);
      } catch (e) {
        console.error('Failed to init datastore:', e);
        // Fall back to empty state so the app still loads
        setData({ Wheat: [], Corn: [], Soybeans: [], lastUpdated: null });
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeData();
  }, []);

  // Persist any changes to localStorage any time data changes (but not on initial null state)
  useEffect(() => {
    if (data === null) return; // Don't overwrite storage before we've loaded
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data]);


  const addRecords = useCallback((commodity, newRecords) => {
    setData((prev) => {
      const existing = prev[commodity] || [];
      return {
        ...prev,
        [commodity]: [...existing, ...newRecords].sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const updateRecord = useCallback((commodity, recordId, updatedFields) => {
    setData((prev) => {
      const records = prev[commodity] || [];
      const index = records.findIndex((r) => r.id === recordId);
      if (index === -1) return prev;

      const record = records[index];
      let newRecord = { ...record, ...updatedFields };

      // Ensure that if user edits size, they can input a positive or negative based on preference,
      // but standard is positive. We'll leave the math as is.
      if (updatedFields.sizeInBushels !== undefined) {
         newRecord.sizeInBushels = updatedFields.sizeInBushels;
      }

      // Auto-recalculate basis if cash/futures change and basis wasn't manually overridden during this update
      if (updatedFields.cashPrice !== undefined || updatedFields.futuresPrice !== undefined) {
        if (updatedFields.basis === undefined && newRecord.cashPrice && newRecord.futuresPrice) {
          const cp = parseFloat(newRecord.cashPrice);
          const fp = parseFloat(newRecord.futuresPrice);
          if (!isNaN(cp) && !isNaN(fp)) {
            newRecord.basis = (cp - fp).toFixed(2); // Format: 2 decimals in cents
          }
        }
      }

      const newRecords = [...records];
      newRecords[index] = newRecord;

      return {
        ...prev,
        [commodity]: newRecords,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const deleteRecord = useCallback((commodity, recordId) => {
    setData((prev) => {
      const records = prev[commodity] || [];
      return {
        ...prev,
        [commodity]: records.filter((r) => r.id !== recordId),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const clearRecords = useCallback((commodity) => {
    setData((prev) => ({
      ...prev,
      [commodity]: [],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  return {
    data,
    isInitializing,
    addRecords,
    updateRecord,
    deleteRecord,
    clearRecords,
  };
}
