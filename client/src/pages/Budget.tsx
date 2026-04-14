import React, { useState, useMemo } from "react";
import { safeFloat, toLocaleDateSafe } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatEuro } from "@/lib/financial";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { BudgetAllocator } from "@/components/budget/BudgetAllocator";
import { BudgetNoteField } from "@/components/budget/BudgetNoteField";
import { BudgetForecastDashboard } from "@/components/budget/BudgetForecastDashboard";
import { BudgetAlertsSystem } from "@/components/budget/BudgetAlertsSystem";
import { BudgetVisualizationsPanel } from "@/components/budget/BudgetVisualizationsPanel";
import { 
  DEFAULT_BUDGET_CATEGORIES, 
  getIconComponent, 
  BudgetCategory, 
  BudgetSubcategory,
  normalizeCustomCategories,
  NormalizedCustomCategory,
  categoryColors
} from "@/constants/budgetCategories";
import {
  categorizeTransaction,
  CATEGORY_NAME_MAPPING,
  REVERSE_CATEGORY_MAPPING,
  CATEGORIZATION_RULES,
  type CategorizationResult,
  type CategorizationRule
} from "@shared/categorization";

import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Treemap
} from "recharts";
import { 
  Target, TrendingUp, AlertTriangle, DollarSign, ShoppingCart, Home, Car, Coffee,
  Gamepad2, Heart, Briefcase, MoreHorizontal, Settings, Eye, Plus, Shirt, Sparkles, 
  GraduationCap, Phone, CreditCard, Calendar, PiggyBank, ArrowUpRight, ArrowDownRight,
  Zap, Wifi, Building, Thermometer, Wrench, Fuel, Bus, Shield, ParkingCircle, 
  Stethoscope, Pill, Dumbbell, Scissors, Footprints, Smartphone, Monitor, Headphones,
  Users, MapPin, Plane, Receipt, ShoppingBag, Edit3, Save, Trash2, Loader2, Search,
  Filter, Clock, Check, TrendingDown
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface BudgetSettings {
  id: number;
  userId: number;
  needsPercentage: string;
  wantsPercentage: string;
  savingsPercentage: string;
  monthlyIncome: string | null;
  customCategories: Record<string, any>[];
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  type: string;
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  budgetCategory?: string;
  isRecurring: boolean;
}

interface CategorySpending {
  category: string;
  budgetCategory?: string; // Make budgetCategory optional here
  amount: number;
  transactions: Transaction[];
  icon: React.ComponentType;
  color: string;
}

interface CategoryBudget {
  id?: number;
  userId?: number;
  category: string;
  subcategory?: string;
  monthlyBudget: string; // Decimal type is string in Drizzle
  budgetType: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Mapping delle icone per le categorie del modulo transazioni
const TRANSACTION_CATEGORY_ICONS: Record<string, string> = {
  'alimentari': 'ShoppingCart',
  'casa': 'Home', 
  'trasporti': 'Car',
  'salute': 'Heart',
  'telefonia': 'Phone',
  'ristorazione': 'Coffee',
  'intrattenimento': 'Gamepad2',
  'abbigliamento': 'Shirt',
  'bellezza': 'Sparkles',
  'educazione': 'GraduationCap',
  'bancario': 'DollarSign',
  'lavoro': 'Briefcase',
  'investimenti': 'TrendingUp',
  'debiti': 'CreditCard',
  'altro': 'MoreHorizontal'
};

// Mapping dei colori per le categorie del modulo transazioni
const TRANSACTION_CATEGORY_COLORS: Record<string, string> = {
  // Nomi esatti come usati nel modulo transazioni
  'Alimentazione': 'text-green-600',
  'Casa e Abitazione': 'text-blue-600',
  'Trasporti': 'text-red-600', 
  'Salute e Benessere': 'text-pink-600',
  'Tecnologia e Comunicazione': 'text-purple-600',
  'Ristoranti': 'text-amber-600',
  'Intrattenimento e Svago': 'text-indigo-600',
  'Abbigliamento e Accessori': 'text-rose-600',
  'Cura della Persona': 'text-violet-600',
  'Educazione': 'text-teal-600',
  'Lavoro e Formazione': 'text-gray-600',
  'Famiglia e Figli': 'text-cyan-600',
  'Bancario': 'text-slate-600',
  'Risparmi e Investimenti': 'text-emerald-600',
  'Debiti e Finanziamenti': 'text-rose-600',
  'Altro': 'text-neutral-600',

  // Mantengo anche i nomi brevi per compatibilità
  'alimentari': 'text-green-600',
  'casa': 'text-blue-600',
  'trasporti': 'text-red-600', 
  'salute': 'text-pink-600',
  'telefonia': 'text-purple-600',
  'ristorazione': 'text-amber-600',
  'intrattenimento': 'text-indigo-600',
  'abbigliamento': 'text-rose-600',
  'bellezza': 'text-violet-600',
  'educazione': 'text-teal-600',
  'bancario': 'text-slate-600',
  'lavoro': 'text-gray-600',
  'investimenti': 'text-emerald-600',
  'debiti': 'text-rose-600',
  'altro': 'text-neutral-600'
};

// Funzione per creare categorie budget SOLO dalle regole di categorizzazione del modulo transazioni
function createBudgetCategoriesFromTransactionRules(): Record<string, BudgetCategory> {
  const categories: Record<string, BudgetCategory> = {};

  // Aggiungi categorie basate sui nomi ESATTI usati nel modulo transazioni
  const transactionCategories = [
    { name: 'Alimentazione', key: 'alimentari', budgetType: 'needs' as const },
    { name: 'Casa e Abitazione', key: 'casa', budgetType: 'needs' as const },
    { name: 'Trasporti', key: 'trasporti', budgetType: 'needs' as const },
    { name: 'Salute e Benessere', key: 'salute', budgetType: 'needs' as const },
    { name: 'Tecnologia e Comunicazione', key: 'telefonia', budgetType: 'needs' as const },
    { name: 'Ristoranti', key: 'ristorazione', budgetType: 'wants' as const },
    { name: 'Intrattenimento e Svago', key: 'intrattenimento', budgetType: 'wants' as const },
    { name: 'Abbigliamento e Accessori', key: 'abbigliamento', budgetType: 'wants' as const },
    { name: 'Cura della Persona', key: 'bellezza', budgetType: 'wants' as const },
    { name: 'Educazione', key: 'educazione', budgetType: 'wants' as const },
    { name: 'Lavoro e Formazione', key: 'formazione', budgetType: 'needs' as const },
    { name: 'Famiglia e Figli', key: 'famiglia', budgetType: 'needs' as const },
    { name: 'Bancario', key: 'bancario', budgetType: 'wants' as const },
    { name: 'Risparmi e Investimenti', key: 'investimenti', budgetType: 'savings' as const },
    { name: 'Debiti e Finanziamenti', key: 'debiti', budgetType: 'needs' as const },
    { name: 'Altro', key: 'altro', budgetType: 'wants' as const }
  ];

  transactionCategories.forEach(cat => {
    categories[cat.name] = {
      iconKey: TRANSACTION_CATEGORY_ICONS[cat.key] || 'MoreHorizontal',
      color: TRANSACTION_CATEGORY_COLORS[cat.key] || 'text-gray-600',
      budgetType: cat.budgetType,
      subcategories: [] // Keep it simple - no complex subcategories for now
    };
  });

  return categories;
}

// Legacy categoryIcons mapping per compatibilità con codice esistente
const categoryIcons: Record<string, React.ComponentType<{className?: string}>> = {
  // Nomi esatti come usati nel modulo transazioni
  'Alimentazione': ShoppingCart,
  'Casa e Abitazione': Home,
  'Trasporti': Car,
  'Ristoranti': Coffee,
  'Intrattenimento e Svago': Gamepad2,
  'Salute e Benessere': Heart,
  'Lavoro e Formazione': Briefcase,
  'Abbigliamento e Accessori': Shirt,
  'Cura della Persona': Sparkles,
  'Educazione': Briefcase,
  'Tecnologia e Comunicazione': Phone,
  'Famiglia e Figli': Users,
  'Bancario': DollarSign,
  'Risparmi e Investimenti': TrendingUp,
  'Debiti e Finanziamenti': CreditCard,
  'Altro': MoreHorizontal,

  // Mantengo anche i nomi brevi per compatibilità
  'alimentari': ShoppingCart,
  'casa': Home,
  'trasporti': Car,
  'ristorazione': Coffee,
  'intrattenimento': Gamepad2,
  'salute': Heart,
  'lavoro': Briefcase,
  'abbigliamento': Shirt,
  'bellezza': Sparkles,
  'educazione': Briefcase,
  'telefonia': Phone,
  'bancario': DollarSign,
  'investimenti': TrendingUp,
  'debiti': CreditCard,
  'altro': MoreHorizontal
};

// Helper function to get icon for a category key or full name
function getCategoryIcon(categoryKey: string, categoryName?: string): React.ComponentType {
  // First try with the category key (short name)
  const iconFromKey = categoryIcons[categoryKey];
  if (iconFromKey) return iconFromKey;

  // Fallback
  return MoreHorizontal;
}

type CategoriesMap = Record<string, BudgetCategory | NormalizedCustomCategory>;

function CategoryBreakdownItem({ spending, allCategories }: { spending: CategorySpending, allCategories: CategoriesMap }) {
  const [showDetails, setShowDetails] = useState(false);
  const IconComponent = categoryIcons[spending.category] || MoreHorizontal;
  const categoryData = allCategories[spending.category];
  const categoryColor = categoryData?.color || TRANSACTION_CATEGORY_COLORS[spending.category.toLowerCase()] || 'text-gray-600';
  const budgetType = categoryData?.budgetType || 'wants';

  return (
    <div className="border rounded-lg">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${categoryColor} bg-opacity-10`}>
            <IconComponent className={`w-5 h-5 ${categoryColor}`} />
          </div>
          <div>
            <h3 className="font-medium">{spending.category}</h3>
            <Badge variant={
              budgetType === 'needs' ? 'destructive' : 
              budgetType === 'wants' ? 'default' : 'secondary'
            } className="text-xs mt-1">
              {budgetType === 'needs' ? 'Bisogni' : 
               budgetType === 'wants' ? 'Desideri' : 'Risparmi'}
            </Badge>
            {!categoryData && (
              <Badge variant="outline" className="text-xs mt-1 ml-2">
                Non mappata
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right flex items-center space-x-2">
          <div>
            <p className="font-medium">{formatEuro(spending.amount)}</p>
          </div>
          <span className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="border-t bg-gray-50 p-3">
          <div className="space-y-2">
            {spending.transactions.map((transaction, txIndex) => (
              <div key={txIndex} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{transaction.description || 'Transazione'}</p>
                  <p className="text-gray-500">
                    {toLocaleDateSafe(transaction.date)} • {transaction.type === 'expense' ? 'Spesa' : transaction.type === 'investment' ? 'Investimento' : 'Entrata'}
                  </p>
                </div>
                <span className={`font-medium ${
                  transaction.type === 'expense' ? 'text-red-600' : 
                  transaction.type === 'investment' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'}{formatEuro(Math.abs(transaction.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetVisualization({ spendingData, budgetSettings, allCategories }: { 
  spendingData: CategorySpending[], 
  budgetSettings: BudgetSettings,
  allCategories: CategoriesMap
}) {
  const monthlyIncome = safeFloat(budgetSettings.monthlyIncome);
  const needsBudget = (monthlyIncome * safeFloat(budgetSettings.needsPercentage)) / 100;
  const wantsBudget = (monthlyIncome * safeFloat(budgetSettings.wantsPercentage)) / 100;
  const savingsBudget = (monthlyIncome * safeFloat(budgetSettings.savingsPercentage)) / 100;

  const needsSpent = spendingData.filter(s => s.budgetCategory === 'needs').reduce((sum, s) => sum + s.amount, 0);
  const wantsSpent = spendingData.filter(s => s.budgetCategory === 'wants').reduce((sum, s) => sum + s.amount, 0);
  const savingsSpent = spendingData.filter(s => s.budgetCategory === 'savings').reduce((sum, s) => sum + s.amount, 0);

  const budgetData = [
    { name: 'Bisogni', budget: needsBudget, spent: needsSpent, percentage: safeFloat(budgetSettings.needsPercentage) },
    { name: 'Desideri', budget: wantsBudget, spent: wantsSpent, percentage: safeFloat(budgetSettings.wantsPercentage) },
    { name: 'Risparmi', budget: savingsBudget, spent: savingsSpent, percentage: safeFloat(budgetSettings.savingsPercentage) }
  ];

  const treemapData = spendingData.map(spending => ({
    name: spending.category,
    size: spending.amount,
    fill: categoryColors[spending.budgetCategory as keyof typeof categoryColors] || categoryColors['wants'] // Fallback color
  }));

  return (
    <div className="space-y-6">
      {/* Enhanced Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgetData.map((item, index) => {
          const usagePercentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
          const isOverBudget = usagePercentage > 100;
          const colors = ['green', 'amber', 'blue'];
          const colorScheme = colors[index];

          return (
            <Card key={index} className={`group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg ${
              isOverBudget 
                ? 'bg-gradient-to-br from-white to-red-50' 
                : `bg-gradient-to-br from-white to-${colorScheme}-50`
            }`}>
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`relative p-3 ${
                      isOverBudget 
                        ? 'bg-gradient-to-br from-red-500 to-rose-600' 
                        : `bg-gradient-to-br from-${colorScheme}-500 to-${colorScheme}-600`
                    } rounded-xl shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      {index === 0 && <Home className="w-6 h-6 text-white" />}
                      {index === 1 && <Coffee className="w-6 h-6 text-white" />}
                      {index === 2 && <PiggyBank className="w-6 h-6 text-white" />}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 ${
                        isOverBudget ? 'bg-red-400' : `bg-${colorScheme}-400`
                      } rounded-full animate-ping`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                      <span className={`text-sm font-medium ${
                        isOverBudget ? 'text-red-600' : `text-${colorScheme}-600`
                      }`}>{item.percentage}% del budget</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Speso</p>
                      <p className={`text-2xl font-bold ${
                        isOverBudget ? 'text-red-600' : `text-${colorScheme}-600`
                      }`}>{formatEuro(item.spent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="text-xl font-semibold text-gray-700">{formatEuro(item.budget)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progresso</span>
                      <span className={`font-bold ${
                        isOverBudget ? 'text-red-600' : `text-${colorScheme}-600`
                      }`}>{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(usagePercentage, 100)} 
                      className={`h-3 ${isOverBudget ? 'bg-red-100' : `bg-${colorScheme}-100`}`}
                    />
                  </div>

                  {isOverBudget ? (
                    <div className="flex items-center justify-center bg-red-100 p-3 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-600 font-semibold text-sm">
                        Superato di {formatEuro(item.spent - item.budget)}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center bg-${colorScheme}-100 p-3 rounded-lg`}>
                      <TrendingUp className={`w-5 h-5 text-${colorScheme}-600 mr-2`} />
                      <span className={`text-${colorScheme}-600 font-semibold text-sm`}>
                        Rimanenti: {formatEuro(item.budget - item.spent)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Treemap Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Spese per Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap data={treemapData} dataKey="size" aspectRatio={4/3} stroke="#fff" />
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dettaglio per Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {spendingData.map((spending, index) => (
              <CategoryBreakdownItem
                key={index}
                spending={spending}
                allCategories={allCategories}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBudgetManager({ 
  allCategories, 
  budgetSettings,
  selectedMonth, 
  setSelectedMonth,
  selectedDateRange,
  setSelectedDateRange,
  timeFilter,
  setTimeFilter
}: { 
  allCategories: CategoriesMap,
  budgetSettings: BudgetSettings | null,
  selectedMonth: string,
  setSelectedMonth: (month: string) => void,
  selectedDateRange: {start: string, end: string} | null,
  setSelectedDateRange: (range: {start: string, end: string} | null) => void,
  timeFilter: 'current-month' | 'custom-month' | 'date-range',
  setTimeFilter: (filter: 'current-month' | 'custom-month' | 'date-range') => void
}) {

  const [editingBudget, setEditingBudget] = useState<{category: string, subcategory?: string} | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [deletingBudget, setDeletingBudget] = useState<{id: number, category: string, amount: string} | null>(null);
  const [expandedTransactions, setExpandedTransactions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Funzione per filtrare transazioni in base al periodo selezionato (duplicata per questo componente)
  const getFilteredTransactions = (transactions: Transaction[]) => {
    if (!transactions) return [];

    let filteredTransactions = transactions.filter(t => 
      (t.type === 'expense' || t.type === 'investment' || t.type === 'goal_contribution') &&
      !t.description?.includes('Vendita investimento') &&
      t.category !== 'Trasferimenti'
    );

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    switch (timeFilter) {
      case 'current-month':
        filteredTransactions = filteredTransactions.filter(t => 
          t.date.slice(0, 7) === currentMonth
        );
        break;
      case 'custom-month':
        filteredTransactions = filteredTransactions.filter(t => 
          t.date.slice(0, 7) === selectedMonth
        );
        break;
      case 'date-range':
        if (selectedDateRange) {
          filteredTransactions = filteredTransactions.filter(t => 
            t.date >= selectedDateRange.start && t.date <= selectedDateRange.end
          );
        }
        break;
    }

    return filteredTransactions;
  };

  const { data: categoryBudgets = [] } = useQuery<CategoryBudget[]>({
    queryKey: ['/api/category-budgets']
  });

  // Auto-fix budget types when component loads if needed
  React.useEffect(() => {
    if (categoryBudgets.length > 0) {
      const needsFixing = categoryBudgets.some(budget => 
        budget.budgetType === 'expense' && allCategories[budget.category]
      );

      if (needsFixing && !fixBudgetTypesMutation.isPending) {
        fixBudgetTypesMutation.mutate();
      }
    }
  }, [categoryBudgets, allCategories]);

  const createBudgetMutation = useMutation({
    mutationFn: async (data: Partial<CategoryBudget>) => {
      const response = await apiRequest('POST', '/api/category-budgets', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget salvato",
        description: "Il budget è stato creato con successo."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/category-budgets'] });
      setEditingBudget(null);
      setBudgetAmount('');
      setNotes('');
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel salvare il budget",
        variant: "destructive"
      });
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CategoryBudget> }) => {
      const response = await apiRequest('PUT', `/api/category-budgets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget aggiornato",
        description: "Il budget è stato aggiornato con successo."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/category-budgets'] });
      setEditingBudget(null);
      setBudgetAmount('');
      setNotes('');
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornare il budget",
        variant: "destructive"
      });
    }
  });

  const fixBudgetTypesMutation = useMutation({
    mutationFn: async () => {
      const updates = categoryBudgets.filter(budget => 
        budget.budgetType === 'expense' && allCategories[budget.category]
      ).map(budget => {
        const categoryData = allCategories[budget.category];
        return apiRequest('PUT', `/api/category-budgets/${budget.id}`, {
          ...budget,
          budgetType: categoryData.budgetType
        });
      });

      return Promise.all(updates);
    },
    onSuccess: () => {
      toast({
        title: "Tipi budget corretti",
        description: "I tipi di budget sono stati aggiornati automaticamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/category-budgets'] });
    }
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/category-budgets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget eliminato",
        description: "Il budget è stato eliminato con successo."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/category-budgets'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'eliminare il budget",
        variant: "destructive"
      });
    }
  });

  const handleSaveBudget = () => {
    if (!editingBudget || !budgetAmount) return;

    const existingBudget = Array.isArray(categoryBudgets) 
      ? categoryBudgets.find(b => 
          b.category === editingBudget.category && 
          b.subcategory === editingBudget.subcategory
        )
      : undefined;

    // Get the budget type from the category data
    const categoryData = allCategories[editingBudget.category];
    const budgetType = categoryData?.budgetType || 'wants'; // Default to wants if not found

    const budgetData = {
      category: editingBudget.category,
      subcategory: editingBudget.subcategory || undefined,
      monthlyBudget: budgetAmount, // Keep as string for decimal type
      budgetType: budgetType,
      notes: notes || undefined,
      isActive: true
    };

    if (existingBudget) {
      updateBudgetMutation.mutate({ id: existingBudget.id!, data: budgetData });
    } else {
      createBudgetMutation.mutate(budgetData);
    }
  };

  const handleEditBudget = (category: string, subcategory?: string) => {
    const existingBudget = Array.isArray(categoryBudgets) 
      ? categoryBudgets.find(b => 
          b.category === category && b.subcategory === subcategory
        )
      : undefined;

    setEditingBudget({ category, subcategory });
    setBudgetAmount(existingBudget?.monthlyBudget.toString() || '');
    setNotes(existingBudget?.notes || '');
  };

  const getBudgetForCategory = (category: string, subcategory?: string) => {
    if (!Array.isArray(categoryBudgets)) {
      return undefined;
    }
    return categoryBudgets.find(b => 
      b.category === category && 
      (subcategory ? b.subcategory === subcategory : !b.subcategory)
    );
  };

  const getTotalBudget = () => {
    if (!Array.isArray(categoryBudgets)) {
      return 0;
    }
    return categoryBudgets.reduce((total, budget) => total + safeFloat(budget.monthlyBudget), 0);
  };

  const getBudgetsByType = (type: 'needs' | 'wants' | 'savings') => {
    if (!Array.isArray(categoryBudgets)) {
      return [];
    }
    return categoryBudgets.filter(budget => {
      // If budget has explicit budgetType, use it
      if (budget.budgetType && budget.budgetType !== 'expense') {
        return budget.budgetType === type;
      }
      // Otherwise, determine from category
      const categoryData = allCategories[budget.category];
      return categoryData?.budgetType === type;
    });
  };

  const getCategoryBudgetSummary = () => {
    const summary: Record<string, { total: number, subcategories: number, mainCategory: number }> = {};

    Object.keys(allCategories).forEach(categoryName => {
      const categoryBudget = getBudgetForCategory(categoryName);
      const categoryData = allCategories[categoryName];
      if (!categoryData?.subcategories) return;

      const subcategoryBudgets = categoryData.subcategories.map((sub: BudgetSubcategory) => getBudgetForCategory(categoryName, sub.name))
        .filter((budget): budget is CategoryBudget => budget !== null && budget !== undefined);

      const mainCategoryAmount = categoryBudget ? safeFloat(categoryBudget.monthlyBudget) : 0;
      const subcategoriesAmount = subcategoryBudgets.reduce((sum: number, b: CategoryBudget) => sum + safeFloat(b.monthlyBudget), 0);

      summary[categoryName] = {
        total: mainCategoryAmount + subcategoriesAmount,
        subcategories: subcategoriesAmount,
        mainCategory: mainCategoryAmount
      };
    });

    return summary;
  };

  // Get real spending data using the transactions from props
  const { data: transactionsData } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/transactions?limit=10000', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    }
  });

  const getRealSpendingByCategory = (transactions: Transaction[]) => {
    if (!transactions) return {};

    // Usa le transazioni già filtrate per il periodo
    const realSpending: Record<string, { total: number, transactions: Transaction[] }> = {};

    // Prima raggruppa le transazioni per categoria reale
    const transactionsByCategory: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const category = t.category || 'Altro';
      if (!transactionsByCategory[category]) {
        transactionsByCategory[category] = [];
      }
      transactionsByCategory[category].push(t);
    });

    // Inizializza tutte le categorie budget con 0
    Object.keys(allCategories).forEach(budgetCategoryName => {
      realSpending[budgetCategoryName] = {
        total: 0,
        transactions: []
      };
    });

    // Mappa le transazioni alle categorie budget
    Object.entries(transactionsByCategory).forEach(([transactionCategory, transactions]) => {
      let mappedToBudgetCategory = false;

      // Mapping diretto e specifico basato sui nomi delle categorie
      const categoryMappings: Record<string, string> = {
        // Transazione -> Budget Category (allineamento perfetto)
        'Alimentazione': 'Alimentazione',
        'Alimentari': 'Alimentazione',
        'Alimentari e Spesa': 'Alimentazione',
        'Casa e Abitazione': 'Casa e Abitazione', 
        'Casa': 'Casa e Abitazione',
        'Salute e Benessere': 'Salute e Benessere',
        'Salute': 'Salute e Benessere',
        'Tecnologia e Comunicazione': 'Tecnologia e Comunicazione',
        'Telefonia e Digitale': 'Tecnologia e Comunicazione',
        'Telefonia': 'Tecnologia e Comunicazione',
        'Ristoranti': 'Ristoranti',
        'Ristorazione': 'Ristoranti',
        'Intrattenimento': 'Intrattenimento e Svago',
        'Abbigliamento': 'Abbigliamento e Accessori',
        'Bellezza': 'Cura della Persona',
        'Investimenti': 'Risparmi e Investimenti',
        'Lavoro': 'Lavoro',
        'Lavoro e Formazione': 'Lavoro e Formazione',
        'Trasporti': 'Trasporti',
        'Altro': 'Altro'
      };

      // Prima prova mapping diretto
      if (categoryMappings[transactionCategory]) {
        const budgetCategory = categoryMappings[transactionCategory];
        if (realSpending[budgetCategory]) {
          realSpending[budgetCategory].total += transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          realSpending[budgetCategory].transactions.push(...transactions);
          mappedToBudgetCategory = true;
        }
      }

      // Se non mappato, cerca corrispondenza esatta nei nomi delle categorie budget
      if (!mappedToBudgetCategory) {
        if (realSpending[transactionCategory]) {
          realSpending[transactionCategory].total += transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          realSpending[transactionCategory].transactions.push(...transactions);
          mappedToBudgetCategory = true;
        }
      }

      // Se ancora non mappato, crea una nuova categoria se non esiste
      if (!mappedToBudgetCategory) {
        realSpending[transactionCategory] = {
          total: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
          transactions: transactions
        };
      }
    });

    return realSpending;
  };




  return (
    <div className="space-y-6">
      {/* Riepilogo Semplice - 50/30/20 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Riepilogo Semplice (50/30/20)
          </CardTitle>
          <p className="text-sm text-gray-600">Budget previsto secondo la regola dei bisogni, desideri e risparmi</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const filteredTransactions = getFilteredTransactions(transactionsData || []);
            const realSpending = getRealSpendingByCategory(filteredTransactions);

            // Calculate theoretical budget based on budget settings
            const monthlyIncome = safeFloat(budgetSettings?.monthlyIncome);
            const needsBudgetTheoretical = (monthlyIncome * safeFloat(budgetSettings?.needsPercentage, 50)) / 100;
            const wantsBudgetTheoretical = (monthlyIncome * safeFloat(budgetSettings?.wantsPercentage, 30)) / 100;
            const savingsBudgetTheoretical = (monthlyIncome * safeFloat(budgetSettings?.savingsPercentage, 20)) / 100;

            // Calculate actual spending by budget type
            let needsSpent = 0;
            let wantsSpent = 0;
            let savingsSpent = 0;

            Object.entries(realSpending).forEach(([categoryName, data]) => {
              const categoryData = allCategories[categoryName];
              const budgetType = categoryData?.budgetType || 'wants';

              switch (budgetType) {
                case 'needs':
                  needsSpent += data.total;
                  break;
                case 'wants':
                  wantsSpent += data.total;
                  break;
                case 'savings':
                  savingsSpent += data.total;
                  break;
              }
            });

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-center mb-2">
                    <Home className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-sm font-medium text-red-600">Bisogni</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-red-600">Budget: {formatEuro(needsBudgetTheoretical)}</p>
                    <p className="text-lg font-semibold text-red-800">Speso: {formatEuro(needsSpent)}</p>
                    <p className={`text-sm font-medium ${needsSpent > needsBudgetTheoretical ? 'text-red-700' : 'text-green-600'}`}>
                      {needsSpent > needsBudgetTheoretical ? 'Superato' : 'Nei limiti'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Essenziali ({budgetSettings?.needsPercentage || '50'}%)</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-center mb-2">
                    <Coffee className="w-5 h-5 text-amber-600 mr-2" />
                    <p className="text-sm font-medium text-amber-600">Desideri</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-amber-600">Budget: {formatEuro(wantsBudgetTheoretical)}</p>
                    <p className="text-lg font-semibold text-amber-800">Speso: {formatEuro(wantsSpent)}</p>
                    <p className={`text-sm font-medium ${wantsSpent > wantsBudgetTheoretical ? 'text-red-700' : 'text-green-600'}`}>
                      {wantsSpent > wantsBudgetTheoretical ? 'Superato' : 'Nei limiti'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Svago & Hobby ({budgetSettings?.wantsPercentage || '30'}%)</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <PiggyBank className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm font-medium text-green-600">Risparmi</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-green-600">Budget: {formatEuro(savingsBudgetTheoretical)}</p>
                    <p className="text-lg font-semibold text-green-800">Speso: {formatEuro(savingsSpent)}</p>
                    <p className={`text-sm font-medium ${savingsSpent > savingsBudgetTheoretical ? 'text-red-700' : 'text-green-600'}`}>
                      {savingsSpent > savingsBudgetTheoretical ? 'Superato' : 'Nei limiti'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Futuro ({budgetSettings?.savingsPercentage || '20'}%)</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-sm font-medium text-blue-600">Totale</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-blue-600">Budget: {formatEuro(needsBudgetTheoretical + wantsBudgetTheoretical + savingsBudgetTheoretical)}</p>
                    <p className="text-lg font-semibold text-blue-800">Speso: {formatEuro(needsSpent + wantsSpent + savingsSpent)}</p>
                    <p className="text-xs text-gray-500">Reddito: {formatEuro(monthlyIncome)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Budget Mensile</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Budget vs Reale Confronto - Layout Migliorato */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-white to-gray-50">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-3 text-2xl mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
                Budget vs Spese Reali
              </CardTitle>
              <p className="text-sm text-gray-600">Confronto intelligente tra obiettivi e risultati effettivi</p>
            </div>

            {/* Controlli Temporali - Migliorati */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500 hidden sm:block" />
              <Select value={timeFilter} onValueChange={(value: 'current-month' | 'custom-month' | 'date-range') => setTimeFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white">
                  <SelectValue placeholder="Seleziona periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">📅 Mese Corrente</SelectItem>
                  <SelectItem value="custom-month">📆 Mese Specifico</SelectItem>
                  <SelectItem value="date-range">📊 Intervallo Date</SelectItem>
                </SelectContent>
              </Select>

              {timeFilter === 'custom-month' && (
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full sm:w-[160px] bg-white"
                />
              )}

              {timeFilter === 'date-range' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={selectedDateRange?.start || ''}
                    onChange={(e) => setSelectedDateRange({
                      start: e.target.value,
                      end: selectedDateRange?.end || ''
                    })}
                    className="w-full sm:w-[140px] bg-white"
                  />
                  <span className="text-sm text-gray-500 text-center sm:text-left">→</span>
                  <Input
                    type="date"
                    value={selectedDateRange?.end || ''}
                    onChange={(e) => setSelectedDateRange({
                      start: selectedDateRange?.start || '',
                      end: e.target.value
                    })}
                    className="w-full sm:w-[140px] bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Periodo selezionato - Badge migliorato */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700">
            <Clock className="w-4 h-4" />
            {timeFilter === 'current-month' && `Periodo: ${new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`}
            {timeFilter === 'custom-month' && `Periodo: ${new Date(selectedMonth + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`}
            {timeFilter === 'date-range' && selectedDateRange?.start && selectedDateRange?.end && 
              `Periodo: ${new Date(selectedDateRange.start).toLocaleDateString('it-IT')} - ${new Date(selectedDateRange.end).toLocaleDateString('it-IT')}`
            }
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(() => {
              const budgetSummary = getCategoryBudgetSummary();
              const filteredTransactions = getFilteredTransactions(transactionsData || []);
              const realSpending = getRealSpendingByCategory(filteredTransactions);

              const categoriesToShow = new Set([
                ...Object.keys(budgetSummary).filter(cat => budgetSummary[cat].total > 0),
                ...Object.keys(realSpending).filter(cat => realSpending[cat].total > 0)
              ]);

              if (categoriesToShow.size === 0) {
                return (
                  <div className="col-span-full text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-10 h-10 text-blue-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">0</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun dato di confronto</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Configura i budget e registra alcune transazioni per vedere analisi dettagliate qui
                    </p>
                  </div>
                );
              }

              return Array.from(categoriesToShow).map((categoryName, index) => {
                const categoryData = allCategories[categoryName];
                const CategoryIcon = categoryData ? getIconComponent(categoryData.iconKey || 'MoreHorizontal') : MoreHorizontal;
                const categoryColor = categoryData?.color || TRANSACTION_CATEGORY_COLORS[categoryName.toLowerCase()] || 'text-gray-600';
                const budgetType = categoryData?.budgetType || 'wants';

                const budgeted = budgetSummary[categoryName]?.total || 0;
                const actual = realSpending[categoryName]?.total || 0;
                const difference = actual - budgeted;
                const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
                const transactions = realSpending[categoryName]?.transactions || [];

                let status: 'over' | 'under' | 'ontrack' = 'ontrack';
                if (budgeted > 0) {
                  if (percentage > 100) status = 'over';
                  else if (percentage < 90) status = 'under';
                }

                // Varianti di design per rendere le card più diverse
                const designVariants = [
                  'shadow-lg hover:shadow-2xl border-l-4',
                  'shadow-md hover:shadow-xl border-t-4', 
                  'shadow-lg hover:shadow-2xl border-r-4',
                ];
                const variant = designVariants[index % designVariants.length];

                const borderColor = status === 'over' ? 'border-red-400' : 
                                   status === 'under' ? 'border-green-400' : 'border-blue-400';

                return (
                  <div 
                    key={categoryName} 
                    className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl ${variant} ${borderColor} p-5 hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
                  >
                    {/* Header della Card */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl ${categoryColor} bg-opacity-10 group-hover:scale-110 transition-transform duration-300 shadow-md flex-shrink-0`}>
                          <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 truncate text-base">{categoryName}</h3>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Badge 
                              variant={budgetType === 'needs' ? 'destructive' : budgetType === 'wants' ? 'default' : 'secondary'} 
                              className="text-xs whitespace-nowrap"
                            >
                              {budgetType === 'needs' ? '🏠 Bisogni' : budgetType === 'wants' ? '🎯 Desideri' : '💰 Risparmi'}
                            </Badge>
                            {!categoryData && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                ⚠️ Non mappata
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Percentuale in alto a destra */}
                      {budgeted > 0 && (
                        <div className={`flex flex-col items-end flex-shrink-0 ${
                          status === 'over' ? 'text-red-600' : 
                          status === 'under' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          <div className="flex items-center gap-1">
                            {status === 'over' && <ArrowUpRight className="w-4 h-4" />}
                            {status === 'under' && <ArrowDownRight className="w-4 h-4" />}
                            <span className="text-2xl font-bold">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                          <span className="text-xs font-medium uppercase tracking-wide whitespace-nowrap">
                            {status === 'over' ? 'Superato' : status === 'under' ? 'Risparmiato' : 'On Track'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Statistiche principali */}
                    <div className="space-y-2 mb-3">
                      {budgeted > 0 && (
                        <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-700 font-semibold">Budget</span>
                          </div>
                          <span className="font-bold text-blue-700 text-base truncate ml-2">{formatEuro(budgeted)}</span>
                        </div>
                      )}

                      {actual > 0 && (
                        <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <DollarSign className="w-4 h-4 text-gray-700" />
                            <span className="text-xs text-gray-700 font-semibold">Speso</span>
                          </div>
                          <span className="font-bold text-gray-800 text-base truncate ml-2">{formatEuro(actual)}</span>
                        </div>
                      )}

                      {budgeted > 0 && actual > 0 && (
                        <div className={`flex items-center justify-between p-2.5 rounded-lg shadow-sm ${
                          difference > 0 ? 'bg-gradient-to-r from-red-50 to-red-100' : 'bg-gradient-to-r from-green-50 to-green-100'
                        }`}>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {difference > 0 ? (
                              <AlertTriangle className="w-4 h-4 text-red-700" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-700" />
                            )}
                            <span className={`text-xs font-semibold whitespace-nowrap ${difference > 0 ? 'text-red-700' : 'text-green-700'}`}>
                              {difference > 0 ? 'Sforato' : 'Risparmiato'}
                            </span>
                          </div>
                          <span className={`font-bold text-base truncate ml-2 ${
                            difference > 0 ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {difference > 0 ? '+' : ''}{formatEuro(Math.abs(difference))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {budgeted > 0 && actual > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700">Progresso</span>
                          <span className={`font-bold text-sm ${
                            status === 'over' ? 'text-red-600' : 
                            status === 'under' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {Math.min(percentage, 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              status === 'over' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 
                              status === 'under' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                              'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            <div className="h-full w-full animate-pulse bg-white opacity-20"></div>
                          </div>
                        </div>
                        {percentage > 100 && (
                          <div className="flex items-center gap-1 text-xs text-red-700 font-semibold bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-300">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Budget superato del {(percentage - 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stati speciali */}
                    {budgeted > 0 && actual === 0 && (
                      <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 shadow-sm">
                        <Check className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-bold text-green-700">Nessuna spesa registrata</p>
                      </div>
                    )}

                    {budgeted === 0 && actual > 0 && (
                      <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm font-bold text-yellow-700">Budget non configurato</p>
                      </div>
                    )}

                    {/* Lista transazioni espandibile */}
                    {transactions.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <button
                          onClick={() => setExpandedTransactions(prev => ({
                            ...prev,
                            [categoryName]: !prev[categoryName]
                          }))}
                          className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">
                              {transactions.length} Transazion{transactions.length === 1 ? 'e' : 'i'}
                            </span>
                          </div>
                          <div className={`transform transition-transform ${expandedTransactions[categoryName] ? 'rotate-180' : ''}`}>
                            <ArrowDownRight className="w-4 h-4 text-gray-600" />
                          </div>
                        </button>

                        {expandedTransactions[categoryName] && (
                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {transactions.map((t: any, idx: number) => (
                              <div 
                                key={idx}
                                className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800">
                                      {t.description || t.merchant || 'Transazione'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(t.date).toLocaleDateString('it-IT', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                  <span className="text-sm font-bold text-red-600">
                                    -{formatEuro(Math.abs(safeFloat(t.amount)))}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>



      {/* Categories and Subcategories - Enhanced Design */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-white to-indigo-50/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white pb-8">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Settings className="w-6 h-6" />
                </div>
                Budget per Categoria
              </CardTitle>
              <p className="text-sm text-indigo-100 max-w-2xl">
                Gestisci i tuoi budget mensili per ogni categoria e sottocategoria di spesa con precisione
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">{Object.keys(allCategories).length} Categorie</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Accordion type="multiple" className="space-y-3">
            {Object.entries(allCategories).map(([categoryName, categoryData], index) => {
              if (!categoryData) return null;
              const CategoryIcon = getIconComponent(categoryData.iconKey || 'MoreHorizontal');
              const categoryBudget = getBudgetForCategory(categoryName);
              const subcategoryBudgets = categoryData.subcategories.map((sub: BudgetSubcategory) => 
                getBudgetForCategory(categoryName, sub.name)
              ).filter((budget): budget is CategoryBudget => budget !== null && budget !== undefined);

              const gradients = [
                'from-blue-500/10 to-indigo-500/5',
                'from-purple-500/10 to-pink-500/5',
                'from-green-500/10 to-emerald-500/5',
                'from-orange-500/10 to-amber-500/5',
                'from-red-500/10 to-rose-500/5',
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <AccordionItem 
                  key={categoryName} 
                  value={categoryName} 
                  className={`group border-2 border-gray-200 rounded-2xl bg-gradient-to-br ${gradient} hover:border-indigo-300 hover:shadow-lg transition-all duration-300`}
                  data-testid={`accordion-item-${categoryName}`}
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline" data-testid={`accordion-trigger-${categoryName}`}>
                    <div className="flex items-center justify-between w-full pointer-events-none">
                      <div className="flex items-center gap-4">
                        <div className={`relative p-3 rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <CategoryIcon className={`w-6 h-6 ${categoryData.color}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-gray-800 text-lg">{categoryName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full">
                              {categoryData.subcategories.length} sottocategorie
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mr-4">
                        {categoryBudget && (
                          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                            <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {formatEuro(safeFloat(categoryBudget.monthlyBudget))}
                            </span>
                          </div>
                        )}
                        <Badge 
                          variant={
                            categoryData.budgetType === 'needs' ? 'destructive' : 
                            categoryData.budgetType === 'wants' ? 'default' : 'secondary'
                          }
                          className="px-3 py-1 text-xs font-semibold shadow-sm"
                        >
                          {categoryData.budgetType === 'needs' ? '🏠 Bisogni' : 
                           categoryData.budgetType === 'wants' ? '🎯 Desideri' : '💰 Risparmi'}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div className="space-y-4 pt-2">
                      {/* Main Category Budget */}
                      <div className="relative p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <Target className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">Budget Categoria Principale</p>
                              <p className="text-sm text-gray-600">{categoryName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {categoryBudget ? (
                              <>
                                <span className="font-bold text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  {formatEuro(safeFloat(categoryBudget.monthlyBudget))}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBudget(categoryName)}
                                  className="bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border-blue-200 shadow-sm"
                                  title="Modifica budget"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeletingBudget({
                                    id: categoryBudget.id!,
                                    category: categoryName,
                                    amount: formatEuro(safeFloat(categoryBudget.monthlyBudget))
                                  })}
                                  className="bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200 shadow-sm"
                                  disabled={deleteBudgetMutation.isPending}
                                  title="Elimina budget"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleEditBudget(categoryName)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                data-testid={`add-budget-${categoryName}`}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Aggiungi Budget
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {categoryData.subcategories.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            <h4 className="font-semibold text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                              Sottocategorie
                            </h4>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {categoryData.subcategories.map((subcategory: BudgetSubcategory) => {
                              const SubIcon = getIconComponent(subcategory.iconKey || 'MoreHorizontal');
                              const subBudget = getBudgetForCategory(categoryName, subcategory.name);

                              return (
                                <div 
                                  key={subcategory.name} 
                                  className="group/sub flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${subcategory.color} bg-opacity-10 group-hover/sub:scale-110 transition-transform`}>
                                      <SubIcon className={`w-4 h-4 ${subcategory.color}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{subcategory.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subBudget ? (
                                      <>
                                        <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                                          {formatEuro(safeFloat(subBudget.monthlyBudget))}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditBudget(categoryName, subcategory.name)}
                                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setDeletingBudget({
                                            id: subBudget.id!,
                                            category: `${categoryName} - ${subcategory.name}`,
                                            amount: formatEuro(safeFloat(subBudget.monthlyBudget))
                                          })}
                                          className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                          disabled={deleteBudgetMutation.isPending}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditBudget(categoryName, subcategory.name)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Budget
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent data-testid="budget-form">
          <DialogHeader>
            <DialogTitle>
              {editingBudget?.subcategory 
                ? `Budget per ${editingBudget.subcategory}` 
                : `Budget per ${editingBudget?.category}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget-amount">Budget Mensile (€)</Label>
              <Input
                id="budget-amount"
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="es. 300"
              />
            </div>
            <div>
              <Label htmlFor="budget-notes">Note (opzionale)</Label>
              <Input
                id="budget-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi note o dettagli..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveBudget}
                disabled={!budgetAmount || createBudgetMutation.isPending || updateBudgetMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Salva Budget
              </Button>
              <Button variant="outline" onClick={() => setEditingBudget(null)}>
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBudget} onOpenChange={() => setDeletingBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il budget di <strong>{deletingBudget?.amount}</strong> per <strong>{deletingBudget?.category}</strong>?
              <br />
              <span className="text-red-600 text-sm mt-2 block">Questa azione non può essere annullata.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBudget(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingBudget) {
                  deleteBudgetMutation.mutate(deletingBudget.id);
                  setDeletingBudget(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteBudgetMutation.isPending}
            >
              {deleteBudgetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina Budget
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BudgetSetup({ budgetSettings, onUpdate }: { 
  budgetSettings: BudgetSettings | null, 
  onUpdate: () => void 
}) {
  const [needsPercentage, setNeedsPercentage] = useState(budgetSettings?.needsPercentage || "50");
  const [wantsPercentage, setWantsPercentage] = useState(budgetSettings?.wantsPercentage || "30");
  const [savingsPercentage, setSavingsPercentage] = useState(budgetSettings?.savingsPercentage || "20");
  const [monthlyIncome, setMonthlyIncome] = useState(budgetSettings?.monthlyIncome || "");

  const { toast } = useToast();
  const { user } = useAuth();

  const updateBudgetMutation = useMutation({
    mutationFn: async (data: { needsPercentage: string; wantsPercentage: string; savingsPercentage: string; monthlyIncome: string; userId: number; }) => {
      const response = await apiRequest('POST', '/api/budget/settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget aggiornato",
        description: "Le impostazioni del budget sono state salvate con successo."
      });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    const total = safeFloat(needsPercentage) + safeFloat(wantsPercentage) + safeFloat(savingsPercentage);
    if (Math.abs(total - 100) > 0.01) {
      toast({
        title: "Errore",
        description: "Le percentuali devono sommare a 100%",
        variant: "destructive"
      });
      return;
    }

    updateBudgetMutation.mutate({
      needsPercentage,
      wantsPercentage,
      savingsPercentage,
      monthlyIncome: monthlyIncome || "",
      userId: (user && typeof user === 'object' && 'id' in user && typeof user.id === 'number') ? user.id : 0
    });
  };

  const total = safeFloat(needsPercentage) + safeFloat(wantsPercentage) + safeFloat(savingsPercentage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurazione Budget (Regola 50/30/20)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="monthlyIncome">Entrata Mensile Netta (€)</Label>
          <Input
            id="monthlyIncome"
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="es. 2500"
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="needs">Bisogni (%)</Label>
            <Input
              id="needs"
              type="number"
              value={needsPercentage}
              onChange={(e) => setNeedsPercentage(e.target.value)}
              min="0"
              max="100"
            />
            <p className="text-sm text-gray-500 mt-1">Affitto, bollette, cibo, trasporti</p>
          </div>

          <div>
            <Label htmlFor="wants">Desideri (%)</Label>
            <Input
              id="wants"
              type="number"
              value={wantsPercentage}
              onChange={(e) => setWantsPercentage(e.target.value)}
              min="0"
              max="100"
            />
            <p className="text-sm text-gray-500 mt-1">Ristoranti, hobby, shopping</p>
          </div>

          <div>
            <Label htmlFor="savings">Risparmi (%)</Label>
            <Input
              id="savings"
              type="number"
              value={savingsPercentage}
              onChange={(e) => setSavingsPercentage(e.target.value)}
              min="0"
              max="100"
            />
            <p className="text-sm text-gray-500 mt-1">Investimenti, obiettivi futuri</p>
          </div>
        </div>

        <div className="text-center">
          <p className={`text-sm ${Math.abs(total - 100) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
            Totale: {total.toFixed(1)}%
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateBudgetMutation.isPending || Math.abs(total - 100) > 0.01}
          className="w-full"
        >
          {updateBudgetMutation.isPending ? "Salvando..." : "Salva Configurazione"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Budget() {
  const { data: budgetSettings } = useQuery<BudgetSettings>({
    queryKey: ['/api/budget/settings']
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/transactions?limit=10000', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    }
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard']
  });

  // State per controlli temporali
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [selectedDateRange, setSelectedDateRange] = useState<{start: string, end: string} | null>(null);
  const [timeFilter, setTimeFilter] = useState<'current-month' | 'custom-month' | 'date-range'>('current-month');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Normalize and combine categories with useMemo for performance
  const customCategories = useMemo(() => 
    normalizeCustomCategories(budgetSettings?.customCategories || []), 
    [budgetSettings]
  );

  // Genera categorie SOLO dal modulo transazioni - niente categorie extra
  const transactionBasedCategories = useMemo(() => 
    createBudgetCategoriesFromTransactionRules(), 
    []
  );

  // Use ONLY transaction-based categories, no DEFAULT_BUDGET_CATEGORIES
  const allCategories: CategoriesMap = useMemo(() => ({
    ...transactionBasedCategories,
    ...customCategories
  }), [transactionBasedCategories, customCategories]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCategoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/transactions/update-budget-categories', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Categorie aggiornate",
        description: data.message || "Transazioni categorizzate automaticamente",
      });
      // Refresh transactions to show updated categories
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento delle categorie",
        variant: "destructive"
      });
    }
  });

  // Funzione per filtrare transazioni in base al periodo selezionato
  const getFilteredTransactions = (transactions: Transaction[]) => {
    if (!transactions) return [];

    let filteredTransactions = transactions.filter(t => 
      (t.type === 'expense' || t.type === 'investment' || t.type === 'goal_contribution') &&
      !t.description?.includes('Vendita investimento') &&
      t.category !== 'Trasferimenti'
    );

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    switch (timeFilter) {
      case 'current-month':
        filteredTransactions = filteredTransactions.filter(t => 
          t.date.slice(0, 7) === currentMonth
        );
        break;
      case 'custom-month':
        filteredTransactions = filteredTransactions.filter(t => 
          t.date.slice(0, 7) === selectedMonth
        );
        break;
      case 'date-range':
        if (selectedDateRange) {
          filteredTransactions = filteredTransactions.filter(t => 
            t.date >= selectedDateRange.start && t.date <= selectedDateRange.end
          );
        }
        break;
    }

    return filteredTransactions;
  };

  // Categorize and group transactions (exclude investment transfers)
  const spendingData: CategorySpending[] = [];
  if (transactions) {
    const budgetTransactions = getFilteredTransactions(transactions);

    // Group by category
    const groupedByCategory: Record<string, Transaction[]> = {};

    budgetTransactions.forEach(transaction => {
      // Use database category if available, otherwise auto-categorize
      let finalCategory = transaction.category;
      let finalBudgetCategory = transaction.budgetCategory;

      if (!finalCategory || !finalBudgetCategory) {
        const { category, budgetCategory } = categorizeTransaction(
          transaction.description || '', 
          transaction.merchant
        );
        finalCategory = finalCategory || category;
        finalBudgetCategory = finalBudgetCategory || budgetCategory;
      }

      // Override budget categories for specific categories that should always be in needs
      if (finalCategory && ['Trasporti', 'Casa', 'Salute', 'Alimentari', 'Telefonia', 'Lavoro'].includes(finalCategory)) {
        finalBudgetCategory = 'needs';
      }

      if (!groupedByCategory[finalCategory]) {
        groupedByCategory[finalCategory] = [];
      }
      groupedByCategory[finalCategory].push({
        ...transaction,
        category: finalCategory,
        budgetCategory: finalBudgetCategory
      });
    });

    // Convert to CategorySpending format
    Object.entries(groupedByCategory).forEach(([category, transactions]) => {
      const amount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const budgetCategory = transactions[0]?.budgetCategory || 'wants'; // Default to 'wants' if not determined

      spendingData.push({
        category,
        budgetCategory, // This might be undefined if not found by categorization
        amount,
        transactions,
        icon: categoryIcons[category] || MoreHorizontal,
        color: categoryColors[budgetCategory as keyof typeof categoryColors] || categoryColors['wants'] // Fallback color
      });
    });
  }

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/budget/settings'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Header with enhanced design - Mobile Optimized */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-green-50 rounded-2xl sm:rounded-3xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-2xl border border-gray-200">
            {/* Decorative elements with better contrast */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-teal-500/5 rounded-full"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-green-600 rounded-xl sm:rounded-2xl shadow-lg">
                      <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="hidden sm:block h-12 w-1 bg-green-500 rounded-full"></div>
                    <div>
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                        Money Management
                      </h1>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-gray-100 text-xs sm:text-sm font-medium">Sistema Intelligente 50/30/20</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm sm:text-lg leading-relaxed max-w-2xl font-medium">
                    Ottimizza le tue finanze con il metodo della regola 50/30/20 e prendi controllo completo delle tue spese
                  </p>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="text-center text-gray-300 text-sm bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">📊 Panoramica</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs lg:text-sm">🚨 Alert</TabsTrigger>
            <TabsTrigger value="forecasts" className="text-xs lg:text-sm">🔮 Previsioni</TabsTrigger>
            <TabsTrigger value="visualizations" className="text-xs lg:text-sm">📊 Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs lg:text-sm">⚙️ Impostazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {budgetSettings && spendingData.length > 0 ? (
              <BudgetVisualization spendingData={spendingData} budgetSettings={budgetSettings} allCategories={allCategories} />
            ) : (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-white to-gray-50">
                <CardContent className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-green-200 rounded-full opacity-20 animate-ping"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Configura il tuo Budget Intelligente</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Attiva il sistema di gestione intelligente 50/30/20 per ottimizzare automaticamente le tue finanze
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mr-3"
                      onClick={() => {
                        const settingsTab = document.querySelector('[value="settings"]') as HTMLElement;
                        if (settingsTab) settingsTab.click();
                      }}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Inizia Configurazione
                    </Button>

                    {transactions && transactions.length > 0 && (
                      <Button 
                        variant="outline"
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 px-6 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300"
                        onClick={() => updateCategoriesMutation.mutate()}
                        disabled={updateCategoriesMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {updateCategoriesMutation.isPending ? 'Categorizzando...' : 'Categorizza Transazioni'}
                      </Button>
                    )}
                  </div>

                  {transactions && transactions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">
                        💡 <strong>Suggerimento:</strong> Clicca "Categorizza Transazioni" per assegnare automaticamente le tue transazioni esistenti alle categorie budget (Bisogni/Desideri/Risparmi)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>



          {/* Smart Budget Alerts System */}
          <TabsContent value="alerts">
            <BudgetAlertsSystem />
          </TabsContent>

          {/* Enhanced Budget Forecast Dashboard */}
          <TabsContent value="forecasts">
            <div className="space-y-6">
              <BudgetForecastDashboard />
              <Separator />
              <CategoryBudgetManager 
                allCategories={allCategories} 
                budgetSettings={budgetSettings}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDateRange={selectedDateRange}
                setSelectedDateRange={setSelectedDateRange}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
              />
            </div>
          </TabsContent>

          {/* Advanced Visualizations Panel */}
          <TabsContent value="visualizations">
            <BudgetVisualizationsPanel />
          </TabsContent>



          <TabsContent value="settings">
            <BudgetSetup budgetSettings={budgetSettings || null} onUpdate={refreshData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}