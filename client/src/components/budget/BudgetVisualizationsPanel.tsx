import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Area, AreaChart, Legend, RadialBarChart, RadialBar,
  ScatterChart, Scatter, Treemap, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  BarChart3, PieChart as PieChartIcon, TrendingUp, Calendar, Grid,
  Target, Zap, Eye, Filter, Download, Maximize2
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

interface HeatmapData {
  month: string;
  category: string;
  amount: number;
  intensity: number;
}

interface ComparisonData {
  period: string;
  [category: string]: string | number;
}

const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#F43F5E', '#65A30D', '#DC2626', '#7C3AED'
];

const HEATMAP_COLORS = ['#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#B45309'];

export function BudgetVisualizationsPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState('6'); // months back
  const [selectedView, setSelectedView] = useState<'heatmap' | 'comparison' | 'distribution' | 'trends'>('heatmap');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Fetch data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => apiRequest('GET', '/api/transactions?limit=1000'),
  });

  const { data: categoryBudgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['/api/category-budgets'],
    queryFn: () => apiRequest('GET', '/api/category-budgets'),
  });

  // Process data for different visualizations
  const processedData = useMemo(() => {
    if (!transactions.length) return { heatmap: [], comparison: [], distribution: [], trends: [] };

    const periodMonths = parseInt(selectedPeriod);
    const startDate = subMonths(new Date(), periodMonths);
    
    // Filter transactions within period
    const filteredTransactions = transactions.filter((t: any) => 
      t.type === 'expense' && 
      new Date(t.date) >= startDate
    );

    // Group by month and category
    const monthlyData: Record<string, Record<string, number>> = {};
    const categoryTotals: Record<string, number> = {};

    filteredTransactions.forEach((transaction: any) => {
      const monthKey = format(new Date(transaction.date), 'yyyy-MM');
      const category = transaction.category || 'Altri';
      const amount = parseFloat(transaction.amount);

      if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
      monthlyData[monthKey][category] = (monthlyData[monthKey][category] || 0) + amount;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    // Create heatmap data
    const heatmapData: HeatmapData[] = [];
    const maxAmount = Math.max(...Object.values(categoryTotals));
    
    Object.entries(monthlyData).forEach(([month, categories]) => {
      Object.entries(categories).forEach(([category, amount]) => {
        heatmapData.push({
          month: format(new Date(month + '-01'), 'MMM yyyy', { locale: it }),
          category,
          amount,
          intensity: (amount / maxAmount) * 100
        });
      });
    });

    // Create comparison data (month over month)
    const comparisonData: ComparisonData[] = Object.keys(monthlyData)
      .sort()
      .map(month => {
        const data: ComparisonData = {
          period: format(new Date(month + '-01'), 'MMM yyyy', { locale: it })
        };
        Object.entries(monthlyData[month] || {}).forEach(([category, amount]) => {
          data[category] = amount;
        });
        return data;
      });

    // Create distribution data (pie chart)
    const distributionData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: ((amount / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);

    // Create trends data (monthly trend for top categories)
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([category]) => category);

    const trendsData = Object.keys(monthlyData)
      .sort()
      .map(month => {
        const data: any = {
          month: format(new Date(month + '-01'), 'MMM yyyy', { locale: it }),
          fullDate: month
        };
        topCategories.forEach(category => {
          data[category] = monthlyData[month][category] || 0;
        });
        return data;
      });

    return {
      heatmap: heatmapData,
      comparison: comparisonData,
      distribution: distributionData,
      trends: trendsData,
      topCategories
    };
  }, [transactions, selectedPeriod]);

  // Custom heatmap component
  const HeatmapChart = ({ data }: { data: HeatmapData[] }) => {
    const months = [...new Set(data.map(d => d.month))].sort();
    const categories = [...new Set(data.map(d => d.category))];
    
    const getIntensityColor = (intensity: number) => {
      if (intensity === 0) return '#F9FAFB';
      const colorIndex = Math.min(Math.floor((intensity / 100) * (HEATMAP_COLORS.length - 1)), HEATMAP_COLORS.length - 1);
      return HEATMAP_COLORS[colorIndex];
    };

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-1 gap-1" style={{ gridTemplateColumns: `120px repeat(${months.length}, 80px)` }}>
            {/* Header */}
            <div className="font-medium text-sm p-2"></div>
            {months.map(month => (
              <div key={month} className="font-medium text-xs p-2 text-center">
                {month}
              </div>
            ))}
            
            {/* Data rows */}
            {categories.map(category => (
              <>
                <div key={`${category}-label`} className="font-medium text-sm p-2 truncate">
                  {category}
                </div>
                {months.map(month => {
                  const cellData = data.find(d => d.month === month && d.category === category);
                  const intensity = cellData?.intensity || 0;
                  const amount = cellData?.amount || 0;
                  
                  return (
                    <div
                      key={`${category}-${month}`}
                      className="h-12 border border-gray-200 rounded flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                      style={{ backgroundColor: getIntensityColor(intensity) }}
                      title={`${category} - ${month}: €${amount.toFixed(0)}`}
                    >
                      {amount > 0 && (
                        <span className={intensity > 50 ? 'text-white' : 'text-gray-800'}>
                          €{amount.toFixed(0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (transactionsLoading || budgetsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Visualizzazioni Avanzate Budget
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analisi visiva approfondita dei pattern di spesa
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Ultimi 3 mesi</SelectItem>
                  <SelectItem value="6">Ultimi 6 mesi</SelectItem>
                  <SelectItem value="12">Ultimo anno</SelectItem>
                  <SelectItem value="24">Ultimi 2 anni</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Esporta
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Visualization Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView as any} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Confronti
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Distribuzione
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend Dettagliati
          </TabsTrigger>
        </TabsList>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mappa Calore Spese per Categoria</CardTitle>
              <p className="text-sm text-gray-600">
                Intensità della spesa per categoria nel tempo. Colori più scuri = spese maggiori.
              </p>
            </CardHeader>
            <CardContent>
              <HeatmapChart data={processedData.heatmap} />
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-gray-600">Intensità:</span>
                <div className="flex items-center gap-1">
                  {HEATMAP_COLORS.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-gray-600">Bassa → Alta</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confronto Mensile per Categoria</CardTitle>
              <p className="text-sm text-gray-600">
                Analisi comparativa delle spese mese per mese
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={processedData.comparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                    />
                    <Legend />
                    {processedData.topCategories?.slice(0, 6).map((category, index) => (
                      <Bar
                        key={category}
                        dataKey={category}
                        stackId="a"
                        fill={CHART_COLORS[index]}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.comparison.slice(-3).map((month, index) => {
              const total = Object.entries(month)
                .filter(([key]) => key !== 'period')
                .reduce((sum, [_, value]) => sum + (value as number), 0);
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{month.period}</h4>
                        <Badge variant="outline">{formatCurrency(total)}</Badge>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(month)
                          .filter(([key]) => key !== 'period')
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 3)
                          .map(([category, amount], idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="truncate">{category}</span>
                              <span className="font-medium">{formatCurrency(amount as number)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuzione Spese per Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedData.distribution.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {processedData.distribution.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spesa']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Graduatoria Categorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processedData.distribution.slice(0, 8).map((item, index) => {
                    const total = processedData.distribution.reduce((sum, d) => sum + d.value, 0);
                    const percentage = (item.value / total) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index] }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-gray-600">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: CHART_COLORS[index]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trend Dettagliati per Categoria</CardTitle>
              <p className="text-sm text-gray-600">
                Evoluzione temporale delle spese per le principali categorie
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                    />
                    <Legend />
                    {processedData.topCategories?.slice(0, 6).map((category, index) => (
                      <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={CHART_COLORS[index]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.topCategories?.slice(0, 6).map((category, index) => {
              const categoryData = processedData.trends.map(t => t[category] as number).filter(Boolean);
              const avgSpent = categoryData.reduce((sum, val) => sum + val, 0) / categoryData.length;
              const lastValue = categoryData[categoryData.length - 1] || 0;
              const trend = lastValue > avgSpent ? 'increasing' : 'decreasing';
              
              return (
                <Card key={category}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{category}</h4>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index] }}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Media mensile:</span>
                          <span className="font-medium">{formatCurrency(avgSpent)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Ultimo mese:</span>
                          <span className="font-medium">{formatCurrency(lastValue)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {trend === 'increasing' ? (
                            <TrendingUp className="w-4 h-4 text-red-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />
                          )}
                          <span className={trend === 'increasing' ? 'text-red-600' : 'text-green-600'}>
                            {trend === 'increasing' ? 'In aumento' : 'In diminuzione'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}