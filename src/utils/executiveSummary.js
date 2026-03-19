import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { format } from 'date-fns';

applyPlugin(jsPDF);

const COMMODITIES = ['Wheat', 'Corn', 'Soybeans'];

function calcStats(records) {
  let netPosition = 0, realizedPnl = 0, hedgeCount = 0, liqCount = 0;
  let sumBasis = 0, basisCount = 0;
  let sumPxSize = 0, sumSize = 0;

  records.forEach(r => {
    const size = parseInt(r.sizeInBushels) || 0;
    const fp = parseFloat(r.futuresPrice);
    if (r.tradeType === 'Hedge' || r.tradeType === 'Rolled In') {
      netPosition += size;
      if (r.tradeType === 'Hedge') hedgeCount++;
      if (!isNaN(fp) && size > 0) { sumPxSize += fp * size; sumSize += size; }
    }
    if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') {
      netPosition -= size;
      if (r.tradeType === 'Liquidation') {
        liqCount++;
        const sell = parseFloat(r.sellPrice);
        if (!isNaN(sell) && !isNaN(fp)) {
          realizedPnl += ((sell - fp) / 100) * Math.abs(size);
        }
      }
    }
    if (r.basis && !isNaN(parseFloat(r.basis))) { sumBasis += parseFloat(r.basis); basisCount++; }
  });
  const vwap = sumSize > 0 ? (sumPxSize / sumSize).toFixed(2) : 'N/A';
  const avgBasis = basisCount > 0 ? (sumBasis / basisCount).toFixed(2) : 'N/A';
  return { netPosition, realizedPnl, hedgeCount, liqCount, vwap, avgBasis, totalTrades: records.length };
}

export function generateExecutiveSummary(data, accountName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const m = 50;

  // Header
  doc.setFillColor(15, 31, 61);
  doc.rect(0, 0, w, 85, 'F');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Executive Summary', m, 45);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 220);
  doc.text(`${accountName} · ${format(new Date(), 'MMMM d, yyyy')}`, m, 68);

  let y = 110;

  // Aggregate stats
  let totalPnl = 0, totalNet = 0, totalTrades = 0;
  COMMODITIES.forEach(c => {
    const s = calcStats(data[c] || []);
    totalPnl += s.realizedPnl;
    totalNet += s.netPosition;
    totalTrades += s.totalTrades;
  });

  // Summary box
  doc.setDrawColor(200); doc.setFillColor(248, 249, 251);
  doc.roundedRect(m, y, w - m * 2, 55, 4, 4, 'FD');

  const boxLabels = ['Total Trades', 'Net Position', 'Realized P&L'];
  const boxValues = [
    totalTrades.toString(),
    `${totalNet.toLocaleString()} bu`,
    `${totalPnl >= 0 ? '+' : '-'}$${Math.abs(totalPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
  ];
  const boxW = (w - m * 2) / 3;
  for (let i = 0; i < 3; i++) {
    const x = m + 15 + i * boxW;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(130);
    doc.text(boxLabels[i].toUpperCase(), x, y + 20);
    doc.setFontSize(16); doc.setTextColor(15, 31, 61);
    if (i === 2) doc.setTextColor(totalPnl >= 0 ? 5 : 220, totalPnl >= 0 ? 150 : 50, totalPnl >= 0 ? 105 : 50);
    doc.text(boxValues[i], x, y + 40);
  }
  y += 75;

  // Per-commodity table
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 31, 61);
  doc.text('Breakdown by Commodity', m, y);
  y += 15;

  const head = [['Commodity', 'Trades', 'Hedges', 'Liquidations', 'VWAP (¢)', 'Avg Basis', 'Net Pos (Bu)', 'Realized P&L']];
  const body = COMMODITIES.map(c => {
    const s = calcStats(data[c] || []);
    const pnlStr = `${s.realizedPnl >= 0 ? '+' : '-'}$${Math.abs(s.realizedPnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    return [c, s.totalTrades, s.hedgeCount, s.liqCount, s.vwap, s.avgBasis, s.netPosition.toLocaleString(), pnlStr];
  });

  doc.autoTable({
    startY: y,
    head, body,
    theme: 'striped',
    headStyles: { fillColor: [15, 31, 61], textColor: 255, fontStyle: 'bold', halign: 'left' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' },
    },
    margin: { left: m, right: m },
  });

  // Footer
  doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150);
  doc.text('Confidential — For Internal Use Only.', m, h - 25);
  doc.text(`StoneX Executive Summary · ${accountName}`, w - m, h - 25, { align: 'right' });

  doc.save(`ExecutiveSummary_${accountName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
