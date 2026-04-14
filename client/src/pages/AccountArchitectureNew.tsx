import { useState, useEffect, useRef } from "react";
import { safeFloat, safeInt } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Building2,
  Wallet,
  Shield,
  TrendingUp,
  PiggyBank,
  Calculator,
  Landmark,
  CreditCard,
  Home,
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowLeftRight,
  DollarSign,
  Target,
  Briefcase,
  Heart,
  Plane,
  Car,
  GraduationCap,
  Gift,
  RefreshCw
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { formatEuro } from "@/lib/financial";

// Icon mapping for custom accounts
const ICON_OPTIONS = [
  { value: "Wallet", label: "Portafoglio", icon: Wallet },
  { value: "Building2", label: "Banca", icon: Building2 },
  { value: "Shield", label: "Sicurezza", icon: Shield },
  { value: "TrendingUp", label: "Investimenti", icon: TrendingUp },
  { value: "PiggyBank", label: "Risparmio", icon: PiggyBank },
  { value: "Calculator", label: "Business", icon: Calculator },
  { value: "Landmark", label: "Immobili", icon: Landmark },
  { value: "CreditCard", label: "Credito", icon: CreditCard },
  { value: "Home", label: "Casa", icon: Home },
  { value: "Target", label: "Obiettivi", icon: Target },
  { value: "Briefcase", label: "Lavoro", icon: Briefcase },
  { value: "Heart", label: "Famiglia", icon: Heart },
  { value: "Plane", label: "Viaggi", icon: Plane },
  { value: "Car", label: "Auto", icon: Car },
  { value: "GraduationCap", label: "Educazione", icon: GraduationCap },
  { value: "Gift", label: "Regali", icon: Gift },
];

// Color options for custom accounts
const COLOR_OPTIONS = [
  { value: "#3B82F6", label: "Blu", color: "#3B82F6" },
  { value: "#10B981", label: "Verde", color: "#10B981" },
  { value: "#F59E0B", label: "Arancione", color: "#F59E0B" },
  { value: "#EF4444", label: "Rosso", color: "#EF4444" },
  { value: "#8B5CF6", label: "Viola", color: "#8B5CF6" },
  { value: "#06B6D4", label: "Azzurro", color: "#06B6D4" },
  { value: "#84CC16", label: "Lime", color: "#84CC16" },
  { value: "#F97316", label: "Arancio scuro", color: "#F97316" },
  { value: "#EC4899", label: "Rosa", color: "#EC4899" },
  { value: "#6B7280", label: "Grigio", color: "#6B7280" },
];

// Standard account definitions with enhanced styling
const STANDARD_ACCOUNTS = {
  income: {
    name: "Conto di Ingresso/Smistamento",
    type: "Conto Corrente",
    description: "Dove arriva il tuo stipendio e da cui distribuisci tutto il resto",
    icon: ArrowLeftRight,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600"
  },
  wealth: {
    name: "Conto Pila",
    type: "Conto di Risparmio",
    description: "Il tuo capitale che accumuli mese dopo mese per raggiungere la libertà finanziaria",
    icon: TrendingUp,
    color: "#3B82F6",
    gradient: "from-blue-500 to-indigo-600"
  },
  operating: {
    name: "Conto Circolante",
    type: "Conto Corrente",
    description: "Per le spese quotidiane: cibo, trasporti, bollette e tutto ciò che ti serve per vivere",
    icon: CreditCard,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600"
  },
  emergency: {
    name: "Conto Emergenze/Sicurezza",
    type: "Conto di Risparmio",
    description: "Il tuo paracadute finanziario per affrontare imprevisti senza intaccare i tuoi investimenti",
    icon: Shield,
    color: "#EF4444",
    gradient: "from-red-500 to-pink-600"
  },
  investment: {
    name: "Conto Investimenti/Libertà",
    type: "Conto Investimenti",
    description: "Da qui alimenterai i tuoi investimenti per costruire ricchezza nel lungo termine",
    icon: TrendingUp,
    color: "#8B5CF6",
    gradient: "from-purple-500 to-violet-600"
  },
  savings: {
    name: "Conto Accantonamenti/Tasse Annuali",
    type: "Conto di Risparmio",
    description: "Per mettere da parte soldi per tasse, spese annuali e grandi acquisti programmati",
    icon: PiggyBank,
    color: "#06B6D4",
    gradient: "from-cyan-500 to-blue-600"
  }
};

interface CustomAccount {
  id: number;
  name: string;
  type: string;
  iban?: string;
  balance: number;
  monthlyAllocation: number;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export default function AccountArchitectureNew() {
  console.log('[DEBUG-ARCH] ===== AccountArchitectureNew component mounting =====');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCustomAccount, setEditingCustomAccount] = useState<CustomAccount | null>(null);
  const [editingStandardAccount, setEditingStandardAccount] = useState<string | null>(null);
  const [standardAccountForm, setStandardAccountForm] = useState<any>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Ref to store timeout ID for cleanup
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state for new custom account
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "savings",
    iban: "",
    balance: 0,
    monthlyAllocation: 0,
    description: "",
    color: "#3B82F6",
    icon: "Wallet"
  });

  // Fetch account architecture with critical cache settings
  const { data: architecture, isLoading: archLoading, error: archError } = useQuery({
    queryKey: ['/api/account-architecture'],
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      console.log('[DEBUG-ARCH] Architecture retry:', { failureCount, status: error?.status });
      return failureCount < 2;
    }
  });

  // Fetch custom accounts with critical cache settings
  const { data: customAccounts, isLoading: customLoading, error: accountsError } = useQuery({
    queryKey: ['/api/custom-accounts'],
    staleTime: 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      console.log('[DEBUG-ARCH] Custom accounts retry:', { failureCount, status: error?.status });
      return failureCount < 2;
    }
  });

  // Create custom account mutation
  const createCustomAccountMutation = useMutation({
    mutationFn: (accountData: any) => apiRequest('POST', '/api/custom-accounts', accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-accounts'] });
      setShowCreateDialog(false);
      setNewAccount({
        name: "",
        type: "savings",
        iban: "",
        balance: 0,
        monthlyAllocation: 0,
        description: "",
        color: "#3B82F6",
        icon: "Wallet"
      });
      toast({
        title: "Conto creato",
        description: "Il nuovo conto è stato creato con successo",
      });
    },
    onError: (error) => {
      console.error('Error creating custom account:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il conto",
        variant: "destructive",
      });
    },
  });

  // Update custom account mutation
  const updateCustomAccountMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PUT', `/api/custom-accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-accounts'] });
      setEditingCustomAccount(null);
      toast({
        title: "Conto aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
    },
    onError: (error) => {
      console.error('Error updating custom account:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il conto",
        variant: "destructive",
      });
    },
  });

  // Delete custom account mutation
  const deleteCustomAccountMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-accounts'] });
      toast({
        title: "Conto eliminato",
        description: "Il conto è stato eliminato con successo",
      });
    },
    onError: (error) => {
      console.error('Error deleting custom account:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il conto",
        variant: "destructive",
      });
    },
  });

  // Update standard account mutation
  const updateStandardAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/account-architecture/${(architecture as any)?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      setEditingStandardAccount(null);
      setStandardAccountForm({});
      toast({
        title: "Conto aggiornato",
        description: "Il nome del conto è stato aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento del conto",
        variant: "destructive",
      });
    }
  });

  const handleCreateAccount = () => {
    if (!newAccount.name.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci un nome per il conto",
        variant: "destructive",
      });
      return;
    }

    createCustomAccountMutation.mutate(newAccount);
  };

  const handleUpdateAccount = () => {
    if (!editingCustomAccount) return;
    updateCustomAccountMutation.mutate(editingCustomAccount);
  };

  const handleDeleteAccount = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo conto?")) {
      deleteCustomAccountMutation.mutate(id);
    }
  };

  const handleEditStandardAccount = (accountKey: string, account: any) => {
    setEditingStandardAccount(accountKey);
    setStandardAccountForm({
      [`${accountKey}AccountName`]: account.name,
      [`${accountKey}AccountIban`]: account.iban || '',
      [`${accountKey}AccountBankName`]: account.bankName || '',
      [`${accountKey}AccountBalance`]: account.balance || '0',
      [`${accountKey}MonthlyAllocation`]: account.monthlyAllocation || '0'
    });
  };

  const handleSaveStandardAccount = () => {
    if (!editingStandardAccount) return;
    
    // Prepare the data with proper field names for the backend
    const updateData: any = {};
    const key = editingStandardAccount;
    
    // Add account name, bank name, and IBAN
    if (standardAccountForm[`${key}AccountName`] !== undefined) {
      updateData[`${key}AccountName`] = standardAccountForm[`${key}AccountName`];
    }
    if (standardAccountForm[`${key}AccountBankName`] !== undefined) {
      updateData[`${key}AccountBankName`] = standardAccountForm[`${key}AccountBankName`];
    }
    if (standardAccountForm[`${key}AccountIban`] !== undefined) {
      updateData[`${key}AccountIban`] = standardAccountForm[`${key}AccountIban`];
    }
    
    // Add balance
    if (standardAccountForm[`${key}AccountBalance`] !== undefined) {
      updateData[`${key}AccountBalance`] = standardAccountForm[`${key}AccountBalance`].toString();
    }
    
    // Add monthly allocation with correct field name
    if (standardAccountForm[`${key}MonthlyAllocation`] !== undefined) {
      // The backend expects field names like "wealthMonthlyAllocation", "operatingMonthlyAllocation", etc.
      const allocationFieldName = `${key}MonthlyAllocation`;
      updateData[allocationFieldName] = standardAccountForm[`${key}MonthlyAllocation`].toString();
    }
    
    updateStandardAccountMutation.mutate(updateData);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Wallet;
  };

  // --- BLOCCO CORRETTO PER LA GESTIONE DEL CARICAMENTO E REINDIRIZZAMENTO ---

  // Effetto per reindirizzare automaticamente al wizard se non c'è architettura.
  // Utilizzando isRedirecting per evitare race conditions e loop infiniti.
  useEffect(() => {
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Esegui il reindirizzamento solo quando:
    // 1. Il caricamento è completato
    // 2. Non c'è architettura
    // 3. Non stiamo già reindirizzando
    if (!archLoading && !architecture && !isRedirecting) {
      console.log('[DEBUG-ARCH] ⚠️ REDIRECTING TO SETUP - no architecture found');
      setIsRedirecting(true);
      // Piccolo timeout per evitare race conditions con il rendering
      redirectTimeoutRef.current = setTimeout(() => {
        setLocation('/account-architecture-setup', { replace: true });
      }, 100);
    }

    // Cleanup function to clear timeout on unmount or dependency changes
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [architecture, archLoading, isRedirecting, setLocation]);

  // Gestione unificata dello stato di caricamento.
  // Mostra lo spinner se stiamo caricando O se stiamo reindirizzando.
  if (archLoading || customLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">
            {isRedirecting ? 'Reindirizzamento in corso...' : 'Caricamento dei dati...'}
          </p>
        </div>
      </div>
    );
  }

  // Se arriviamo qui senza architettura dopo il caricamento, mostra uno stato di errore 
  // invece di continuare con il rendering (fallback di sicurezza)
  if (!architecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore di Configurazione</h2>
          <p className="text-gray-600 mb-4">Impossibile accedere all'architettura dei conti.</p>
          <Button onClick={() => setLocation('/account-architecture-setup')} className="bg-blue-600 hover:bg-blue-700">
            Configura Account
          </Button>
        </div>
      </div>
    );
  }

  // --- FINE DEL BLOCCO CORRETTO ---


  // Se arriviamo qui, siamo sicuri che 'architecture' esista e non sia null.
  const standardAccountsData = (architecture as any)?.accounts || {};
  const allCustomAccounts = Array.isArray(customAccounts) ? customAccounts : [];

  // Logica per rilevare conti mancanti
  const missingAccounts = Object.entries(STANDARD_ACCOUNTS).filter(([key, account]) => {
    const accountData = standardAccountsData[key];
    return !accountData || !accountData.bankName || !accountData.iban;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Configuration Card - Always Visible */}
        <div className="mb-6">
          <Card className={missingAccounts.length > 0 ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${missingAccounts.length > 0 ? "bg-orange-100" : "bg-blue-100"}`}>
                  {missingAccounts.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Settings className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  {missingAccounts.length > 0 ? (
                    <>
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">
                        Configurazione Incompleta
                      </h3>
                      <p className="text-orange-800 mb-3">
                        Hai {missingAccounts.length} conti che necessitano di configurazione per utilizzare tutte le funzionalità dell'app.
                      </p>
                      <div className="mb-4">
                        <h4 className="font-medium text-orange-900 mb-2">Conti da configurare:</h4>
                        <ul className="space-y-1">
                          {missingAccounts.map(([key, account]) => (
                            <li key={key} className="text-sm text-orange-800 flex items-center">
                              <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                              {account.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        onClick={() => setLocation('/account-architecture-setup?force=true')}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Completa Configurazione
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Gestione Configurazione Conti
                      </h3>
                      <p className="text-blue-800 mb-3">
                        Tutti i tuoi conti sono configurati! Puoi modificare i dettagli dei conti, aggiornare saldi, allocazioni mensili o cambiare le banche associate.
                      </p>
                      <Button
                        onClick={() => setLocation('/account-architecture-setup?force=true')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configura Conti
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                Architettura dei Conti
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Gestisci i tuoi 6 conti standard e crea conti personalizzati per ogni esigenza
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
              <Button
                onClick={() => setLocation('/account-architecture-setup')}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 mobile-button-scale"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Riconfigura
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg mobile-button-scale"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Conto
              </Button>
            </div>
          </div>
        </div>

        {/* Standard Accounts Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Landmark className="w-6 h-6 mr-2 text-blue-600" />
            I Tuoi 6 Conti Standard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(STANDARD_ACCOUNTS).map(([key, account]) => {
              const accountData = standardAccountsData[key];
              const IconComponent = account.icon;
              const isMissing = !accountData || !accountData.bankName || !accountData.iban;

              return (
                <Card
                  key={key}
                  className={`hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group cursor-pointer ${isMissing ? 'border-l-4 border-l-orange-400' : ''}`}
                  onClick={() => setSelectedAccount(selectedAccount === key ? null : key)}
                >
                  <div className={`h-2 bg-gradient-to-r ${account.gradient}`}></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: `${account.color}20`, color: account.color }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          {editingStandardAccount === key ? (
                            <div className="space-y-2">
                              <Input
                                value={standardAccountForm[`${key}AccountName`] || ''}
                                onChange={(e) => setStandardAccountForm({
                                  ...standardAccountForm,
                                  [`${key}AccountName`]: e.target.value
                                })}
                                className="text-lg font-semibold"
                                placeholder="Nome del conto"
                              />
                              <Input
                                value={standardAccountForm[`${key}AccountBankName`] || ''}
                                onChange={(e) => setStandardAccountForm({
                                  ...standardAccountForm,
                                  [`${key}AccountBankName`]: e.target.value
                                })}
                                className="text-sm"
                                placeholder="Nome della banca (es. Intesa Sanpaolo, Unicredit, Revolut)"
                              />
                              <Input
                                value={standardAccountForm[`${key}AccountIban`] || ''}
                                onChange={(e) => setStandardAccountForm({
                                  ...standardAccountForm,
                                  [`${key}AccountIban`]: e.target.value
                                })}
                                className="text-sm"
                                placeholder="IBAN (es. IT60 X054 2811 1010 0000 0123 456)"
                              />
                              <Input
                                type="number"
                                value={standardAccountForm[`${key}AccountBalance`] || ''}
                                onChange={(e) => setStandardAccountForm({
                                  ...standardAccountForm,
                                  [`${key}AccountBalance`]: e.target.value
                                })}
                                className="text-sm"
                                placeholder="Saldo attuale"
                              />
                              <Input
                                type="number"
                                value={standardAccountForm[`${key}MonthlyAllocation`] || ''}
                                onChange={(e) => setStandardAccountForm({
                                  ...standardAccountForm,
                                  [`${key}MonthlyAllocation`]: e.target.value
                                })}
                                className="text-sm"
                                placeholder="Allocazione mensile"
                              />
                            </div>
                          ) : (
                            <>
                              <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                                {accountData?.name || account.name}
                              </CardTitle>
                              {(accountData?.bankName || accountData?.iban) && (
                                <p className="text-sm font-medium text-blue-600 mt-1">
                                  {accountData?.bankName ? `🏦 ${accountData.bankName}` :
                                    accountData.iban.includes('REVO') ? '🏦 Revolut' :
                                      accountData.iban.includes('NTSB') ? '🏦 N26' :
                                        accountData.iban.includes('BCIT') ? '🏦 Intesa Sanpaolo' :
                                          accountData.iban.includes('UBSP') ? '🏦 UBI Banca' :
                                            `🏦 ${accountData.iban.substring(0, 8)}...`}
                                </p>
                              )}
                              {accountData?.name && accountData.name !== account.name && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ({account.name})
                                </p>
                              )}
                            </>
                          )}
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {account.type}
                            </Badge>
                            {isMissing && (
                              <Badge variant="destructive" className="text-xs">
                                Configurazione Richiesta
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {editingStandardAccount === key ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveStandardAccount}
                              disabled={updateStandardAccountMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              Salva
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingStandardAccount(null);
                                setStandardAccountForm({});
                              }}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Annulla
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStandardAccount(key, accountData || account);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {account.description}
                    </p>

                    {accountData && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Saldo Attuale</span>
                          <span className="text-lg font-bold" style={{ color: account.color }}>
                            {formatEuro(accountData.balance || 0)}
                          </span>
                        </div>

                        {accountData.monthlyAllocation > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Allocazione Mensile</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatEuro(accountData.monthlyAllocation)}
                            </span>
                          </div>
                        )}

                        {accountData.iban && (
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">IBAN</span>
                              <span className="text-xs font-medium text-gray-700 font-mono">
                                {accountData.iban}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Custom Accounts Section */}
        {Array.isArray(allCustomAccounts) && allCustomAccounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="w-6 h-6 mr-2 text-green-600" />
              I Tuoi Conti Personalizzati
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.isArray(allCustomAccounts) && allCustomAccounts.map((account: CustomAccount) => {
                const IconComponent = getIconComponent(account.icon);

                return (
                  <Card
                    key={account.id}
                    className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group"
                  >
                    <div
                      className="h-2"
                      style={{ backgroundColor: account.color }}
                    ></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-3 rounded-full shadow-md group-hover:scale-110 transition-transform duration-200"
                            style={{
                              backgroundColor: `${account.color}20`,
                              color: account.color
                            }}
                          >
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                              {account.name}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {account.type}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCustomAccount(account)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {account.description && (
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {account.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Saldo Attuale</span>
                          <span
                            className="text-lg font-bold"
                            style={{ color: account.color }}
                          >
                            {formatEuro(account.balance || 0)}
                          </span>
                        </div>

                        {account.monthlyAllocation > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Allocazione Mensile</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatEuro(account.monthlyAllocation)}
                            </span>
                          </div>
                        )}

                        {account.iban && (
                          <div className="pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">IBAN: {account.iban}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Custom Account Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Crea Nuovo Conto Personalizzato
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome del Conto *</Label>
                  <Input
                    id="name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="es. Conto Vacanze"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo di Conto</Label>
                  <Select
                    value={newAccount.type}
                    onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Conto di Risparmio</SelectItem>
                      <SelectItem value="checking">Conto Corrente</SelectItem>
                      <SelectItem value="investment">Conto Investimenti</SelectItem>
                      <SelectItem value="business">Conto Business</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                  placeholder="Descrivi a cosa serve questo conto..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="balance">Saldo Iniziale</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyAllocation">Allocazione Mensile</Label>
                  <Input
                    id="monthlyAllocation"
                    type="number"
                    value={newAccount.monthlyAllocation}
                    onChange={(e) => setNewAccount({ ...newAccount, monthlyAllocation: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="iban">IBAN (opzionale)</Label>
                  <Input
                    id="iban"
                    value={newAccount.iban}
                    onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                    placeholder="IT60 X054 2811 1010 0000 0123 456"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Icona</Label>
                  <Select
                    value={newAccount.icon}
                    onValueChange={(value) => setNewAccount({ ...newAccount, icon: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <IconComponent className="w-4 h-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Colore</Label>
                  <div className="mt-1 grid grid-cols-5 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewAccount({ ...newAccount, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${newAccount.color === color.value
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                          }`}
                        style={{ backgroundColor: color.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Annulla
              </Button>
              <Button
                onClick={handleCreateAccount}
                disabled={createCustomAccountMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {createCustomAccountMutation.isPending ? "Creazione..." : "Crea Conto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Custom Account Dialog */}
        <Dialog open={!!editingCustomAccount} onOpenChange={() => setEditingCustomAccount(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Modifica Conto Personalizzato
              </DialogTitle>
            </DialogHeader>

            {editingCustomAccount && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome del Conto *</Label>
                    <Input
                      id="edit-name"
                      value={editingCustomAccount.name}
                      onChange={(e) => setEditingCustomAccount({
                        ...editingCustomAccount,
                        name: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-type">Tipo di Conto</Label>
                    <Select
                      value={editingCustomAccount.type}
                      onValueChange={(value) => setEditingCustomAccount({
                        ...editingCustomAccount,
                        type: value
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Conto di Risparmio</SelectItem>
                        <SelectItem value="checking">Conto Corrente</SelectItem>
                        <SelectItem value="investment">Conto Investimenti</SelectItem>
                        <SelectItem value="business">Conto Business</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Descrizione</Label>
                  <Textarea
                    id="edit-description"
                    value={editingCustomAccount.description || ""}
                    onChange={(e) => setEditingCustomAccount({
                      ...editingCustomAccount,
                      description: e.target.value
                    })}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-balance">Saldo Attuale</Label>
                    <Input
                      id="edit-balance"
                      type="number"
                      value={editingCustomAccount.balance}
                      onChange={(e) => setEditingCustomAccount({
                        ...editingCustomAccount,
                        balance: parseFloat(e.target.value) || 0
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-monthlyAllocation">Allocazione Mensile</Label>
                    <Input
                      id="edit-monthlyAllocation"
                      type="number"
                      value={editingCustomAccount.monthlyAllocation}
                      onChange={(e) => setEditingCustomAccount({
                        ...editingCustomAccount,
                        monthlyAllocation: parseFloat(e.target.value) || 0
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-iban">IBAN</Label>
                    <Input
                      id="edit-iban"
                      value={editingCustomAccount.iban || ""}
                      onChange={(e) => setEditingCustomAccount({
                        ...editingCustomAccount,
                        iban: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Icona</Label>
                    <Select
                      value={editingCustomAccount.icon}
                      onValueChange={(value) => setEditingCustomAccount({
                        ...editingCustomAccount,
                        icon: value
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-4 h-4" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Colore</Label>
                    <div className="mt-1 grid grid-cols-5 gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEditingCustomAccount({
                            ...editingCustomAccount,
                            color: color.value
                          })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${editingCustomAccount.color === color.value
                              ? 'border-gray-900 scale-110'
                              : 'border-gray-300 hover:scale-105'
                            }`}
                          style={{ backgroundColor: color.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditingCustomAccount(null)}
              >
                Annulla
              </Button>
              <Button
                onClick={handleUpdateAccount}
                disabled={updateCustomAccountMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {updateCustomAccountMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}