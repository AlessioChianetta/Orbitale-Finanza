import { useState, useEffect, useMemo } from "react";
import { safeFloat, safeInt } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Calculator, 
  Target, 
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Info,
  Sparkles,
  Zap,
  TrendingDown,
  Clock,
  Wallet,
  Star,
  Trophy,
  Flame
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SimulationData {
  year: number;
  totalCapital: number;
  totalContributions: number;
  totalReturns: number;
  monthlyContribution: number;
}

interface UserFinancialData {
  currentAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  availableForInvestment: number;
  currentInvestments: number;
  goals: Array<{
    name: string;
    targetAmount: number;
    timelineYears: number;
  }>;
}

export default function Simulator() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Simulation parameters
  const [monthlyInvestment, setMonthlyInvestment] = useState([435]);
  const [annualReturn, setAnnualReturn] = useState([7]);
  const [timeHorizon, setTimeHorizon] = useState([30]);
  const [oneTimeInvestment, setOneTimeInvestment] = useState([0]);
  const [uninvestedSavings, setUninvestedSavings] = useState([0]); // Risparmi non investiti
  const [monthlySavings, setMonthlySavings] = useState([0]); // Risparmi mensili non investiti
  const [monthlyExpenses, setMonthlyExpenses] = useState([20]); // Rappresenta le spese in centinaia di euro (20 = €2000)
  const [compoundingFrequency, setCompoundingFrequency] = useState<'monthly' | 'annual'>('monthly'); // Frequenza capitalizzazione
  const [selectedTab, setSelectedTab] = useState("calculator");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Accesso Richiesto",
        description: "Effettua il login per accedere al Simulatore",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userFinancialData } = useQuery<UserFinancialData>({
    queryKey: ["/api/financial-summary"],
    retry: false,
  });

  // Calculate compound interest
  const calculateCompoundInterest = (
    monthlyAmount: number,
    annualRate: number,
    years: number,
    initialAmount: number = 0,
    monthlyExpenses: number = 2000,
    uninvestedSavingsAmount: number = 0,
    monthlySavingsAmount: number = 0,
    frequency: 'monthly' | 'annual' = 'monthly'
  ): SimulationData[] => {
    const data: SimulationData[] = [];

    let totalCapital = initialAmount;
    let totalContributions = initialAmount;
    let totalUninvestedSavings = uninvestedSavingsAmount;

    for (let year = 0; year <= years; year++) {
      if (year === 0) {
        data.push({
          year,
          totalCapital: initialAmount + uninvestedSavingsAmount,
          totalContributions: initialAmount,
          totalReturns: 0,
          monthlyContribution: monthlyAmount
        });
        continue;
      }

      if (frequency === 'monthly') {
        // Capitalizzazione mensile
        const monthlyRate = annualRate / 100 / 12;
        for (let month = 1; month <= 12; month++) {
          totalCapital = totalCapital * (1 + monthlyRate) + monthlyAmount;
          totalContributions += monthlyAmount;
          totalUninvestedSavings += monthlySavingsAmount;
        }
      } else {
        // Capitalizzazione annuale
        const yearlyRate = annualRate / 100;
        // Aggiungi tutti i contributi mensili dell'anno
        const yearlyContributions = monthlyAmount * 12;
        totalContributions += yearlyContributions;
        totalUninvestedSavings += monthlySavingsAmount * 12;
        // Applica l'interesse annuale una sola volta
        totalCapital = (totalCapital + yearlyContributions) * (1 + yearlyRate);
      }

      const totalReturns = totalCapital - totalContributions;

      data.push({
        year,
        totalCapital: Math.round(totalCapital + totalUninvestedSavings),
        totalContributions: Math.round(totalContributions),
        totalReturns: Math.round(totalReturns),
        monthlyContribution: monthlyAmount
      });
    }

    return data;
  };

  // Memoized calculations
  const simulationData = useMemo(() => {
    return calculateCompoundInterest(
      monthlyInvestment[0],
      annualReturn[0],
      timeHorizon[0],
      oneTimeInvestment[0],
      monthlyExpenses[0] * 100,
      uninvestedSavings[0],
      monthlySavings[0],
      compoundingFrequency
    );
  }, [monthlyInvestment[0], annualReturn[0], timeHorizon[0], oneTimeInvestment[0], monthlyExpenses[0], uninvestedSavings[0], monthlySavings[0], compoundingFrequency]);

  const finalData = simulationData[simulationData.length - 1];

  // Calculate financial independence metrics
  const monthlyPassiveIncome = (finalData?.totalCapital || 0) * 0.04 / 12; // 4% rule
  const yearsToFI = simulationData.findIndex(data => data.totalCapital >= (monthlyExpenses[0] * 100) * 12 * 25) || timeHorizon[0]; // 25x annual expenses

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Dark Hero Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-purple-600 rounded-xl shadow-lg flex-shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">Simulatore "E se...?"</h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                        <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Interesse Composto</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">Scopri come piccoli cambiamenti possono trasformare il tuo futuro finanziario con il potere dell'interesse composto</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          {/* Modern Tab Navigation */}
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl p-1">
              <TabsTrigger 
                value="calculator" 
                className="flex items-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Calcolatore</span>
              </TabsTrigger>
              <TabsTrigger 
                value="scenarios" 
                className="flex items-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Scenari</span>
              </TabsTrigger>
              <TabsTrigger 
                value="independence" 
                className="flex items-center space-x-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Libertà</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Enhanced Controls */}
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Parametri di Simulazione
                  </h3>
                </div>

                <div className="space-y-8">
                  {/* Monthly Investment */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Investimento Mensile</Label>
                      <div className="px-3 py-1 bg-green-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={monthlyInvestment[0]}
                            onChange={(e) => {
                              const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 20000);
                              setMonthlyInvestment([value]);
                            }}
                            min={0}
                            max={20000}
                            step={50}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-16"
                          />
                          <span className="text-lg font-bold ml-1">€</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={monthlyInvestment}
                      onValueChange={setMonthlyInvestment}
                      max={20000}
                      min={0}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>€0</span>
                      <span>€20.000</span>
                    </div>
                  </div>

                  {/* Annual Return */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Rendimento Annuo</Label>
                      <div className="px-3 py-1 bg-blue-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={annualReturn[0]}
                            onChange={(e) => {
                              const value = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 100);
                              setAnnualReturn([value]);
                            }}
                            min={0}
                            max={100}
                            step={0.5}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-12"
                          />
                          <span className="text-lg font-bold ml-1">%</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={annualReturn}
                      onValueChange={setAnnualReturn}
                      max={100}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Time Horizon */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Orizzonte Temporale</Label>
                      <div className="px-3 py-1 bg-purple-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={timeHorizon[0]}
                            onChange={(e) => {
                              const value = Math.min(Math.max(safeInt(e.target.value, 1), 1), 40);
                              setTimeHorizon([value]);
                            }}
                            min={1}
                            max={40}
                            step={1}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-8"
                          />
                          <span className="text-lg font-bold ml-1">anni</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={timeHorizon}
                      onValueChange={setTimeHorizon}
                      max={40}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>1 anno</span>
                      <span>40 anni</span>
                    </div>
                  </div>

                  {/* One-time Investment */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Investimento Iniziale</Label>
                      <div className="px-3 py-1 bg-amber-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={oneTimeInvestment[0]}
                            onChange={(e) => {
                              const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 1000000);
                              setOneTimeInvestment([value]);
                            }}
                            min={0}
                            max={1000000}
                            step={5000}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-20"
                          />
                          <span className="text-lg font-bold ml-1">€</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={oneTimeInvestment}
                      onValueChange={setOneTimeInvestment}
                      max={1000000}
                      min={0}
                      step={5000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>€0</span>
                      <span>€1.000.000</span>
                    </div>
                  </div>

                  {/* Uninvested Savings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Risparmi Non Investiti</Label>
                      <div className="px-3 py-1 bg-teal-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={uninvestedSavings[0]}
                            onChange={(e) => {
                              const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 500000);
                              setUninvestedSavings([value]);
                            }}
                            min={0}
                            max={500000}
                            step={1000}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-20"
                          />
                          <span className="text-lg font-bold ml-1">€</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={uninvestedSavings}
                      onValueChange={setUninvestedSavings}
                      max={500000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>€0</span>
                      <span>€500.000</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Capitale risparmiato ma non investito (es. conto corrente)
                    </p>
                  </div>

                  {/* Monthly Savings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Risparmi Mensili</Label>
                      <div className="px-3 py-1 bg-cyan-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={monthlySavings[0]}
                            onChange={(e) => {
                              const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 5000);
                              setMonthlySavings([value]);
                            }}
                            min={0}
                            max={5000}
                            step={50}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-16"
                          />
                          <span className="text-lg font-bold ml-1">€</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={monthlySavings}
                      onValueChange={setMonthlySavings}
                      max={5000}
                      min={0}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>€0</span>
                      <span>€5.000</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Risparmio mensile non investito (es. fondo emergenza)
                    </p>
                  </div>

                  {/* Monthly Expenses */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-gray-700">Spese Mensili</Label>
                      <div className="px-3 py-1 bg-red-500 text-white rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={monthlyExpenses[0] * 100}
                            onChange={(e) => {
                              const value = Math.min(Math.max(safeInt(e.target.value, 500), 500), 5000);
                              setMonthlyExpenses([value / 100]);
                            }}
                            min={500}
                            max={5000}
                            step={100}
                            className="text-lg font-bold text-white bg-transparent border-0 shadow-none p-0 h-auto text-center w-16"
                          />
                          <span className="text-lg font-bold ml-1">€</span>
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={monthlyExpenses}
                      onValueChange={setMonthlyExpenses}
                      max={50}
                      min={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>€500</span>
                      <span>€5.000</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Le tue spese mensili totali (default: €2.000)
                    </p>
                  </div>

                  {/* Compounding Frequency */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-gray-700">Frequenza Capitalizzazione Interessi</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={compoundingFrequency === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setCompoundingFrequency('monthly')}
                        className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 rounded-xl ${
                          compoundingFrequency === 'monthly' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                            : 'border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <span className="font-semibold">Mensile</span>
                        <span className="text-xs opacity-90">Interessi ogni mese</span>
                      </Button>
                      <Button
                        variant={compoundingFrequency === 'annual' ? 'default' : 'outline'}
                        onClick={() => setCompoundingFrequency('annual')}
                        className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-300 rounded-xl ${
                          compoundingFrequency === 'annual' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                            : 'border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <span className="font-semibold">Annuale</span>
                        <span className="text-xs opacity-90">Interessi una volta all'anno</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-start space-x-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {compoundingFrequency === 'monthly' 
                          ? 'Gli interessi vengono calcolati e aggiunti al capitale ogni mese (più vantaggioso)' 
                          : 'Gli interessi vengono calcolati e aggiunti al capitale una volta all\'anno'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Enhanced Quick Scenarios */}
                <div className="mt-10">
                  <Label className="text-lg font-semibold text-gray-700 mb-6 block">Scenari Rapidi</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMonthlyInvestment([200]);
                        setAnnualReturn([6]);
                        setTimeHorizon([30]);
                      }}
                      className="h-16 flex flex-col items-center justify-center space-y-1 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 rounded-xl group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full group-hover:animate-pulse"></div>
                        <span className="font-semibold text-green-700">Conservativo</span>
                      </div>
                      <span className="text-xs text-green-600">€200/mese • 6%</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMonthlyInvestment([500]);
                        setAnnualReturn([7]);
                        setTimeHorizon([25]);
                      }}
                      className="h-16 flex flex-col items-center justify-center space-y-1 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 rounded-xl group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:animate-pulse"></div>
                        <span className="font-semibold text-blue-700">Bilanciato</span>
                      </div>
                      <span className="text-xs text-blue-600">€500/mese • 7%</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMonthlyInvestment([800]);
                        setAnnualReturn([8]);
                        setTimeHorizon([20]);
                      }}
                      className="h-16 flex flex-col items-center justify-center space-y-1 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-300 rounded-xl group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-pulse"></div>
                        <span className="font-semibold text-red-700">Aggressivo</span>
                      </div>
                      <span className="text-xs text-red-600">€800/mese • 8%</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMonthlyInvestment([userFinancialData?.availableForInvestment || 435]);
                        setAnnualReturn([7]);
                        setTimeHorizon([30]);
                      }}
                      className="h-16 flex flex-col items-center justify-center space-y-1 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 rounded-xl group"
                    >
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-purple-500 group-hover:animate-spin" />
                        <span className="font-semibold text-purple-700">I Miei Dati</span>
                      </div>
                      <span className="text-xs text-purple-600">Personalizzato</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Enhanced Results */}
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Risultati della Simulazione
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Enhanced Key Metrics */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="relative p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white overflow-hidden group hover:scale-105 transition-all duration-300">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                      <div className="relative">
                        <div className="flex items-center space-x-3 mb-3">
                          <TrendingUp className="w-8 h-8 text-white" />
                          <span className="text-lg font-semibold">Capitale Finale</span>
                        </div>
                        <p className="text-4xl font-bold mb-2">
                          {formatEuro(finalData?.totalCapital || 0)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm opacity-90">Il tuo patrimonio futuro</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white overflow-hidden group hover:scale-105 transition-all duration-300">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                      <div className="relative">
                        <div className="flex items-center space-x-3 mb-3">
                          <Zap className="w-8 h-8 text-white" />
                          <span className="text-lg font-semibold">Guadagni Totali</span>
                        </div>
                        <p className="text-4xl font-bold mb-2">
                          {formatEuro(finalData?.totalReturns || 0)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm opacity-90">Interesse composto</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Monthly Passive Income */}
                  <div className="relative p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl text-white overflow-hidden group hover:scale-105 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-3 mb-3">
                        <Calendar className="w-8 h-8 text-white" />
                        <span className="text-lg font-semibold">Rendita Mensile</span>
                      </div>
                      <p className="text-3xl font-bold mb-2">
                        {formatEuro(monthlyPassiveIncome)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm opacity-90">Reddito passivo sostenibile (4% rule)</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Breakdown */}
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                    <h4 className="font-bold text-xl mb-4 text-gray-800">Dettaglio dopo {timeHorizon[0]} anni</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Wallet className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-700 font-medium">Contributi totali</span>
                        </div>
                        <span className="font-bold text-lg text-gray-900">{formatEuro(finalData?.totalContributions || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700 font-medium">Guadagni da investimenti</span>
                        </div>
                        <span className="font-bold text-lg text-green-600">{formatEuro(finalData?.totalReturns || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                        <div className="flex items-center space-x-3">
                          <Trophy className="w-6 h-6" />
                          <span className="font-bold text-lg">Totale</span>
                        </div>
                        <span className="font-bold text-2xl">{formatEuro(finalData?.totalCapital || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Multiplier Effect */}
                  <div className="relative p-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white overflow-hidden group hover:scale-105 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-3 mb-3">
                        <Info className="w-8 h-8 text-white" />
                        <span className="text-lg font-semibold">Effetto Moltiplicatore</span>
                      </div>
                      <p className="text-lg leading-relaxed">
                        Ogni euro investito oggi diventa{' '}
                        <span className="text-2xl font-bold bg-white/20 px-2 py-1 rounded-lg">
                          {(((finalData?.totalCapital || 0) / (finalData?.totalContributions || 1)) || 1).toFixed(1)}€
                        </span>{' '}
                        dopo {timeHorizon[0]} anni
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Enhanced Chart */}
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Crescita del Capitale nel Tempo
                </h3>
              </div>
              <div className="h-96 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulationData}>
                    <defs>
                      <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#6B7280"
                      fontSize={12}
                      fontWeight="500"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatEuro(value)} 
                      stroke="#6B7280"
                      fontSize={12}
                      fontWeight="500"
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatEuro(Number(value)), name]}
                      labelFormatter={(label) => `Anno ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalContributions" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="url(#colorContributions)"
                      name="Contributi"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalReturns" 
                      stackId="1"
                      stroke="#10B981" 
                      fill="url(#colorReturns)"
                      name="Guadagni"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Enhanced Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Analisi degli Scenari
              </h2>
              <p className="text-gray-600 text-lg">Scopri l'impatto di piccoli cambiamenti sul tuo futuro finanziario</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "E se investissi €100 in più al mese?",
                  subtitle: "Il potere del contributo extra",
                  current: calculateCompoundInterest(monthlyInvestment[0], annualReturn[0], timeHorizon[0], oneTimeInvestment[0], monthlyExpenses[0] * 100, uninvestedSavings[0], monthlySavings[0], compoundingFrequency),
                  scenario: calculateCompoundInterest(monthlyInvestment[0] + 100, annualReturn[0], timeHorizon[0], oneTimeInvestment[0], monthlyExpenses[0] * 100, uninvestedSavings[0], monthlySavings[0], compoundingFrequency),
                  icon: ArrowUp,
                  gradient: "from-green-500 to-emerald-600",
                  bgGradient: "from-green-50 to-emerald-50"
                },
                {
                  title: "E se il rendimento fosse 1% più alto?",
                  subtitle: "L'effetto dell'interesse composto",
                  current: calculateCompoundInterest(monthlyInvestment[0], annualReturn[0], timeHorizon[0], oneTimeInvestment[0], monthlyExpenses[0] * 100, uninvestedSavings[0], monthlySavings[0], compoundingFrequency),
                  scenario: calculateCompoundInterest(monthlyInvestment[0], annualReturn[0] + 1, timeHorizon[0], oneTimeInvestment[0], monthlyExpenses[0] * 100, uninvestedSavings[0], monthlySavings[0], compoundingFrequency),
                  icon: TrendingUp,
                  gradient: "from-blue-500 to-indigo-600",
                  bgGradient: "from-blue-50 to-indigo-50"
                },
                {
                  title: "E se iniziassi 5 anni prima?",
                  subtitle: "Il valore del tempo negli investimenti",
                  current: calculateCompoundInterest(monthlyInvestment[0], annualReturn[0], timeHorizon[0], oneTimeInvestment[0], monthlyExpenses[0] * 100, uninvestedSavings[0], monthlySavings[0], compoundingFrequency),
                  scenario: calculateCompoundInterest(monthlyInvestment[0], annualReturn[0], timeHorizon[0] + 5, oneTimeInvestment[0], monthlyExpenses[0] * 100, uninvestedSavings[0], monthlySavings[0], compoundingFrequency),
                  icon: Calendar,
                  gradient: "from-purple-500 to-pink-600",
                  bgGradient: "from-purple-50 to-pink-50"
                }
              ].map((scenario, index) => {
                const currentFinal = scenario.current[scenario.current.length - 1];
                const scenarioFinal = scenario.scenario[scenario.scenario.length - 1];
                const difference = scenarioFinal.totalCapital - currentFinal.totalCapital;
                const percentageIncrease = (difference / currentFinal.totalCapital) * 100;

                return (
                  <Card key={index} className={`p-8 bg-gradient-to-br ${scenario.bgGradient} border-0 shadow-xl rounded-3xl hover:shadow-2xl hover:scale-105 transition-all duration-500 group`}>
                    <div className="text-center mb-6">
                      <div className={`inline-flex p-4 bg-gradient-to-r ${scenario.gradient} rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-all duration-300`}>
                        <scenario.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{scenario.title}</h3>
                      <p className="text-gray-600 text-sm">{scenario.subtitle}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Scenario attuale</p>
                        <p className="text-2xl font-bold text-gray-800">{formatEuro(currentFinal.totalCapital)}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">Con questo cambiamento</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatEuro(scenarioFinal.totalCapital)}
                        </p>
                      </div>

                      <div className={`p-4 bg-gradient-to-r ${scenario.gradient} rounded-2xl text-white text-center`}>
                        <p className="text-lg font-bold mb-1">
                          +{formatEuro(difference)}
                        </p>
                        <p className="text-sm opacity-90">
                          (+{percentageIncrease.toFixed(1)}% in più)
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Enhanced Financial Independence Tab */}
          <TabsContent value="independence" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                La Tua Strada verso la Libertà Finanziaria
              </h2>
              <p className="text-gray-600 text-lg">Comprendi i concetti chiave per raggiungere l'indipendenza economica</p>
            </div>

            <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-6">Concetti Chiave</h4>
                  <div className="space-y-6">
                    <div className="p-6 border-2 border-blue-200 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-500 rounded-xl">
                          <PieChart className="w-5 h-5 text-white" />
                        </div>
                        <h5 className="text-lg font-bold text-blue-700">Regola del 4%</h5>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        Puoi prelevare il 4% del tuo portafoglio ogni anno senza intaccarlo
                      </p>
                    </div>

                    <div className="p-6 border-2 border-green-200 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-500 rounded-xl">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <h5 className="text-lg font-bold text-green-700">Numero FI</h5>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        Spese annuali × 25 = capitale necessario per la libertà finanziaria
                      </p>
                    </div>

                    <div className="p-6 border-2 border-purple-200 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-500 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h5 className="text-lg font-bold text-purple-700">Coast FI</h5>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        Capitale che, senza ulteriori contributi, crescerà fino al tuo numero FI
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-6">I Tuoi Numeri</h4>
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
                      <div className="flex items-center space-x-3 mb-3">
                        <Wallet className="w-6 h-6" />
                        <p className="text-lg font-semibold">Spese Mensili Simulate</p>
                      </div>
                      <p className="text-3xl font-bold">
                        {formatEuro(monthlyExpenses[0] * 100)}
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white">
                      <div className="flex items-center space-x-3 mb-3">
                        <Target className="w-6 h-6" />
                        <p className="text-lg font-semibold">Numero FI Necessario</p>
                      </div>
                      <p className="text-3xl font-bold">
                        {formatEuro((monthlyExpenses[0] * 100) * 12 * 25)}
                      </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl text-white">
                      <div className="flex items-center space-x-3 mb-3">
                        <Clock className="w-6 h-6" />
                        <p className="text-lg font-semibold">Anni alla Libertà Finanziaria</p>
                      </div>
                      <p className="text-3xl font-bold mb-2">
                        {yearsToFI} anni
                      </p>
                      <p className="text-sm opacity-90">
                        Con l'investimento attuale di {formatEuro(monthlyInvestment[0])}/mese
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}