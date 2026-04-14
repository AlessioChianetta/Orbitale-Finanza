import { useState } from "react";
import { safeFloat, safeInt, getLocalDateString, dateToLocalString } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatEuro, futureValue, requiredMonthlyContribution, timeToGoal } from "@/lib/financial";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Euro, 
  Calculator, 
  Edit,
  Trash2,
  BarChart3,
  FileText,
  Home,
  Car,
  GraduationCap,
  Shield,
  Plane,
  PieChart,
  LineChart,
  PiggyBank,
  Trophy,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Goal {
  id: number;
  userId: number;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  priority: number;
  riskProfile?: string;
  expectedReturn?: number;
  createdAt: string;
  updatedAt: string;
}

interface GoalTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  defaultAmount?: number;
  defaultTimeframe?: number;
  priority: number;
}

function calculateRiskProfile(answers: Record<string, number>): { profile: string; expectedReturn: number } {
  const avgScore = Object.values(answers).reduce((sum, score) => sum + score, 0) / Object.values(answers).length;

  if (avgScore <= 2) return { profile: 'Conservativo', expectedReturn: 0.06 }; // 6%
  if (avgScore <= 3.5) return { profile: 'Moderato', expectedReturn: 0.08 }; // 8%
  return { profile: 'Aggressivo', expectedReturn: 0.10 }; // 10%
}

function CompoundGrowthChart({ 
  currentAmount, 
  monthlyContribution, 
  targetAmount, 
  expectedReturn, 
  targetDate 
}: {
  currentAmount: number;
  monthlyContribution: number;
  targetAmount: number;
  expectedReturn: number;
  targetDate: string;
}) {
  const today = new Date();
  const endDate = new Date(targetDate);
  const totalMonths = Math.max(12, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  // Ensure numeric values and fix expectedReturn calculation
  const numCurrentAmount = Number(currentAmount) || 0;
  const numMonthlyContribution = Number(monthlyContribution) || 0;
  const numTargetAmount = Number(targetAmount) || 0;
  // expectedReturn should be already in decimal format (0.10 = 10%)
  const numExpectedReturn = Number(expectedReturn) || 0.10;

  // Calculate required monthly contribution if none provided
  const remainingAmount = Math.max(0, numTargetAmount - numCurrentAmount);
  const requiredContribution = remainingAmount > 0 ? 
    requiredMonthlyContribution(numTargetAmount, numCurrentAmount, totalMonths, numExpectedReturn) : 0;

  // Use actual contribution or calculated required amount for visualization
  const displayContribution = numMonthlyContribution > 0 ? numMonthlyContribution : requiredContribution;

  const chartData = [];
  let balance = numCurrentAmount;
  let totalContributions = numCurrentAmount;

  // Generate monthly data points
  for (let month = 0; month <= totalMonths; month++) {
    if (month > 0) {
      // Apply monthly interest first
      balance = balance * (1 + numExpectedReturn / 12);
      // Add monthly contribution
      balance += displayContribution;
      totalContributions += displayContribution;
    }

    // Add data point every 6 months for cleaner visualization
    if (month % 6 === 0 || month === totalMonths) {
      const gains = balance - totalContributions;
      chartData.push({
        year: Math.floor(month / 12),
        month: month,
        totalValue: Math.round(balance),
        contributions: Math.round(totalContributions),
        gains: Math.round(Math.max(0, gains)),
        period: month === 0 ? 'Inizio' : `Anno ${Math.floor(month / 12)}`,
        isProjection: numMonthlyContribution === 0
      });
    }
  }

  const finalData = chartData[chartData.length - 1];
  const willReachTarget = finalData?.totalValue >= numTargetAmount;

  // Calculate performance metrics
  const totalContributed = (finalData?.contributions || numCurrentAmount) - numCurrentAmount;
  const totalGains = finalData?.gains || 0;
  const totalReturn = totalContributed > 0 ? ((totalGains / totalContributed) * 100) : 0;
  const capitalMultiplier = totalContributed > 0 ? (finalData?.totalValue || 0) / totalContributed : 1;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="year" 
              tickFormatter={(value) => `Anno ${value}`}
              className="text-xs"
            />
            <YAxis 
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              className="text-xs"
              domain={[0, 'dataMax + 1000']}
            />
            <Tooltip 
              formatter={(value: any, name: string) => {
                const labels = {
                  'contributions': 'Contributi Totali',
                  'gains': 'Guadagni da Interessi',
                  'totalValue': 'Valore Totale'
                };
                return [formatEuro(value), labels[name as keyof typeof labels] || name];
              }}
              labelFormatter={(year) => `Anno ${year}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="contributions" 
              stackId="1" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.7}
              name="contributions"
            />
            <Area 
              type="monotone" 
              dataKey="gains" 
              stackId="1" 
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.8}
              name="gains"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-600 mb-1">Deposito Iniziale</p>
          <p className="text-lg font-bold text-blue-700">{formatEuro(currentAmount)}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg text-center">
          <p className="text-sm text-indigo-600 mb-1">
            {monthlyContribution > 0 ? 'Contributi Attuali' : 'Contributi Necessari'}
          </p>
          <p className="text-lg font-bold text-indigo-700">
            {formatEuro((finalData?.contributions || currentAmount) - numCurrentAmount)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-green-600 mb-1">Guadagni da Interessi</p>
          <p className="text-lg font-bold text-green-700">{formatEuro(finalData?.gains || 0)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-sm text-purple-600 mb-1">Capitale Finale</p>
          <p className="text-lg font-bold text-purple-700">{formatEuro(finalData?.totalValue || targetAmount)}</p>
        </div>
      </div>

      {numMonthlyContribution === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Calculator className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Contributo Mensile Suggerito</p>
              <p className="text-sm text-yellow-700 mt-1">
                Per raggiungere {formatEuro(numTargetAmount)} entro la data target, dovresti investire circa{' '}
                <span className="font-bold">{formatEuro(displayContribution)}/mese</span>.
                Questo grafico mostra una proiezione basata su questo contributo suggerito.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analysis */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisi Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Durata investimento:</p>
            <p className="text-lg font-bold text-gray-900">{Math.floor(totalMonths / 12)} anni, {totalMonths % 12} mesi</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Contributo mensile:</p>
            <p className="text-lg font-bold text-gray-900">{formatEuro(displayContribution)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Rendimento totale:</p>
            <p className="text-lg font-bold text-green-600">{totalReturn.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Moltiplicatore capitale:</p>
            <p className="text-lg font-bold text-blue-600">{capitalMultiplier.toFixed(1)}x</p>
          </div>
        </div>
      </div>

      {/* Target Achievement Status */}
      <div className={`p-4 rounded-lg border ${willReachTarget ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold ${willReachTarget ? 'text-green-800' : 'text-yellow-800'}`}>
              {willReachTarget ? '🎯 Obiettivo Raggiungibile!' : '⚠️ Obiettivo Non Raggiungibile'}
            </p>
            <p className={`text-sm ${willReachTarget ? 'text-green-600' : 'text-yellow-600'}`}>
              {willReachTarget 
                ? `Raggiungerai ${formatEuro(finalData?.totalValue || 0)} superando l'obiettivo di ${formatEuro(targetAmount)}`
                : `Ti mancheranno ${formatEuro(targetAmount - (finalData?.totalValue || 0))} per raggiungere l'obiettivo`
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-medium-gray">Tasso di interesse annuale</p>
            <p className="font-bold text-trust-blue">{(numExpectedReturn * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Investment Performance Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-dark-gray mb-3">Analisi Performance</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-medium-gray">Durata investimento:</p>
            <p className="font-medium">{Math.floor(totalMonths / 12)} anni, {totalMonths % 12} mesi</p>
          </div>
          <div>
            <p className="text-medium-gray">Contributo mensile:</p>
            <p className="font-medium">{formatEuro(monthlyContribution)}</p>
          </div>
          <div>
            <p className="text-medium-gray">Rendimento totale:</p>
            <p className="font-medium text-growth-green">
              {finalData ? (((finalData.totalValue - finalData.contributions) / finalData.contributions) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div>
            <p className="text-medium-gray">Moltiplicatore capitale:</p>
            <p className="font-medium text-trust-blue">
              {finalData && finalData.contributions > 0 ? (finalData.totalValue / finalData.contributions).toFixed(1) : '1.0'}x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionsDialog({ trigger, onUpdate }: { trigger: React.ReactNode; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionData, setTransactionData] = useState({
    type: 'income',
    amount: '',
    description: '',
    category: ''
  });
  const { toast } = useToast();

  const addTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      onUpdate();
      toast({
        title: "Transazione aggiunta!",
        description: "La transazione è stata registrata."
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setTransactionData({
      type: 'income',
      amount: '',
      description: '',
      category: ''
    });
  };

  const handleAddTransaction = () => {
    if (!transactionData.amount || !transactionData.category) {
      toast({
        title: "Campi mancanti",
        description: "Inserisci importo e categoria.",
        variant: "destructive"
      });
      return;
    }

    addTransactionMutation.mutate({
      ...transactionData,
      amount: safeFloat(transactionData.amount),
      date: getLocalDateString()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-trust-blue" />
            <span>Azioni Rapide</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select 
                value={transactionData.type} 
                onValueChange={(value) => setTransactionData({...transactionData, type: value})}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">💰 Entrata</SelectItem>
                  <SelectItem value="expense">💸 Spesa</SelectItem>
                  <SelectItem value="investment">📈 Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Importo (€)</Label>
              <Input
                type="number"
                step="0.01"
                className="h-8"
                value={transactionData.amount}
                onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Input
              className="h-8"
              value={transactionData.category}
              onChange={(e) => setTransactionData({...transactionData, category: e.target.value})}
              placeholder="Es. Stipendio, Spesa, ETF..."
            />
          </div>
          <div>
            <Label className="text-xs">Descrizione</Label>
            <Input
              className="h-8"
              value={transactionData.description}
              onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
              placeholder="Descrizione opzionale"
            />
          </div>
          <Button 
            onClick={handleAddTransaction}
            disabled={addTransactionMutation.isPending}
            className="w-full h-8 bg-trust-blue hover:bg-blue-600"
          >
            {addTransactionMutation.isPending ? "Aggiungendo..." : "Aggiungi Transazione"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoalDetailDialog({ goal, trigger }: { goal: Goal; trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAction, setDeleteAction] = useState<'return' | 'transfer' | 'convert' | null>(null);
  const [targetGoalId, setTargetGoalId] = useState<number | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<string | null>(null);
  const [updateData, setUpdateData] = useState({
    currentAmount: goal.currentAmount.toString(),
    monthlyContribution: goal.monthlyContribution.toString(),
    targetDate: goal.targetDate,
    expectedReturn: ((goal.expectedReturn || 0.10) * 100).toString() // Convert to percentage for display
  });
  const { toast } = useToast();

  const { data: allGoals } = useQuery<Goal[]>({
    queryKey: ['/api/goals']
  });

  const { data: customAccounts } = useQuery<any[]>({
    queryKey: ['/api/custom-accounts']
  });

  const { data: investments } = useQuery<any[]>({
    queryKey: ['/api/investments']
  });

  const otherGoals = allGoals?.filter(g => g.id !== goal.id) || [];

  // Filter investments linked to this goal
  const linkedInvestments = (investments || []).filter((inv: any) => inv.goalId === goal.id);

  const updateGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/goals/${goal.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Obiettivo aggiornato!",
        description: "Le modifiche sono state salvate."
      });
      setShowUpdate(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      let url = `/api/goals/${goal.id}`;
      const params = new URLSearchParams();



      if (deleteAction) {
        params.append('action', deleteAction);
        if (deleteAction === 'transfer' && targetGoalId) {
          params.append('targetGoalId', targetGoalId.toString());
        }
        if (deleteAction === 'return' && targetAccountId) {
          params.append('targetAccountId', targetAccountId);
        }
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }



      const response = await apiRequest('DELETE', url);
      // Handle 204 No Content response (successful deletion with no body)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Obiettivo eliminato",
        description: deleteAction === 'return' 
          ? "I fondi sono stati restituiti alla tua liquidità"
          : deleteAction === 'transfer'
          ? "I fondi sono stati trasferiti all'altro obiettivo"
          : "I fondi sono stati convertiti in investimento generico"
      });
      setShowDeleteConfirm(false);
      setDeleteAction(null);
      setTargetGoalId(null);
      setIsOpen(false);
    },
    onError: (error: Error) => {
      console.log("Delete goal error:", error.message);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    if (goal.currentAmount > 0) {
      setShowDeleteConfirm(true);
    } else {
      deleteGoalMutation.mutate();
    }
  };

  const confirmDelete = () => {
    if (deleteAction === 'transfer' && !targetGoalId) {
      toast({
        title: "Seleziona obiettivo",
        description: "Devi selezionare un obiettivo di destinazione per il trasferimento",
        variant: "destructive"
      });
      return;
    }

    deleteGoalMutation.mutate();
  };

  const handleUpdate = () => {
    updateGoalMutation.mutate({
      currentAmount: safeFloat(updateData.currentAmount),
      monthlyContribution: safeFloat(updateData.monthlyContribution),
      targetDate: updateData.targetDate,
      expectedReturn: safeFloat(updateData.expectedReturn) / 100 // Convert percentage back to decimal
    });
  };

  const progressPercentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remainingMonths = Math.max(0, (() => { const p = goal.targetDate?.split('-'); if (p?.length === 3) { return Math.ceil((new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2])).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)); } return 0; })());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-trust-blue" />
              <span>{goal.name}</span>
            </DialogTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpdate(!showUpdate)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifica
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteGoalMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Elimina
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-medium-gray">Obiettivo</p>
              <p className="text-lg font-bold text-trust-blue">{formatEuro(goal.targetAmount)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-medium-gray">Attuale</p>
              <p className="text-lg font-bold text-growth-green">{formatEuro(goal.currentAmount)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-medium-gray">Progresso</p>
              <p className="text-lg font-bold text-purple-600">{progressPercentage.toFixed(1)}%</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-medium-gray">Tempo rimanente</p>
              <p className="text-lg font-bold text-orange-600">
                {remainingMonths > 12 
                  ? `${Math.floor(remainingMonths / 12)}a ${remainingMonths % 12}m`
                  : `${remainingMonths}m`
                }
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso verso l'obiettivo</span>
              <span className="font-medium">{formatEuro(goal.targetAmount - goal.currentAmount)} rimanenti</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Linked Investments Section */}
          {goal.type === 'investment' && linkedInvestments.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-trust-blue" />
                Investimenti Collegati
              </h4>
              <div className="space-y-3">
                {linkedInvestments.map((investment) => {
                  // Use the correct field names from the API response
                  const quantity = safeFloat(investment.shares?.toString() || investment.quantity?.toString());
                  const currentPrice = safeFloat(investment.currentPrice?.toString());
                  const averagePrice = safeFloat(investment.purchasePrice?.toString() || investment.averagePrice?.toString());
                  const totalValue = safeFloat(investment.totalValue?.toString() || (quantity * currentPrice).toString());
                  const totalCost = quantity * averagePrice;
                  const gainLoss = totalValue - totalCost;
                  const gainLossPercentage = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

                  return (
                    <div key={investment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-dark-gray">{investment.name}</h5>
                          <p className="text-sm text-medium-gray">{investment.symbol} • {investment.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatEuro(totalValue)}</p>
                          <p className={`text-sm font-medium ${gainLoss >= 0 ? 'text-growth-green' : 'text-red-600'}`}>
                            {gainLoss >= 0 ? '+' : ''}{formatEuro(gainLoss)} ({gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-medium-gray">Quantità</p>
                          <p className="font-medium">{quantity}</p>
                        </div>
                        <div>
                          <p className="text-medium-gray">Prezzo Medio</p>
                          <p className="font-medium">{formatEuro(averagePrice)}</p>
                        </div>
                        <div>
                          <p className="text-medium-gray">Prezzo Attuale</p>
                          <p className="font-medium">{formatEuro(currentPrice)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Total Portfolio Value Summary */}
                <div className="bg-trust-blue/10 p-4 rounded-lg border border-trust-blue/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-medium-gray">Valore Totale Portfolio</p>
                      <p className="text-lg font-bold text-trust-blue">
                        {formatEuro(linkedInvestments.reduce((sum, inv) => {
                          // Use totalValue from API if available, otherwise calculate
                          const totalValue = safeFloat(inv.totalValue?.toString());
                          if (totalValue > 0) return sum + totalValue;

                          const quantity = safeFloat(inv.shares?.toString() || inv.quantity?.toString());
                          const currentPrice = safeFloat(inv.currentPrice?.toString());
                          return sum + (quantity * currentPrice);
                        }, 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-medium-gray">Rendimento Totale</p>
                      <p className={`font-bold ${
                        linkedInvestments.reduce((sum, inv) => {
                          // Use totalReturn from API if available
                          const totalReturn = safeFloat(inv.totalReturn?.toString());
                          if (totalReturn !== 0) return sum + totalReturn;

                          const quantity = safeFloat(inv.shares?.toString() || inv.quantity?.toString());
                          const currentPrice = safeFloat(inv.currentPrice?.toString());
                          const averagePrice = safeFloat(inv.purchasePrice?.toString() || inv.averagePrice?.toString());
                          return sum + (quantity * (currentPrice - averagePrice));
                        }, 0) >= 0 ? 'text-growth-green' : 'text-red-600'
                      }`}>
                        {(() => {
                          const totalGainLoss = linkedInvestments.reduce((sum, inv) => {
                            // Use totalReturn from API if available
                            const totalReturn = safeFloat(inv.totalReturn?.toString());
                            if (totalReturn !== 0) return sum + totalReturn;

                            const quantity = safeFloat(inv.shares?.toString() || inv.quantity?.toString());
                            const currentPrice = safeFloat(inv.currentPrice?.toString());
                            const averagePrice = safeFloat(inv.purchasePrice?.toString() || inv.averagePrice?.toString());
                            return sum + (quantity * (currentPrice - averagePrice));
                          }, 0);
                          const totalCost = linkedInvestments.reduce((sum, inv) => {
                            const quantity = safeFloat(inv.shares?.toString() || inv.quantity?.toString());
                            const averagePrice = safeFloat(inv.purchasePrice?.toString() || inv.averagePrice?.toString());
                            return sum + (quantity * averagePrice);
                          }, 0);
                          const totalPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
                          return `${totalGainLoss >= 0 ? '+' : ''}${formatEuro(totalGainLoss)} (${totalPercentage >= 0 ? '+' : ''}${totalPercentage.toFixed(2)}%)`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compound Growth Chart */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Proiezione Crescita</h4>
            <CompoundGrowthChart
              currentAmount={goal.currentAmount}
              monthlyContribution={goal.monthlyContribution}
              targetAmount={goal.targetAmount}
              expectedReturn={safeFloat(goal.expectedReturn?.toString(), 0.10)}
              targetDate={goal.targetDate}
            />
          </div>

          {/* Update Form */}
          {showUpdate && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-4">Aggiorna Obiettivo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Importo Attuale (€)</Label>
                  <Input
                    type="number"
                    value={updateData.currentAmount}
                    onChange={(e) => setUpdateData({...updateData, currentAmount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Contributo Mensile (€)</Label>
                  <Input
                    type="number"
                    value={updateData.monthlyContribution}
                    onChange={(e) => setUpdateData({...updateData, monthlyContribution: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data Obiettivo</Label>
                  <Input
                    type="date"
                    value={updateData.targetDate}
                    onChange={(e) => setUpdateData({...updateData, targetDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Rendimento Annuo Atteso (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={updateData.expectedReturn}
                    onChange={(e) => setUpdateData({...updateData, expectedReturn: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={handleUpdate}
                  disabled={updateGoalMutation.isPending}
                  className="bg-trust-blue hover:bg-blue-600"
                >
                  {updateGoalMutation.isPending ? "Aggiornando..." : "Aggiorna"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowUpdate(false)}
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Elimina Obiettivo</h3>
              <p className="text-medium-gray mb-4">
                Questo obiettivo contiene <strong>{formatEuro(goal.currentAmount)}</strong>. 
                Cosa vuoi fare con questi fondi?
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="delete"
                    checked={deleteAction === 'delete'}
                    onChange={(e) => setDeleteAction(e.target.value as 'delete')}
                    className="text-trust-blue"
                  />
                  <div>
                    <p className="font-medium">🗑️ Elimina senza trasferire fondi</p>
                    <p className="text-sm text-medium-gray">I fondi vengono eliminati permanentemente senza essere trasferiti</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="return"
                    checked={deleteAction === 'return'}
                    onChange={(e) => setDeleteAction(e.target.value as 'return')}
                    className="text-trust-blue"
                  />
                  <div className="flex-1">
                    <p className="font-medium">💰 Ritorna alla liquidità</p>
                    <p className="text-sm text-medium-gray">I fondi tornano disponibili per altri usi</p>
                    {deleteAction === 'return' && (
                      <select
                        value={targetAccountId || ''}
                        onChange={(e) => setTargetAccountId(e.target.value || null)}
                        className="mt-2 w-full p-2 border rounded"
                      >
                        <option value="">Seleziona conto di destinazione...</option>
                        <option value="income">Conto Entrate</option>
                        <option value="wealth">Conto Ricchezza</option>
                        <option value="operating">Conto Operativo</option>
                        <option value="emergency">Conto Emergenza</option>
                        <option value="investment">Conto Investimenti</option>
                        <option value="savings">Conto Risparmi</option>
                        {Array.isArray(customAccounts) && customAccounts.map((acc: any) => (
                          <option key={`custom_${acc.id}`} value={`custom_${acc.id}`}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                {otherGoals.length > 0 && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteAction"
                      value="transfer"
                      checked={deleteAction === 'transfer'}
                      onChange={(e) => setDeleteAction(e.target.value as 'transfer')}
                      className="text-trust-blue"
                    />
                    <div className="flex-1">
                      <p className="font-medium">📈 Trasferisci ad altro obiettivo</p>
                      <p className="text-sm text-medium-gray">Sposta i fondi a un obiettivo esistente</p>
                      {deleteAction === 'transfer' && (
                        <select
                          value={targetGoalId || ''}
                          onChange={(e) => setTargetGoalId(safeInt(e.target.value) || null)}
                          className="mt-2 w-full p-2 border rounded"
                        >
                          <option value="">Seleziona obiettivo...</option>
                          {otherGoals.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({formatEuro(g.currentAmount)} / {formatEuro(g.targetAmount)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>
                )}

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="convert"
                    checked={deleteAction === 'convert'}
                    onChange={(e) => setDeleteAction(e.target.value as 'convert')}
                    className="text-trust-blue"
                  />
                  <div>
                    <p className="font-medium">💎 Converti in investimento</p>
                    <p className="text-sm text-medium-gray">Trasforma in investimento generico</p>
                  </div>
                </label>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteAction(null);
                    setTargetGoalId(null);
                    setTargetAccountId(null);
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={!deleteAction || (deleteAction === 'return' && !targetAccountId) || (deleteAction === 'transfer' && !targetGoalId) || deleteGoalMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteGoalMutation.isPending ? "Eliminando..." : "Conferma"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const safeCurrentAmount = safeFloat(goal.currentAmount?.toString());
  const safeTargetAmount = safeFloat(goal.targetAmount?.toString(), 1);
  const progressPercentage = Math.min(100, (safeCurrentAmount / safeTargetAmount) * 100);
  const remainingMonths = Math.max(0, (() => { const p = goal.targetDate?.split('-'); if (p?.length === 3) { return Math.ceil((new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2])).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)); } return 0; })());

  const getGoalIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'house': return Home;
      case 'car': return Car;
      case 'education': return GraduationCap;
      case 'emergency': return Shield;
      case 'vacation': return Plane;
      case 'investment': return LineChart;
      case 'retirement': return PiggyBank;
      default: return Target;
    }
  };

  const IconComponent = getGoalIcon(goal.type);

  return (
    <GoalDetailDialog 
      goal={goal}
      trigger={
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-trust-blue">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-trust-blue/10 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-trust-blue" />
                </div>
                <div>
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <p className="text-sm text-medium-gray capitalize">{goal.type}</p>
                </div>
              </div>
              <Badge variant={progressPercentage >= 100 ? "default" : "secondary"}>
                {progressPercentage >= 100 ? "Completato" : `${progressPercentage.toFixed(0)}%`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-medium-gray">Progresso</span>
              <span className="font-semibold">{formatEuro(safeCurrentAmount)} / {formatEuro(safeTargetAmount)}</span>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-medium-gray">Contributo mensile</p>
                <p className="font-semibold text-trust-blue">{formatEuro(safeFloat(goal.monthlyContribution?.toString()))}</p>
              </div>
              <div>
                <p className="text-medium-gray">Tempo rimanente</p>
                <p className="font-semibold text-orange-600">
                  {remainingMonths > 12 
                    ? `${Math.floor(remainingMonths / 12)}a ${remainingMonths % 12}m`
                    : `${remainingMonths}m`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    />
  );
}

export function GoalCreationDialog({ trigger }: { trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [customGoal, setCustomGoal] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    monthlyContribution: ''
  });
  const [riskAnswers, setRiskAnswers] = useState<Record<string, number>>({});
  const [calculatedData, setCalculatedData] = useState<any>(null);
  const [selectedInvestments, setSelectedInvestments] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard']
  });

  const { data: investments } = useQuery({
    queryKey: ['/api/investments']
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/goals', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Obiettivo creato!",
        description: "Il tuo nuovo obiettivo è stato aggiunto."
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const goalTemplates: GoalTemplate[] = [
    {
      id: 'emergency',
      name: 'Fondo di Emergenza',
      icon: Shield,
      description: 'Proteggi il tuo futuro con un fondo di emergenza da 6-12 mesi di spese',
      defaultAmount: 15000,
      defaultTimeframe: 24,
      priority: 1
    },
    {
      id: 'house',
      name: 'Acquisto Casa',
      icon: Home,
      description: 'Risparmia per l\'anticipo della tua casa dei sogni',
      defaultAmount: 50000,
      defaultTimeframe: 60,
      priority: 2
    },
    {
      id: 'investment',
      name: 'Portfolio Investimenti',
      icon: LineChart,
      description: 'Costruisci un portfolio diversificato per il futuro',
      defaultAmount: 25000,
      defaultTimeframe: 36,
      priority: 3
    },
    {
      id: 'vacation',
      name: 'Viaggio da Sogno',
      icon: Plane,
      description: 'Pianifica il viaggio della tua vita',
      defaultAmount: 5000,
      defaultTimeframe: 12,
      priority: 4
    },
    {
      id: 'car',
      name: 'Nuova Auto',
      icon: Car,
      description: 'Risparmia per la tua prossima automobile',
      defaultAmount: 20000,
      defaultTimeframe: 24,
      priority: 5
    },
    {
      id: 'education',
      name: 'Formazione',
      icon: GraduationCap,
      description: 'Investi nella tua educazione e crescita professionale',
      defaultAmount: 8000,
      defaultTimeframe: 18,
      priority: 6
    }
  ];

  const resetForm = () => {
    setStep(1);
    setSelectedTemplate(null);
    setCustomGoal({
      name: '',
      description: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      monthlyContribution: ''
    });
    setRiskAnswers({});
    setCalculatedData(null);
    setSelectedInvestments([]);
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template);

    // Calculate appropriate current amount based on goal type and net worth
    const netWorth = (dashboardData as any)?.financialSummary?.netWorth || 0;
    let suggestedCurrentAmount = '0';

    if (template.id === 'emergency') {
      suggestedCurrentAmount = Math.max(0, netWorth * 0.1).toString();
    } else if (template.id === 'house') {
      suggestedCurrentAmount = Math.max(0, netWorth * 0.2).toString();
    } else {
      suggestedCurrentAmount = Math.max(0, netWorth * 0.05).toString();
    }

    setCustomGoal({
      name: template.name,
      description: template.description,
      targetAmount: template.defaultAmount?.toString() || '',
      currentAmount: suggestedCurrentAmount,
      targetDate: dateToLocalString(new Date(Date.now() + (template.defaultTimeframe || 60) * 30 * 24 * 60 * 60 * 1000)),
      monthlyContribution: ''
    });
    setStep(2);
  };

  const handleCreateGoal = () => {
    const { profile, expectedReturn } = calculateRiskProfile(riskAnswers);

    createGoalMutation.mutate({
      name: customGoal.name,
      type: selectedTemplate?.id || 'custom',
      targetAmount: safeFloat(customGoal.targetAmount),
      currentAmount: 0, // Always start with 0, user can add funds later
      monthlyContribution: parseFloat(customGoal.monthlyContribution) || 0,
      targetDate: customGoal.targetDate,
      priority: selectedTemplate?.priority || 5,
      riskProfile: profile,
      expectedReturn: expectedReturn,
      linkedInvestments: selectedInvestments
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-trust-blue" />
            <span>Crea Nuovo Obiettivo</span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Scegli un template o crea obiettivo personalizzato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goalTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-trust-blue"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-trust-blue/10 rounded-lg flex items-center justify-center">
                          <template.icon className="w-5 h-5 text-trust-blue" />
                        </div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-medium-gray mb-2">{template.description}</p>
                      <div className="flex justify-between text-xs text-medium-gray">
                        <span>Target: {formatEuro(template.defaultAmount || 0)}</span>
                        <span>{template.defaultTimeframe}m</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep(2);
                }}
                className="w-full mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea Obiettivo Personalizzato
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Dettagli Obiettivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Obiettivo</Label>
                  <Input
                    value={customGoal.name}
                    onChange={(e) => setCustomGoal({...customGoal, name: e.target.value})}
                    placeholder="Es. Casa al mare"
                  />
                </div>
                <div>
                  <Label>Importo Obiettivo (€)</Label>
                  <Input
                    type="number"
                    value={customGoal.targetAmount}
                    onChange={(e) => setCustomGoal({...customGoal, targetAmount: e.target.value})}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <Label>Data Obiettivo</Label>
                  <Input
                    type="date"
                    value={customGoal.targetDate}
                    onChange={(e) => setCustomGoal({...customGoal, targetDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Contributo Mensile (€)</Label>
                  <Input
                    type="number"
                    value={customGoal.monthlyContribution}
                    onChange={(e) => setCustomGoal({...customGoal, monthlyContribution: e.target.value})}
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Investment Selection for Portfolio Investment Goals */}
            {(selectedTemplate?.id === 'investment' || customGoal.name.toLowerCase().includes('investiment') || customGoal.name.toLowerCase().includes('portfolio')) && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-purple-600" />
                    Collega Investimenti Esistenti
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Seleziona gli investimenti che vuoi collegare a questo obiettivo. Nella sezione investimenti vedrai l'obiettivo associato.
                  </p>

                  {investments && Array.isArray(investments) && investments.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                      {investments.map((investment: any) => (
                        <label key={investment.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedInvestments.includes(investment.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvestments([...selectedInvestments, investment.id]);
                              } else {
                                setSelectedInvestments(selectedInvestments.filter(id => id !== investment.id));
                              }
                            }}
                            className="h-4 w-4 text-purple-600 rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">{investment.name}</span>
                              <span className="text-sm text-gray-500">{investment.type}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                              <span>Quantità: {investment.quantity || 0}</span>
                              <span>Valore: €{((safeFloat(investment.quantity) * safeFloat(investment.currentPrice || investment.averagePrice))).toFixed(2)}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <LineChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Nessun investimento disponibile</p>
                      <p className="text-xs">Crea prima degli investimenti nella sezione Investimenti</p>
                    </div>
                  )}

                  {selectedInvestments.length > 0 && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">
                        <strong>{selectedInvestments.length}</strong> investimenti selezionati per questo obiettivo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={() => setStep(1)} variant="outline">
                Indietro
              </Button>
              <Button 
                onClick={handleCreateGoal}
                disabled={createGoalMutation.isPending}
                className="bg-trust-blue hover:bg-blue-600"
              >
                {createGoalMutation.isPending ? "Creando..." : "Crea Obiettivo"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Goals() {
  const { data: goals, isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    refetchOnWindowFocus: true,
    staleTime: 0 // Always consider data stale to force refresh
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const refetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  };

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const netWorth = (dashboardData as any)?.financialSummary?.netWorth || 0;
  const totalGoalValue = goals?.reduce((sum, goal) => {
    const target = safeFloat(goal.targetAmount?.toString());
    return sum + (isNaN(target) ? 0 : target);
  }, 0) || 0;
  const currentGoalValue = goals?.reduce((sum, goal) => {
    const current = safeFloat(goal.currentAmount?.toString());
    return sum + (isNaN(current) ? 0 : current);
  }, 0) || 0;
  const completedGoals = goals?.filter(goal => {
    const current = safeFloat(goal.currentAmount?.toString());
    const target = safeFloat(goal.targetAmount?.toString());
    return target > 0 && (current / target) >= 1;
  }).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10">
      {/* Hero Header with enhanced design */}
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-green-50 rounded-2xl sm:rounded-3xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-2xl border border-gray-200">
          {/* Decorative elements with better contrast */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full -ml-24 -mb-24"></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-500/5 rounded-full"></div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 md:p-4 bg-purple-600 rounded-2xl shadow-lg">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="h-8 md:h-12 w-1 bg-purple-500 rounded-full"></div>
                  <div>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                      I Tuoi Obiettivi
                    </h1>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 md:w-3 h-2 md:h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-gray-100 text-xs md:text-sm font-medium">Centro di Pianificazione Finanziaria</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-200 text-base md:text-lg leading-relaxed max-w-2xl font-medium">
                  Trasforma i tuoi sogni in traguardi concreti con piani intelligenti e monitoraggio preciso
                </p>
              </div>

              <div className="flex flex-col space-y-3 md:space-y-4 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
                  <QuickActionsDialog 
                    trigger={
                      <Button className="bg-green-600 text-white px-5 md:px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-green-700 transition-all duration-300 transform hover:-translate-y-1 border-2 border-green-500 mobile-button-scale">
                        <Calculator className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                        <span className="text-sm md:text-base">Azioni Rapide</span>
                      </Button>
                    }
                    onUpdate={refetchData}
                  />
                  <GoalCreationDialog 
                    trigger={
                      <Button className="bg-purple-600 text-white px-6 md:px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all duration-300 transform hover:-translate-y-1 group border-2 border-purple-500 mobile-button-scale">
                        <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-sm md:text-base">Nuovo Obiettivo</span>
                      </Button>
                    }
                  />
                </div>
                <div className="text-center text-gray-300 text-sm bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-blue-200 group-hover:scale-110 transition-all duration-300">
                    <Euro className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Patrimonio Netto</p>
                  <p className="text-3xl font-bold text-blue-600 tracking-tight">{formatEuro(netWorth)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-xs text-blue-600 font-medium">Base solida</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
          <CardContent className="p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg group-hover:shadow-purple-200 group-hover:scale-110 transition-all duration-300">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Obiettivi Totali</p>
                  <p className="text-3xl font-bold text-purple-600 tracking-tight">{formatEuro(totalGoalValue)}</p>
                  <div className="flex items-center mt-2">
                    <Target className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-xs text-purple-600 font-medium">Traguardi definiti</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:shadow-green-200 group-hover:scale-110 transition-all duration-300">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Progresso Attuale</p>
                  <p className="text-3xl font-bold text-green-600 tracking-tight">{formatEuro(currentGoalValue)}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">In crescita</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50">
          <CardContent className="p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-lg group-hover:shadow-yellow-200 group-hover:scale-110 transition-all duration-300">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-1">Obiettivi Completati</p>
                  <p className="text-3xl font-bold text-yellow-600 tracking-tight">{completedGoals}</p>
                  <div className="flex items-center mt-2">
                    <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-xs text-yellow-600 font-medium">Successi raggiunti</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="space-y-6">
        {goals && goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-white to-gray-50">
            <CardContent className="text-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-purple-500" />
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-ping"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nessun obiettivo ancora</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Inizia il tuo percorso verso il successo finanziario creando il tuo primo obiettivo concreto e misurabile
              </p>
              <GoalCreationDialog 
                trigger={
                  <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Plus className="w-5 h-5 mr-2" />
                    Crea il tuo primo obiettivo
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}