import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { GitBranch } from 'lucide-react';

export function BasisChart({ commodity, records }) {
  const chartData = useMemo(() => {
    const points = records
      .filter(r => r.basis && r.tradeDate && !isNaN(parseFloat(r.basis)))
      .map(r => ({
        x: new Date(r.tradeDate).getTime(),
        y: parseFloat(r.basis),
      }))
      .sort((a, b) => a.x - b.x);
    return points;
  }, [records]);

  if (chartData.length < 2) return null;

  const options = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4, opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    colors: ['#6366f1'],
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#6B7280' },
        formatter: (v) => v.toFixed(2)
      }
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (v) => `${v.toFixed(2)} ¢` }
    },
    dataLabels: { enabled: false },
  };

  const series = [{ name: 'Basis', data: chartData }];

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <GitBranch size={20} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Basis History</p>
          <p className="text-sm text-gray-400">{commodity} basis over time from trade records</p>
        </div>
      </div>
      <div className="h-48">
        <Chart options={options} series={series} type="area" height="100%" />
      </div>
    </div>
  );
}
