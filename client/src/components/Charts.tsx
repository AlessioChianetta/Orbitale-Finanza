import { useEffect, useRef } from "react";

interface ChartsProps {
  assetsByType: Record<string, number>;
}

export default function Charts({ assetsByType }: ChartsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Transform data for chart
    const data = Object.entries(assetsByType);
    const labels = data.map(([type]) => {
      switch (type) {
        case 'liquidity': return 'Liquidità';
        case 'investment': return 'Investimenti';
        case 'property': return 'Immobiliare';
        case 'vehicle': return 'Veicoli';
        default: return 'Altro';
      }
    });
    const values = data.map(([, value]) => value);
    const colors = ['#2563EB', '#059669', '#F59E0B', '#8B5CF6', '#EF4444'];

    // Calculate percentages
    const total = values.reduce((sum, value) => sum + value, 0);
    const percentages = values.map(value => ((value / total) * 100).toFixed(1));

    const chart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, values.length),
          borderWidth: 0,
          cutout: '70%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: €${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      chart.destroy();
    };
  }, [assetsByType]);

  // Add Chart.js via CDN if not already loaded
  useEffect(() => {
    if (window.Chart) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  if (Object.keys(assetsByType).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-medium-gray">
        <p>Nessun dato disponibile per il grafico</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
      <div className="w-64 h-64 relative">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="space-y-4">
        {Object.entries(assetsByType).map(([type, value], index) => {
          const total = Object.values(assetsByType).reduce((sum, v) => sum + v, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          const colors = ['#2563EB', '#059669', '#F59E0B', '#8B5CF6', '#EF4444'];
          
          const typeLabel = {
            'liquidity': 'Liquidità',
            'investment': 'Investimenti',
            'property': 'Immobiliare',
            'vehicle': 'Veicoli',
            'other': 'Altro'
          }[type] || 'Altro';

          return (
            <div key={type} className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-dark-gray">{typeLabel} ({percentage}%)</span>
              <span className="text-sm font-semibold text-dark-gray">
                €{value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
