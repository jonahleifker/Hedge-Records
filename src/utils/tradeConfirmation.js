import jsPDF from 'jspdf';
import { format } from 'date-fns';

/**
 * Generate a single-trade confirmation PDF.
 */
export function generateTradeConfirmation(record, commodity) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const w = doc.internal.pageSize.getWidth();
  const m = 50;

  // Header bar
  doc.setFillColor(15, 31, 61);
  doc.rect(0, 0, w, 80, 'F');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('StoneX — Trade Confirmation', m, 50);

  // Date line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy — HH:mm:ss')}`, w - m, 50, { align: 'right' });

  // Body
  let y = 110;
  const label = (text, x, yy) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    doc.text(text.toUpperCase(), x, yy);
  };
  const value = (text, x, yy) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(text || '—'), x, yy);
  };

  // Trade details
  label('Commodity', m, y); value(commodity, m, y + 18);
  label('Contract Month', w / 2, y); value(record.contractMonth || '—', w / 2, y + 18);
  y += 50;
  label('Trade Number', m, y); value(record.tradeNumber || '—', m, y + 18);
  label('Trade Date', w / 2, y); value(record.tradeDate ? format(new Date(record.tradeDate), 'MM/dd/yyyy') : '—', w / 2, y + 18);
  y += 50;
  label('Trade Type', m, y); value(record.tradeType || '—', m, y + 18);
  label('Size (Bushels)', w / 2, y); value((parseInt(record.sizeInBushels) || 0).toLocaleString(), w / 2, y + 18);

  y += 60;
  doc.setDrawColor(220, 220, 220);
  doc.line(m, y, w - m, y);
  y += 20;

  // Pricing
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 31, 61);
  doc.text('Pricing', m, y);
  y += 25;

  label('Cash Price (¢/bu)', m, y);
  value(record.cashPrice ? parseFloat(record.cashPrice).toFixed(2) : '—', m, y + 18);
  label('Futures Price (¢/bu)', w / 2, y);
  value(record.futuresPrice ? parseFloat(record.futuresPrice).toFixed(2) : '—', w / 2, y + 18);
  y += 50;
  label('Basis (¢/bu)', m, y);
  value(record.basis ? parseFloat(record.basis).toFixed(2) : '—', m, y + 18);

  if (record.tradeType === 'Liquidation' && record.sellPrice) {
    label('Exit / Sell Price (¢/bu)', w / 2, y);
    value(parseFloat(record.sellPrice).toFixed(2), w / 2, y + 18);
    
    y += 50;
    const pnl = ((parseFloat(record.sellPrice) - parseFloat(record.futuresPrice)) / 100) * Math.abs(parseInt(record.sizeInBushels) || 0);
    label('Realized P&L', m, y);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(pnl >= 0 ? 5 : 220, pnl >= 0 ? 150 : 50, pnl >= 0 ? 105 : 50);
    doc.text(`${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, m, y + 22);
  }

  // Notes
  if (record.notes) {
    y += 60;
    doc.setDrawColor(220, 220, 220);
    doc.line(m, y, w - m, y);
    y += 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 31, 61);
    doc.text('Notes', m, y);
    y += 18;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(record.notes, w - m * 2);
    doc.text(lines, m, y);
  }

  // Footer
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Confidential — For Internal Use Only.', m, h - 30);
  doc.text('StoneX Trade Confirmation', w - m, h - 30, { align: 'right' });

  doc.save(`TradeConfirmation_${record.tradeNumber || 'unknown'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
