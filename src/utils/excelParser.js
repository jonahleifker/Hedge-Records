import * as XLSX from 'xlsx';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Assume the first sheet is the one we want
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert exactly to an array of objects
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Extract original headers directly from the first row of json keys if length > 0
        const headers = json.length > 0 ? Object.keys(json[0]) : [];

        resolve({ headers, rows: json });
      } catch {
        reject(new Error('Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading the file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const EXPECTED_FIELDS = [
  { key: 'tradeDate', label: 'Trade Date (MM/DD/YYYY)' },
  { key: 'tradeNumber', label: 'Trade Number' },
  { key: 'tradeType', label: 'Trade Type' },
  { key: 'contractMonth', label: 'Contract Month' },
  { key: 'cashPrice', label: 'Cash Price' },
  { key: 'futuresPrice', label: 'Futures Price' },
  { key: 'basis', label: 'Basis' },
  { key: 'sizeInBushels', label: 'Size (Bushels)' },
  { key: 'commodity', label: 'Commodity (Optional)' },
];

import { CONTRACT_MONTHS } from './constants';

export const validateRow = (row) => {
  const errors = {};

  // Date validation
  if (!row.tradeDate) {
    errors.tradeDate = 'Required';
  } else {
    // Basic date parsing check
    const d = new Date(row.tradeDate);
    if (isNaN(d.getTime())) {
      errors.tradeDate = 'Invalid Date';
    }
  }

  // Decimals & 0.25 Increments
  const decimalFields = ['cashPrice', 'futuresPrice', 'basis'];
  decimalFields.forEach((field) => {
    if (row[field] !== undefined && row[field] !== '') {
      const val = parseFloat(row[field]);
      if (isNaN(val)) {
        errors[field] = 'Must be a number';
      } else if (Math.abs((val * 4) % 1) > 0.0001) {
        errors[field] = 'Must be in 0.25 increments';
      }
    }
  });

  // Integer and 5000 mult
  const parsedSize = parseInt(row.sizeInBushels);
  if (!row.sizeInBushels || isNaN(parsedSize) || parsedSize <= 0) {
    errors.sizeInBushels = 'Must be a positive integer';
  } else if (parsedSize % 5000 !== 0) {
    errors.sizeInBushels = 'Must be in increments of 5,000';
  }

  // Contract Month Format check
  if (row.commodity && row.contractMonth) {
    const validMonths = CONTRACT_MONTHS[row.commodity];
    if (validMonths && !validMonths.includes(row.contractMonth)) {
      errors.contractMonth = 'Invalid month for commodity';
    }
  } else if (!row.contractMonth) {
    errors.contractMonth = 'Required';
  }

  // Trade Type (Enum: "Hedge" | "Liquidation" | "Rolled In" | "Rolled Out")
  if (row.tradeType) {
    let tType = row.tradeType;
    if (tType === 'Rolled') tType = 'Rolled Out'; // Legacy translation

    const validTypes = ['Hedge', 'Liquidation', 'Rolled In', 'Rolled Out'];
    if (!validTypes.includes(tType)) {
      errors.tradeType = 'Invalid Type';
    } else {
      row.tradeType = tType; // Lock back in correctly
    }
  } else {
    errors.tradeType = 'Required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
