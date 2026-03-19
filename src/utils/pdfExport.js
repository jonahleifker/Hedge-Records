import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { format } from 'date-fns';
import { CONTRACT_MONTHS } from './constants';

applyPlugin(jsPDF);

function calculateStats(records) {
  let totalBushels = 0;
  let hedgeCount = 0;
  let liqCount = 0;
  let sumBasis = 0;
  let basisCount = 0;
  let netPosition = 0;

  records.forEach(r => {
    const size = parseInt(r.sizeInBushels) || 0;
    
    const isPositiveExposure = r.tradeType === 'Hedge' || r.tradeType === 'Rolled In';
    const isNegativeExposure = r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out';

    if (isPositiveExposure) {
      if (r.tradeType === 'Hedge') hedgeCount++;
      totalBushels += size;
      netPosition += size;
    }
    
    if (isNegativeExposure) {
      if (r.tradeType === 'Liquidation') liqCount++;
      totalBushels -= size;
      netPosition -= size;
    }

    if (r.basis && !isNaN(parseFloat(r.basis))) {
      sumBasis += parseFloat(r.basis);
      basisCount++;
    }
  });

  return {
    totalBushels,
    hedgeCount,
    liqCount,
    avgBasis: basisCount > 0 ? (sumBasis / basisCount).toFixed(2) : 'N/A',
    netPosition
  };
}

export function exportToPDF(commodity, records) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  const months = CONTRACT_MONTHS[commodity] || [];
  
  if (months.length === 0) {
    months.push('All Months');
  }

  const generationDate = format(new Date(), 'MM/dd/yyyy HH:mm:ss');

  // helper to draw header and stats
  const drawPageHeaderAndStats = (pageTitle, statsObj) => {
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 31, 61);
    doc.text(`StoneX — ${commodity} Hedge Record`, margin, margin);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${generationDate}`, pageWidth - margin, margin, { align: 'right' });
    doc.text(pageTitle, pageWidth - margin, margin + 14, { align: 'right' });

    // Summary Stats Block
    let startY = margin + 40;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(244, 246, 249);
    doc.roundedRect(margin, startY, pageWidth - (margin * 2), 50, 4, 4, 'FD');

    const statItemWidth = (pageWidth - (margin * 2)) / 5;
    const statLabels = ['Total Bushels', 'Hedges', 'Liquidations', 'Avg Basis', 'Net Position (Bu)'];
    const statValues = [
      statsObj.totalBushels.toLocaleString(),
      statsObj.hedgeCount.toLocaleString(),
      statsObj.liqCount.toLocaleString(),
      statsObj.avgBasis,
      statsObj.netPosition.toLocaleString()
    ];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    
    for (let i = 0; i < 5; i++) {
      const x = margin + 20 + (i * statItemWidth);
      doc.text(statLabels[i].toUpperCase(), x, startY + 20);
      
      doc.setFontSize(14);
      if (i === 4 && statsObj.netPosition !== 0) {
        doc.setTextColor(statsObj.netPosition > 0 ? 0 : 255, statsObj.netPosition > 0 ? 196 : 77, statsObj.netPosition > 0 ? 140 : 79);
      } else {
        doc.setTextColor(15, 31, 61);
      }
      doc.text(statValues[i], x, startY + 38);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
    }

    return startY + 70;
  };

  // 1. Generate Summary Page (All Months)
  const globalStats = calculateStats(records);
  const summaryStartY = drawPageHeaderAndStats('Commodity Summary', globalStats);

  const summaryHead = [['Contract Month', 'Total Bushels', 'Hedges', 'Liquidations', 'Avg Basis', 'Net Position (Bu)']];
  const summaryRows = [];

  months.forEach(month => {
    const monthRecords = months.length > 1 ? records.filter(r => r.contractMonth === month) : records;
    const stats = calculateStats(monthRecords);
    
    // Only include months that have records, or include all valid months?
    // It's helpful to show all valid months so they can quickly see if anything is missing.
    summaryRows.push([
      month,
      stats.totalBushels.toLocaleString(),
      stats.hedgeCount.toLocaleString(),
      stats.liqCount.toLocaleString(),
      stats.avgBasis,
      stats.netPosition.toLocaleString()
    ]);
  });

  doc.autoTable({
    startY: summaryStartY,
    head: summaryHead,
    body: summaryRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 31, 61], // #0f1f3d
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { top: margin, right: margin, bottom: 40, left: margin }
  });

  // 2. Generate Individual Month Pages
  months.forEach((month) => {
    doc.addPage();

    const monthRecords = months.length > 1 ? records.filter(r => r.contractMonth === month) : records;
    const stats = calculateStats(monthRecords);

    const startY = drawPageHeaderAndStats(`Contract Month: ${month}`, stats);

    // Table Data Preparation
    const tableColumns = ['Trade Date', 'Trade Number', 'Month', 'Type', 'Cash Price', 'Futures Price', 'Basis', 'Size (Bu)', 'Rev / P&L'];
    const tableRows = monthRecords.map(r => {
      let dateStr = r.tradeDate;
      try { dateStr = format(new Date(r.tradeDate), 'MM/dd/yyyy'); } catch { /* ignore */ }
      
      // Format decimals
      const cp = r.cashPrice ? parseFloat(r.cashPrice).toFixed(2) : '';
      const fp = r.futuresPrice ? parseFloat(r.futuresPrice).toFixed(2) : '';
      const bas = r.basis ? parseFloat(r.basis).toFixed(2) : '';
      
      let sizeNum = r.sizeInBushels ? parseInt(r.sizeInBushels) : 0;
      if (r.tradeType === 'Liquidation' || r.tradeType === 'Rolled Out') {
        sizeNum = -Math.abs(sizeNum);
      }
      const size = sizeNum ? sizeNum.toLocaleString() : '';

      let revStr = '';
      if (r.tradeType === 'Liquidation') {
        const sell = parseFloat(r.sellPrice);
        const buy = parseFloat(r.futuresPrice);
        const sz = parseInt(r.sizeInBushels) || 0;
        if (!isNaN(sell) && !isNaN(buy)) {
          const rev = ((sell - buy) / 100) * Math.abs(sz);
          const sign = rev < 0 ? '-' : '+';
          revStr = `${sign}$${Math.abs(rev).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
      }

      return [dateStr, r.tradeNumber || '', r.contractMonth || '', r.tradeType || '', cp, fp, bas, size, revStr];
    });

    if (tableRows.length > 0) {
      doc.autoTable({
        startY,
        head: [tableColumns],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 31, 61], // #0f1f3d
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 100 },
          2: { cellWidth: 80 },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { top: margin, right: margin, bottom: 40, left: margin }
      });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text(`No records found for ${month}.`, margin, startY + 20);
    }
  });

  // Footer for all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Confidential — For Internal Use Only.',
      margin,
      pageHeight - 20
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 20,
      { align: 'right' }
    );
  }

  const currentDateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `Statements/${commodity}_HedgeRecord_${currentDateStr}.pdf`;
  doc.save(filename);
}
