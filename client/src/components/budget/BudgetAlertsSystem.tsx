import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle, Bell, CheckCircle, TrendingUp, TrendingDown, Target,
  Clock, Zap, Shield, Activity, AlertCircle, XCircle, Info, Sparkles
} from 'lucide-react';
import { format, isThisMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

interface BudgetAlert {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  message: string;
  currentAmount: number;
  budgetAmount?: number;
  percentage?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  suggestions: string[];
  timestamp: Date;
  isActive: boolean;
  isRead: boolean;
}

interface CategoryBudgetStatus {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  remaining: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  trend: 'increasing' | 'decreasing' | 'stable';
  daysRemaining: number;
}

const alertTypeIcons = {
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle,
  info: Info
};

const alertTypeColors = {
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

export function BudgetAlertsSystem() {
  const { toast } = useToast();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'status' | 'trends'>('alerts');
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: categoryBudgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['/api/category-budgets'],
    queryFn: () => apiRequest('GET', '/api/category-budgets'),
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => apiRequest('GET', '/api/transactions?limit=500'),
  });

  const { data: budgetInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/budget-insights'],
    queryFn: () => apiRequest('GET', '/api/budget-insights'),
    enabled: alertsEnabled
  });

  // Calculate current month spending by category
  const currentMonthSpending = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const spending: Record<string, number> = {};

    transactions
      .filter((t: any) => 
        t.type === 'expense' && 
        t.date && 
        t.date.toString().startsWith(currentMonth)
      )
      .forEach((transaction: any) => {
        const category = transaction.category || 'Altri';
        spending[category] = (spending[category] || 0) + parseFloat(transaction.amount);
      });

    return spending;
  }, [transactions]);

  // Calculate budget status for each category
  const categoryBudgetStatus = useMemo((): CategoryBudgetStatus[] => {
    if (!Array.isArray(categoryBudgets)) {
      return [];
    }
    return categoryBudgets.map((budget: any) => {
      const spentAmount = currentMonthSpending[budget.category] || 0;
      const budgetAmount = parseFloat(budget.monthlyBudget);
      const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      const remaining = budgetAmount - spentAmount;

      let status: CategoryBudgetStatus['status'] = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 85) status = 'danger';
      else if (percentage >= 70) status = 'warning';

      // Calculate trend (simplified)
      const trend: CategoryBudgetStatus['trend'] = 'stable'; // Could be enhanced with historical data

      const now = new Date();
      const endOfMonthDate = endOfMonth(now);
      const daysRemaining = Math.ceil((endOfMonthDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        category: budget.category,
        budgetAmount,
        spentAmount,
        percentage,
        remaining,
        status,
        trend,
        daysRemaining
      };
    });
  }, [categoryBudgets, currentMonthSpending]);

  // Generate smart alerts
  const budgetAlerts = useMemo((): BudgetAlert[] => {
    const alerts: BudgetAlert[] = [];

    // Budget threshold alerts
    categoryBudgetStatus.forEach((status, index) => {
      if (status.status === 'exceeded') {
        alerts.push({
          id: `budget-exceeded-${status.category}`,
          type: 'danger',
          priority: 'critical',
          category: status.category,
          title: `Budget Superato: ${status.category}`,
          message: `Hai superato il budget di €${(status.spentAmount - status.budgetAmount).toFixed(2)}`,
          currentAmount: status.spentAmount,
          budgetAmount: status.budgetAmount,
          percentage: status.percentage,
          suggestions: [
            'Rivedi le spese in questa categoria',
            'Considera di trasferire budget da altre categorie',
            'Imposta un limite di spesa giornaliero più rigido'
          ],
          timestamp: new Date(),
          isActive: true,
          isRead: readAlerts.has(`budget-exceeded-${status.category}`)
        });
      } else if (status.status === 'danger') {
        alerts.push({
          id: `budget-warning-${status.category}`,
          type: 'warning',
          priority: 'high',
          category: status.category,
          title: `Attenzione Budget: ${status.category}`,
          message: `Hai utilizzato ${status.percentage.toFixed(1)}% del budget mensile`,
          currentAmount: status.spentAmount,
          budgetAmount: status.budgetAmount,
          percentage: status.percentage,
          suggestions: [
            'Monitora attentamente le prossime spese',
            'Considera di ridurre le spese non essenziali',
            `Hai ancora €${status.remaining.toFixed(2)} disponibili`
          ],
          timestamp: new Date(),
          isActive: true,
          isRead: readAlerts.has(`budget-warning-${status.category}`)
        });
      }

      // Pace alerts (spending too fast)
      if (status.daysRemaining > 0) {
        const dailyBudgetRemaining = status.remaining / status.daysRemaining;
        const dailySpendingRate = status.spentAmount / (30 - status.daysRemaining);
        
        if (dailySpendingRate > dailyBudgetRemaining * 1.5 && status.percentage > 50) {
          alerts.push({
            id: `pace-warning-${status.category}`,
            type: 'warning',
            priority: 'medium',
            category: status.category,
            title: `Ritmo di Spesa Elevato: ${status.category}`,
            message: `Al ritmo attuale, potresti superare il budget entro ${Math.ceil(status.remaining / dailySpendingRate)} giorni`,
            currentAmount: status.spentAmount,
            budgetAmount: status.budgetAmount,
            suggestions: [
              `Riduci la spesa giornaliera a €${dailyBudgetRemaining.toFixed(2)}`,
              'Pianifica le spese rimanenti del mese',
              'Considera di posticipare acquisti non urgenti'
            ],
            timestamp: new Date(),
            isActive: true,
            isRead: readAlerts.has(`pace-warning-${status.category}`)
          });
        }
      }
    });

    // Success alerts for good budget management
    categoryBudgetStatus.forEach((status) => {
      if (status.percentage < 50 && status.daysRemaining < 10 && status.budgetAmount > 0) {
        alerts.push({
          id: `budget-success-${status.category}`,
          type: 'success',
          priority: 'low',
          category: status.category,
          title: `Ottima Gestione: ${status.category}`,
          message: `Hai utilizzato solo ${status.percentage.toFixed(1)}% del budget!`,
          currentAmount: status.spentAmount,
          budgetAmount: status.budgetAmount,
          percentage: status.percentage,
          suggestions: [
            'Continua così!',
            'Potresti allocare parte del budget non utilizzato ad altre categorie',
            'Considera di aumentare i risparmi questo mese'
          ],
          timestamp: new Date(),
          isActive: true,
          isRead: readAlerts.has(`budget-success-${status.category}`)
        });
      }
    });

    // Insights-based alerts
    if (budgetInsights?.alerts) {
      budgetInsights.alerts.forEach((insight: any, index: number) => {
        alerts.push({
          id: `insight-alert-${index}`,
          type: insight.type === 'warning' ? 'warning' : 'info',
          priority: insight.severity === 'high' ? 'high' : 'medium',
          category: insight.category,
          title: `Trend Alert: ${insight.category}`,
          message: insight.message,
          currentAmount: 0,
          trend: insight.type === 'warning' ? 'increasing' : 'decreasing',
          suggestions: [
            'Analizza i trend di spesa',
            'Rivedi le transazioni recenti',
            'Considera di aggiustare il budget'
          ],
          timestamp: new Date(),
          isActive: true,
          isRead: readAlerts.has(`insight-alert-${index}`)
        });
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [categoryBudgetStatus, budgetInsights, readAlerts]);

  // Mark alert as read
  const markAsRead = (alertId: string) => {
    setReadAlerts(prev => new Set([...prev, alertId]));
  };

  // Show notification for new critical alerts
  useEffect(() => {
    if (alertsEnabled) {
      const criticalAlerts = budgetAlerts.filter(alert => 
        alert.priority === 'critical' && !alert.isRead
      );
      
      criticalAlerts.forEach(alert => {
        toast({
          title: "🚨 Alert Critico Budget",
          description: alert.message,
          variant: "destructive",
        });
      });
    }
  }, [budgetAlerts, alertsEnabled, toast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: CategoryBudgetStatus['status']) => {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-orange-600';
      case 'exceeded': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 85) return 'bg-orange-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (budgetsLoading || transactionsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadAlertsCount = budgetAlerts.filter(alert => !alert.isRead).length;
  const criticalAlertsCount = budgetAlerts.filter(alert => alert.priority === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Sistema Alert Budget
                {unreadAlertsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadAlertsCount}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Monitoraggio intelligente del budget con alert personalizzati
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Alert Attivi</span>
                <Switch
                  checked={alertsEnabled}
                  onCheckedChange={setAlertsEnabled}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Alerts Banner */}
      {criticalAlertsCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Attenzione!</strong> Hai {criticalAlertsCount} alert{criticalAlertsCount > 1 ? ' critici' : ' critico'} che richiede{criticalAlertsCount > 1 ? 'ono' : ''} immediata attenzione.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab as any}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alert ({budgetAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Stato Budget
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {budgetAlerts.length > 0 ? (
            <div className="space-y-3">
              {budgetAlerts.map((alert, index) => {
                const IconComponent = alertTypeIcons[alert.type];
                return (
                  <Card 
                    key={alert.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !alert.isRead ? 'ring-2 ring-blue-200' : ''
                    }`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${alertTypeColors[alert.type]}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{alert.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={priorityColors[alert.priority]} variant="outline">
                                {alert.priority.toUpperCase()}
                              </Badge>
                              {!alert.isRead && (
                                <Badge variant="default" className="text-xs">Nuovo</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          
                          {alert.budgetAmount && (
                            <div className="flex items-center gap-4 text-sm">
                              <span>Speso: <strong>{formatCurrency(alert.currentAmount)}</strong></span>
                              <span>Budget: <strong>{formatCurrency(alert.budgetAmount)}</strong></span>
                              {alert.percentage && (
                                <span className={getStatusColor(
                                  alert.percentage >= 100 ? 'exceeded' :
                                  alert.percentage >= 85 ? 'danger' :
                                  alert.percentage >= 70 ? 'warning' : 'safe'
                                )}>
                                  {alert.percentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}

                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-gray-700">Suggerimenti:</h5>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {alert.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Tutto sotto controllo!</h3>
                <p className="text-gray-600">
                  Non ci sono alert attivi. Il tuo budget è ben gestito.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Budget Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4">
            {categoryBudgetStatus.map((status, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{status.category}</h4>
                      <Badge className={getStatusColor(status.status)} variant="outline">
                        {status.status === 'safe' ? 'OK' :
                         status.status === 'warning' ? 'Attenzione' :
                         status.status === 'danger' ? 'Pericolo' :
                         'Superato'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Speso: {formatCurrency(status.spentAmount)}</span>
                        <span>Budget: {formatCurrency(status.budgetAmount)}</span>
                      </div>
                      <Progress 
                        value={Math.min(status.percentage, 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{status.percentage.toFixed(1)}% utilizzato</span>
                        <span>
                          {status.remaining > 0 ? `€${status.remaining.toFixed(0)} rimanenti` : `€${Math.abs(status.remaining).toFixed(0)} superati`}
                        </span>
                      </div>
                    </div>

                    {status.daysRemaining > 0 && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {status.daysRemaining} giorni rimanenti nel mese
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {budgetInsights?.spendingTrends ? (
            <div className="grid gap-4">
              {Object.entries(budgetInsights.spendingTrends).map(([category, trend]: [string, any]) => (
                <Card key={category}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{category}</h4>
                        <p className="text-sm text-gray-600">
                          {trend.trend === 'increasing' ? 'In aumento' : 'In diminuzione'} del {Math.abs(parseFloat(trend.percentage)).toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trend.trend === 'increasing' ? (
                          <TrendingUp className="w-5 h-5 text-red-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-green-500" />
                        )}
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(trend.lastAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            vs {formatCurrency(trend.previousAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Dati Trend Non Disponibili</h3>
                <p className="text-gray-600">
                  Aggiungi più transazioni per vedere i trend di spesa dettagliati.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}