import { useState, useEffect, useCallback } from 'react';
import { appendAuditEntry } from '../components/AuditLog';

export const ACCOUNTS = [
  { id: 'alpha', name: 'Alpha Grains' },
  { id: 'beta',  name: 'Beta Farms' },
  { id: 'gamma', name: 'Gamma Ag' },
  { id: 'delta', name: 'Delta Coop' },
];

const storageKey = (accountId) => `stonex_hedge_records_v6_${accountId}`;

// sellPrice on Liquidation records = exit futures price (for PNL calc)
const SEED_DATA = {
  alpha: {
    Wheat: [
      { id: 'a-wh-001', tradeDate: '2026-02-28', tradeNumber: 'WH-1000', tradeType: 'Hedge',       cashPrice: '572.50', futuresPrice: '615.75', basis: '-43.25', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'a-wh-002', tradeDate: '2026-02-26', tradeNumber: 'WH-1001', tradeType: 'Hedge',       cashPrice: '569.00', futuresPrice: '612.25', basis: '-43.25', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'a-wh-003', tradeDate: '2026-02-24', tradeNumber: 'WH-1002', tradeType: 'Rolled In',   cashPrice: '571.25', futuresPrice: '614.50', basis: '-43.25', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'a-wh-004', tradeDate: '2026-02-20', tradeNumber: 'WH-1003', tradeType: 'Hedge',       cashPrice: '565.75', futuresPrice: '609.00', basis: '-43.25', sizeInBushels: 25000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'a-wh-005', tradeDate: '2026-02-18', tradeNumber: 'WH-1004', tradeType: 'Hedge',       cashPrice: '562.50', futuresPrice: '606.25', basis: '-43.75', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'a-wh-006', tradeDate: '2026-02-14', tradeNumber: 'WH-1005', tradeType: 'Liquidation', cashPrice: '574.00', futuresPrice: '609.00', basis: '-43.75', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Jul 26', sellPrice: '628.50' },
      { id: 'a-wh-007', tradeDate: '2026-02-12', tradeNumber: 'WH-1006', tradeType: 'Hedge',       cashPrice: '558.25', futuresPrice: '602.00', basis: '-43.75', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'a-wh-008', tradeDate: '2026-02-10', tradeNumber: 'WH-1007', tradeType: 'Hedge',       cashPrice: '555.00', futuresPrice: '599.25', basis: '-44.25', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'a-wh-009', tradeDate: '2026-02-06', tradeNumber: 'WH-1008', tradeType: 'Hedge',       cashPrice: '550.75', futuresPrice: '595.25', basis: '-44.50', sizeInBushels: 30000, commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'a-wh-010', tradeDate: '2026-02-04', tradeNumber: 'WH-1009', tradeType: 'Liquidation', cashPrice: '563.50', futuresPrice: '595.25', basis: '-44.25', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Dec 26', sellPrice: '611.00' },
      { id: 'a-wh-011', tradeDate: '2026-02-02', tradeNumber: 'WH-1010', tradeType: 'Hedge',       cashPrice: '548.00', futuresPrice: '592.50', basis: '-44.50', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'a-wh-012', tradeDate: '2026-01-30', tradeNumber: 'WH-1011', tradeType: 'Rolled In',   cashPrice: '560.25', futuresPrice: '604.50', basis: '-44.25', sizeInBushels: 5000,  commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'a-wh-013', tradeDate: '2026-01-28', tradeNumber: 'WH-1012', tradeType: 'Hedge',       cashPrice: '544.75', futuresPrice: '589.00', basis: '-44.25', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'a-wh-014', tradeDate: '2026-01-26', tradeNumber: 'WH-1013', tradeType: 'Hedge',       cashPrice: '541.50', futuresPrice: '586.25', basis: '-44.75', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'a-wh-015', tradeDate: '2026-01-22', tradeNumber: 'WH-1014', tradeType: 'Liquidation', cashPrice: '556.75', futuresPrice: '599.25', basis: '-44.75', sizeInBushels: 5000,  commodity: 'Wheat', contractMonth: 'Sep 26', sellPrice: '618.50' },
    ],
    Corn: [
      { id: 'a-cn-001', tradeDate: '2026-02-28', tradeNumber: 'CN-1000', tradeType: 'Hedge',       cashPrice: '431.75', futuresPrice: '475.00', basis: '-43.25', sizeInBushels: 25000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'a-cn-002', tradeDate: '2026-02-26', tradeNumber: 'CN-1001', tradeType: 'Hedge',       cashPrice: '429.50', futuresPrice: '473.00', basis: '-43.50', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'a-cn-003', tradeDate: '2026-02-24', tradeNumber: 'CN-1002', tradeType: 'Rolled In',   cashPrice: '432.25', futuresPrice: '476.00', basis: '-43.75', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'a-cn-004', tradeDate: '2026-02-20', tradeNumber: 'CN-1003', tradeType: 'Hedge',       cashPrice: '425.00', futuresPrice: '469.00', basis: '-44.00', sizeInBushels: 30000, commodity: 'Corn', contractMonth: 'Jul 26' },
      { id: 'a-cn-005', tradeDate: '2026-02-18', tradeNumber: 'CN-1004', tradeType: 'Liquidation', cashPrice: '437.50', futuresPrice: '469.00', basis: '-44.25', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'Jul 26', sellPrice: '488.25' },
      { id: 'a-cn-006', tradeDate: '2026-02-14', tradeNumber: 'CN-1005', tradeType: 'Hedge',       cashPrice: '421.75', futuresPrice: '466.00', basis: '-44.25', sizeInBushels: 15000, commodity: 'Corn', contractMonth: 'Jul 26' },
      { id: 'a-cn-007', tradeDate: '2026-02-12', tradeNumber: 'CN-1006', tradeType: 'Hedge',       cashPrice: '418.50', futuresPrice: '462.75', basis: '-44.25', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'Sep 26' },
      { id: 'a-cn-008', tradeDate: '2026-02-10', tradeNumber: 'CN-1007', tradeType: 'Hedge',       cashPrice: '415.25', futuresPrice: '459.75', basis: '-44.50', sizeInBushels: 25000, commodity: 'Corn', contractMonth: 'Sep 26' },
      { id: 'a-cn-009', tradeDate: '2026-02-06', tradeNumber: 'CN-1008', tradeType: 'Liquidation', cashPrice: '428.00', futuresPrice: '459.75', basis: '-44.50', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'Sep 26', sellPrice: '471.00' },
      { id: 'a-cn-010', tradeDate: '2026-02-04', tradeNumber: 'CN-1009', tradeType: 'Hedge',       cashPrice: '412.00', futuresPrice: '456.75', basis: '-44.75', sizeInBushels: 30000, commodity: 'Corn', contractMonth: 'Dec 26' },
      { id: 'a-cn-011', tradeDate: '2026-02-02', tradeNumber: 'CN-1010', tradeType: 'Hedge',       cashPrice: '409.75', futuresPrice: '454.50', basis: '-44.75', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'Dec 26' },
      { id: 'a-cn-012', tradeDate: '2026-01-30', tradeNumber: 'CN-1011', tradeType: 'Rolled In',   cashPrice: '422.25', futuresPrice: '467.00', basis: '-44.75', sizeInBushels: 5000,  commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'a-cn-013', tradeDate: '2026-01-28', tradeNumber: 'CN-1012', tradeType: 'Hedge',       cashPrice: '406.50', futuresPrice: '451.25', basis: '-44.75', sizeInBushels: 15000, commodity: 'Corn', contractMonth: 'Jul 26' },
      { id: 'a-cn-014', tradeDate: '2026-01-26', tradeNumber: 'CN-1013', tradeType: 'Liquidation', cashPrice: '419.00', futuresPrice: '456.75', basis: '-45.00', sizeInBushels: 5000,  commodity: 'Corn', contractMonth: 'Dec 26', sellPrice: '462.00' },
      { id: 'a-cn-015', tradeDate: '2026-01-22', tradeNumber: 'CN-1014', tradeType: 'Hedge',       cashPrice: '403.25', futuresPrice: '448.25', basis: '-45.00', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'Dec 26' },
    ],
    Soybeans: [
      { id: 'a-sy-001', tradeDate: '2026-02-28', tradeNumber: 'SY-1000', tradeType: 'Hedge',       cashPrice: '1097.50', futuresPrice: '1142.75', basis: '-45.25', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'a-sy-002', tradeDate: '2026-02-26', tradeNumber: 'SY-1001', tradeType: 'Hedge',       cashPrice: '1093.25', futuresPrice: '1138.50', basis: '-45.25', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'a-sy-003', tradeDate: '2026-02-24', tradeNumber: 'SY-1002', tradeType: 'Rolled In',   cashPrice: '1100.00', futuresPrice: '1145.25', basis: '-45.25', sizeInBushels: 5000,  commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'a-sy-004', tradeDate: '2026-02-20', tradeNumber: 'SY-1003', tradeType: 'Hedge',       cashPrice: '1088.75', futuresPrice: '1134.00', basis: '-45.25', sizeInBushels: 20000, commodity: 'Soybeans', contractMonth: 'Jul 26' },
      { id: 'a-sy-005', tradeDate: '2026-02-18', tradeNumber: 'SY-1004', tradeType: 'Liquidation', cashPrice: '1104.50', futuresPrice: '1134.00', basis: '-45.50', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Jul 26', sellPrice: '1162.25' },
      { id: 'a-sy-006', tradeDate: '2026-02-14', tradeNumber: 'SY-1005', tradeType: 'Hedge',       cashPrice: '1084.25', futuresPrice: '1129.75', basis: '-45.50', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'Jul 26' },
      { id: 'a-sy-007', tradeDate: '2026-02-12', tradeNumber: 'SY-1006', tradeType: 'Hedge',       cashPrice: '1080.00', futuresPrice: '1125.50', basis: '-45.50', sizeInBushels: 20000, commodity: 'Soybeans', contractMonth: 'Sep 26' },
      { id: 'a-sy-008', tradeDate: '2026-02-10', tradeNumber: 'SY-1007', tradeType: 'Hedge',       cashPrice: '1075.75', futuresPrice: '1121.25', basis: '-45.50', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Sep 26' },
      { id: 'a-sy-009', tradeDate: '2026-02-06', tradeNumber: 'SY-1008', tradeType: 'Liquidation', cashPrice: '1090.50', futuresPrice: '1125.50', basis: '-45.50', sizeInBushels: 5000,  commodity: 'Soybeans', contractMonth: 'Sep 26', sellPrice: '1148.00' },
      { id: 'a-sy-010', tradeDate: '2026-02-04', tradeNumber: 'SY-1009', tradeType: 'Hedge',       cashPrice: '1071.50', futuresPrice: '1117.25', basis: '-45.75', sizeInBushels: 25000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
      { id: 'a-sy-011', tradeDate: '2026-02-02', tradeNumber: 'SY-1010', tradeType: 'Hedge',       cashPrice: '1067.25', futuresPrice: '1113.00', basis: '-45.75', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
      { id: 'a-sy-012', tradeDate: '2026-01-30', tradeNumber: 'SY-1011', tradeType: 'Rolled In',   cashPrice: '1083.00', futuresPrice: '1128.75', basis: '-45.75', sizeInBushels: 5000,  commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'a-sy-013', tradeDate: '2026-01-28', tradeNumber: 'SY-1012', tradeType: 'Hedge',       cashPrice: '1063.00', futuresPrice: '1108.75', basis: '-45.75', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Jul 26' },
      { id: 'a-sy-014', tradeDate: '2026-01-26', tradeNumber: 'SY-1013', tradeType: 'Liquidation', cashPrice: '1078.75', futuresPrice: '1117.25', basis: '-45.75', sizeInBushels: 5000,  commodity: 'Soybeans', contractMonth: 'Nov 26', sellPrice: '1139.50' },
      { id: 'a-sy-015', tradeDate: '2026-01-22', tradeNumber: 'SY-1014', tradeType: 'Hedge',       cashPrice: '1058.75', futuresPrice: '1104.50', basis: '-45.75', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
    ],
  },
  beta: {
    Wheat: [
      { id: 'b-wh-001', tradeDate: '2026-02-25', tradeNumber: 'WH-2000', tradeType: 'Hedge',       cashPrice: '580.00', futuresPrice: '623.50', basis: '-43.50', sizeInBushels: 30000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'b-wh-002', tradeDate: '2026-02-22', tradeNumber: 'WH-2001', tradeType: 'Liquidation', cashPrice: '592.75', futuresPrice: '623.50', basis: '-43.50', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'May 26', sellPrice: '641.00' },
      { id: 'b-wh-003', tradeDate: '2026-02-19', tradeNumber: 'WH-2002', tradeType: 'Hedge',       cashPrice: '576.25', futuresPrice: '619.75', basis: '-43.50', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'b-wh-004', tradeDate: '2026-02-16', tradeNumber: 'WH-2003', tradeType: 'Hedge',       cashPrice: '572.00', futuresPrice: '615.25', basis: '-43.25', sizeInBushels: 25000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'b-wh-005', tradeDate: '2026-02-13', tradeNumber: 'WH-2004', tradeType: 'Liquidation', cashPrice: '585.50', futuresPrice: '619.75', basis: '-43.25', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Jul 26', sellPrice: '634.25' },
      { id: 'b-wh-006', tradeDate: '2026-02-10', tradeNumber: 'WH-2005', tradeType: 'Rolled In',   cashPrice: '568.75', futuresPrice: '612.00', basis: '-43.25', sizeInBushels: 8000,  commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'b-wh-007', tradeDate: '2026-02-07', tradeNumber: 'WH-2006', tradeType: 'Hedge',       cashPrice: '564.00', futuresPrice: '607.50', basis: '-43.50', sizeInBushels: 35000, commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'b-wh-008', tradeDate: '2026-02-04', tradeNumber: 'WH-2007', tradeType: 'Liquidation', cashPrice: '577.25', futuresPrice: '615.25', basis: '-43.50', sizeInBushels: 12000, commodity: 'Wheat', contractMonth: 'Sep 26', sellPrice: '629.75' },
      { id: 'b-wh-009', tradeDate: '2026-02-01', tradeNumber: 'WH-2008', tradeType: 'Hedge',       cashPrice: '559.50', futuresPrice: '603.25', basis: '-43.75', sizeInBushels: 18000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'b-wh-010', tradeDate: '2026-01-29', tradeNumber: 'WH-2009', tradeType: 'Hedge',       cashPrice: '555.00', futuresPrice: '598.75', basis: '-43.75', sizeInBushels: 22000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'b-wh-011', tradeDate: '2026-01-26', tradeNumber: 'WH-2010', tradeType: 'Hedge',       cashPrice: '551.25', futuresPrice: '595.00', basis: '-43.75', sizeInBushels: 12000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'b-wh-012', tradeDate: '2026-01-23', tradeNumber: 'WH-2011', tradeType: 'Liquidation', cashPrice: '566.00', futuresPrice: '607.50', basis: '-44.00', sizeInBushels: 8000,  commodity: 'Wheat', contractMonth: 'Dec 26', sellPrice: '619.00' },
    ],
    Corn: [
      { id: 'b-cn-001', tradeDate: '2026-02-25', tradeNumber: 'CN-2000', tradeType: 'Hedge',       cashPrice: '440.00', futuresPrice: '484.50', basis: '-44.50', sizeInBushels: 35000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'b-cn-002', tradeDate: '2026-02-22', tradeNumber: 'CN-2001', tradeType: 'Liquidation', cashPrice: '452.25', futuresPrice: '484.50', basis: '-44.25', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'May 26', sellPrice: '498.75' },
      { id: 'b-cn-003', tradeDate: '2026-02-19', tradeNumber: 'CN-2002', tradeType: 'Hedge',       cashPrice: '436.50', futuresPrice: '481.00', basis: '-44.50', sizeInBushels: 25000, commodity: 'Corn', contractMonth: 'Jul 26' },
      { id: 'b-cn-004', tradeDate: '2026-02-16', tradeNumber: 'CN-2003', tradeType: 'Hedge',       cashPrice: '432.75', futuresPrice: '477.25', basis: '-44.50', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'Sep 26' },
      { id: 'b-cn-005', tradeDate: '2026-02-13', tradeNumber: 'CN-2004', tradeType: 'Liquidation', cashPrice: '445.00', futuresPrice: '481.00', basis: '-44.25', sizeInBushels: 12000, commodity: 'Corn', contractMonth: 'Jul 26', sellPrice: '492.50' },
      { id: 'b-cn-006', tradeDate: '2026-02-10', tradeNumber: 'CN-2005', tradeType: 'Hedge',       cashPrice: '429.00', futuresPrice: '473.50', basis: '-44.50', sizeInBushels: 15000, commodity: 'Corn', contractMonth: 'Dec 26' },
      { id: 'b-cn-007', tradeDate: '2026-02-07', tradeNumber: 'CN-2006', tradeType: 'Hedge',       cashPrice: '425.25', futuresPrice: '469.75', basis: '-44.50', sizeInBushels: 30000, commodity: 'Corn', contractMonth: 'Dec 26' },
      { id: 'b-cn-008', tradeDate: '2026-02-04', tradeNumber: 'CN-2007', tradeType: 'Liquidation', cashPrice: '438.50', futuresPrice: '477.25', basis: '-44.25', sizeInBushels: 8000,  commodity: 'Corn', contractMonth: 'Sep 26', sellPrice: '485.00' },
      { id: 'b-cn-009', tradeDate: '2026-02-01', tradeNumber: 'CN-2008', tradeType: 'Rolled In',   cashPrice: '421.50', futuresPrice: '466.00', basis: '-44.50', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'b-cn-010', tradeDate: '2026-01-29', tradeNumber: 'CN-2009', tradeType: 'Hedge',       cashPrice: '417.75', futuresPrice: '462.25', basis: '-44.50', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'Jul 26' },
    ],
    Soybeans: [
      { id: 'b-sy-001', tradeDate: '2026-02-25', tradeNumber: 'SY-2000', tradeType: 'Hedge',       cashPrice: '1110.00', futuresPrice: '1156.25', basis: '-46.25', sizeInBushels: 20000, commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'b-sy-002', tradeDate: '2026-02-22', tradeNumber: 'SY-2001', tradeType: 'Liquidation', cashPrice: '1124.50', futuresPrice: '1156.25', basis: '-46.00', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'May 26', sellPrice: '1178.50' },
      { id: 'b-sy-003', tradeDate: '2026-02-19', tradeNumber: 'SY-2002', tradeType: 'Hedge',       cashPrice: '1105.75', futuresPrice: '1151.75', basis: '-46.00', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'Jul 26' },
      { id: 'b-sy-004', tradeDate: '2026-02-16', tradeNumber: 'SY-2003', tradeType: 'Hedge',       cashPrice: '1101.50', futuresPrice: '1147.50', basis: '-46.00', sizeInBushels: 25000, commodity: 'Soybeans', contractMonth: 'Sep 26' },
      { id: 'b-sy-005', tradeDate: '2026-02-13', tradeNumber: 'SY-2004', tradeType: 'Liquidation', cashPrice: '1116.00', futuresPrice: '1151.75', basis: '-46.00', sizeInBushels: 8000,  commodity: 'Soybeans', contractMonth: 'Jul 26', sellPrice: '1171.25' },
      { id: 'b-sy-006', tradeDate: '2026-02-10', tradeNumber: 'SY-2005', tradeType: 'Hedge',       cashPrice: '1097.25', futuresPrice: '1143.25', basis: '-46.00', sizeInBushels: 12000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
      { id: 'b-sy-007', tradeDate: '2026-02-07', tradeNumber: 'SY-2006', tradeType: 'Hedge',       cashPrice: '1093.00', futuresPrice: '1139.00', basis: '-46.00', sizeInBushels: 18000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
      { id: 'b-sy-008', tradeDate: '2026-02-04', tradeNumber: 'SY-2007', tradeType: 'Liquidation', cashPrice: '1108.50', futuresPrice: '1147.50', basis: '-46.00', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Sep 26', sellPrice: '1165.75' },
    ],
  },
  gamma: {
    Wheat: [
      { id: 'g-wh-001', tradeDate: '2026-02-27', tradeNumber: 'WH-3000', tradeType: 'Hedge',       cashPrice: '560.00', futuresPrice: '603.25', basis: '-43.25', sizeInBushels: 40000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'g-wh-002', tradeDate: '2026-02-24', tradeNumber: 'WH-3001', tradeType: 'Liquidation', cashPrice: '571.50', futuresPrice: '603.25', basis: '-43.25', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'May 26', sellPrice: '618.00' },
      { id: 'g-wh-003', tradeDate: '2026-02-21', tradeNumber: 'WH-3002', tradeType: 'Hedge',       cashPrice: '556.75', futuresPrice: '599.75', basis: '-43.00', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'g-wh-004', tradeDate: '2026-02-17', tradeNumber: 'WH-3003', tradeType: 'Rolled In',   cashPrice: '553.00', futuresPrice: '596.00', basis: '-43.00', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'g-wh-005', tradeDate: '2026-02-14', tradeNumber: 'WH-3004', tradeType: 'Hedge',       cashPrice: '549.25', futuresPrice: '592.25', basis: '-43.00', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'g-wh-006', tradeDate: '2026-02-11', tradeNumber: 'WH-3005', tradeType: 'Liquidation', cashPrice: '562.00', futuresPrice: '599.75', basis: '-43.25', sizeInBushels: 8000,  commodity: 'Wheat', contractMonth: 'Jul 26', sellPrice: '608.50' },
      { id: 'g-wh-007', tradeDate: '2026-02-08', tradeNumber: 'WH-3006', tradeType: 'Hedge',       cashPrice: '545.50', futuresPrice: '588.50', basis: '-43.00', sizeInBushels: 25000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'g-wh-008', tradeDate: '2026-02-05', tradeNumber: 'WH-3007', tradeType: 'Hedge',       cashPrice: '541.75', futuresPrice: '584.75', basis: '-43.00', sizeInBushels: 30000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'g-wh-009', tradeDate: '2026-02-02', tradeNumber: 'WH-3008', tradeType: 'Liquidation', cashPrice: '554.25', futuresPrice: '592.25', basis: '-43.00', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Dec 26', sellPrice: '601.75' },
      { id: 'g-wh-010', tradeDate: '2026-01-30', tradeNumber: 'WH-3009', tradeType: 'Hedge',       cashPrice: '538.00', futuresPrice: '581.00', basis: '-43.00', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'Sep 26' },
    ],
    Corn: [
      { id: 'g-cn-001', tradeDate: '2026-02-27', tradeNumber: 'CN-3000', tradeType: 'Hedge',       cashPrice: '448.25', futuresPrice: '493.00', basis: '-44.75', sizeInBushels: 40000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'g-cn-002', tradeDate: '2026-02-24', tradeNumber: 'CN-3001', tradeType: 'Liquidation', cashPrice: '461.00', futuresPrice: '493.00', basis: '-44.75', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'May 26', sellPrice: '506.50' },
      { id: 'g-cn-003', tradeDate: '2026-02-21', tradeNumber: 'CN-3002', tradeType: 'Hedge',       cashPrice: '444.50', futuresPrice: '489.25', basis: '-44.75', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'Jul 26' },
      { id: 'g-cn-004', tradeDate: '2026-02-17', tradeNumber: 'CN-3003', tradeType: 'Hedge',       cashPrice: '440.75', futuresPrice: '485.50', basis: '-44.75', sizeInBushels: 25000, commodity: 'Corn', contractMonth: 'Sep 26' },
      { id: 'g-cn-005', tradeDate: '2026-02-14', tradeNumber: 'CN-3004', tradeType: 'Liquidation', cashPrice: '453.50', futuresPrice: '489.25', basis: '-44.75', sizeInBushels: 12000, commodity: 'Corn', contractMonth: 'Jul 26', sellPrice: '499.75' },
      { id: 'g-cn-006', tradeDate: '2026-02-11', tradeNumber: 'CN-3005', tradeType: 'Hedge',       cashPrice: '437.00', futuresPrice: '481.75', basis: '-44.75', sizeInBushels: 30000, commodity: 'Corn', contractMonth: 'Dec 26' },
      { id: 'g-cn-007', tradeDate: '2026-02-08', tradeNumber: 'CN-3006', tradeType: 'Rolled In',   cashPrice: '433.25', futuresPrice: '478.00', basis: '-44.75', sizeInBushels: 8000,  commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'g-cn-008', tradeDate: '2026-02-05', tradeNumber: 'CN-3007', tradeType: 'Liquidation', cashPrice: '446.00', futuresPrice: '485.50', basis: '-44.75', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'Sep 26', sellPrice: '493.25' },
    ],
    Soybeans: [
      { id: 'g-sy-001', tradeDate: '2026-02-27', tradeNumber: 'SY-3000', tradeType: 'Hedge',       cashPrice: '1085.00', futuresPrice: '1131.25', basis: '-46.25', sizeInBushels: 25000, commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'g-sy-002', tradeDate: '2026-02-24', tradeNumber: 'SY-3001', tradeType: 'Liquidation', cashPrice: '1098.75', futuresPrice: '1131.25', basis: '-46.00', sizeInBushels: 12000, commodity: 'Soybeans', contractMonth: 'May 26', sellPrice: '1153.50' },
      { id: 'g-sy-003', tradeDate: '2026-02-21', tradeNumber: 'SY-3002', tradeType: 'Hedge',       cashPrice: '1081.50', futuresPrice: '1127.50', basis: '-46.00', sizeInBushels: 18000, commodity: 'Soybeans', contractMonth: 'Jul 26' },
      { id: 'g-sy-004', tradeDate: '2026-02-17', tradeNumber: 'SY-3003', tradeType: 'Hedge',       cashPrice: '1077.25', futuresPrice: '1123.25', basis: '-46.00', sizeInBushels: 20000, commodity: 'Soybeans', contractMonth: 'Sep 26' },
      { id: 'g-sy-005', tradeDate: '2026-02-14', tradeNumber: 'SY-3004', tradeType: 'Liquidation', cashPrice: '1091.00', futuresPrice: '1127.50', basis: '-46.00', sizeInBushels: 8000,  commodity: 'Soybeans', contractMonth: 'Jul 26', sellPrice: '1145.75' },
      { id: 'g-sy-006', tradeDate: '2026-02-11', tradeNumber: 'SY-3005', tradeType: 'Hedge',       cashPrice: '1073.00', futuresPrice: '1119.00', basis: '-46.00', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
      { id: 'g-sy-007', tradeDate: '2026-02-08', tradeNumber: 'SY-3006', tradeType: 'Liquidation', cashPrice: '1086.50', futuresPrice: '1123.25', basis: '-46.00', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Sep 26', sellPrice: '1139.00' },
    ],
  },
  delta: {
    Wheat: [
      { id: 'd-wh-001', tradeDate: '2026-02-26', tradeNumber: 'WH-4000', tradeType: 'Hedge',       cashPrice: '548.00', futuresPrice: '591.25', basis: '-43.25', sizeInBushels: 50000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'd-wh-002', tradeDate: '2026-02-23', tradeNumber: 'WH-4001', tradeType: 'Liquidation', cashPrice: '559.75', futuresPrice: '591.25', basis: '-43.00', sizeInBushels: 25000, commodity: 'Wheat', contractMonth: 'May 26', sellPrice: '604.50' },
      { id: 'd-wh-003', tradeDate: '2026-02-20', tradeNumber: 'WH-4002', tradeType: 'Hedge',       cashPrice: '545.00', futuresPrice: '588.25', basis: '-43.25', sizeInBushels: 30000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'd-wh-004', tradeDate: '2026-02-17', tradeNumber: 'WH-4003', tradeType: 'Hedge',       cashPrice: '541.25', futuresPrice: '584.50', basis: '-43.25', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'Sep 26' },
      { id: 'd-wh-005', tradeDate: '2026-02-14', tradeNumber: 'WH-4004', tradeType: 'Rolled In',   cashPrice: '537.50', futuresPrice: '580.75', basis: '-43.25', sizeInBushels: 12000, commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'd-wh-006', tradeDate: '2026-02-11', tradeNumber: 'WH-4005', tradeType: 'Liquidation', cashPrice: '550.00', futuresPrice: '588.25', basis: '-43.25', sizeInBushels: 15000, commodity: 'Wheat', contractMonth: 'Jul 26', sellPrice: '597.75' },
      { id: 'd-wh-007', tradeDate: '2026-02-08', tradeNumber: 'WH-4006', tradeType: 'Hedge',       cashPrice: '533.75', futuresPrice: '577.00', basis: '-43.25', sizeInBushels: 25000, commodity: 'Wheat', contractMonth: 'May 26' },
      { id: 'd-wh-008', tradeDate: '2026-02-05', tradeNumber: 'WH-4007', tradeType: 'Hedge',       cashPrice: '530.00', futuresPrice: '573.25', basis: '-43.25', sizeInBushels: 35000, commodity: 'Wheat', contractMonth: 'Jul 26' },
      { id: 'd-wh-009', tradeDate: '2026-02-02', tradeNumber: 'WH-4008', tradeType: 'Liquidation', cashPrice: '542.50', futuresPrice: '584.50', basis: '-43.25', sizeInBushels: 10000, commodity: 'Wheat', contractMonth: 'Sep 26', sellPrice: '591.25' },
      { id: 'd-wh-010', tradeDate: '2026-01-30', tradeNumber: 'WH-4009', tradeType: 'Hedge',       cashPrice: '526.25', futuresPrice: '569.50', basis: '-43.25', sizeInBushels: 20000, commodity: 'Wheat', contractMonth: 'Dec 26' },
      { id: 'd-wh-011', tradeDate: '2026-01-27', tradeNumber: 'WH-4010', tradeType: 'Liquidation', cashPrice: '538.75', futuresPrice: '580.75', basis: '-43.00', sizeInBushels: 8000,  commodity: 'Wheat', contractMonth: 'Dec 26', sellPrice: '588.00' },
    ],
    Corn: [
      { id: 'd-cn-001', tradeDate: '2026-02-26', tradeNumber: 'CN-4000', tradeType: 'Hedge',       cashPrice: '455.50', futuresPrice: '500.75', basis: '-45.25', sizeInBushels: 50000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'd-cn-002', tradeDate: '2026-02-23', tradeNumber: 'CN-4001', tradeType: 'Liquidation', cashPrice: '468.25', futuresPrice: '500.75', basis: '-45.00', sizeInBushels: 25000, commodity: 'Corn', contractMonth: 'May 26', sellPrice: '515.50' },
      { id: 'd-cn-003', tradeDate: '2026-02-20', tradeNumber: 'CN-4002', tradeType: 'Hedge',       cashPrice: '451.75', futuresPrice: '497.00', basis: '-45.25', sizeInBushels: 30000, commodity: 'Corn', contractMonth: 'Jul 26' },
      { id: 'd-cn-004', tradeDate: '2026-02-17', tradeNumber: 'CN-4003', tradeType: 'Hedge',       cashPrice: '448.00', futuresPrice: '493.25', basis: '-45.25', sizeInBushels: 20000, commodity: 'Corn', contractMonth: 'Sep 26' },
      { id: 'd-cn-005', tradeDate: '2026-02-14', tradeNumber: 'CN-4004', tradeType: 'Liquidation', cashPrice: '460.50', futuresPrice: '497.00', basis: '-45.25', sizeInBushels: 15000, commodity: 'Corn', contractMonth: 'Jul 26', sellPrice: '508.25' },
      { id: 'd-cn-006', tradeDate: '2026-02-11', tradeNumber: 'CN-4005', tradeType: 'Hedge',       cashPrice: '444.25', futuresPrice: '489.50', basis: '-45.25', sizeInBushels: 25000, commodity: 'Corn', contractMonth: 'Dec 26' },
      { id: 'd-cn-007', tradeDate: '2026-02-08', tradeNumber: 'CN-4006', tradeType: 'Rolled In',   cashPrice: '440.50', futuresPrice: '485.75', basis: '-45.25', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'May 26' },
      { id: 'd-cn-008', tradeDate: '2026-02-05', tradeNumber: 'CN-4007', tradeType: 'Liquidation', cashPrice: '453.00', futuresPrice: '493.25', basis: '-45.25', sizeInBushels: 10000, commodity: 'Corn', contractMonth: 'Sep 26', sellPrice: '501.00' },
      { id: 'd-cn-009', tradeDate: '2026-02-02', tradeNumber: 'CN-4008', tradeType: 'Hedge',       cashPrice: '436.75', futuresPrice: '482.00', basis: '-45.25', sizeInBushels: 30000, commodity: 'Corn', contractMonth: 'Dec 26' },
    ],
    Soybeans: [
      { id: 'd-sy-001', tradeDate: '2026-02-26', tradeNumber: 'SY-4000', tradeType: 'Hedge',       cashPrice: '1120.00', futuresPrice: '1167.50', basis: '-47.50', sizeInBushels: 30000, commodity: 'Soybeans', contractMonth: 'May 26' },
      { id: 'd-sy-002', tradeDate: '2026-02-23', tradeNumber: 'SY-4001', tradeType: 'Liquidation', cashPrice: '1134.75', futuresPrice: '1167.50', basis: '-47.25', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'May 26', sellPrice: '1190.25' },
      { id: 'd-sy-003', tradeDate: '2026-02-20', tradeNumber: 'SY-4002', tradeType: 'Hedge',       cashPrice: '1116.25', futuresPrice: '1163.75', basis: '-47.50', sizeInBushels: 20000, commodity: 'Soybeans', contractMonth: 'Jul 26' },
      { id: 'd-sy-004', tradeDate: '2026-02-17', tradeNumber: 'SY-4003', tradeType: 'Hedge',       cashPrice: '1112.50', futuresPrice: '1160.00', basis: '-47.50', sizeInBushels: 25000, commodity: 'Soybeans', contractMonth: 'Sep 26' },
      { id: 'd-sy-005', tradeDate: '2026-02-14', tradeNumber: 'SY-4004', tradeType: 'Liquidation', cashPrice: '1127.00', futuresPrice: '1163.75', basis: '-47.25', sizeInBushels: 10000, commodity: 'Soybeans', contractMonth: 'Jul 26', sellPrice: '1181.50' },
      { id: 'd-sy-006', tradeDate: '2026-02-11', tradeNumber: 'SY-4005', tradeType: 'Hedge',       cashPrice: '1108.75', futuresPrice: '1156.25', basis: '-47.50', sizeInBushels: 20000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
      { id: 'd-sy-007', tradeDate: '2026-02-08', tradeNumber: 'SY-4006', tradeType: 'Liquidation', cashPrice: '1121.25', futuresPrice: '1160.00', basis: '-47.25', sizeInBushels: 12000, commodity: 'Soybeans', contractMonth: 'Sep 26', sellPrice: '1174.75' },
      { id: 'd-sy-008', tradeDate: '2026-02-05', tradeNumber: 'SY-4007', tradeType: 'Hedge',       cashPrice: '1105.00', futuresPrice: '1152.50', basis: '-47.50', sizeInBushels: 15000, commodity: 'Soybeans', contractMonth: 'Nov 26' },
    ],
  },
};

export function useHedgeRecords(accountId) {
  const [data, setData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    setIsInitializing(true);
    setData(null);
    const key = storageKey(accountId);
    const seed = SEED_DATA[accountId];

    const initializeData = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.Wheat || parsed.Corn || parsed.Soybeans)) {
            setData(parsed);
            setIsInitializing(false);
            return;
          }
        }
        const newData = {
          Wheat: seed?.Wheat || [],
          Corn: seed?.Corn || [],
          Soybeans: seed?.Soybeans || [],
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(newData));
        setData(newData);
      } catch (e) {
        console.error('Failed to init datastore:', e);
        setData({ Wheat: [], Corn: [], Soybeans: [], lastUpdated: null });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [accountId]);

  useEffect(() => {
    if (data === null || !accountId) return;
    try {
      localStorage.setItem(storageKey(accountId), JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data, accountId]);

  const addRecords = useCallback((commodity, newRecords) => {
    setData((prev) => {
      const existing = prev[commodity] || [];
      return {
        ...prev,
        [commodity]: [...existing, ...newRecords].sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)),
        lastUpdated: new Date().toISOString(),
      };
    });
    newRecords.forEach(r => {
      appendAuditEntry(accountId, {
        action: 'add', commodity,
        tradeNumber: r.tradeNumber,
        description: `Added ${r.tradeType} trade for ${parseInt(r.sizeInBushels || 0).toLocaleString()} bu`,
      });
    });
  }, [accountId]);

  const updateRecord = useCallback((commodity, recordId, updatedFields) => {
    setData((prev) => {
      const records = prev[commodity] || [];
      const index = records.findIndex((r) => r.id === recordId);
      if (index === -1) return prev;
      const record = records[index];
      // Log audit entry for each changed field
      Object.keys(updatedFields).forEach(field => {
        if (record[field] !== updatedFields[field]) {
          appendAuditEntry(accountId, {
            action: 'update', commodity,
            tradeNumber: record.tradeNumber,
            field,
            oldValue: record[field],
            newValue: updatedFields[field],
            description: `Updated ${field} on trade ${record.tradeNumber}`,
          });
        }
      });
      let newRecord = { ...record, ...updatedFields };
      if (updatedFields.cashPrice !== undefined || updatedFields.futuresPrice !== undefined) {
        if (updatedFields.basis === undefined && newRecord.cashPrice && newRecord.futuresPrice) {
          const cp = parseFloat(newRecord.cashPrice);
          const fp = parseFloat(newRecord.futuresPrice);
          if (!isNaN(cp) && !isNaN(fp)) newRecord.basis = (cp - fp).toFixed(2);
        }
      }
      const newRecords = [...records];
      newRecords[index] = newRecord;
      return { ...prev, [commodity]: newRecords, lastUpdated: new Date().toISOString() };
    });
  }, [accountId]);

  const deleteRecord = useCallback((commodity, recordId) => {
    setData((prev) => {
      const record = (prev[commodity] || []).find(r => r.id === recordId);
      if (record) {
        appendAuditEntry(accountId, {
          action: 'delete', commodity,
          tradeNumber: record.tradeNumber,
          description: `Deleted trade ${record.tradeNumber} (${record.tradeType}, ${parseInt(record.sizeInBushels || 0).toLocaleString()} bu)`,
        });
      }
      return {
        ...prev,
        [commodity]: (prev[commodity] || []).filter((r) => r.id !== recordId),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [accountId]);

  const clearRecords = useCallback((commodity) => {
    appendAuditEntry(accountId, {
      action: 'clear', commodity,
      description: `Cleared all ${commodity} records`,
    });
    setData((prev) => ({ ...prev, [commodity]: [], lastUpdated: new Date().toISOString() }));
  }, [accountId]);

  return { data, isInitializing, addRecords, updateRecord, deleteRecord, clearRecords };
}
