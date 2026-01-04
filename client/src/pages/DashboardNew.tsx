import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  HomeIcon,
  Building,
  ShieldIcon,
  PiggyBank,
  CreditCard,
  DollarSign,
  Zap,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatEuro } from '@/lib/financial';

// Helper function per ottenere il nome della banca dall'IBAN
const getBankName = (iban: string, bankName?: string) => {
  if (bankName && bankName.trim() !== '') return bankName;
  if (!iban) return '';

  if (iban.includes('REVO')) return 'Revolut';
  if (iban.includes('NTSB')) return 'N26';
  if (iban.includes('BCIT')) return 'Intesa Sanpaolo';
  if (iban.includes('UBSP')) return 'UBI Banca';
  if (iban.includes('BPER')) return 'BPER Banca';
  if (iban.includes('BMPS')) return 'Monte dei Paschi';
  if (iban.includes('UNCRITMM')) return 'UniCredit';

  return `${iban.substring(0, 8)}...`;
};

const getAccountIcon = (accountKey: string) => {
  const icons = {
    income: HomeIcon,
    wealth: Building,
    operating: CreditCard,
    emergency: ShieldIcon,
    investment: TrendingUp,
    savings: PiggyBank
  };
  return icons[accountKey as keyof typeof icons] || Wallet;
};

interface Transaction {
  id: number;
  type: string;
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  date: string;
  accountType?: string;
}

export default function DashboardNew() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthlyInvestment, setMonthlyInvestment] = useState([435]);
  const [annualReturn, setAnnualReturn] = useState([7]);
  const [timeHorizon, setTimeHorizon] = useState([30]);

  // Fetch data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard-unified'],
    refetchInterval: 30000,
  });

  const { data: architectureData } = useQuery({
    queryKey: ['/api/account-architecture'],
  });

  const { data: customAccounts } = useQuery({
    queryKey: ['/api/custom-accounts'],
  });

  const { data: transactionsData } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: budgetSettings } = useQuery({
    queryKey: ['/api/budget-settings'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  // Filtra transazioni per il mese selezionato
  const monthlyTransactions = (transactionsData || []).filter(t => 
    t.date.startsWith(selectedMonth) && 
    (t.type === 'expense' || t.type === 'income')
  );

  // Calcola totali mensili
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Raggruppa spese per categoria
  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category || 'Altro';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // Calcola budget vs reale
  const monthlyIncomeFromSettings = parseFloat(budgetSettings?.monthlyIncome || '0');
  const needsBudget = (monthlyIncomeFromSettings * parseFloat(budgetSettings?.needsPercentage || '50')) / 100;
  const wantsBudget = (monthlyIncomeFromSettings * parseFloat(budgetSettings?.wantsPercentage || '30')) / 100;
  const savingsBudget = (monthlyIncomeFromSettings * parseFloat(budgetSettings?.savingsPercentage || '20')) / 100;

  // Simulatore semplificato
  const calculateFutureValue = () => {
    const months = timeHorizon[0] * 12;
    const monthlyRate = annualReturn[0] / 100 / 12;
    let total = 0;

    for (let i = 0; i < months; i++) {
      total = total * (1 + monthlyRate) + monthlyInvestment[0];
    }

    return total;
  };

  const futureValue = calculateFutureValue();
  const totalContributions = monthlyInvestment[0] * timeHorizon[0] * 12;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Dashboard Finanziaria
            </h1>
            <p className="text-gray-600 mt-2">
              Gestione completa delle tue finanze
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              Aggiornato: {format(new Date(), 'HH:mm', { locale: it })}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna Sinistra - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Architettura dei Conti */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-800 via-slate-700 to-gray-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Architettura dei Conti</h3>
                    <p className="text-sm text-gray-200">
                      Sistema a 6 conti{customAccounts && customAccounts.length > 0 ? ` + ${customAccounts.length} personalizzati` : ''}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {architectureData?.accounts && Object.entries(architectureData.accounts).map(([key, account]: [string, any]) => {
                    const Icon = getAccountIcon(key);
                    const colors = {
                      income: 'from-green-50 to-emerald-50 border-green-200',
                      wealth: 'from-blue-50 to-sky-50 border-blue-200',
                      operating: 'from-purple-50 to-indigo-50 border-purple-200',
                      emergency: 'from-orange-50 to-amber-50 border-orange-200',
                      investment: 'from-violet-50 to-purple-50 border-violet-200',
                      savings: 'from-teal-50 to-cyan-50 border-teal-200'
                    };

                    return (
                      <div key={key} className={`p-4 rounded-xl bg-gradient-to-br ${colors[key as keyof typeof colors]} border-2 hover:shadow-lg transition-all`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-white/80 p-2 rounded-lg">
                            <Icon className="h-5 w-5 text-gray-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-800 truncate">
                              {account.name}
                            </h4>
                            {account.bankName && (
                              <div className="text-xs text-blue-600 font-medium">
                                🏦 {account.bankName}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatEuro(account.balance || 0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Transazioni del Mese */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white rounded-t-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/20 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-bold truncate">Transazioni del Mese</h3>
                      <p className="text-xs sm:text-sm text-blue-100">
                        {monthlyTransactions.length} operazioni
                      </p>
                    </div>
                  </CardTitle>
                  <Input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-40 bg-white/20 text-white border-white/30 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {/* Riepilogo */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl border border-green-200">
                    <p className="text-xs sm:text-sm text-green-600 font-medium mb-0.5 sm:mb-1">Entrate</p>
                    <p className="text-base sm:text-2xl font-bold text-green-700 truncate">{formatEuro(monthlyIncome)}</p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-200">
                    <p className="text-xs sm:text-sm text-red-600 font-medium mb-0.5 sm:mb-1">Uscite</p>
                    <p className="text-base sm:text-2xl font-bold text-red-700 truncate">{formatEuro(monthlyExpenses)}</p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                    <p className="text-xs sm:text-sm text-blue-600 font-medium mb-0.5 sm:mb-1">Saldo</p>
                    <p className={`text-base sm:text-2xl font-bold truncate ${monthlyIncome - monthlyExpenses >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatEuro(monthlyIncome - monthlyExpenses)}
                    </p>
                  </div>
                </div>

                {/* Lista Transazioni */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {monthlyTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-medium text-gray-900 text-xs sm:text-base truncate">
                            {transaction.description && transaction.description.length > 30 
                              ? `${transaction.description.substring(0, 30)}...` 
                              : (transaction.description || transaction.category)}
                          </p>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                            <p className="text-xs text-gray-500 flex-shrink-0">{format(new Date(transaction.date), 'dd MMM', { locale: it })}</p>
                            {transaction.category && (
                              <>
                                <span className="text-xs text-gray-400 flex-shrink-0">•</span>
                                <p className="text-xs text-gray-500 truncate">{transaction.category}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm sm:text-lg whitespace-nowrap ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatEuro(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {monthlyTransactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nessuna transazione per questo mese</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Reale */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Budget vs Reale</h3>
                    <p className="text-sm text-pink-100">Confronto previsionale e spese effettive</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bisogni */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">🏠 Bisogni (50%)</span>
                      <Badge variant="outline">{formatEuro(needsBudget)}</Badge>
                    </div>
                    <Progress value={Math.min((monthlyExpenses * 0.5 / needsBudget) * 100, 100)} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Speso</span>
                      <span className="font-semibold">{formatEuro(monthlyExpenses * 0.5)}</span>
                    </div>
                  </div>

                  {/* Desideri */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">🎯 Desideri (30%)</span>
                      <Badge variant="outline">{formatEuro(wantsBudget)}</Badge>
                    </div>
                    <Progress value={Math.min((monthlyExpenses * 0.3 / wantsBudget) * 100, 100)} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Speso</span>
                      <span className="font-semibold">{formatEuro(monthlyExpenses * 0.3)}</span>
                    </div>
                  </div>

                  {/* Risparmi */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">💰 Risparmi (20%)</span>
                      <Badge variant="outline">{formatEuro(savingsBudget)}</Badge>
                    </div>
                    <Progress value={Math.min((monthlyExpenses * 0.2 / savingsBudget) * 100, 100)} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accantonato</span>
                      <span className="font-semibold">{formatEuro(monthlyExpenses * 0.2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonna Destra - 1/3 */}
          <div className="space-y-6">
            {/* Simulatore */}
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Simulatore "E se...?"</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Investimento Mensile */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700">Investimento Mensile</label>
                    <span className="text-lg font-bold text-orange-600">{formatEuro(monthlyInvestment[0])}</span>
                  </div>
                  <Slider
                    value={monthlyInvestment}
                    onValueChange={setMonthlyInvestment}
                    max={2000}
                    min={50}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Rendimento Annuo */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700">Rendimento Annuo</label>
                    <span className="text-lg font-bold text-orange-600">{annualReturn[0]}%</span>
                  </div>
                  <Slider
                    value={annualReturn}
                    onValueChange={setAnnualReturn}
                    max={15}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Orizzonte Temporale */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700">Orizzonte Temporale</label>
                    <span className="text-lg font-bold text-orange-600">{timeHorizon[0]} anni</span>
                  </div>
                  <Slider
                    value={timeHorizon}
                    onValueChange={setTimeHorizon}
                    max={40}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  {/* Risultati */}
                  <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-4 rounded-xl">
                    <p className="text-sm text-orange-700 font-medium mb-2">Capitale Finale</p>
                    <p className="text-3xl font-bold text-orange-900">{formatEuro(futureValue)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/80 p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Versato</p>
                      <p className="font-bold text-gray-900">{formatEuro(totalContributions)}</p>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600 mb-1">Guadagni</p>
                      <p className="font-bold text-green-600">{formatEuro(futureValue - totalContributions)}</p>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Approfondisci nel Simulatore
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Spese per Categoria */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Top Categorie di Spesa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{category}</span>
                        <span className="font-semibold text-gray-900">{formatEuro(amount)}</span>
                      </div>
                    ))}
                  {Object.keys(expensesByCategory).length === 0 && (
                    <p className="text-center text-gray-500 py-4">Nessuna spesa registrata</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}