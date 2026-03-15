export const COMMODITIES = ['Wheat', 'Corn', 'Soybeans'];

export const TRADE_TYPES = ['Hedge', 'Liquidation', 'Rolled In', 'Rolled Out'];

export const TRADE_TYPE_COLORS = {
  'Hedge': 'text-blue-700 bg-blue-100 border-blue-200',
  'Liquidation': 'text-red-700 bg-red-100 border-red-200',
  'Rolled In': 'text-emerald-700 bg-emerald-100 border-emerald-200',
  'Rolled Out': 'text-amber-700 bg-amber-100 border-amber-200', 
};

export const DEFAULT_TRADE_RECORD = {
  id: '',
  tradeDate: '',     // MM/DD/YYYY
  tradeNumber: '',
  tradeType: 'Hedge',
  cashPrice: '',
  futuresPrice: '',
  basis: '',
  sizeInBushels: 0,
  commodity: 'Wheat',
  contractMonth: '',
};

export const CONTRACT_MONTHS = {
  'Wheat': ['May 26', 'Jul 26', 'Sep 26', 'Dec 26'],
  'Corn': ['May 26', 'Jul 26', 'Sep 26', 'Dec 26'],
  'Soybeans': ['May 26', 'Jul 26', 'Sep 26', 'Nov 26'],
};
