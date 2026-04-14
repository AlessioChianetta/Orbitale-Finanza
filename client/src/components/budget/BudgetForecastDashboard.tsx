import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Area, AreaChart, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calculator, Target, Zap, AlertTriangle,
  Calendar, BarChart3, Activity, Brain, Sparkles, Clock, ArrowUp, ArrowDown
} from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface ForecastData {
  category: string;
  monthKey: string;
  forecastedAmount: number;
  confidence: number;
  methodology: string;
  basedOnMonths: number;
}

interface TrendData {
  month: string;
  [category: string]: string | number;
}

interface CategoryInsight {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  confidence: number;
  recommendation: string;
  alert?: {
    type: 'warning' | 'info' | 'success';
    message: string;
  };
}

const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export function BudgetForecastDashboard() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('3'); // months ahead
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'trends' | 'forecasts' | 'insights'>('trends');

  // Fetch transaction data for analysis
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/transactions?limit=10000', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });

  // Fetch existing forecasts
  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ['/api/budget-forecasts'],
    queryFn: () => apiRequest('GET', '/api/budget-forecasts'),
  });

  // Fetch budget insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/budget-insights'],
    queryFn: () => apiRequest('GET', '/api/budget-insights'),
  });

  // Generate forecasts mutation
  const generateForecastsMutation = useMutation({
    mutationFn: (data: { categories: string[], monthsAhead: number }) =>
      apiRequest('POST', '/api/budget-forecasts/generate', data),
    onSuccess: () => {
      toast({
        title: "🔮 Previsioni Generate",
        description: "Le previsioni budget sono state create con successo!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-forecasts'] });
    },
    onError: () => {
      toast({
        title: "❌ Errore",
        description: "Errore nella generazione delle previsioni.",
        variant: "destructive",
      });
    }
  });

  // Process transaction data for trends
  const trendData = useMemo(() => {
    if (!transactions.length) return [];

    const monthlyData: Record<string, Record<string, number>> = {};
    
    transactions
      .filter((t: any) => t.type === 'expense' && t.date)
      .forEach((transaction: any) => {
        const monthKey = transaction.date.toString().slice(0, 7);
        const category = transaction.category || 'Altri';
        
        if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
        monthlyData[monthKey][category] = (monthlyData[monthKey][category] || 0) + parseFloat(transaction.amount);
      });

    // Convert to chart format
    const months = Object.keys(monthlyData).sort().slice(-12); // Last 12 months
    return months.map(month => {
      const data: TrendData = { month };
      Object.entries(monthlyData[month] || {}).forEach(([category, amount]) => {
        data[category] = amount;
      });
      return data;
    });
  }, [transactions]);

  // Get available categories from transactions
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => categories.add(t.category || 'Altri'));
    return Array.from(categories).sort();
  }, [transactions]);

  // Process insights for category analysis
  const categoryInsights = useMemo(() => {
    if (!insights?.spendingTrends) return [];

    return Object.entries(insights.spendingTrends).map(([category, data]: [string, any]) => ({
      category,
      trend: data.trend,
      trendPercentage: parseFloat(data.percentage),
      confidence: 75, // Could be calculated based on data quality
      recommendation: generateRecommendation(data.trend, parseFloat(data.percentage)),
      alert: generateAlert(data.trend, parseFloat(data.percentage))
    }));
  }, [insights]);

  // Helper functions
  function generateRecommendation(trend: string, percentage: number): string {
    if (trend === 'increasing' && percentage > 20) {
      return "Considera di rivedere questa categoria e impostare un budget più rigoroso.";
    } else if (trend === 'decreasing' && percentage < -10) {
      return "Ottimo controllo della spesa! Potresti riallocare il budget risparmiato.";
    } else if (Math.abs(percentage) < 5) {
      return "Spesa stabile. Continua a monitorare per mantenere il controllo.";
    }
    return "Monitora attentamente i cambiamenti in questa categoria.";
  }

  function generateAlert(trend: string, percentage: number) {
    if (trend === 'increasing' && percentage > 30) {
      return {
        type: 'warning' as const,
        message: `Aumento significativo del ${percentage.toFixed(1)}%`
      };
    } else if (trend === 'decreasing' && percentage < -20) {
      return {
        type: 'success' as const,
        message: `Ottimo risparmio del ${Math.abs(percentage).toFixed(1)}%`
      };
    }
    return undefined;
  }

  const handleGenerateForecasts = () => {
    const categories = selectedCategories.length > 0 ? selectedCategories : availableCategories.slice(0, 5);
    generateForecastsMutation.mutate({
      categories,
      monthsAhead: parseInt(selectedPeriod)
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthKey: string) => {
    try {
      return format(parseISO(monthKey + '-01'), 'MMM yyyy', { locale: it });
    } catch {
      return monthKey;
    }
  };

  if (transactionsLoading || forecastsLoading || insightsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
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
                <Brain className="w-5 h-5 text-purple-600" />
                Dashboard Previsioni Budget
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analisi avanzata dei trend di spesa e previsioni intelligenti
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mese</SelectItem>
                  <SelectItem value="3">3 mesi</SelectItem>
                  <SelectItem value="6">6 mesi</SelectItem>
                  <SelectItem value="12">12 mesi</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerateForecasts}
                disabled={generateForecastsMutation.isPending}
                className="flex items-center gap-2"
              >
                {generateForecastsMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Genera Previsioni
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode as any} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend Storici
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Previsioni
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-blue-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Spesa Media Mensile</p>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {formatCurrency(
                        trendData.reduce((sum, month) => {
                          const monthTotal = Object.entries(month)
                            .filter(([key]) => key !== 'month')
                            .reduce((total, [_, value]) => total + (value as number), 0);
                          return sum + monthTotal;
                        }, 0) / Math.max(trendData.length, 1)
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Activity className="w-3 h-3" />
                      <span>Basato su {trendData.length} {trendData.length === 1 ? 'mese' : 'mesi'}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center opacity-20"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 via-white to-green-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Categorie Attive</p>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      {availableCategories.length}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Target className="w-3 h-3" />
                      <span>Con transazioni registrate</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center opacity-20"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-white to-purple-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Previsioni Generate</p>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      {forecasts.length}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Sparkles className="w-3 h-3" />
                      <span>Analisi predittiva attiva</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center opacity-20"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Trends Chart */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-white to-gray-50">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Trend Spesa per Categoria
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Analisi storica degli ultimi {trendData.length} {trendData.length === 1 ? 'mese' : 'mesi'} - 
                    Top {Math.min(5, availableCategories.length)} categorie
                  </p>
                </div>
                <Badge variant="outline" className="self-start sm:self-center px-3 py-1.5 bg-white">
                  <Activity className="w-3 h-3 mr-1.5" />
                  Aggiornato in tempo reale
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        {availableCategories.slice(0, 5).map((category, index) => (
                          <linearGradient key={`gradient-${category}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS[index]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={CHART_COLORS[index]} stopOpacity={0.1}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={formatMonth}
                        stroke="#9ca3af"
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => formatCurrency(value)}
                        stroke="#9ca3af"
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                        labelFormatter={formatMonth}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                          padding: '12px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      {availableCategories.slice(0, 5).map((category, index) => (
                        <Area
                          key={category}
                          type="monotone"
                          dataKey={category}
                          stackId="1"
                          stroke={CHART_COLORS[index]}
                          fill={`url(#color-${index})`}
                          strokeWidth={2}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessun Dato Disponibile</h3>
                  <p className="text-gray-500 max-w-md">
                    Aggiungi transazioni per visualizzare i trend di spesa nel tempo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Performance Summary */}
          {availableCategories.length > 0 && (
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Performance Categorie (Top 5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableCategories.slice(0, 5).map((category, index) => {
                    const categoryTotal = trendData.reduce((sum, month) => {
                      return sum + ((month[category] as number) || 0);
                    }, 0);
                    const avgMonthly = categoryTotal / Math.max(trendData.length, 1);

                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: CHART_COLORS[index] }}
                          ></div>
                          <span className="font-medium text-gray-700">{category}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{formatCurrency(avgMonthly)}</p>
                          <p className="text-xs text-gray-500">media/mese</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          {forecasts.length > 0 ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Previsioni Future</CardTitle>
                  <p className="text-sm text-gray-600">
                    Previsioni generate basate sui dati storici degli ultimi mesi
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecasts.slice(0, 15)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="monthKey" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={formatMonth}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Previsione']}
                          labelFormatter={formatMonth}
                        />
                        <Bar dataKey="forecastedAmount" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Dettaglio Previsioni per Categoria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forecasts.slice(0, 6).map((forecast: any, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{forecast.category}</h4>
                            <Badge variant="outline" className="text-xs">
                              {formatMonth(forecast.monthKey)}
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(parseFloat(forecast.forecastedAmount))}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">
                              {parseFloat(forecast.confidence).toFixed(0)}% fiducia
                            </Badge>
                            <span className="text-gray-500">
                              {forecast.methodology === 'trend_analysis' ? 'Trend' : forecast.methodology}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna Previsione Disponibile</h3>
                <p className="text-gray-600 mb-4">
                  Genera previsioni intelligenti basate sui tuoi dati storici di spesa
                </p>
                <Button onClick={handleGenerateForecasts} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Genera Prime Previsioni
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {categoryInsights.length > 0 ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryInsights.map((insight, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.category}</h4>
                          <div className="flex items-center gap-1">
                            {insight.trend === 'increasing' ? (
                              <ArrowUp className="w-4 h-4 text-red-500" />
                            ) : insight.trend === 'decreasing' ? (
                              <ArrowDown className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 bg-gray-400 rounded-full" />
                            )}
                            <span className={`text-sm font-medium ${
                              insight.trend === 'increasing' ? 'text-red-600' : 
                              insight.trend === 'decreasing' ? 'text-green-600' : 
                              'text-gray-600'
                            }`}>
                              {Math.abs(insight.trendPercentage).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {insight.alert && (
                          <Alert className={
                            insight.alert.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                            insight.alert.type === 'success' ? 'border-green-200 bg-green-50' :
                            'border-blue-200 bg-blue-50'
                          }>
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>{insight.alert.message}</AlertDescription>
                          </Alert>
                        )}

                        <div className="text-sm text-gray-600">
                          <p>{insight.recommendation}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% accuratezza
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              insight.trend === 'increasing' ? 'text-red-600' :
                              insight.trend === 'decreasing' ? 'text-green-600' :
                              'text-gray-600'
                            }`}
                          >
                            {insight.trend === 'increasing' ? 'In Aumento' :
                             insight.trend === 'decreasing' ? 'In Diminuzione' :
                             'Stabile'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Insights Non Disponibili</h3>
                <p className="text-gray-600">
                  Aggiungi più transazioni per generare insights dettagliati sui tuoi pattern di spesa
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}