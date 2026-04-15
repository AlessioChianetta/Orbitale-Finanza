import React, { useState, useMemo, useCallback } from "react";
import { safeFloat, safeInt, getLocalDateString } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Target,
  Wallet,
  PiggyBank,
  CreditCard,
  Edit,
  Trash2,
  MoreHorizontal,
  Home,
  Calculator,
  History,
  Send,
  Receipt,
  Car,
  ShoppingCart,
  ShoppingBag,
  Coffee,
  Gamepad2,
  Heart,
  Settings,
  Plane,
  AlertTriangle,
  ChevronDown,
  // Additional icons for subcategories
  Zap,
  Phone,
  Wifi,
  Building,
  Thermometer,
  Wrench,
  Fuel,
  Bus,
  Shield,
  ParkingCircle,
  Stethoscope,
  Pill,
  Dumbbell,
  Scissors,
  Eye,
  Shirt,
  Footprints,
  Smartphone,
  Monitor,
  Headphones,
  Cloud,
  Baby,
  GraduationCap,
  Briefcase,
  Gift,
  FileText,
  BookOpen,
  Utensils,
  MapPin,
  Landmark,
  Car as TaxiIcon,
  Train,
  PersonStanding,
  Users,
  Sparkles
} from "lucide-react";

import { apiRequest, queryClient, invalidateAccountCache } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatEuro } from "@/lib/financial";

// Helper function to get bank name from IBAN or explicit bank name
const getBankName = (iban: string, bankName?: string) => {
  if (bankName && bankName.trim() !== '') return bankName;
  if (!iban) return '';

  // Extract bank from IBAN patterns
  if (iban.includes('REVO')) return 'Revolut';
  if (iban.includes('NTSB')) return 'N26';
  if (iban.includes('BCIT')) return 'Intesa Sanpaolo';
  if (iban.includes('UBSP')) return 'UBI Banca';
  if (iban.includes('BPER')) return 'BPER Banca';
  if (iban.includes('BMPS')) return 'Monte dei Paschi';
  if (iban.includes('UNCRITMM')) return 'UniCredit';

  return `${iban.substring(0, 8)}...`;
};

// Helper function to get account display name with bank info - MOVED OUTSIDE COMPONENTS
const getAccountDisplayName = (accountType: string, accountArchitecture?: any, customAccounts?: any[]) => {
  if (!accountType) return '';

  // Handle custom accounts
  if (accountType.startsWith('custom_')) {
    const customAccountId = accountType.replace('custom_', '');
    const customAccount = customAccounts?.find((acc: any) => acc.id.toString() === customAccountId);
    if (customAccount) {
      const bankName = getBankName(customAccount.iban, customAccount.bankName);
      return `${customAccount.name}${bankName ? ` (${bankName})` : ''}`;
    }
    return accountType.replace('custom_', 'Conto Personalizzato ');
  }

  // Handle standard accounts with correct names from architecture
  if (accountArchitecture?.accounts) {
    const account = accountArchitecture.accounts[accountType as keyof typeof accountArchitecture.accounts];
    if (account?.name) {
      const bankName = getBankName(account.iban, account.bankName);
      return `${account.name}${bankName ? ` (${bankName})` : ''}`;
    }
  }

  // Fallback names
  const accountNames = {
    income: 'Conto di Ingresso/Smistamento',
    wealth: 'Conto Pila',
    operating: 'Conto Circolante',
    emergency: 'Conto Emergenze/Sicurezza',
    investment: 'Conto Investimenti/Libertà',
    savings: 'Conto Accantonamenti/Tasse Annuali'
  };
  return accountNames[accountType as keyof typeof accountNames] || accountType;
};

interface Transaction {
  id: number;
  userId: number;
  type: 'income' | 'expense' | 'investment' | 'goal_contribution';
  category: string;
  amount: number;
  description: string;
  accountType?: string;
  date: string;
  goalId?: number;
  investmentId?: number;
  isRecurring: boolean;
  createdAt: string;
  source?: string; // Added to distinguish between manual and checkup transactions
}

const transactionTypes = [
  { value: 'income', label: 'Entrata', icon: TrendingUp, color: 'text-green-600' },
  { value: 'expense', label: 'Spesa', icon: TrendingDown, color: 'text-red-600' }
];

const incomeCategories = [
  'Stipendio', 'Freelance', 'Bonus', 'Investimenti', 'Vendite', 'Affitti', 'Altro'
];

const expenseCategories = {
  'Casa e Abitazione': [
    'Affitto/Mutuo',
    'Bollette (Luce, Gas, Acqua)',
    'Telefono fisso/Internet',
    'Condominio',
    'Riscaldamento/Climatizzazione',
    'Tassa rifiuti (TARI)',
    'Manutenzioni/Riparazioni casa'
  ],
  'Trasporti': [
    'Benzina/Diesel/Elettrico',
    'Abbonamenti mezzi pubblici',
    'Assicurazione auto',
    'Bollo auto',
    'Parcheggi/ZTL',
    'Pedaggi autostradali',
    'Manutenzione/Revisione auto',
    'Car sharing/Taxi'
  ],
  'Alimentazione': [
    'Spesa alimentare (supermercato)',
    'Ristoranti/Pizzerie',
    'Bar/Caffè',
    'Mensa ufficio/scuola',
    'Delivery/Take away'
  ],
  'Salute e Benessere': [
    'Assicurazione sanitaria',
    'Farmaci/Parafarmaci',
    'Visite mediche private',
    'Dentista/Ortodonzia',
    'Palestra/Piscina/Sport',
    'Parrucchiere/Barbiere',
    'Estetista/Nail art',
    'Prodotti igiene personale'
  ],
  'Abbigliamento e Cura': [
    'Vestiti',
    'Scarpe',
    'Intimo',
    'Accessori (borse, cinture, etc.)',
    'Lavanderia/Tintoria'
  ],
  'Tecnologia e Comunicazione': [
    'Telefono cellulare',
    'Netflix/Prime/Disney+',
    'Spotify/Apple Music',
    'Software/App premium',
    'Cloud storage',
    'Gaming (PlayStation Plus, etc.)'
  ],
  'Intrattenimento e Cultura': [
    'Cinema/Teatro',
    'Concerti/Eventi',
    'Libri/Audiolibri',
    'Riviste/Giornali',
    'Hobby e passioni'
  ],
  'Famiglia e Figli': [
    'Asilo nido/Scuola privata',
    'Baby sitter',
    'Pannolini/Prodotti neonato',
    'Attività sportive bambini',
    'Regali (compleanni, ricorrenze)'
  ],
  'Lavoro e Formazione': [
    'Corsi di formazione',
    'Libri professionali',
    'Trasporti per lavoro',
    'Abbigliamento professionale'
  ],
  'Debiti e Finanziamenti': [
    'Carte di credito',
    'Prestiti personali',
    'Mutuo casa',
    'Finanziamento auto',
    'Finanziamento moto',
    'Prestiti studenteschi',
    'Debiti familiari',
    'Scoperti bancari',
    'Altri debiti'
  ],
  'Altro': [
    'Donazioni/Beneficenza',
    'Spese veterinario (animali)',
    'Spese impreviste (buffer)',
    'Accantonamento vacanze',
    'Accantonamento regali Natale',
    'Altro'
  ]
};

const subscriptionCategories = [
  'Telefonia', 'Internet', 'Streaming', 'Software', 'Palestra',
  'Assicurazioni', 'Servizi Bancari', 'Servizi Cloud', 'Riviste', 'Altro'
];

const investmentCategories = [
  'Azioni', 'Obbligazioni', 'ETF', 'Fondi', 'Criptovalute', 'Immobili', 'Materie Prime', 'Altro'
];

function AddTransactionDialog({ trigger }: { trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [lastSavedInfo, setLastSavedInfo] = useState<{ amount: string; category: string; type: string } | null>(null);
  const batchModeRef = React.useRef(false);
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    date: getLocalDateString(),
    goalId: '',
    investmentId: '',
    accountType: '',
    isRecurring: false,
    frequency: 'monthly',
    dayOfMonth: new Date().getDate(),
    endDate: ''
  });
  const { toast } = useToast();

  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setBatchCount(0);
      setLastSavedInfo(null);
      batchModeRef.current = false;
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (lastSavedInfo) {
      const timer = setTimeout(() => setLastSavedInfo(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastSavedInfo]);

  const useThreeStepMode = isMobile;

  const { data: goals } = useQuery({
    queryKey: ['/api/goals'],
    enabled: formData.type === 'goal_contribution'
  });

  const { data: investments } = useQuery({
    queryKey: ['/api/investments'],
    enabled: formData.type === 'investment'
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    enabled: formData.type === 'investment' || formData.type === 'goal_contribution'
  });

  const { data: accountArchitecture } = useQuery({
    queryKey: ['/api/account-architecture'],
    staleTime: 30 * 1000 // 30 seconds for critical data
  });

  const { data: customAccounts } = useQuery({
    queryKey: ['/api/custom-accounts'],
    staleTime: 30 * 1000 // 30 seconds for critical data
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = data.type === 'subscription' ? '/api/recurring-transactions' : '/api/transactions';

      const payload = {
        ...data,
        amount: safeFloat(data.amount),
        goalId: data.goalId ? safeInt(data.goalId) : undefined,
        investmentId: data.investmentId ? safeInt(data.investmentId) : undefined,
        account_type: data.accountType
      };

      const response = await apiRequest('POST', endpoint, payload);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore server: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (result) => {
      invalidateAccountCache();
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });

      if (batchModeRef.current) {
        setBatchCount(prev => prev + 1);
        setLastSavedInfo({
          amount: formData.amount,
          category: formData.category || formData.subcategory || formData.type,
          type: formData.type
        });
        resetFormPartial();
        toast({
          title: "Transazione salvata!",
          description: "Puoi aggiungerne un'altra."
        });
      } else {
        toast({
          title: "Transazione aggiunta!",
          description: "La transazione è stata registrata con successo."
        });
        setIsOpen(false);
        resetForm();
      }
      batchModeRef.current = false;
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Combine standard and custom accounts - Filter only configured accounts
  const standardAccountTypes = (accountArchitecture as any)?.accounts ? [
    {
      value: 'income',
      label: (accountArchitecture as any).accounts.income.name,
      bankName: getBankName((accountArchitecture as any).accounts.income.iban, (accountArchitecture as any).accounts.income.bankName),
      iban: (accountArchitecture as any).accounts.income.iban,
      balance: (accountArchitecture as any).accounts.income.balance,
      type: 'standard'
    },
    {
      value: 'wealth',
      label: (accountArchitecture as any).accounts.wealth.name,
      bankName: getBankName((accountArchitecture as any).accounts.wealth.iban, (accountArchitecture as any).accounts.wealth.bankName),
      iban: (accountArchitecture as any).accounts.wealth.iban,
      balance: (accountArchitecture as any).accounts.wealth.balance,
      type: 'standard'
    },
    {
      value: 'operating',
      label: (accountArchitecture as any).accounts.operating.name,
      bankName: getBankName((accountArchitecture as any).accounts.operating.iban, (accountArchitecture as any).accounts.operating.bankName),
      iban: (accountArchitecture as any).accounts.operating.iban,
      balance: (accountArchitecture as any).accounts.operating.balance,
      type: 'standard'
    },
    {
      value: 'emergency',
      label: (accountArchitecture as any).accounts.emergency.name,
      bankName: getBankName((accountArchitecture as any).accounts.emergency.iban, (accountArchitecture as any).accounts.emergency.bankName),
      iban: (accountArchitecture as any).accounts.emergency.iban,
      balance: (accountArchitecture as any).accounts.emergency.balance,
      type: 'standard'
    },
    {
      value: 'investment',
      label: (accountArchitecture as any).accounts.investment.name,
      bankName: getBankName((accountArchitecture as any).accounts.investment.iban, (accountArchitecture as any).accounts.investment.bankName),
      iban: (accountArchitecture as any).accounts.investment.iban,
      balance: (accountArchitecture as any).accounts.investment.balance,
      type: 'standard'
    },
    {
      value: 'savings',
      label: (accountArchitecture as any).accounts.savings.name,
      bankName: getBankName((accountArchitecture as any).accounts.savings.iban, (accountArchitecture as any).accounts.savings.bankName),
      iban: (accountArchitecture as any).accounts.savings.iban,
      balance: (accountArchitecture as any).accounts.savings.balance,
      type: 'standard'
    }
  ].filter(account => account.iban && account.iban.trim() !== '') : [];

  const customAccountTypes = Array.isArray(customAccounts) ? customAccounts.map((account: any) => ({
    value: `custom_${account.id}`,
    label: account.name,
    bankName: getBankName(account.iban, account.bankName),
    iban: account.iban,
    balance: account.balance,
    type: 'custom',
    customAccount: account
  })) : [];

  const accountTypes = [...standardAccountTypes, ...customAccountTypes];

  const resetForm = () => {
    setFormData({
      type: '',
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      accountType: '',
      date: getLocalDateString(),
      goalId: '',
      investmentId: '',
      isRecurring: false,
      frequency: 'monthly',
      dayOfMonth: new Date().getDate(),
      endDate: ''
    });
    setCurrentStep(1);
  };

  const resetFormPartial = () => {
    setFormData(prev => ({
      ...prev,
      amount: '',
      description: '',
      date: getLocalDateString(),
      goalId: '',
      investmentId: '',
      isRecurring: false,
      frequency: 'monthly',
      dayOfMonth: new Date().getDate(),
      endDate: ''
    }));
    if (isMobile) {
      setCurrentStep(2);
    }
  };

  const totalSteps = useThreeStepMode ? 3 : 1;

  const canProceedToStep2 = () => {
    return formData.type && (formData.type === 'goal_contribution' || formData.category);
  };

  const canProceedToStep3 = () => {
    return canProceedToStep2() &&
           formData.accountType &&
           formData.amount &&
           (formData.type !== 'expense' || !formData.category || formData.subcategory);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Tipo e Categoria';
      case 2: return 'Conto e Importo';
      case 3: return 'Dettagli e Conferma';
      default: return 'Aggiungi Transazione';
    }
  };

  const availableLiquidity = ((dashboardData as any)?.financialSummary?.availableLiquidity) || 0;


  // Get the balance of the selected account
  const getSelectedAccountBalance = () => {
    if (!formData.accountType) return 0;

    // Handle custom accounts
    if (formData.accountType.startsWith('custom_')) {
      const customAccountId = formData.accountType.replace('custom_', '');
      const customAccount = Array.isArray(customAccounts) ? customAccounts.find((acc: any) => acc.id.toString() === customAccountId) : null;
      return customAccount?.balance || 0;
    }

    // Handle standard accounts
    const archAccounts = (accountArchitecture as any)?.accounts;
    if (!archAccounts) {
      return 0;
    }
    const account = archAccounts[formData.accountType];
    return account?.balance || 0;
  };

  const selectedAccountBalance = getSelectedAccountBalance();

  const handleSubmit = (batch = false) => {
    const isCategoryRequired = formData.type !== 'goal_contribution';
    const isSubcategoryRequired = formData.type === 'expense' && formData.category;

    if (!formData.type || (isCategoryRequired && !formData.category) || (isSubcategoryRequired && !formData.subcategory) || !formData.amount) {
      toast({
        title: "Campi mancanti",
        description: "Completa tutti i campi obbligatori.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.accountType) {
      toast({
        title: "Conto mancante",
        description: accountArchitecture ?
          "Seleziona il conto di riferimento per questa transazione." :
          "Devi prima configurare l'architettura dei conti.",
        variant: "destructive"
      });
      return;
    }

    const amount = safeFloat(formData.amount);

    if (formData.type === 'investment' && amount > availableLiquidity) {
      toast({
        title: "Liquidità insufficiente",
        description: `Disponibili: ${formatEuro(availableLiquidity)}, richiesti: ${formatEuro(amount)}`,
        variant: "destructive"
      });
      return;
    }

    if ((formData.type === 'expense' || formData.type === 'subscription' || formData.type === 'goal_contribution') && amount > selectedAccountBalance) {
      const selectedAccount = accountTypes.find(acc => acc.value === formData.accountType);
      toast({
        title: "Saldo insufficiente",
        description: `Il conto ${selectedAccount?.label} ha un saldo di ${formatEuro(selectedAccountBalance)}, ma hai richiesto ${formatEuro(amount)}`,
        variant: "destructive"
      });
      return;
    }

    batchModeRef.current = batch;
    addTransactionMutation.mutate(formData);
  };

  const getCategoriesForType = () => {
    switch (formData.type) {
      case 'income':
        return incomeCategories;
      case 'expense':
        return Object.keys(expenseCategories); // Return main categories
      case 'investment':
        return investmentCategories;
      case 'goal_contribution':
        return [];
      case 'subscription':
        return subscriptionCategories;
      default:
        return [];
    }
  };

  const getSubcategoriesForCategory = () => {
    if (formData.type === 'expense' && formData.category && expenseCategories[formData.category as keyof typeof expenseCategories]) {
      return expenseCategories[formData.category as keyof typeof expenseCategories];
    }
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] max-h-[90vh]' : 'sm:max-w-3xl'} flex flex-col p-0`}>
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {useThreeStepMode ? getStepTitle() : 'Aggiungi Transazione'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {useThreeStepMode
                    ? `Step ${currentStep} di ${totalSteps}`
                    : batchCount > 0
                      ? `${batchCount} transazion${batchCount === 1 ? 'e' : 'i'} inserit${batchCount === 1 ? 'a' : 'e'} in questa sessione`
                      : 'Compila i dettagli per registrare una nuova operazione'}
                </DialogDescription>
              </div>
            </div>
            {batchCount > 0 && (
              <div className="flex items-center space-x-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                <span>{batchCount}</span>
              </div>
            )}
          </div>

          {useThreeStepMode && (
            <div className="flex space-x-2 mt-4">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    index + 1 <= currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0" style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}>
          {lastSavedInfo && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">Transazione salvata!</p>
                <p className="text-xs text-green-600 truncate">{formatEuro(safeFloat(lastSavedInfo.amount))} - {lastSavedInfo.category}</p>
              </div>
            </div>
          )}

          {(!useThreeStepMode || currentStep === 1) && (
            <div className={`space-y-4 ${isMobile ? '' : 'mb-6'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center space-x-2">
                    <span>Tipo Transazione</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value, category: ''})}>
                    <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] overflow-y-auto">
                      {transactionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="py-3">
                          <div className="flex items-center space-x-3">
                            <type.icon className={`w-5 h-5 ${type.color}`} />
                            <span className="font-medium">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category - Not required for goal contributions */}
                {formData.type && formData.type !== 'goal_contribution' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center space-x-2">
                      <span>Categoria</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value, subcategory: ''})}>
                      <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[50vh] overflow-y-auto">
                        {getCategoriesForType().map((category) => {
                          const categoryConfig: Record<string, { icon: any, color: string }> = {
                            'Casa e Abitazione': { icon: Home, color: 'text-blue-600' },
                            'Trasporti': { icon: Car, color: 'text-purple-600' },
                            'Alimentazione': { icon: ShoppingCart, color: 'text-orange-600' },
                            'Salute e Benessere': { icon: Heart, color: 'text-red-600' },
                            'Abbigliamento e Cura': { icon: Shirt, color: 'text-indigo-600' },
                            'Tecnologia e Comunicazione': { icon: Settings, color: 'text-gray-600' },
                            'Intrattenimento e Cultura': { icon: Gamepad2, color: 'text-pink-600' },
                            'Famiglia e Figli': { icon: Baby, color: 'text-yellow-600' },
                            'Lavoro e Formazione': { icon: GraduationCap, color: 'text-teal-600' },
                            'Debiti e Finanziamenti': { icon: CreditCard, color: 'text-rose-600' },
                            'Altro': { icon: DollarSign, color: 'text-gray-600' },
                            'Stipendio': { icon: TrendingUp, color: 'text-green-600' },
                            'Freelance': { icon: TrendingUp, color: 'text-blue-600' },
                            'Bonus': { icon: TrendingUp, color: 'text-yellow-600' },
                            'Investimenti': { icon: TrendingUp, color: 'text-purple-600' },
                            'Vendite': { icon: TrendingUp, color: 'text-orange-600' },
                            'Affitti': { icon: TrendingUp, color: 'text-teal-600' }
                          };
                          const config = categoryConfig[category] || { icon: DollarSign, color: 'text-gray-600' };
                          const Icon = config.icon;

                          return (
                            <SelectItem key={category} value={category} className="py-3">
                              <div className="flex items-center space-x-3">
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <span className="font-medium">{category}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Subcategory - Only show for expenses when category is selected */}
              {formData.type === 'expense' && formData.category && getSubcategoriesForCategory().length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center space-x-2">
                    <span>Sottocategoria</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.subcategory} onValueChange={(value) => setFormData({...formData, subcategory: value})}>
                    <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                      <SelectValue placeholder="Seleziona sottocategoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] overflow-y-auto">
                      {getSubcategoriesForCategory().map((subcategory) => {
                        const subcategoryIcons: Record<string, { icon: any, color: string }> = {
                          // Casa e Abitazione
                          'Affitto/Mutuo': { icon: Home, color: 'text-blue-600' },
                          'Bollette (Luce, Gas, Acqua)': { icon: Zap, color: 'text-yellow-600' },
                          'Telefono fisso/Internet': { icon: Wifi, color: 'text-green-600' },
                          'Condominio': { icon: Building, color: 'text-gray-600' },
                          'Riscaldamento/Climatizzazione': { icon: Thermometer, color: 'text-red-600' },
                          'Tassa rifiuti (TARI)': { icon: Receipt, color: 'text-orange-600' },
                          'Manutenzioni/Riparazioni casa': { icon: Wrench, color: 'text-blue-700' },

                          // Trasporti
                          'Benzina/Diesel/Elettrico': { icon: Fuel, color: 'text-red-600' },
                          'Abbonamenti mezzi pubblici': { icon: Bus, color: 'text-blue-600' },
                          'Assicurazione auto': { icon: Shield, color: 'text-blue-600' },
                          'Bollo auto': { icon: Receipt, color: 'text-orange-600' },
                          'Parcheggi/ZTL': { icon: ParkingCircle, color: 'text-purple-600' },
                          'Pedaggi autostradali': { icon: Car, color: 'text-blue-600' },
                          'Manutenzione/Revisione auto': { icon: Wrench, color: 'text-gray-600' },
                          'Car sharing/Taxi': { icon: TaxiIcon, color: 'text-indigo-600' },

                          // Alimentazione
                          'Spesa alimentare (supermercato)': { icon: ShoppingCart, color: 'text-green-600' },
                          'Ristoranti/Pizzerie': { icon: Coffee, color: 'text-red-600' },
                          'Bar/Caffè': { icon: Coffee, color: 'text-orange-600' },
                          'Mensa ufficio/scuola': { icon: Coffee, color: 'text-blue-600' },
                          'Delivery/Take away': { icon: ShoppingBag, color: 'text-purple-600' },

                          // Salute e Benessere
                          'Assicurazione sanitaria': { icon: Shield, color: 'text-blue-600' },
                          'Farmaci/Parafarmaci': { icon: Pill, color: 'text-green-600' },
                          'Visite mediche private': { icon: Stethoscope, color: 'text-red-600' },
                          'Dentista/Ortodonzia': { icon: Heart, color: 'text-blue-600' },
                          'Palestra/Piscina/Sport': { icon: Dumbbell, color: 'text-orange-600' },
                          'Parrucchiere/Barbiere': { icon: Scissors, color: 'text-pink-600' },
                          'Estetista/Nail art': { icon: Sparkles, color: 'text-pink-600' },
                          'Prodotti igiene personale': { icon: Heart, color: 'text-purple-600' },
                          'Ottico/Lenti': { icon: Eye, color: 'text-purple-600' },

                          // Abbigliamento e Cura
                          'Vestiti': { icon: Shirt, color: 'text-blue-600' },
                          'Scarpe': { icon: Footprints, color: 'text-brown-600' },
                          'Intimo': { icon: Shirt, color: 'text-pink-600' },
                          'Accessori (borse, cinture, etc.)': { icon: Gift, color: 'text-purple-600' },
                          'Lavanderia/Tintoria': { icon: Shirt, color: 'text-gray-600' },

                          // Tecnologia e Comunicazione
                          'Telefono cellulare': { icon: Smartphone, color: 'text-blue-600' },
                          'Netflix/Prime/Disney+': { icon: Monitor, color: 'text-red-600' },
                          'Spotify/Apple Music': { icon: Headphones, color: 'text-green-600' },
                          'Software/App premium': { icon: Settings, color: 'text-purple-600' },
                          'Cloud storage': { icon: Cloud, color: 'text-blue-600' },
                          'Gaming (PlayStation Plus, etc.)': { icon: Gamepad2, color: 'text-orange-600' },

                          // Intrattenimento e Cultura
                          'Cinema/Teatro': { icon: Monitor, color: 'text-red-600' },
                          'Concerti/Eventi': { icon: Heart, color: 'text-pink-600' },
                          'Libri/Audiolibri': { icon: BookOpen, color: 'text-blue-600' },
                          'Riviste/Giornali': { icon: FileText, color: 'text-gray-600' },
                          'Hobby e passioni': { icon: Heart, color: 'text-purple-600' },

                          // Famiglia e Figli
                          'Asilo nido/Scuola privata': { icon: GraduationCap, color: 'text-blue-600' },
                          'Baby sitter': { icon: Users, color: 'text-pink-600' },
                          'Pannolini/Prodotti neonato': { icon: Heart, color: 'text-yellow-600' },
                          'Attività sportive bambini': { icon: Target, color: 'text-orange-600' },
                          'Regali (compleanni, ricorrenze)': { icon: Gift, color: 'text-purple-600' },

                          // Lavoro e Formazione
                          'Corsi di formazione': { icon: GraduationCap, color: 'text-blue-600' },
                          'Libri professionali': { icon: BookOpen, color: 'text-green-600' },
                          'Trasporti per lavoro': { icon: Bus, color: 'text-gray-600' },
                          'Abbigliamento professionale': { icon: Briefcase, color: 'text-purple-600' },

                          // Altro
                          'Donazioni/Beneficenza': { icon: Heart, color: 'text-red-600' },
                          'Spese veterinario (animali)': { icon: Heart, color: 'text-green-600' },
                          'Spese impreviste (buffer)': { icon: AlertTriangle, color: 'text-orange-600' },
                          'Accantonamento vacanze': { icon: Plane, color: 'text-blue-600' },
                          'Accantonamento regali Natale': { icon: Gift, color: 'text-red-600' },
                          'Altro': { icon: DollarSign, color: 'text-gray-600' }
                        };

                        const iconConfig = subcategoryIcons[subcategory] || { icon: DollarSign, color: 'text-gray-600' };
                        const Icon = iconConfig.icon;

                        return (
                          <SelectItem key={subcategory} value={subcategory} className="py-3">
                            <div className="flex items-center space-x-3">
                              <Icon className={`w-5 h-5 ${iconConfig.color}`} />
                              <span className="font-medium">{subcategory}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {(!useThreeStepMode || currentStep === 2) && (
            <div className={`space-y-4 ${isMobile ? '' : 'mb-6'}`}>
              {!isMobile && (
                <div className="flex items-center space-x-3 pt-2 pb-1">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Conto e Importo</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <span>Conto di Riferimento</span>
                  <span className="text-red-500">*</span>
                </Label>
                {accountArchitecture ? (
                  <>
                    <Select value={formData.accountType} onValueChange={(value) => setFormData({...formData, accountType: value})}>
                      <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                        <SelectValue placeholder="Seleziona il conto..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[50vh] overflow-y-auto">
                        {accountTypes.map((account) => (
                          <SelectItem key={account.value} value={account.value} className="py-4">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Wallet className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{account.label}</div>
                                  {account.bankName && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      🏦 {account.bankName}
                                    </div>
                                  )}
                                  {account.iban && (
                                    <div className="text-xs text-gray-500 font-mono">
                                      {account.iban}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {account.balance !== undefined && (
                                <div className="text-right">
                                  <div className="text-sm font-bold text-gray-900">
                                    {formatEuro(account.balance)}
                                  </div>
                                  <div className="text-xs text-gray-500">disponibile</div>
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {accountTypes.length === 0 ? (
                      <div className="p-4 border-2 border-orange-200 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 mt-2">
                        <div className="flex items-center space-x-3 text-orange-800 mb-3">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-semibold">Nessun conto configurato</span>
                        </div>
                        <p className="text-sm text-orange-700 mb-3">
                          Configura i tuoi conti per procedere con le transazioni.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/account-architecture-setup?force=true'}
                          className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        >
                          Configura Conti
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Seleziona il conto da cui verrà effettuata questa operazione
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-6 border-2 border-dashed border-orange-300 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center space-x-3 text-orange-800 mb-3">
                      <Home className="w-6 h-6" />
                      <span className="font-semibold">Architettura dei conti richiesta</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-4">
                      Configura prima la tua architettura dei conti per utilizzare le transazioni.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/account-architecture'}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      Configura Architettura
                    </Button>
                  </div>
                )}
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center space-x-2">
                    <span>Importo (€)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  {formData.type === 'investment' && (
                    <div className={`text-xs p-2 rounded-lg ${availableLiquidity < 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      💰 Liquidità disponibile: {formatEuro(availableLiquidity)}
                      {availableLiquidity < 0 && " (insufficiente)"}
                    </div>
                  )}
                  {(formData.type === 'expense' || formData.type === 'subscription' || formData.type === 'goal_contribution') && formData.accountType && (
                    <div className={`text-xs p-2 rounded-lg ${selectedAccountBalance < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      💳 Saldo disponibile: {formatEuro(selectedAccountBalance)}
                      {selectedAccountBalance <= 0 && " (insufficiente)"}
                    </div>
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className={`h-12 text-lg font-semibold border-2 transition-colors ${
                      (formData.type === 'investment' && safeFloat(formData.amount) > availableLiquidity) ||
                      ((formData.type === 'expense' || formData.type === 'subscription' || formData.type === 'goal_contribution') &&
                       safeFloat(formData.amount) > selectedAccountBalance)
                        ? "border-red-300 focus:border-red-500"
                        : "hover:border-blue-300 focus:border-blue-500"
                    }`}
                    max={
                      formData.type === 'investment' ? availableLiquidity :
                      (formData.type === 'expense' || formData.type === 'subscription' || formData.type === 'goal_contribution') ? selectedAccountBalance :
                      undefined
                    }
                  />
                  {formData.type === 'investment' && safeFloat(formData.amount) > availableLiquidity && (
                    <p className="text-xs text-red-500 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Importo superiore alla liquidità disponibile</span>
                    </p>
                  )}
                  {(formData.type === 'expense' || formData.type === 'subscription' || formData.type === 'goal_contribution') &&
                   safeFloat(formData.amount) > selectedAccountBalance && (
                    <p className="text-xs text-red-500 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Importo superiore al saldo disponibile</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="h-12 border-2 hover:border-blue-300 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {(!useThreeStepMode || currentStep === 3) && (
            <div className="space-y-4">
              {!isMobile && (
                <div className="flex items-center space-x-3 pt-2 pb-1">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Dettagli e Conferma</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
          {isMobile && formData.type && formData.type !== 'goal_contribution' && (
            <div>
              <Label>Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value, subcategory: ''})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh] overflow-y-auto">
                  {getCategoriesForType().map((category) => {
                    // Map categories to icons and colors for dropdown display
                    const categoryConfig: Record<string, { icon: any, color: string }> = {
                      'Casa e Abitazione': { icon: Home, color: 'text-blue-600' },
                      'Trasporti': { icon: Car, color: 'text-purple-600' },
                      'Alimentazione': { icon: ShoppingCart, color: 'text-orange-600' },
                      'Salute e Benessere': { icon: Heart, color: 'text-red-600' },
                      'Abbigliamento e Cura': { icon: Shirt, color: 'text-indigo-600' },
                      'Tecnologia e Comunicazione': { icon: Settings, color: 'text-gray-600' },
                      'Intrattenimento e Cultura': { icon: Gamepad2, color: 'text-pink-600' },
                      'Famiglia e Figli': { icon: Baby, color: 'text-yellow-600' },
                      'Lavoro e Formazione': { icon: GraduationCap, color: 'text-teal-600' },
                      'Altro': { icon: DollarSign, color: 'text-gray-600' },
                      // Income categories
                      'Stipendio': { icon: TrendingUp, color: 'text-green-600' },
                      'Freelance': { icon: TrendingUp, color: 'text-blue-600' },
                      'Bonus': { icon: TrendingUp, color: 'text-yellow-600' },
                      'Investimenti': { icon: TrendingUp, color: 'text-purple-600' },
                      'Vendite': { icon: TrendingUp, color: 'text-orange-600' },
                      'Affitti': { icon: TrendingUp, color: 'text-teal-600' }
                    };
                    const config = categoryConfig[category] || { icon: DollarSign, color: 'text-gray-600' };
                    const Icon = config.icon;

                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {isMobile && formData.type === 'expense' && formData.category && getSubcategoriesForCategory().length > 0 && (
            <div>
              <Label>Sottocategoria *</Label>
              <Select value={formData.subcategory} onValueChange={(value) => setFormData({...formData, subcategory: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona sottocategoria" />
                </SelectTrigger>
                <SelectContent className="max-h-[50vh] overflow-y-auto">
                  {getSubcategoriesForCategory().map((subcategory) => {
                    const subcategoryIcons: Record<string, { icon: any, color: string }> = {
                      'Affitto/Mutuo': { icon: Home, color: 'text-blue-600' },
                      'Bollette (Luce, Gas, Acqua)': { icon: Zap, color: 'text-yellow-600' },
                      'Telefono fisso/Internet': { icon: Wifi, color: 'text-green-600' },
                      'Condominio': { icon: Building, color: 'text-gray-600' },
                      'Riscaldamento/Climatizzazione': { icon: Thermometer, color: 'text-red-600' },
                      'Tassa rifiuti (TARI)': { icon: Receipt, color: 'text-orange-600' },
                      'Manutenzioni/Riparazioni casa': { icon: Wrench, color: 'text-blue-700' },

                      // Trasporti
                      'Benzina/Diesel/Elettrico': { icon: Fuel, color: 'text-red-600' },
                      'Abbonamenti mezzi pubblici': { icon: Bus, color: 'text-blue-600' },
                      'Assicurazione auto': { icon: Shield, color: 'text-blue-600' },
                      'Bollo auto': { icon: Receipt, color: 'text-orange-600' },
                      'Parcheggi/ZTL': { icon: ParkingCircle, color: 'text-purple-600' },
                      'Pedaggi autostradali': { icon: Car, color: 'text-blue-600' },
                      'Manutenzione/Revisione auto': { icon: Wrench, color: 'text-gray-600' },
                      'Car sharing/Taxi': { icon: TaxiIcon, color: 'text-indigo-600' },

                      // Alimentazione
                      'Spesa alimentare (supermercato)': { icon: ShoppingCart, color: 'text-green-600' },
                      'Ristoranti/Pizzerie': { icon: Coffee, color: 'text-red-600' },
                      'Bar/Caffè': { icon: Coffee, color: 'text-orange-600' },
                      'Mensa ufficio/scuola': { icon: Coffee, color: 'text-blue-600' },
                      'Delivery/Take away': { icon: ShoppingBag, color: 'text-purple-600' },

                      // Salute e Benessere
                      'Assicurazione sanitaria': { icon: Shield, color: 'text-blue-600' },
                      'Farmaci/Parafarmaci': { icon: Pill, color: 'text-green-600' },
                      'Visite mediche private': { icon: Stethoscope, color: 'text-red-600' },
                      'Dentista/Ortodonzia': { icon: Heart, color: 'text-blue-600' },
                      'Palestra/Sport': { icon: Dumbbell, color: 'text-orange-600' },
                      'Parrucchiere/Estetica': { icon: Scissors, color: 'text-pink-600' },
                      'Ottico/Lenti': { icon: Eye, color: 'text-purple-600' },

                      // Abbigliamento e Cura
                      'Abbigliamento': { icon: Shirt, color: 'text-indigo-600' },
                      'Scarpe/Accessori': { icon: Footprints, color: 'text-brown-600' },
                      'Prodotti bellezza/Cosmetici': { icon: Sparkles, color: 'text-pink-600' },
                      'Vestiti': { icon: Shirt, color: 'text-blue-600' },
                      'Scarpe': { icon: Footprints, color: 'text-brown-600' },
                      'Intimo': { icon: Shirt, color: 'text-pink-600' },
                      'Accessori (borse, cinture, etc.)': { icon: Gift, color: 'text-purple-600' },
                      'Lavanderia/Tintoria': { icon: Shirt, color: 'text-gray-600' },

                      // Tecnologia e Comunicazione
                      'Telefono/Internet mobile': { icon: Smartphone, color: 'text-blue-600' },
                      'Elettronica/Informatica': { icon: Monitor, color: 'text-gray-600' },
                      'Software/App/Abbonamenti': { icon: Settings, color: 'text-purple-600' },
                      'Accessori tech': { icon: Headphones, color: 'text-green-600' },
                      'Telefono cellulare': { icon: Smartphone, color: 'text-blue-600' },
                      'Netflix/Prime/Disney+': { icon: Monitor, color: 'text-red-600' },
                      'Spotify/Apple Music': { icon: Headphones, color: 'text-green-600' },
                      'Software/App premium': { icon: Settings, color: 'text-purple-600' },
                      'Cloud storage': { icon: Cloud, color: 'text-blue-600' },
                      'Gaming (PlayStation Plus, etc.)': { icon: Gamepad2, color: 'text-orange-600' },

                      // Intrattenimento e Cultura
                      'Cinema/Teatro/Concerti': { icon: Calendar, color: 'text-red-600' },
                      'Streaming/Gaming': { icon: Gamepad2, color: 'text-blue-600' },
                      'Libri/Riviste': { icon: GraduationCap, color: 'text-green-600' },
                      'Hobby/Corsi': { icon: Heart, color: 'text-purple-600' },
                      'Viaggi/Vacanze': { icon: Plane, color: 'text-blue-600' },
                      'Sport/Attività ricreative': { icon: Target, color: 'text-orange-600' },
                      'Cinema/Teatro': { icon: Monitor, color: 'text-red-600' },
                      'Concerti/Eventi': { icon: Heart, color: 'text-pink-600' },
                      'Libri/Audiolibri': { icon: BookOpen, color: 'text-blue-600' },
                      'Riviste/Giornali': { icon: FileText, color: 'text-gray-600' },
                      'Hobby e passioni': { icon: Heart, color: 'text-purple-600' },

                      // Famiglia e Figli
                      'Bambini (vestiti, giochi)': { icon: Heart, color: 'text-pink-600' },
                      'Scuola/Università': { icon: GraduationCap, color: 'text-blue-600' },
                      'Babysitter/Asilo nido': { icon: Users, color: 'text-green-600' },
                      'Attività sportive bambini': { icon: Target, color: 'text-orange-600' },
                      'Spese mediche bambini': { icon: Stethoscope, color: 'text-red-600' },
                      'Asilo nido/Scuola privata': { icon: GraduationCap, color: 'text-blue-600' },
                      'Baby sitter': { icon: Users, color: 'text-pink-600' },
                      'Pannolini/Prodotti neonato': { icon: Heart, color: 'text-yellow-600' },
                      'Regali (compleanni, ricorrenze)': { icon: Gift, color: 'text-purple-600' },

                      // Lavoro e Formazione
                      'Formazione professionale': { icon: GraduationCap, color: 'text-blue-600' },
                      'Materiale ufficio': { icon: Briefcase, color: 'text-gray-600' },
                      'Trasporti per lavoro': { icon: Bus, color: 'text-gray-600' },
                      'Abbigliamento professionale': { icon: Briefcase, color: 'text-purple-600' },
                      'Corsi di formazione': { icon: GraduationCap, color: 'text-blue-600' },
                      'Libri professionali': { icon: BookOpen, color: 'text-green-600' },

                      // Altro
                      'Donazioni/Beneficenza': { icon: Heart, color: 'text-red-600' },
                      'Spese veterinario (animali)': { icon: Heart, color: 'text-green-600' },
                      'Spese impreviste (buffer)': { icon: AlertTriangle, color: 'text-orange-600' },
                      'Accantonamento vacanze': { icon: Plane, color: 'text-blue-600' },
                      'Accantonamento regali Natale': { icon: Gift, color: 'text-red-600' },
                      'Altro': { icon: DollarSign, color: 'text-gray-600' }
                    };

                    const iconConfig = subcategoryIcons[subcategory] || { icon: DollarSign, color: 'text-gray-600' };
                    const Icon = iconConfig.icon;

                    return (
                      <SelectItem key={subcategory} value={subcategory}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${iconConfig.color}`} />
                          <span>{subcategory}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Goal Selection for Goal Contributions */}
              {formData.type === 'goal_contribution' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Obiettivo</Label>
                  <Select value={formData.goalId} onValueChange={(value) => setFormData({...formData, goalId: value})}>
                    <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                      <SelectValue placeholder="Seleziona obiettivo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] overflow-y-auto">
                      {Array.isArray(goals) ? goals.filter((goal: any) => goal.type !== 'investment').map((goal: any) => (
                        <SelectItem key={goal.id} value={goal.id.toString()} className="py-3">
                          <div className="flex items-center space-x-3">
                            <Target className="w-5 h-5 text-green-600" />
                            <span className="font-medium">{goal.name}</span>
                          </div>
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Investment Selection for Investments */}
              {formData.type === 'investment' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Investimento</Label>
                  <Select value={formData.investmentId} onValueChange={(value) => setFormData({...formData, investmentId: value})}>
                    <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                      <SelectValue placeholder="Seleziona investimento" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] overflow-y-auto">
                      {Array.isArray(investments) ? investments.map((investment: any) => (
                        <SelectItem key={investment.id} value={investment.id.toString()} className="py-3">
                          <div className="flex items-center space-x-3">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">{investment.name}</span>
                          </div>
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subscription-specific fields */}
              {formData.type === 'subscription' && (
                <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center space-x-2 text-purple-700">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Impostazioni Ricorrenza</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Frequenza</Label>
                      <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
                        <SelectTrigger className="h-10 border-2 hover:border-purple-300 transition-colors">
                          <SelectValue placeholder="Seleziona frequenza" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">📅 Mensile</SelectItem>
                          <SelectItem value="weekly">📅 Settimanale</SelectItem>
                          <SelectItem value="yearly">📅 Annuale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Giorno del mese</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.dayOfMonth}
                          onChange={(e) => setFormData({...formData, dayOfMonth: safeInt(e.target.value)})}
                          className="h-10 border-2 hover:border-purple-300 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Data fine (opzionale)</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="h-10 border-2 hover:border-purple-300 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Descrizione</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Aggiungi dettagli opzionali sulla transazione..."
                  rows={3}
                  className="border-2 hover:border-blue-300 transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t px-4 sm:px-6 py-4">
          {useThreeStepMode && totalSteps > 1 ? (
            <div className="space-y-3">
              <div className="flex justify-between space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex-1 py-3 border-2"
                >
                  Indietro
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !canProceedToStep2()) ||
                      (currentStep === 2 && !canProceedToStep3())
                    }
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    Continua
                  </Button>
                ) : (
                  <div className="flex flex-1 space-x-2">
                    <Button
                      onClick={() => handleSubmit(false)}
                      disabled={addTransactionMutation.isPending}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      {addTransactionMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Salvando...</span>
                        </div>
                      ) : "Salva e Chiudi"}
                    </Button>
                    <Button
                      onClick={() => handleSubmit(true)}
                      disabled={addTransactionMutation.isPending}
                      variant="outline"
                      className="py-3 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      + Altra
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Step {currentStep} di {totalSteps}</p>
              </div>
            </div>
          ) : (
            <div className="flex space-x-3">
              <Button
                onClick={() => handleSubmit(true)}
                disabled={addTransactionMutation.isPending}
                variant="outline"
                className="py-3 px-4 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
              >
                {addTransactionMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </div>
                ) : "Salva e Aggiungi Altra"}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={addTransactionMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-semibold text-lg"
              >
                {addTransactionMutation.isPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </div>
                ) : "Salva e Chiudi"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditTransactionDialog({ transaction, isOpen, onOpenChange }: { transaction: any, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    description: transaction.description || '',
    amount: transaction.amount ? transaction.amount.toString() : '',
    category: transaction.category || '',
    subcategory: transaction.subcategory || '',
    date: transaction.date ? transaction.date.split('T')[0] : getLocalDateString(),
    accountType: transaction.accountType || ''
  });
  const { toast } = useToast();

  const { data: accountArchitecture } = useQuery({
    queryKey: ['/api/account-architecture'],
    staleTime: 30 * 1000
  });

  const { data: customAccounts } = useQuery({
    queryKey: ['/api/custom-accounts'],
    staleTime: 30 * 1000
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        description: data.description,
        amount: safeFloat(data.amount),
        category: data.category,
        subcategory: data.subcategory || null,
        date: data.date,
        account_type: data.accountType
      };
      const response = await apiRequest('PATCH', `/api/transactions/${transaction.id}`, payload);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore server: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      toast({
        title: "Transazione aggiornata",
        description: "Modifica salvata con successo."
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reset form data when transaction changes
  React.useEffect(() => {
    setFormData({
      description: transaction.description || '',
      amount: transaction.amount ? transaction.amount.toString() : '',
      category: transaction.category || '',
      subcategory: transaction.subcategory || '',
      date: transaction.date ? transaction.date.split('T')[0] : getLocalDateString(),
      accountType: transaction.accountType || ''
    });
  }, [transaction]);

  const standardAccountTypes = (accountArchitecture as any)?.accounts ? [
    {
      value: 'income',
      label: (accountArchitecture as any).accounts.income.name,
      bankName: getBankName((accountArchitecture as any).accounts.income.iban, (accountArchitecture as any).accounts.income.bankName),
      iban: (accountArchitecture as any).accounts.income.iban,
      balance: (accountArchitecture as any).accounts.income.balance,
      type: 'standard'
    },
    {
      value: 'wealth',
      label: (accountArchitecture as any).accounts.wealth.name,
      bankName: getBankName((accountArchitecture as any).accounts.wealth.iban, (accountArchitecture as any).accounts.wealth.bankName),
      iban: (accountArchitecture as any).accounts.wealth.iban,
      balance: (accountArchitecture as any).accounts.wealth.balance,
      type: 'standard'
    },
    {
      value: 'operating',
      label: (accountArchitecture as any).accounts.operating.name,
      bankName: getBankName((accountArchitecture as any).accounts.operating.iban, (accountArchitecture as any).accounts.operating.bankName),
      iban: (accountArchitecture as any).accounts.operating.iban,
      balance: (accountArchitecture as any).accounts.operating.balance,
      type: 'standard'
    },
    {
      value: 'emergency',
      label: (accountArchitecture as any).accounts.emergency.name,
      bankName: getBankName((accountArchitecture as any).accounts.emergency.iban, (accountArchitecture as any).accounts.emergency.bankName),
      iban: (accountArchitecture as any).accounts.emergency.iban,
      balance: (accountArchitecture as any).accounts.emergency.balance,
      type: 'standard'
    },
    {
      value: 'investment',
      label: (accountArchitecture as any).accounts.investment.name,
      bankName: getBankName((accountArchitecture as any).accounts.investment.iban, (accountArchitecture as any).accounts.investment.bankName),
      iban: (accountArchitecture as any).accounts.investment.iban,
      balance: (accountArchitecture as any).accounts.investment.balance,
      type: 'standard'
    },
    {
      value: 'savings',
      label: (accountArchitecture as any).accounts.savings.name,
      bankName: getBankName((accountArchitecture as any).accounts.savings.iban, (accountArchitecture as any).accounts.savings.bankName),
      iban: (accountArchitecture as any).accounts.savings.iban,
      balance: (accountArchitecture as any).accounts.savings.balance,
      type: 'standard'
    }
  ].filter(account => account.iban && account.iban.trim() !== '') : [];

  const customAccountTypes = Array.isArray(customAccounts) ? customAccounts.map((account: any) => ({
    value: `custom_${account.id}`,
    label: account.name,
    bankName: getBankName(account.iban, account.bankName),
    iban: account.iban,
    balance: account.balance,
    type: 'custom',
    customAccount: account
  })) : [];

  const accountTypes = [...standardAccountTypes, ...customAccountTypes];

  const getCategoriesForType = () => {
    switch (transaction.type) {
      case 'income':
        return incomeCategories;
      case 'expense':
        return Object.keys(expenseCategories);
      case 'investment':
        return investmentCategories;
      default:
        return [];
    }
  };

  const getSubcategoriesForCategory = () => {
    if (transaction.type === 'expense' && formData.category && expenseCategories[formData.category as keyof typeof expenseCategories]) {
      return expenseCategories[formData.category as keyof typeof expenseCategories];
    }
    return [];
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.amount) {
      toast({
        title: "Campi mancanti",
        description: "Completa tutti i campi obbligatori.",
        variant: "destructive"
      });
      return;
    }

    const amount = safeFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Importo non valido",
        description: "L'importo deve essere maggiore di zero.",
        variant: "destructive"
      });
      return;
    }

    // Validate subcategory for expenses
    if (transaction.type === 'expense' && formData.category && !formData.subcategory) {
      toast({
        title: "Sottocategoria mancante",
        description: "Seleziona una sottocategoria per le spese.",
        variant: "destructive"
      });
      return;
    }

    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl flex flex-col p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Modifica Transazione
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Aggiorna i dettagli della transazione
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center space-x-2">
              <span>Categoria</span>
              <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value, subcategory: ''})}>
              <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {getCategoriesForType().map((category) => {
                  const categoryConfig: Record<string, { icon: any, color: string }> = {
                    'Casa e Abitazione': { icon: Home, color: 'text-blue-600' },
                    'Trasporti': { icon: Car, color: 'text-purple-600' },
                    'Alimentazione': { icon: ShoppingCart, color: 'text-orange-600' },
                    'Salute e Benessere': { icon: Heart, color: 'text-red-600' },
                    'Abbigliamento e Cura': { icon: Shirt, color: 'text-indigo-600' },
                    'Tecnologia e Comunicazione': { icon: Settings, color: 'text-gray-600' },
                    'Intrattenimento e Cultura': { icon: Gamepad2, color: 'text-pink-600' },
                    'Famiglia e Figli': { icon: Baby, color: 'text-yellow-600' },
                    'Lavoro e Formazione': { icon: GraduationCap, color: 'text-teal-600' },
                    'Altro': { icon: DollarSign, color: 'text-gray-600' },
                    'Stipendio': { icon: TrendingUp, color: 'text-green-600' },
                    'Freelance': { icon: TrendingUp, color: 'text-blue-600' },
                    'Bonus': { icon: TrendingUp, color: 'text-yellow-600' },
                    'Investimenti': { icon: TrendingUp, color: 'text-purple-600' },
                    'Vendite': { icon: TrendingUp, color: 'text-orange-600' },
                    'Affitti': { icon: TrendingUp, color: 'text-teal-600' }
                  };
                  const config = categoryConfig[category] || { icon: DollarSign, color: 'text-gray-600' };
                  const Icon = config.icon;

                  return (
                    <SelectItem key={category} value={category} className="py-3">
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <span className="font-medium">{category}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory - Only show for expenses when category is selected */}
          {transaction.type === 'expense' && formData.category && getSubcategoriesForCategory().length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center space-x-2">
                <span>Sottocategoria</span>
                <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.subcategory} onValueChange={(value) => setFormData({...formData, subcategory: value})}>
                <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Seleziona sottocategoria" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {getSubcategoriesForCategory().map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory} className="py-3">
                      <span className="font-medium">{subcategory}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center space-x-2">
              <span>Importo</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0.00"
              className="h-12 border-2 hover:border-blue-300 transition-colors"
            />
          </div>

          {/* Account Type */}
          {accountTypes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Conto di Riferimento</Label>
              <Select value={formData.accountType} onValueChange={(value) => setFormData({...formData, accountType: value})}>
                <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Seleziona conto" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {accountTypes.map((account) => (
                    <SelectItem key={account.value} value={account.value} className="py-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <Wallet className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{account.label}</div>
                            {account.bankName && (
                              <div className="text-xs text-gray-500">{account.bankName}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          {formatEuro(account.balance)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center space-x-2">
              <span>Data</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="h-12 border-2 hover:border-blue-300 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Descrizione</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Aggiungi dettagli opzionali..."
              rows={3}
              className="border-2 hover:border-blue-300 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t px-6 py-4 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {updateMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              "Salva Modifiche"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check if this is a checkup transaction or manual transaction
  const isCheckupTxn = transaction.source === 'checkup';

  // For checkup transactions, determine icon and behavior differently
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
    // Manual transactions
    const typeConfig = transactionTypes.find(t => t.value === type);
    return typeConfig?.icon || DollarSign;
  };

  const Icon = getTransactionIcon(transaction.type, transaction.source || 'manual');
  const amount = safeFloat(transaction.amount);
  const isTransfer = transaction.category === 'Trasferimenti' || transaction.description?.includes('Giroconto');
  const isPositive = transaction.type === 'income';

  // Get account architecture and custom accounts for bank info
  const { data: accountArchitecture } = useQuery({
    queryKey: ['/api/account-architecture']
  });

  const { data: customAccounts } = useQuery({
    queryKey: ['/api/custom-accounts']
  });

  // Use the global getAccountDisplayName function

  // For transfers, determine if this is outgoing (-) or incoming (+) based on description
  let displayAmount = amount;
  if (isTransfer) {
    // If description contains "da [current account]", it's outgoing (negative)
    // If description contains "a [current account]", it's incoming (positive)
    if (transaction.description?.includes('da ' + getAccountDisplayName(transaction.accountType, accountArchitecture, Array.isArray(customAccounts) ? customAccounts : []))) {
      displayAmount = -Math.abs(amount);
    } else {
      displayAmount = Math.abs(amount);
    }
  } else {
    // Regular transactions: expenses negative, income positive
    displayAmount = transaction.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
  }

  // Extract transfer info if this is a transfer
  let transferInfo = '';
  if (isTransfer && transaction.description) {
    // Try to extract "da X a Y" pattern from description
    const transferMatch = transaction.description.match(/da (.+?) a (.+?)$/i);
    if (transferMatch) {
      transferInfo = `da ${transferMatch[1]} a ${transferMatch[2]}`;
    } else if (transaction.accountType) {
      // Fallback: show the account involved
      transferInfo = `da ${getAccountDisplayName(transaction.accountType, accountArchitecture, Array.isArray(customAccounts) ? customAccounts : [])}`;
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Only allow deletion of manual transactions, not checkup data
      if (isCheckupTxn) {
        throw new Error("Non puoi eliminare i dati del check-up. Modifica i dati nel check-up stesso.");
      }
      await apiRequest('DELETE', `/api/transactions/${transaction.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-unified'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Transazione eliminata",
        description: "La transazione è stata rimossa con successo."
      });
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
    <div className="flex items-center justify-between gap-3 py-2.5 group">
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isTransfer ? 'bg-blue-50' : (isPositive ? 'bg-emerald-50' : 'bg-red-50')
        }`}>
          <Icon className={`w-4 h-4 ${
            isTransfer ? 'text-blue-500' : (isPositive ? 'text-emerald-500' : 'text-red-500')
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate leading-tight">
            {isTransfer && transferInfo
              ? `Giroconto ${transferInfo}`
              : (transaction.description || transaction.category)}
          </p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            {transaction.subcategory && (
              <span className="text-xs text-gray-400 truncate">{transaction.subcategory}</span>
            )}
            <span className="text-xs text-gray-400">
              {(() => { const p = transaction.date.split('-'); return new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10)).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' }); })()}
            </span>
            {!isTransfer && transaction.accountType && (
              <span className="text-xs text-gray-400 truncate max-w-[160px]">
                {getAccountDisplayName(transaction.accountType, accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : [])}
              </span>
            )}
            {isCheckupTxn && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Check-up</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: amount + type tag + menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className={`text-sm font-bold tabular-nums ${
            displayAmount >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {displayAmount >= 0 ? '+' : ''}{formatEuro(displayAmount)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isCheckupTxn ? 'Check-up' : (transactionTypes.find(t => t.value === transaction.type)?.label || transaction.type)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400 hover:text-gray-700">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Elimina
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="mobile-modal">
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                  >
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditTransactionDialog 
        transaction={transaction}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}

// Account Transfer Component
function AccountTransferDialog({ trigger }: { trigger: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const useThreeStepMode = true; // Always use three-step mode
  const [transferForm, setTransferForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: ''
  });

  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset step when dialog opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  const { data: accountArchitecture } = useQuery({
    queryKey: ['/api/account-architecture'],
    staleTime: 30 * 1000 // 30 seconds for critical data
  });

  const { data: customAccounts } = useQuery({
    queryKey: ['/api/custom-accounts'],
    staleTime: 30 * 1000 // 30 seconds for critical data
  });

  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/accounts/transfer', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante il trasferimento');
      }
      return response.json();
    },
    onSuccess: (data) => {
      invalidateAccountCache();
      toast({
        title: "Giroconto completato!",
        description: data.message || "Trasferimento eseguito con successo"
      });
      setIsOpen(false);
      setTransferForm({ fromAccount: '', toAccount: '', amount: '', description: '' });
      setCurrentStep(1);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Step navigation helpers
  const totalSteps = (isMobile || useThreeStepMode) ? 3 : 1;

  const canProceedToStep2 = () => {
    return transferForm.fromAccount && transferForm.toAccount;
  };

  const canProceedToStep3 = () => {
    return canProceedToStep2() && transferForm.amount && safeFloat(transferForm.amount) > 0;
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Selezione Conti';
      case 2: return 'Importo';
      case 3: return 'Conferma e Dettagli';
      default: return 'Nuovo Giroconto';
    }
  };

  const handleTransferSubmit = () => {
    if (!transferForm.fromAccount || !transferForm.toAccount || !transferForm.amount) {
      toast({
        title: "Campi mancanti",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (transferForm.fromAccount === transferForm.toAccount) {
      toast({
        title: "Errore",
        description: "Non puoi trasferire denaro sullo stesso conto",
        variant: "destructive"
      });
      return;
    }

    const amount = safeFloat(transferForm.amount);
    if (amount <= 0) {
      toast({
        title: "Errore",
        description: "L'importo deve essere maggiore di zero",
        variant: "destructive"
      });
      return;
    }

    // Check if sufficient balance
    const fromAccountBalance = getAccountBalance(transferForm.fromAccount);
    if (amount > fromAccountBalance) {
      toast({
        title: "Saldo insufficiente",
        description: `Il conto selezionato ha un saldo di ${formatEuro(fromAccountBalance)}, ma hai richiesto ${formatEuro(amount)}`,
        variant: "destructive"
      });
      return;
    }

    transferMutation.mutate({
      fromAccount: transferForm.fromAccount,
      toAccount: transferForm.toAccount,
      amount: amount,
      description: transferForm.description || `Giroconto da ${getAccountDisplayName(transferForm.fromAccount, accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : [])} a ${getAccountDisplayName(transferForm.toAccount, accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : [])}`
    });
  };

  const getAccountBalance = (accountType: string) => {
    // Handle custom accounts
    if (accountType.startsWith('custom_')) {
      const customAccountId = accountType.replace('custom_', '');
      const customAccount = Array.isArray(customAccounts) ? customAccounts.find((acc: any) => acc.id && acc.id.toString() === customAccountId) : null;
      return customAccount?.balance || 0;
    }

    // Handle standard accounts
    const archAccounts = (accountArchitecture as any)?.accounts;
    if (!archAccounts) return 0;
    const account = archAccounts[accountType];
    return account?.balance || 0;
  };

  // Available liquid accounts (excluding investments) - include only configured accounts
  const archAccounts = (accountArchitecture as any)?.accounts;
  const standardLiquidAccounts = archAccounts ? [
    {
      value: 'income',
      label: getAccountDisplayName('income', accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : []),
      bankName: getBankName(archAccounts.income?.iban, archAccounts.income?.bankName),
      balance: getAccountBalance('income'),
      iban: archAccounts.income?.iban
    },
    {
      value: 'wealth',
      label: getAccountDisplayName('wealth', accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : []),
      bankName: getBankName(archAccounts.wealth?.iban, archAccounts.wealth?.bankName),
      balance: getAccountBalance('wealth'),
      iban: archAccounts.wealth?.iban
    },
    {
      value: 'operating',
      label: getAccountDisplayName('operating', accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : []),
      bankName: getBankName(archAccounts.operating?.iban, archAccounts.operating?.bankName),
      balance: getAccountBalance('operating'),
      iban: archAccounts.operating?.iban
    },
    {
      value: 'emergency',
      label: getAccountDisplayName('emergency', accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : []),
      bankName: getBankName(archAccounts.emergency?.iban, archAccounts.emergency?.bankName),
      balance: getAccountBalance('emergency'),
      iban: archAccounts.emergency?.iban
    },
    {
      value: 'investment',
      label: getAccountDisplayName('investment', accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : []),
      bankName: getBankName(archAccounts.investment?.iban, archAccounts.investment?.bankName),
      balance: getAccountBalance('investment'),
      iban: archAccounts.investment?.iban
    },
    {
      value: 'savings',
      label: getAccountDisplayName('savings', accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : []),
      bankName: getBankName(archAccounts.savings?.iban, archAccounts.savings?.bankName),
      balance: getAccountBalance('savings'),
      iban: archAccounts.savings?.iban
    }
  ].filter(account => account.iban && account.iban.trim() !== '') : [];

  const customLiquidAccounts = Array.isArray(customAccounts) ? customAccounts
    .filter((account: any) => account.id && account.isActive !== false)
    .map((account: any) => ({
      value: `custom_${account.id}`,
      label: getAccountDisplayName(`custom_${account.id}`, accountArchitecture as any, customAccounts),
      bankName: getBankName(account.iban, account.bankName),
      balance: account.balance || 0,
      iban: account.iban || '',
      isCustom: true
    })) : [];

  const liquidAccounts = [...standardLiquidAccounts, ...customLiquidAccounts];
  const fromAccountBalance = getAccountBalance(transferForm.fromAccount);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] max-h-[90vh]' : 'max-w-2xl'} bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 border-0 shadow-2xl flex flex-col p-0`} aria-describedby="transfer-dialog-description">
        {/* Decorative background elements - reduced on mobile */}
        <div className={`absolute top-0 right-0 bg-gradient-to-bl from-blue-400/15 via-indigo-400/10 to-transparent rounded-full ${isMobile ? 'w-16 h-16 -mr-8 -mt-8' : 'w-32 h-32 -mr-16 -mt-16'}`}></div>
        <div className={`absolute bottom-0 left-0 bg-gradient-to-tr from-cyan-400/10 via-blue-400/5 to-transparent rounded-full ${isMobile ? 'w-12 h-12 -ml-6 -mb-6' : 'w-24 h-24 -ml-12 -mb-12'}`}></div>

        <DialogHeader className={`pb-4 sm:pb-6 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <div className={`bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-2xl ${isMobile ? 'p-3' : 'p-4'}`}>
                  <Send className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 sm:w-4 h-3 sm:h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className={`font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                  {(isMobile || useThreeStepMode) ? getStepTitle() : 'Nuovo Giroconto'}
                </DialogTitle>
                <p className={`text-gray-600 mt-1 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {(isMobile || useThreeStepMode) ? `Step ${currentStep} di ${totalSteps}` : 'Trasferisci denaro tra i tuoi conti in modo sicuro e istantaneo'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress indicator for step mode */}
          {(isMobile || useThreeStepMode) && (
            <div className="flex space-x-2 mt-4">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    index + 1 <= currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}

          <div id="transfer-dialog-description" className="sr-only">
            Utilizza questo modulo per trasferire denaro tra i tuoi conti.
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0" style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}>
        {/* Step 1: Account Selection */}
        {((!isMobile && !useThreeStepMode) || currentStep === 1) && (
          <div className={`space-y-4 sm:space-y-6 ${isMobile ? '' : 'mb-6'}`}>
            {/* From Account */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Conto di Origine</span>
                <span className="text-red-500">*</span>
              </Label>
              <Select value={transferForm.fromAccount} onValueChange={(value) => setTransferForm({...transferForm, fromAccount: value})}>
                <SelectTrigger className={`border-2 hover:border-blue-300 transition-colors bg-white/80 backdrop-blur-sm ${isMobile ? 'h-12' : 'h-14'}`}>
                  <SelectValue placeholder="Seleziona conto di origine" />
                </SelectTrigger>
                <SelectContent className={`overflow-y-auto ${isMobile ? 'max-h-[250px]' : 'max-h-[300px]'}`}>
                  {liquidAccounts.map((account) => (
                    <SelectItem key={account.value} value={account.value} className={isMobile ? 'py-3' : 'py-4'}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`bg-blue-100 rounded-lg flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                            <Wallet className={`text-blue-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-gray-900 truncate ${isMobile ? 'max-w-[120px]' : 'max-w-[200px]'}`}>{account.label}</div>
                            {account.bankName && (
                              <div className="text-xs text-blue-600 font-medium truncate">
                                🏦 {account.bankName}
                              </div>
                            )}
                            {account.iban && (
                              <div className={`text-xs text-gray-500 font-mono truncate ${isMobile ? 'max-w-[100px]' : 'max-w-[150px]'}`}>
                                {account.iban}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                          <div className="text-xs sm:text-sm font-bold text-gray-900">
                            {formatEuro(account.balance)}
                          </div>
                          <div className="text-xs text-gray-500">disponibile</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transferForm.fromAccount && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center space-x-2 text-orange-700">
                    <AlertTriangle className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold">
                      Saldo disponibile: {formatEuro(getAccountBalance(transferForm.fromAccount))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* To Account */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Conto di Destinazione</span>
                <span className="text-red-500">*</span>
              </Label>
              <Select value={transferForm.toAccount} onValueChange={(value) => setTransferForm({...transferForm, toAccount: value})}>
                <SelectTrigger className={`border-2 hover:border-green-300 transition-colors bg-white/80 backdrop-blur-sm ${isMobile ? 'h-12' : 'h-14'}`}>
                  <SelectValue placeholder="Seleziona conto di destinazione" />
                </SelectTrigger>
                <SelectContent className={`overflow-y-auto ${isMobile ? 'max-h-[250px]' : 'max-h-[300px]'}`}>
                  {liquidAccounts.filter(acc => acc.value !== transferForm.fromAccount).map((account) => (
                    <SelectItem key={account.value} value={account.value} className={isMobile ? 'py-3' : 'py-4'}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`bg-green-100 rounded-lg flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                            <Wallet className={`text-green-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-gray-900 truncate ${isMobile ? 'max-w-[120px]' : 'max-w-[200px]'}`}>{account.label}</div>
                            {account.bankName && (
                              <div className="text-xs text-blue-600 font-medium truncate">
                                🏦 {account.bankName}
                              </div>
                            )}
                            {account.iban && (
                              <div className={`text-xs text-gray-500 font-mono truncate ${isMobile ? 'max-w-[100px]' : 'max-w-[150px]'}`}>
                                {account.iban}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                          <div className="text-xs sm:text-sm font-bold text-gray-900">
                            {formatEuro(account.balance)}
                          </div>
                          <div className="text-xs text-gray-500">attuale</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Amount */}
        {((!isMobile && !useThreeStepMode) || currentStep === 2) && (
          <div className={`space-y-4 sm:space-y-6 ${isMobile ? '' : 'mb-6'}`}>
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>Importo</span>
                <span className="text-red-500">*</span>
              </Label>
              {transferForm.fromAccount && (
                <div className={`text-xs p-2 rounded-lg ${fromAccountBalance <= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  💰 Saldo disponibile: {formatEuro(fromAccountBalance)}
                  {fromAccountBalance <= 0 && " (insufficiente)"}
                </div>
              )}
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={fromAccountBalance}
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  placeholder="0.00"
                  className={`font-bold border-2 transition-colors bg-white/80 backdrop-blur-sm ${
                    safeFloat(transferForm.amount) > fromAccountBalance 
                      ? "border-red-300 focus:border-red-500"
                      : "hover:border-blue-300 focus:border-blue-500"
                  } ${isMobile ? 'h-12 text-lg pl-10' : 'h-14 text-xl pl-12'}`}
                />
                <div className={`absolute top-1/2 transform -translate-y-1/2 text-gray-500 ${isMobile ? 'left-3' : 'left-4'}`}>
                  €
                </div>
              </div>
              {safeFloat(transferForm.amount) > fromAccountBalance && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Importo superiore al saldo disponibile</span>
                </p>
              )}
              {transferForm.amount && safeFloat(transferForm.amount) > 0 && safeFloat(transferForm.amount) <= fromAccountBalance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">
                    💶 Trasferimento di <span className="font-bold">{formatEuro(safeFloat(transferForm.amount))}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Description and Confirmation */}
        {((!isMobile && !useThreeStepMode) || currentStep === 3) && (
          <div className="space-y-4 sm:space-y-6">
            {/* Transfer Preview Card */}
            {transferForm.fromAccount && transferForm.toAccount && transferForm.amount && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-blue-200/50 mb-4 sm:mb-6">
                <div className={`flex items-center justify-center text-center ${isMobile ? 'flex-col space-y-3' : 'space-x-4'}`}>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-blue-700">Da</p>
                    <p className={`font-bold text-gray-900 truncate ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {getAccountDisplayName(transferForm.fromAccount, accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : [])}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Disponibile: {formatEuro(getAccountBalance(transferForm.fromAccount))}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`bg-blue-600 rounded-full shadow-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                      <ArrowLeftRight className={`text-white ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </div>
                    <p className={`font-black text-blue-700 mt-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                      {formatEuro(safeFloat(transferForm.amount) || 0)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-green-700">A</p>
                    <p className={`font-bold text-gray-900 truncate ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {getAccountDisplayName(transferForm.toAccount, accountArchitecture as any, Array.isArray(customAccounts) ? customAccounts : [])}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Attuale: {formatEuro(getAccountBalance(transferForm.toAccount))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span>Descrizione</span>
                <span className="text-gray-400 text-xs">(opzionale)</span>
              </Label>
              <Input
                value={transferForm.description}
                onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                placeholder="Motivo del trasferimento..."
                className={`border-2 hover:border-gray-300 transition-colors bg-white/80 backdrop-blur-sm ${isMobile ? 'h-10' : 'h-12'}`}
              />
            </div>
          </div>
        )}
        </div>

        {/* Enhanced Footer with Step Navigation */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t px-4 sm:px-6 py-4">
          {(isMobile || useThreeStepMode) && totalSteps > 1 ? (
            <div className="flex justify-between space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex-1 py-3 border-2"
              >
                ← Indietro
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2()) ||
                    (currentStep === 2 && !canProceedToStep3())
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  Continua →
                </Button>
              ) : (
                <Button
                  onClick={handleTransferSubmit}
                  disabled={
                    transferMutation.isPending ||
                    safeFloat(transferForm.amount) > fromAccountBalance ||
                    !transferForm.fromAccount ||
                    !transferForm.toAccount ||
                    !transferForm.amount
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {transferMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Trasferimento...</span>
                    </div>
                  ) : (
                    "✅ Conferma Trasferimento"
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className={`flex pt-2 sm:pt-4 ${isMobile ? 'flex-col space-y-3' : 'gap-4'}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className={`border-2 hover:bg-gray-50 font-semibold ${isMobile ? 'h-11' : 'flex-1 h-12'}`}
              >
                <span>Annulla</span>
              </Button>
              <Button
                type="submit"
                disabled={transferMutation.isPending || !transferForm.fromAccount || !transferForm.toAccount || !transferForm.amount}
                className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${isMobile ? 'h-11 text-base' : 'flex-1 h-12 text-lg'}`}
                onClick={handleTransferSubmit}
              >
                {transferMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className={`border-2 border-white border-t-transparent rounded-full animate-spin ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    <span>Trasferimento...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                    <span>Trasferisci</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Helper Text */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              {(isMobile || useThreeStepMode) ? `Step ${currentStep} di ${totalSteps}` : '🔒 I trasferimenti sono sicuri e istantanei tra i tuoi conti'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Format a Date using local time zone (avoids UTC shift from toISOString)
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Transactions() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Compute the date range for the API based on the selected period
  const { apiStartDate, apiEndDate } = useMemo(() => {
    const now = new Date();
    const todayStr = formatLocalDate(now);

    switch (selectedPeriod) {
      case 'today':
        return { apiStartDate: todayStr, apiEndDate: todayStr };
      case 'week': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        return { apiStartDate: formatLocalDate(start), apiEndDate: todayStr };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { apiStartDate: formatLocalDate(start), apiEndDate: todayStr };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { apiStartDate: formatLocalDate(start), apiEndDate: todayStr };
      }
      case 'custom':
        if (startDate && endDate) {
          return { apiStartDate: startDate, apiEndDate: endDate };
        }
        return { apiStartDate: undefined, apiEndDate: undefined };
      default:
        return { apiStartDate: undefined, apiEndDate: undefined };
    }
  }, [selectedPeriod, startDate, endDate]);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', apiStartDate, apiEndDate],
    queryFn: async () => {
      const url = (apiStartDate && apiEndDate)
        ? `/api/transactions?startDate=${apiStartDate}&endDate=${apiEndDate}`
        : '/api/transactions?limit=10000';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    }
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    enabled: !isLoading // Only fetch dashboard data if transactions are not loading
  });

  // Transactions are already filtered server-side; use directly
  const filteredTransactions = transactions || [];

  const recentTransactions = filteredTransactions;

  const toggleCategoryExpansion = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Safe calculation functions that handle various data types
  const safeAmount = (amount: any): number => {
    if (amount === null || amount === undefined) return 0;
    const parsed = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalIncome = recentTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + safeAmount(t.amount), 0) || 0;
  const totalExpenses = recentTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(safeAmount(t.amount)), 0) || 0;
  const totalInvestments = recentTransactions?.filter(t => t.type === 'investment').reduce((sum, t) => sum + safeAmount(t.amount), 0) || 0;


  const { toast } = useToast();

  const generateTransactionReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Get account architecture for the report
      const accountArchitecture = await queryClient.fetchQuery({
        queryKey: ['/api/account-architecture'],
        staleTime: 30 * 1000
      });

      const payload = {
        period: selectedPeriod,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        transactions: recentTransactions,
        summary: {
          totalIncome,
          totalExpenses,
          totalInvestments,
          netBalance: totalIncome - totalExpenses,
          transactionCount: recentTransactions.length
        },
        accountArchitecture,
        generatedAt: new Date().toISOString()
      };

      console.log('Generating PDF report with payload:', payload);

      const response = await fetch('/api/transactions/generate-pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore nella generazione del report: ${response.status} - ${errorText}`);
      }

      // Check if the response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const responseText = await response.text();
        console.error('Response is not a PDF:', responseText);
        throw new Error('Il server non ha restituito un PDF valido');
      }

      const blob = await response.blob();
      console.log('PDF blob size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('Il PDF generato è vuoto');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_transazioni_${selectedPeriod}_${getLocalDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generato",
        description: "Il tuo report PDF è stato scaricato con successo."
      });
    } catch (error: any) {
      console.error("Report generation error:", error);
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 will-change-scroll">
        {/* Hero Header - Compatto e orizzontale */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
            {/* Decorative elements ottimizzati */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>

            <div className="relative z-10">
              {/* Layout più compatto e orizzontale */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                
                {/* Sezione titolo - più compatta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                      <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">
                        Transazioni
                      </h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                        <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Centro di Controllo Finanziario</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">
                    Monitora, gestisci e analizza tutte le tue operazioni finanziarie
                  </p>
                </div>

                {/* Sezione azioni - layout orizzontale ottimizzato */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto lg:flex-shrink-0">
                  
                  {/* Bottoni principali - layout orizzontale su mobile */}
                  <div className="flex flex-row sm:flex-row items-stretch gap-2 sm:gap-3">
                    <AddTransactionDialog
                      trigger={
                        <Button className="flex-1 sm:flex-none bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-300 group border border-blue-500 text-xs sm:text-sm">
                          <Plus className="w-4 h-4 mr-1 sm:mr-2 group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
                          <span className="truncate">Nuova Transazione</span>
                        </Button>
                      }
                    />
                    <AccountTransferDialog
                      trigger={
                        <Button className="flex-1 sm:flex-none bg-green-600 text-white hover:bg-green-700 border-green-500 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm">
                          <Send className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">Giroconto</span>
                        </Button>
                      }
                    />
                    <Button
                      onClick={generateTransactionReport}
                      disabled={isGeneratingReport || recentTransactions.length === 0}
                      className="flex-1 sm:flex-none bg-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all duration-300 group border border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      {isGeneratingReport ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">PDF...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Receipt className="w-4 h-4 mr-1 sm:mr-2 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
                          <span className="truncate">PDF</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Data indicator - integrato orizzontalmente */}
                  <div className="flex items-center justify-center text-gray-300 text-xs bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm self-center sm:self-auto">
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {new Date().toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Filter - Pill Buttons + Date Range Picker */}
        <div className="mt-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/20 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full -mr-10 -mt-10"></div>
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 justify-between flex-wrap">

                {/* Pill Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { value: 'today', label: 'Oggi' },
                    { value: 'week', label: 'Settimana' },
                    { value: 'month', label: 'Mese' },
                    { value: 'year', label: 'Anno' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedPeriod(value)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                        selectedPeriod === value
                          ? 'bg-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 shadow border border-gray-200/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  {/* Custom Date Range Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        onClick={() => setSelectedPeriod('custom')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                          selectedPeriod === 'custom'
                            ? 'bg-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 shadow border border-gray-200/80'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        {selectedPeriod === 'custom' && startDate && endDate
                          ? `${format(new Date(startDate + 'T00:00:00'), 'd MMM', { locale: it })} → ${format(new Date(endDate + 'T00:00:00'), 'd MMM yy', { locale: it })}`
                          : 'Personalizzato'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-2xl border-0 rounded-2xl overflow-hidden" align="start">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
                        <p className="font-bold text-sm">Seleziona intervallo</p>
                        <p className="text-indigo-200 text-xs mt-0.5">
                          {startDate && endDate
                            ? `${format(new Date(startDate + 'T00:00:00'), 'd MMMM yyyy', { locale: it })} → ${format(new Date(endDate + 'T00:00:00'), 'd MMMM yyyy', { locale: it })}`
                            : startDate
                              ? `Dal ${format(new Date(startDate + 'T00:00:00'), 'd MMMM yyyy', { locale: it })} — clicca la data finale`
                              : 'Clicca la data di inizio, poi quella di fine'}
                        </p>
                      </div>
                      <CalendarPicker
                        mode="range"
                        numberOfMonths={2}
                        locale={it}
                        selected={
                          startDate && endDate
                            ? { from: new Date(startDate + 'T00:00:00'), to: new Date(endDate + 'T00:00:00') }
                            : startDate
                              ? { from: new Date(startDate + 'T00:00:00'), to: undefined }
                              : undefined
                        }
                        onSelect={(range: DateRange | undefined) => {
                          if (range?.from) {
                            setStartDate(formatLocalDate(range.from));
                          } else {
                            setStartDate('');
                            setEndDate('');
                          }
                          if (range?.to) {
                            setEndDate(formatLocalDate(range.to));
                          } else if (!range?.from) {
                            setEndDate('');
                          }
                        }}
                        disabled={{ after: new Date() }}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Live badge */}
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 shadow border border-green-200/50">
                  <div className="w-2 h-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-bold whitespace-nowrap">Live</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ultra Compact Summary Cards - Horizontal Design */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 via-green-50 to-white">
              <div className="absolute top-0 right-0 w-12 h-12 bg-green-200 rounded-full -mr-6 -mt-6 opacity-10"></div>

              <CardContent className="relative p-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-green-800 mb-1 uppercase truncate">Entrate Totali</p>
                      <p className="text-lg md:text-xl font-black text-green-700 truncate">
                        +{formatEuro(totalIncome)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full">
                      {selectedPeriod === 'today' ? 'Oggi' :
                       selectedPeriod === 'week' ? 'Settimana' :
                       selectedPeriod === 'month' ? 'Mese' :
                       selectedPeriod === 'year' ? 'Anno' : 'Periodo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-red-50 via-rose-50 to-white">
              <div className="absolute top-0 left-0 w-12 h-12 bg-red-200 rounded-full -ml-6 -mt-6 opacity-10"></div>

              <CardContent className="relative p-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-800 mb-1 uppercase truncate">Spese Totali</p>
                      <p className="text-lg md:text-xl font-black text-red-700 truncate">
                        -{formatEuro(totalExpenses)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <ArrowDownRight className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-700 font-semibold bg-red-100 px-2 py-1 rounded-full">
                      {selectedPeriod === 'today' ? 'Oggi' :
                       selectedPeriod === 'week' ? 'Settimana' :
                       selectedPeriod === 'month' ? 'Mese' :
                       selectedPeriod === 'year' ? 'Anno' : 'Periodo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 via-sky-50 to-white">
              <div className="absolute top-0 right-0 w-14 h-14 bg-blue-200 rounded-full -mr-7 -mt-7 opacity-10"></div>

              <CardContent className="relative p-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl shadow-lg flex-shrink-0">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-800 mb-1 uppercase truncate">Investimenti</p>
                      <p className="text-lg md:text-xl font-black text-blue-700 truncate">
                        {formatEuro(totalInvestments)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-700 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                      {selectedPeriod === 'today' ? 'Oggi' :
                       selectedPeriod === 'week' ? 'Settimana' :
                       selectedPeriod === 'month' ? 'Mese' :
                       selectedPeriod === 'year' ? 'Anno' : 'Periodo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 via-violet-50 to-white">
              <div className="absolute top-0 left-0 w-14 h-14 bg-purple-200 rounded-full -ml-7 -mt-7 opacity-10"></div>

              <CardContent className="relative p-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg flex-shrink-0">
                      <Calculator className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-purple-800 mb-1 uppercase truncate">Saldo Netto</p>
                      <p className={`text-lg md:text-xl font-black truncate ${(totalIncome - totalExpenses) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatEuro(totalIncome - totalExpenses)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {(totalIncome - totalExpenses) >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(totalIncome - totalExpenses) >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {selectedPeriod === 'today' ? 'Oggi' :
                       selectedPeriod === 'week' ? 'Settimana' :
                       selectedPeriod === 'month' ? 'Mese' :
                       selectedPeriod === 'year' ? 'Anno' : 'Periodo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Transactions List */}
        <div className="mt-10 space-y-6">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500 text-sm font-medium">Caricamento transazioni…</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            <>
              {/* ── Giroconti & Entrate ───────────────────────────────── */}
              {(() => {
                const transfers = recentTransactions.filter(t =>
                  t.category === 'Trasferimenti' || t.description?.includes('Giroconto')
                );
                const incomeTransactions = recentTransactions.filter(t => t.type === 'income');
                const allInternalMovements = [...transfers, ...incomeTransactions];

                if (allInternalMovements.length === 0) return null;

                return (
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Send className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">Giroconti e Entrate</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{allInternalMovements.length} movimenti</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {selectedPeriod === 'today' ? 'Oggi' : selectedPeriod === 'week' ? 'Settimana' : selectedPeriod === 'month' ? 'Mese' : selectedPeriod === 'year' ? 'Anno' : 'Custom'}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {/* Giroconti sub-section */}
                      {transfers.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleCategoryExpansion('Trasferimenti')}
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-800">Giroconti</p>
                                <p className="text-xs text-gray-400">{transfers.length} trasferimenti interni</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{transfers.length}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedCategories.has('Trasferimenti') ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          <div className={`transition-all duration-300 ease-out overflow-hidden ${expandedCategories.has('Trasferimenti') ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="divide-y divide-gray-50 bg-gray-50/40">
                              {transfers.map((transaction: any, index: number) => (
                                <div key={`transfer-${transaction.id}-${transaction.createdAt || index}`} className="px-5 py-1.5 hover:bg-white/70 transition-colors duration-100">
                                  <TransactionItem transaction={transaction} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Entrate sub-section */}
                      {incomeTransactions.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleCategoryExpansion('Entrate')}
                            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-800">Entrate</p>
                                <p className="text-xs text-gray-400">{incomeTransactions.length} ricevuti</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-bold text-emerald-600">
                                +{formatEuro(incomeTransactions.reduce((sum, t) => sum + (safeFloat(t.amount)), 0))}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedCategories.has('Entrate') ? 'rotate-180' : ''}`} />
                            </div>
                          </button>
                          <div className={`transition-all duration-300 ease-out overflow-hidden ${expandedCategories.has('Entrate') ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="divide-y divide-gray-50 bg-gray-50/40">
                              {incomeTransactions.map((transaction: any, index: number) => (
                                <div key={`income-${transaction.id}-${transaction.createdAt || index}`} className="px-5 py-1.5 hover:bg-white/70 transition-colors duration-100">
                                  <TransactionItem transaction={transaction} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Transazioni per Categoria ─────────────────────────── */}
              {(() => {
                const regularTransactions = recentTransactions.filter(t =>
                  t.category !== 'Trasferimenti' && 
                  !t.description?.includes('Giroconto') &&
                  t.type !== 'income'
                );

                if (regularTransactions.length === 0) return null;

                const groupedTransactions = regularTransactions.reduce((acc: any, transaction: any) => {
                  const category = transaction.category;
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(transaction);
                  return acc;
                }, {} as Record<string, Transaction[]>);

                const categoryConfig: any = {
                  'Casa e Abitazione':         { icon: Home,         accent: 'bg-sky-50 text-sky-600',      bar: 'bg-sky-400' },
                  'Trasporti':                  { icon: Car,          accent: 'bg-violet-50 text-violet-600', bar: 'bg-violet-400' },
                  'Alimentazione':              { icon: ShoppingCart, accent: 'bg-orange-50 text-orange-600', bar: 'bg-orange-400' },
                  'Salute e Benessere':         { icon: Heart,        accent: 'bg-rose-50 text-rose-600',    bar: 'bg-rose-400' },
                  'Abbigliamento e Cura':       { icon: ShoppingBag,  accent: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-400' },
                  'Tecnologia e Comunicazione': { icon: Settings,     accent: 'bg-slate-50 text-slate-600',  bar: 'bg-slate-400' },
                  'Intrattenimento e Cultura':  { icon: Gamepad2,     accent: 'bg-pink-50 text-pink-600',    bar: 'bg-pink-400' },
                  'Famiglia e Figli':           { icon: Baby,         accent: 'bg-amber-50 text-amber-600',  bar: 'bg-amber-400' },
                  'Lavoro e Formazione':        { icon: GraduationCap,accent: 'bg-teal-50 text-teal-600',   bar: 'bg-teal-400' },
                  'Debiti e Finanziamenti':     { icon: CreditCard,   accent: 'bg-red-50 text-red-600',     bar: 'bg-red-400' },
                  'Altro':                      { icon: DollarSign,   accent: 'bg-gray-50 text-gray-600',   bar: 'bg-gray-400' },
                  'Casa':                       { icon: Home,         accent: 'bg-sky-50 text-sky-600',      bar: 'bg-sky-400' },
                  'Alimentari':                 { icon: ShoppingCart, accent: 'bg-orange-50 text-orange-600', bar: 'bg-orange-400' },
                  'Ristoranti':                 { icon: Coffee,       accent: 'bg-amber-50 text-amber-600',  bar: 'bg-amber-400' },
                  'Intrattenimento':            { icon: Gamepad2,     accent: 'bg-pink-50 text-pink-600',    bar: 'bg-pink-400' },
                  'Salute':                     { icon: Heart,        accent: 'bg-rose-50 text-rose-600',    bar: 'bg-rose-400' },
                  'Abbigliamento':              { icon: Shirt,        accent: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-400' },
                  'Tecnologia':                 { icon: Settings,     accent: 'bg-slate-50 text-slate-600',  bar: 'bg-slate-400' },
                  'Viaggi':                     { icon: Plane,        accent: 'bg-cyan-50 text-cyan-600',    bar: 'bg-cyan-400' },
                  'Investimenti':               { icon: TrendingUp,   accent: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-400' },
                  'default':                    { icon: DollarSign,   accent: 'bg-gray-50 text-gray-600',   bar: 'bg-gray-400' },
                };

                const grandTotal = regularTransactions.reduce((sum: number, t: any) => {
                  const amount = safeFloat(t.amount);
                  return sum + Math.abs(amount);
                }, 0);

                return (
                  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                          <History className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">Transazioni per Categoria</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{regularTransactions.length} operazioni • {Object.keys(groupedTransactions).length} categorie</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                        {selectedPeriod === 'today' ? 'Oggi' : selectedPeriod === 'week' ? 'Settimana' : selectedPeriod === 'month' ? 'Mese' : selectedPeriod === 'year' ? 'Anno' : 'Custom'}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {Object.entries(groupedTransactions)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([category, transactions]: [string, any]) => {
                          const config = categoryConfig[category] || categoryConfig.default;
                          const Icon = config.icon;
                          const isExpanded = expandedCategories.has(category);
                          const total = transactions.reduce((sum: number, t: any) => {
                            const amount = safeFloat(t.amount);
                            return sum + Math.abs(amount);
                          }, 0);
                          const isIncomeCategory = transactions.some((t: any) => t.type === 'income');
                          const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;

                          return (
                            <div key={category}>
                              <button
                                onClick={() => toggleCategoryExpansion(category)}
                                className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors duration-150 group border-l-2 ${
                                  isExpanded
                                    ? `bg-gray-50/80 ${config.bar.replace('bg-', 'border-')}`
                                    : 'border-transparent hover:bg-gray-50/60 hover:border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-150 ${config.accent.split(' ')[0]} ${isExpanded ? 'scale-110' : 'group-hover:scale-105'}`}>
                                    <Icon className={`w-4 h-4 ${config.accent.split(' ')[1]}`} />
                                  </div>
                                  <div className="text-left flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate transition-colors duration-150 ${isExpanded ? 'text-gray-900' : 'text-gray-700'}`}>{category}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex-1 h-1 rounded-full bg-gray-100 max-w-[80px]">
                                        <div className={`h-1 rounded-full ${config.bar}`} style={{ width: `${pct}%` }}></div>
                                      </div>
                                      <span className="text-xs text-gray-400 flex-shrink-0">{transactions.length} op.</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                                  <span className={`text-sm font-bold ${isIncomeCategory ? 'text-emerald-600' : 'text-gray-700'}`}>
                                    {isIncomeCategory ? '+' : '-'}{formatEuro(Math.abs(total))}
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </button>

                              <div className={`transition-all duration-300 ease-out overflow-hidden ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="divide-y divide-gray-50 bg-gray-50/40">
                                  {transactions.map((transaction: any, index: number) => (
                                    <div key={`${category}-${transaction.id}-${transaction.createdAt || index}`} className="px-5 py-1.5 hover:bg-white/70 transition-colors duration-100">
                                      <TransactionItem transaction={transaction} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Nessuna transazione trovata</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm">
                Inizia aggiungendo la tua prima transazione per tenere traccia delle tue finanze.
              </p>
              <AddTransactionDialog
                trigger={
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Prima Transazione
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}