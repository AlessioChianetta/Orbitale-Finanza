import { useQuery, useMutation } from "@tanstack/react-query";
import { safeFloat, safeInt } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

import Charts from "@/components/Charts";
import GoalCard from "@/components/GoalCard";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatEuro } from "@/lib/financial";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Plus,
  Calculator,
  Eye,
  ArrowRight,
  Lock,
  Trophy,
  BookOpen,
  Lightbulb,
  Home,
  Shield,
  Plane,
  Info,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  StopCircle,
  Play,
} from "lucide-react";

// SubscriptionItem component  
function SubscriptionItem({ subscription, onToggle }: { subscription: any, onToggle: () => void }) {
  const { toast } = useToast();
  
  const toggleSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', `/api/recurring-transactions/${subscription.id}`, {
        isActive: !subscription.isActive
      });
    },
    onSuccess: () => {
      toast({
        title: subscription.isActive ? "Abbonamento sospeso" : "Abbonamento riattivato",
        description: subscription.isActive 
          ? "L'abbonamento verrà fermato dal prossimo mese" 
          : "L'abbonamento è stato riattivato"
      });
      onToggle();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-50 rounded-lg">
          <CreditCard className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <p className="font-medium text-sm">{subscription.description}</p>
          <p className="text-xs text-medium-gray">
            {subscription.category} • {subscription.frequency === 'monthly' ? 'Mensile' : 'Annuale'}
            {subscription.dayOfMonth && ` • Giorno ${subscription.dayOfMonth}`}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <p className="font-bold text-red-600 text-sm">
            -{formatEuro(subscription.amount)}
          </p>
          <Badge variant={subscription.isActive ? "default" : "secondary"} className="text-xs">
            {subscription.isActive ? "Attivo" : "Sospeso"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSubscriptionMutation.mutate()}
          disabled={toggleSubscriptionMutation.isPending}
          className={`text-xs ${subscription.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
        >
          {subscription.isActive ? (
            <>
              <ArrowDownCircle className="w-3 h-3 mr-1" />
              Ferma
            </>
          ) : (
            <>
              <ArrowUpCircle className="w-3 h-3 mr-1" />
              Riattiva
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface DashboardData {
  financialSummary: {
    netWorth: number;
    availableLiquidity: number;
    cashFlow: number;
    totalAssets: number;
    totalLiabilities: number;
    totalIncome: number;
    totalExpenses: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyRecurringExpenses: number;
    availableMonthlyFlow: number;
    totalInvestments: number;
  };
  assetsByType: Record<string, number>;
  goals: Array<{
    id: number;
    name: string;
    type: string;
    targetAmount: string;
    currentAmount: string;
    monthlyContribution: string;
    targetDate: string;
    priority: number;
  }>;
  recentTransactions: Array<{
    id: number | string;
    type: string;
    category: string;
    amount: string | number;
    description: string;
    date: string;
    createdAt?: string;
    source?: string;
  }>;
  achievements: Array<{
    id: number;
    type: string;
    name: string;
    description: string;
  }>;
  progress: Array<{
    module: string;
    completed: boolean;
  }>;
  recurringTransactions: Array<{
    id: number;
    description: string;
    category: string;
    frequency: string;
    amount: number;
    isActive: boolean;
    type: string;
    dayOfMonth?: number;
  }>;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  // Check if user has completed registration
  const { data: userProgress } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  const hasCompletedRegistration = Array.isArray(userProgress) && userProgress.some((p: any) => p.module === 'registration' && p.completed);

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Welcome screen for new users who haven't completed registration
  if (!hasCompletedRegistration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <Card className="max-w-2xl w-full text-center p-8">
            <CardContent>
              <div className="w-20 h-20 bg-primary-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-primary-blue" />
              </div>
              <h1 className="text-3xl font-bold text-dark-gray mb-4">
                Benvenuto in Percorso Capitale! 👋
              </h1>
              <p className="text-lg text-medium-gray mb-8">
                La tua piattaforma italiana per la gestione finanziaria intelligente. 
                Inizia completando il tuo profilo per un'esperienza personalizzata.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <a href="/registration">
                  <Button className="w-full bg-trust-blue hover:bg-blue-600 text-white h-12">
                    <Calculator className="w-5 h-5 mr-2" />
                    Completa il Profilo
                  </Button>
                </a>
                <a href="/checkup">
                  <Button variant="outline" className="w-full h-12 border-trust-blue text-trust-blue hover:bg-trust-blue hover:text-white">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Inizia Check-up Veloce
                  </Button>
                </a>
              </div>

              <p className="text-sm text-medium-gray">
                Puoi iniziare subito il check-up o completare prima il tuo profilo per un'esperienza ottimale
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center p-8">
            <CardContent>
              <h2 className="text-2xl font-bold text-dark-gray mb-4">Inizia il tuo Percorso Capitale</h2>
              <p className="text-medium-gray mb-6">
                Iniziamo il tuo percorso verso la libertà finanziaria con un check-up completo.
              </p>
              <Button className="bg-trust-blue hover:bg-blue-600" onClick={() => window.location.href = "/checkup"}>
                Inizia il Check-up Finanziario
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { financialSummary, assetsByType, goals, recentTransactions, achievements, progress: moduleProgress, recurringTransactions } = dashboardData;

  // Extract monthly financial variables
  const monthlyIncome = financialSummary?.monthlyIncome || 0;
  const monthlyExpenses = financialSummary?.monthlyExpenses || 0;
  const monthlyRecurringExpenses = financialSummary?.monthlyRecurringExpenses || 0;
  const availableMonthlyFlow = financialSummary?.availableMonthlyFlow || 0;
  const activeRecurringTransactions = recurringTransactions?.filter((rt: any) => rt.isActive && rt.type === 'subscription') || [];

  const getModuleStatus = (module: string) => {
    const foundProgress = moduleProgress.find(p => p.module === module);
    return foundProgress?.completed ? 'completed' : 'pending';
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'home_purchase': return Home;
      case 'emergency_fund': return Shield;
      case 'travel': return Plane;
      default: return Target;
    }
  };

  const hasCompletedCheckup = getModuleStatus('checkup') === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Dark Hero Header */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">Ciao, benvenuto nel tuo futuro!</h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                        <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">
                          {hasCompletedCheckup ? "Check-up completato" : "Percorso in corso"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">
                    {hasCompletedCheckup 
                      ? "Ecco il tuo report finanziario aggiornato. Continua a costruire il tuo futuro!" 
                      : "Iniziamo insieme un percorso per prendere il controllo del tuo futuro finanziario."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {!hasCompletedCheckup ? (
                    <Button 
                      className="w-full sm:w-auto bg-white text-slate-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                      onClick={() => window.location.href = "/checkup"}
                    >
                      Inizia il Check-up Gratuito
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasCompletedCheckup && (
          <>
            {/* Progress Overview - Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 via-emerald-50 to-white">
                <CardContent className="relative p-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-bold text-green-800 mb-1 uppercase truncate">Patrimonio Netto</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <Info className="w-3 h-3 text-green-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Patrimonio Netto - Come viene calcolato</DialogTitle>
                                <DialogDescription className="space-y-3">
                                  <p><strong>Formula:</strong> Asset + Investimenti - Passività</p>
                                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                                    <p><strong>Asset:</strong> {formatEuro(financialSummary.totalAssets)} (case, conti correnti, investimenti fissi)</p>
                                    <p><strong>+ Investimenti da transazioni:</strong> {formatEuro(financialSummary.totalInvestments)} (ETF, azioni acquistate)</p>
                                    <p><strong>- Passività:</strong> {formatEuro(financialSummary.totalLiabilities)} (debiti, mutui, prestiti)</p>
                                    <hr className="my-2" />
                                    <p><strong>= Patrimonio Netto:</strong> {formatEuro(financialSummary.netWorth)}</p>
                                  </div>
                                  <p className="text-sm text-medium-gray">
                                    Il patrimonio netto rappresenta il tuo valore finanziario totale. 
                                    Gli investimenti non lo riducono, spostano solo denaro da liquidità a investimenti.
                                  </p>
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-lg md:text-xl font-black text-green-700 truncate">{formatEuro(financialSummary.netWorth)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 via-sky-50 to-white">
                <CardContent className="relative p-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl shadow-lg flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-bold text-blue-800 mb-1 uppercase truncate">Liquidità Disponibile</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <Info className="w-3 h-3 text-blue-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Liquidità Disponibile - Come viene calcolata</DialogTitle>
                                <DialogDescription className="space-y-3">
                                  <p><strong>Formula:</strong> Entrate - Spese - Investimenti</p>
                                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                                    <p><strong>Entrate totali:</strong> {formatEuro(financialSummary.availableLiquidity >= 0 ? Math.abs(financialSummary.availableLiquidity) : 0)} (stipendi, bonus, rendite)</p>
                                    <p><strong>- Spese totali:</strong> {formatEuro(0)} (cibo, casa, trasporti, etc.)</p>
                                    <p><strong>- Investimenti:</strong> {formatEuro(financialSummary.totalInvestments)} (ETF, azioni, etc.)</p>
                                    <hr className="my-2" />
                                    <p><strong>= Liquidità Disponibile:</strong> {formatEuro(financialSummary.availableLiquidity)}</p>
                                  </div>
                                  <p className="text-sm text-medium-gray">
                                    La liquidità rappresenta il denaro che puoi spendere subito. 
                                    Se negativa, significa che hai speso/investito più di quanto hai guadagnato.
                                  </p>
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-lg md:text-xl font-black text-blue-700 truncate">{formatEuro(financialSummary.availableLiquidity)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 via-violet-50 to-white">
                <CardContent className="relative p-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-bold text-purple-800 mb-1 uppercase truncate">Investimenti</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <Info className="w-3 h-3 text-purple-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Investimenti - Come vengono tracciati</DialogTitle>
                                <DialogDescription className="space-y-3">
                                  <p><strong>Cosa include:</strong> Solo investimenti da transazioni</p>
                                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                                    <p><strong>Transazioni di tipo "Investimento":</strong> {formatEuro(financialSummary.totalInvestments)}</p>
                                    <p className="text-xs text-gray-600">
                                      Include: ETF, azioni, obbligazioni, crypto acquistati tramite transazioni
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Esclude: Asset fissi inseriti nel check-up (case, conti deposito, etc.)
                                    </p>
                                  </div>
                                  <p className="text-sm text-medium-gray">
                                    Questo valore rappresenta solo il capitale che hai destinato agli investimenti 
                                    attraverso le transazioni registrate. Gli asset fissi sono conteggiati separatamente 
                                    nel patrimonio netto.
                                  </p>
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-lg md:text-xl font-black text-purple-700 truncate">{formatEuro(financialSummary.totalInvestments)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-indigo-50 via-slate-50 to-white">
                <CardContent className="relative p-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-xl shadow-lg flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-bold text-indigo-800 mb-1 uppercase truncate">Flusso Mensile</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <Info className="w-3 h-3 text-indigo-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Flusso di Cassa Mensile - Come viene calcolato</DialogTitle>
                                <DialogDescription className="space-y-3">
                                  <p><strong>Formula:</strong> Entrate Ricorrenti - Spese Ricorrenti</p>
                                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                                    <p><strong>Entrate mensili attive:</strong> {formatEuro(monthlyIncome)} (stipendi, pensioni, affitti)</p>
                                    <p><strong>- Spese mensili ricorrenti:</strong> {formatEuro(monthlyRecurringExpenses)} (abbonamenti attivi)</p>
                                    <div className="border-t pt-2 mt-2">
                                      <p><strong>= Flusso Mensile Disponibile:</strong> {formatEuro(availableMonthlyFlow, true)}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-medium-gray">
                                    Questo calcolo esclude le transazioni una tantum e si basa solo su entrate 
                                    e spese ricorrenti. Rappresenta quanto denaro generi ogni mese.
                                  </p>
                                </DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-lg md:text-xl font-black text-indigo-700 truncate">{formatEuro(availableMonthlyFlow, true)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-amber-50 via-orange-50 to-white">
                <CardContent className="relative p-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg flex-shrink-0">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800 mb-1 uppercase truncate">Obiettivi Attivi</p>
                        <p className="text-lg md:text-xl font-black text-amber-700 truncate">{goals.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid - Mobile Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Left Column - Charts */}
              <div className="lg:col-span-2 space-y-6">
                {/* Portfolio Composition Chart */}
                <Card className="p-6 border-0 shadow-lg rounded-2xl bg-white">
                  <h3 className="text-lg font-semibold text-dark-gray mb-6">Composizione Patrimonio</h3>
                  <Charts assetsByType={assetsByType} />
                </Card>

                {/* Goals Progress */}
                <Card className="p-6 border-0 shadow-lg rounded-2xl bg-white">
                  <h3 className="text-lg font-semibold text-dark-gray mb-6">I Tuoi Obiettivi</h3>
                  <div className="space-y-6">
                    {goals.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-medium-gray mb-4">Non hai ancora definito obiettivi finanziari</p>
                        <Button 
                          className="bg-trust-blue hover:bg-blue-600"
                          onClick={() => {/* Navigate to goals */}}
                        >
                          Crea il tuo primo obiettivo
                        </Button>
                      </div>
                    ) : (
                      goals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} />
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column - Modules & Actions */}
              <div className="space-y-6">
                {/* Recurring Subscriptions Management */}
                {activeRecurringTransactions.length > 0 && (
                  <Card className="p-6 border-0 shadow-lg rounded-2xl bg-white">
                    <h3 className="text-lg font-semibold text-dark-gray mb-4">Abbonamenti Attivi</h3>
                    <div className="space-y-3">
                      {activeRecurringTransactions.map((subscription: any) => (
                        <SubscriptionItem 
                          key={subscription.id} 
                          subscription={subscription}
                          onToggle={() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
                          }}
                        />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="p-6 border-0 shadow-lg rounded-2xl bg-white">
                  <h3 className="text-lg font-semibold text-dark-gray mb-4">Azioni Rapide</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start space-x-3 hover:bg-blue-50"
                    >
                      <Plus className="w-5 h-5 text-trust-blue" />
                      <span>Aggiungi Transazione</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start space-x-3 hover:bg-green-50"
                    >
                      <TrendingUp className="w-5 h-5 text-growth-green" />
                      <span>Aggiorna Portfolio</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start space-x-3 hover:bg-amber-50"
                    >
                      <Calculator className="w-5 h-5 text-amber-500" />
                      <span>Simula Scenario</span>
                    </Button>
                  </div>
                </Card>

                {/* Module Status */}
                <Card className="p-6 border-0 shadow-lg rounded-2xl bg-white">
                  <h3 className="text-lg font-semibold text-dark-gray mb-4">I Tuoi Moduli</h3>
                  <div className="space-y-4">
                    {/* Module 1 - Checkup */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-growth-green rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">✓</span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">Check-up Finanziario</p>
                          <p className="text-xs text-medium-gray">Completato</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Module 2 - Goals */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-trust-blue rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">Pianificatore Obiettivi</p>
                          <p className="text-xs text-medium-gray">In corso</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Module 3 - Money Management */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-medium-gray rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">Money Management</p>
                          <p className="text-xs text-medium-gray">Da iniziare</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Lock className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Achievement Badges */}
                <Card className="p-6 border-0 shadow-lg rounded-2xl bg-white">
                  <h3 className="text-lg font-semibold text-dark-gray mb-4">I Tuoi Traguardi</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-xs text-medium-gray">Primo Check-up</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        goals.length >= 3 
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                          : 'bg-gray-200'
                      }`}>
                        <Target className={`w-6 h-6 ${goals.length >= 3 ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <p className="text-xs text-medium-gray">3 Obiettivi</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-xs text-medium-gray">Primo Corso</p>
                    </div>
                  </div>
                </Card>

                {/* Educational Tip */}
                <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 border-0 shadow-lg rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">💡 Tip della Settimana</h4>
                      <p className="text-sm text-purple-100 mb-3">
                        L'interesse composto è la forza più potente nell'universo finanziario. 
                        Iniziare prima significa moltiplicare i risultati!
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-30 text-white"
                      >
                        Scopri di più
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="mt-8 p-6 border-0 shadow-lg rounded-2xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-gray">Attività Recente</h3>
                <Button variant="ghost" size="sm" className="text-trust-blue hover:text-blue-700">
                  Vedi tutto
                </Button>
              </div>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-medium-gray py-4">
                    Nessuna attività recente. Inizia aggiungendo le tue prime transazioni!
                  </p>
                ) : (
                  recentTransactions.map((transaction) => {
                    const getTransactionIcon = (type: string, source: string) => {
                      if (source === 'checkup') {
                        switch (type) {
                          case 'asset': return Home;
                          case 'liability': return CreditCard;
                          case 'income': return TrendingUp;
                          case 'expense': return TrendingDown;
                          default: return Calculator;
                        }
                      }
                      // Transazioni manuali
                      switch (type) {
                        case 'income': return ArrowUpCircle;
                        case 'expense': return ArrowDownCircle;
                        case 'investment': return TrendingUp;
                        case 'goal_contribution': return Target;
                        default: return DollarSign;
                      }
                    };

                    const getIconColor = (type: string, amount: number) => {
                      if (amount >= 0) {
                        return type === 'asset' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100';
                      } else {
                        return 'text-red-600 bg-red-100';
                      }
                    };

                    const Icon = getTransactionIcon(transaction.type, transaction.source || 'manual');
                    const amount = safeFloat(transaction.amount);
                    
                    return (
                      <div key={transaction.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(transaction.type, amount)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-dark-gray">{transaction.description}</p>
                          <p className="text-sm text-medium-gray">
                            {transaction.category} - {formatEuro(Math.abs(amount))}
                            {transaction.source === 'checkup' && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Check-up
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {amount >= 0 ? '+' : ''}{formatEuro(amount)}
                          </div>
                          <div className="text-xs text-medium-gray">{transaction.date}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg"
          className="w-14 h-14 bg-gradient-to-r from-trust-blue to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-shadow p-0"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
