import { useState } from "react";
import { safeFloat, safeInt } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building2, 
  BookOpen, 
  Wallet,
  Shield,
  TrendingUp,
  PiggyBank,
  Calculator,
  Landmark,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  CreditCard,
  Home,
  Calendar,
  Settings,
  Search,
  Loader2,
  Trash2,
  AlertTriangle,
  ArrowLeftRight
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatEuro } from "@/lib/financial";

// Standard account definitions
const STANDARD_ACCOUNTS = {
  income: {
    name: "Conto di Ingresso/Smistamento",
    type: "Conto Corrente",
    description: "Dove arriva il tuo stipendio e da cui distribuisci tutto il resto"
  },
  wealth: {
    name: "Conto Pila",
    type: "Conto di Risparmio",
    description: "Il tuo patrimonio che cresce automaticamente ogni mese"
  },
  operating: {
    name: "Conto Circolante",
    type: "Conto Corrente",
    description: "Per tutte le spese quotidiane e mensili ricorrenti"
  },
  emergency: {
    name: "Conto Emergenze/Sicurezza",
    type: "Conto di Risparmio",
    description: "Il tuo fondo di emergenza per imprevisti e sicurezza"
  },
  investment: {
    name: "Conto Investimenti/Libertà",
    type: "Conto Investimenti",
    description: "Per investimenti e costruzione della libertà finanziaria"
  },
  savings: {
    name: "Conto Accantonamenti/Tasse Annuali",
    type: "Conto di Risparmio",
    description: "Per accantonamenti fiscali e spese annuali programmate"
  }
};

const accountIcons = {
  income: Landmark,
  wealth: TrendingUp,
  operating: Wallet,
  emergency: Shield,
  investment: Calculator,
  savings: PiggyBank
};

const accountColors = {
  income: "bg-blue-500",
  wealth: "bg-purple-500",
  operating: "bg-green-500",
  emergency: "bg-red-500",
  investment: "bg-yellow-500",
  savings: "bg-orange-500"
};

interface AccountArchitecture {
  id?: number;
  userId: number;
  monthlyIncome: number;
  autoDistributionEnabled: boolean;
  distributionDay: number;
  accounts: {
    income: {
      name: string;
      iban?: string;
      balance: number;
      type: string;
      description: string;
    };
    wealth: {
      name: string;
      iban?: string;
      balance: number;
      monthlyAllocation: number;
      type: string;
      description: string;
    };
    operating: {
      name: string;
      iban?: string;
      balance: number;
      monthlyAllocation: number;
      type: string;
      description: string;
    };
    emergency: {
      name: string;
      iban?: string;
      balance: number;
      targetAmount: number;
      monthlyAllocation: number;
      type: string;
      description: string;
    };
    investment: {
      name: string;
      iban?: string;
      balance: number;
      monthlyAllocation: number;
      type: string;
      description: string;
    };
    savings: {
      name: string;
      iban?: string;
      balance: number;
      monthlyAllocation: number;
      type: string;
      description: string;
    };
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DistributionPlan {
  totalIncome: number;
  totalAllocated: number;
  remainingUnallocated: number;
  distributions: {
    income: number;
    wealth: number;
    operating: number;
    emergency: number;
    investment: number;
    savings: number;
  };
  nextDistributionDate: string;
}

// Componente per la ricerca investimenti tramite API
interface InvestmentSearchModalProps {
  onAddInvestment: (investment: any) => void;
}

function InvestmentSearchModal({ onAddInvestment }: InvestmentSearchModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchInvestments = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/financial/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setSearchResults(data.slice(0, 10)); // Limita a 10 risultati
      } else {
        toast({
          title: "Errore nella ricerca",
          description: "Impossibile cercare investimenti. Riprova.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: "Verifica la connessione internet e riprova.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectInvestment = (investment: any) => {
    setSelectedInvestment(investment);
  };

  const handleAddInvestment = () => {
    if (!selectedInvestment || !currentValue) {
      toast({
        title: "Campi obbligatori",
        description: "Seleziona un investimento e inserisci il valore attuale.",
        variant: "destructive"
      });
      return;
    }

    const newInvestment = {
      name: selectedInvestment.name || selectedInvestment.symbol,
      symbol: selectedInvestment.symbol,
      currentValue: currentValue,
      totalValue: currentValue,
      quantity: 1,
      purchasePrice: currentValue,
      type: selectedInvestment.type === 'Common Stock' ? 'stocks' : 'etf'
    };

    onAddInvestment(newInvestment);
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedInvestment(null);
    setCurrentValue(0);

    toast({
      title: "Investimento aggiunto",
      description: `${newInvestment.name} è stato aggiunto al tuo portafoglio.`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Cerca tramite API
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cerca Investimenti</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo di ricerca */}
          <div className="flex gap-2">
            <Input
              placeholder="Cerca per simbolo/ticker (es. AAPL, VWCE, MSFT)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchInvestments()}
            />
            <Button onClick={searchInvestments} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Risultati della ricerca */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Risultati della ricerca:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((result, index) => (
                  <Card 
                    key={index}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedInvestment?.symbol === result.symbol ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectInvestment(result)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{result.symbol}</div>
                        <div className="text-sm text-gray-600">{result.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Tipo: {result.type} | Mercato: {result.displaySymbol}
                        </div>
                      </div>
                      {selectedInvestment?.symbol === result.symbol && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Configurazione investimento selezionato */}
          {selectedInvestment && (
            <Card className="p-4">
              <h4 className="font-medium mb-3">Configura Investimento</h4>
              <div className="space-y-3">
                <div>
                  <Label>Investimento Selezionato</Label>
                  <div className="text-sm font-medium">{selectedInvestment.symbol} - {selectedInvestment.name}</div>
                </div>
                <div>
                  <Label htmlFor="current-value">Valore Attuale (€) *</Label>
                  <Input
                    id="current-value"
                    type="number"
                    placeholder="Inserisci il valore attuale del tuo investimento"
                    value={currentValue || ''}
                    onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Pulsanti di azione */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleAddInvestment}
              disabled={!selectedInvestment || !currentValue}
            >
              Aggiungi Investimento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountArchitecture() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Force setup state - to allow entering setup even when architecture exists
  const [forceSetup, setForceSetup] = useState(false);

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: ''
  });
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante il trasferimento');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-unified'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Trasferimento completato!",
        description: data.message
      });
      setIsTransferOpen(false);
      setTransferForm({ fromAccount: '', toAccount: '', amount: '', description: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle transfer form submission
  const handleTransferSubmit = (e: any) => {
    e.preventDefault();
    if (!transferForm.fromAccount || !transferForm.toAccount || !transferForm.amount) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (transferForm.fromAccount === transferForm.toAccount) {
      toast({
        title: "Errore",
        description: "Non puoi trasferire da un conto a se stesso",
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

    transferMutation.mutate({
      fromAccount: transferForm.fromAccount,
      toAccount: transferForm.toAccount,
      amount: amount,
      description: transferForm.description || `Trasferimento da ${transferForm.fromAccount} a ${transferForm.toAccount}`
    });
  };

  // Fetch user's current architecture
  const { data: architecture, isLoading } = useQuery<AccountArchitecture>({
    queryKey: ['/api/account-architecture'],
    refetchInterval: 5000, // Update every 5 seconds for real-time investment values
  });

  // Fetch distribution plan
  const { data: distributionPlan } = useQuery<DistributionPlan>({
    queryKey: ['/api/distribution-plan'],
  });

  // Fetch user assets
  const { data: userAssets = [] } = useQuery<any[]>({
    queryKey: ['/api/assets'],
  });

  const createArchitectureMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/account-architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create architecture');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-plan'] });
      toast({
        title: "Architettura Creata",
        description: "La tua architettura dei conti è stata configurata con successo."
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'architettura dei conti.",
        variant: "destructive"
      });
    }
  });

  const resetArchitectureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/account-architecture/${architecture?.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete architecture');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-plan'] });
      toast({
        title: "Architettura Resettata",
        description: "L'architettura è stata resettata. Ora puoi riconfigurarla."
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel reset dell'architettura.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // If there's no architecture or forceSetup is true, show the setup wizard
  if (!architecture || forceSetup) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">Architettura dei Conti Intelligente</h1>
                <p className="mt-1 text-blue-100 text-sm sm:text-base">
                  Il Sistema Operativo Finanziario - Trasforma il tuo flusso di denaro in canali intelligenti
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-4">
              <Badge variant="secondary" className="bg-blue-800 text-blue-100 text-xs">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Modulo 6
              </Badge>
              <Badge variant="secondary" className="bg-purple-800 text-purple-100 text-xs">
                6 Conti Standard
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 text-orange-800 mb-2">
            <Building2 className="w-5 h-5" />
            <span className="font-medium">
              {architecture ? 'Configurazione Conti Mancanti' : 'Configurazione Richiesta'}
            </span>
          </div>
          <p className="text-orange-700 mb-3">
            {architecture 
              ? 'Completa la configurazione dei conti che hai saltato durante il setup iniziale.' 
              : 'Per utilizzare al meglio l\'applicazione finanziaria, devi prima configurare i tuoi 6 conti standard. Questo è il modulo più importante che organizza tutto il tuo denaro in modo intelligente.'
            }
          </p>
          {!architecture && (
            <p className="text-sm text-orange-600">
              Durante la configurazione del "Conto Investimenti", potrai anche inserire i tuoi investimenti esistenti 
              che verranno automaticamente aggiunti al tuo portafoglio nell'Area Investimenti.
            </p>
          )}
        </div>

        <SetupWizard 
          userAssets={userAssets}
          onComplete={(data) => {
            if (architecture) {
              // Update existing architecture
              const updatedData = { ...architecture, ...data };
              const updateMutation = {
                mutate: async (data: any) => {
                  const response = await fetch(`/api/account-architecture/${architecture.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  });
                  if (!response.ok) throw new Error('Failed to update architecture');
                  queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
                  setForceSetup(false);
                  toast({
                    title: "Architettura Aggiornata",
                    description: "La configurazione dei conti è stata completata con successo."
                  });
                }
              };
              updateMutation.mutate(updatedData);
            } else {
              // Create new architecture
              createArchitectureMutation.mutate(data);
            }
          }} 
          onCancel={architecture ? () => setForceSetup(false) : undefined}
          existingArchitecture={architecture}
        />
      </div>
    );
  }

  return (
    <PatrimonyDashboard 
      architecture={architecture} 
      distributionPlan={distributionPlan} 
      resetArchitectureMutation={resetArchitectureMutation}
      transferForm={transferForm}
      setTransferForm={setTransferForm}
      isTransferOpen={isTransferOpen}
      setIsTransferOpen={setIsTransferOpen}
      transferMutation={transferMutation}
      handleTransferSubmit={handleTransferSubmit}
      setForceSetup={setForceSetup}
    />
  );
}

function DistributionPlanView({ 
  architecture, 
  distributionPlan 
}: { 
  architecture: AccountArchitecture;
  distributionPlan?: DistributionPlan;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeDistributionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/execute-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to execute distribution');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-plan'] });
      toast({
        title: "Distribuzione Eseguita",
        description: "I fondi sono stati distribuiti con successo tra i conti."
      });
    }
  });

  if (!distributionPlan || !distributionPlan.totalIncome) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Piano di Distribuzione</h3>
        <div className="text-center p-8 text-gray-500">
          <p>Nessun piano di distribuzione disponibile.</p>
          <p className="text-sm mt-2">Assicurati di aver configurato correttamente l'architettura dei conti.</p>
        </div>
      </Card>
    );
  }

  const nextDistributionDate = new Date();
  nextDistributionDate.setDate(architecture.distributionDay);
  if (nextDistributionDate < new Date()) {
    nextDistributionDate.setMonth(nextDistributionDate.getMonth() + 1);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">Piano di Distribuzione Mensile</h3>
            <p className="text-gray-600">Distribuzione automatica del {architecture.distributionDay} di ogni mese</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Prossima distribuzione</div>
            <div className="font-semibold">{nextDistributionDate.toLocaleDateString('it-IT')}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              €{distributionPlan.totalIncome.toLocaleString()}
            </div>
            <p className="text-sm text-green-700">Reddito Mensile</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              €{distributionPlan.totalAllocated.toLocaleString()}
            </div>
            <p className="text-sm text-blue-700">Totale Allocato</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              €{distributionPlan.remainingUnallocated.toLocaleString()}
            </div>
            <p className="text-sm text-orange-700">Rimanente</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Istruzioni di Trasferimento</h4>
          <div className="space-y-3">
            {Object.entries(distributionPlan.distributions).map(([accountKey, amount]) => {
              if (accountKey === 'income' || amount === 0) return null;

              const accountInfo = STANDARD_ACCOUNTS[accountKey as keyof typeof STANDARD_ACCOUNTS];
              const Icon = accountIcons[accountKey as keyof typeof accountIcons];
              const colorClass = accountColors[accountKey as keyof typeof accountColors];

              return (
                <div key={accountKey} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${colorClass} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{accountInfo.name}</div>
                      <div className="text-sm text-gray-500">
                        Da: Conto di Ingresso/Smistamento
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">€{amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {((amount / distributionPlan.totalIncome) * 100).toFixed(1)}% del reddito
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button 
            onClick={() => executeDistributionMutation.mutate()}
            disabled={executeDistributionMutation.isPending}
            className="w-full"
            size="lg"
          >
            {executeDistributionMutation.isPending ? 'Esecuzione...' : 'Esegui Distribuzione Ora'}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Questa azione simulerà i trasferimenti tra i conti secondo il piano configurato
          </p>
        </div>
      </Card>
    </div>
  );
}

function AccountsManagement({ architecture }: { architecture: AccountArchitecture }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>({});

  const updateAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/account-architecture/${architecture.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-plan'] });
      setEditingAccount(null);
      toast({
        title: "Conto Aggiornato",
        description: "Le modifiche sono state salvate con successo."
      });
    }
  });

  const handleEdit = (accountKey: string) => {
    setEditingAccount(accountKey);
    setAccountData(architecture.accounts[accountKey as keyof typeof architecture.accounts]);
  };

  const handleSave = () => {
    const updatedArchitecture = {
      ...architecture,
      accounts: {
        ...architecture.accounts,
        [editingAccount!]: accountData
      }
    };
    updateAccountMutation.mutate(updatedArchitecture);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-6">Gestione Conti</h3>

        <div className="space-y-4">
          {Object.entries(architecture.accounts || {}).map(([key, account]) => {
            const Icon = accountIcons[key as keyof typeof accountIcons];
            const colorClass = accountColors[key as keyof typeof accountColors];
            const isEditing = editingAccount === key;

            return (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${colorClass} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{account?.name}</h4>
                      <p className="text-sm text-gray-500">{account?.type}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => isEditing ? handleSave() : handleEdit(key)}
                    disabled={updateAccountMutation.isPending}
                  >
                    {isEditing ? 'Salva' : 'Modifica'}
                  </Button>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${key}-iban`}>IBAN</Label>
                      <Input
                        id={`${key}-iban`}
                        value={accountData.iban || ''}
                        onChange={(e) => setAccountData({...accountData, iban: e.target.value})}
                        placeholder="IT60 X054 2811 1010 0000 0123 456"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}-balance`}>Saldo Attuale (€)</Label>
                      <Input
                        id={`${key}-balance`}
                        type="number"
                        value={accountData.balance || 0}
                        onChange={(e) => setAccountData({...accountData, balance: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    {key !== 'income' && (
                      <div>
                        <Label htmlFor={`${key}-allocation`}>Allocazione Mensile (€)</Label>
                        <Input
                          id={`${key}-allocation`}
                          type="number"
                          value={accountData?.monthlyAllocation || 0}
                          onChange={(e) => setAccountData({...accountData, monthlyAllocation: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    )}
                    {key === 'emergency' && (
                      <div>
                        <Label htmlFor={`${key}-target`}>Obiettivo Fondo (€)</Label>
                        <Input
                          id={`${key}-target`}
                          type="number"
                          value={accountData?.targetAmount || 0}
                          onChange={(e) => setAccountData({...accountData, targetAmount: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">IBAN:</span>
                      <div className="font-mono">{account?.iban || 'Non configurato'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Saldo:</span>
                      <div className="font-semibold">€{(account?.balance || 0).toLocaleString()}</div>
                    </div>
                    {key !== 'income' && (
                      <div>
                        <span className="text-gray-500">Allocazione Mensile:</span>
                        <div className="font-semibold">
                          €{((account as any)?.monthlyAllocation || 0).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ArchitectureSettings({ architecture }: { architecture: AccountArchitecture }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    monthlyIncome: architecture.monthlyIncome,
    distributionDay: architecture.distributionDay,
    autoDistributionEnabled: architecture.autoDistributionEnabled
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/account-architecture/${architecture.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-plan'] });
      toast({
        title: "Impostazioni Aggiornate",
        description: "Le modifiche sono state salvate con successo."
      });
    }
  });

  const resetArchitectureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/account-architecture/${architecture.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to reset architecture');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      toast({
        title: "Architettura Resettata",
        description: "L'architettura è stata resettata. Potrai riconfigurarla."
      });
    }
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      ...architecture,
      ...settings
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-6">Impostazioni Architettura</h3>

        <div className="space-y-6">
          <div>
            <Label htmlFor="monthlyIncome">Reddito Mensile Netto (€)</Label>
            <Input // Corrected line
              id="monthlyIncome"
              type="number"
              value={settings.monthlyIncome}
              onChange={(e) => setSettings({...settings, monthlyIncome: parseFloat(e.target.value) || 0})}
            />
            <p className="text-sm text-gray-500 mt-1">
              Questo importo verrà utilizzato per calcolare le distribuzioni automatiche
            </p>
          </div>

          <div>
            <Label htmlFor="distributionDay">Giorno di Distribuzione Mensile</Label>
            <Select 
              value={settings.distributionDay.toString()} 
              onValueChange={(value) => setSettings({...settings, distributionDay: safeInt(value)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1} del mese
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoDistribution"
              checked={settings.autoDistributionEnabled}
              onCheckedChange={(checked) => setSettings({...settings, autoDistributionEnabled: checked})}
            />
            <div>
              <Label htmlFor="autoDistribution" className="font-medium">Distribuzione Automatica</Label>
              <p className="text-sm text-gray-500">
                Se attiva, il sistema distribuirà automaticamente i fondi ogni mese
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="w-full mb-4"
            >
              {updateSettingsMutation.isPending ? 'Salvando...' : 'Salva Impostazioni'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-red-200">
        <h4 className="text-lg font-semibold text-red-600 mb-4">Zona Pericolosa</h4>
        <p className="text-gray-600 mb-4">
          Resettare l'architettura cancellerà tutta la configurazione attuale. 
          Dovrai riconfigurarla completamente dal wizard di setup.
        </p>
        <Button 
          variant="destructive"
          onClick={() => {
            if (confirm('Sei sicuro di voler resettare completamente l\'architettura? Questa azione non può essere annullata e dovrai riconfigurare tutti i 6 conti.')) {
              resetArchitectureMutation.mutate();
            }
          }}
          disabled={resetArchitectureMutation.isPending}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {resetArchitectureMutation.isPending ? 'Resettando...' : 'Resetta e Riconfigura'}
        </Button>
      </Card>
    </div>
  );
}

function SetupWizard({ 
  userAssets, 
  onComplete, 
  onCancel, 
  existingArchitecture 
}: { 
  userAssets: any[]; 
  onComplete: (data: any) => void; 
  onCancel?: () => void;
  existingArchitecture?: AccountArchitecture;
}) {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(existingArchitecture?.monthlyIncome?.toString() || "");
  const [distributionDay, setDistributionDay] = useState(existingArchitecture?.distributionDay?.toString() || "1");
  const [autoDistribution, setAutoDistribution] = useState(existingArchitecture?.autoDistributionEnabled ?? true);
  const [accountsConfig, setAccountsConfig] = useState({
    income: { 
      bankName: (existingArchitecture?.accounts?.income as any)?.bankName || "", 
      iban: existingArchitecture?.accounts?.income?.iban || "", 
      balance: existingArchitecture?.accounts?.income?.balance || 0, 
      monthlyAllocation: (existingArchitecture?.accounts?.income as any)?.monthlyAllocation || 0, 
      targetAmount: 0 
    },
    wealth: { 
      bankName: (existingArchitecture?.accounts?.wealth as any)?.bankName || "", 
      iban: existingArchitecture?.accounts?.wealth?.iban || "", 
      balance: existingArchitecture?.accounts?.wealth?.balance || 0, 
      monthlyAllocation: existingArchitecture?.accounts?.wealth?.monthlyAllocation || 0, 
      targetAmount: 0 
    },
    operating: { 
      bankName: (existingArchitecture?.accounts?.operating as any)?.bankName || "", 
      iban: existingArchitecture?.accounts?.operating?.iban || "", 
      balance: existingArchitecture?.accounts?.operating?.balance || 0, 
      monthlyAllocation: existingArchitecture?.accounts?.operating?.monthlyAllocation || 0, 
      targetAmount: 0 
    },
    emergency: { 
      bankName: (existingArchitecture?.accounts?.emergency as any)?.bankName || "", 
      iban: existingArchitecture?.accounts?.emergency?.iban || "", 
      balance: existingArchitecture?.accounts?.emergency?.balance || 0, 
      monthlyAllocation: existingArchitecture?.accounts?.emergency?.monthlyAllocation || 0, 
      targetAmount: (existingArchitecture?.accounts?.emergency as any)?.emergencyTargetAmount || 0 
    },
    investment: { 
      bankName: (existingArchitecture?.accounts?.investment as any)?.bankName || "", 
      iban: existingArchitecture?.accounts?.investment?.iban || "", 
      balance: existingArchitecture?.accounts?.investment?.balance || 0, 
      monthlyAllocation: existingArchitecture?.accounts?.investment?.monthlyAllocation || 0, 
      targetAmount: 0 
    },
    savings: { 
      bankName: (existingArchitecture?.accounts?.savings as any)?.bankName || "", 
      iban: existingArchitecture?.accounts?.savings?.iban || "", 
      balance: existingArchitecture?.accounts?.savings?.balance || 0, 
      monthlyAllocation: existingArchitecture?.accounts?.savings?.monthlyAllocation || 0, 
      targetAmount: 0 
    }
  });

  // Investment configuration state
  const [investmentConfig, setInvestmentConfig] = useState({
    existingInvestments: [] as Array<{
      name: string;
      symbol: string;
      currentValue: number;
      totalValue?: number;
      quantity?: number;
      purchasePrice?: number;
      type: 'stocks' | 'etf' | 'bonds' | 'crypto' | 'real_estate' | 'other';
    }>,
    portfolioGoal: {
      targetAmount: 0,
      targetDate: '',
      monthlyContribution: 0
    }
  });

  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      const architectureData = {
        monthlyIncome: safeFloat(monthlyIncome),
        autoDistributionEnabled: autoDistribution,
        distributionDay: safeInt(distributionDay),
        accounts: {
          income: {
            ...STANDARD_ACCOUNTS.income,
            ...accountsConfig.income
          },
          wealth: {
            ...STANDARD_ACCOUNTS.wealth,
            ...accountsConfig.wealth
          },
          operating: {
            ...STANDARD_ACCOUNTS.operating,
            ...accountsConfig.operating
          },
          emergency: {
            ...STANDARD_ACCOUNTS.emergency,
            ...accountsConfig.emergency
          },
          investment: {
            ...STANDARD_ACCOUNTS.investment,
            ...accountsConfig.investment
          },
          savings: {
            ...STANDARD_ACCOUNTS.savings,
            ...accountsConfig.savings
          }
        },
        investmentConfig, // Include investment configuration
        isActive: true
      };

      await onComplete(architectureData);
    } catch (error) {
      console.error('Error completing configuration:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const totalSteps = 7; // Introduzione + 6 conti
  const accountKeys = Object.keys(STANDARD_ACCOUNTS);

  const updateAccountConfig = (accountKey: string, field: string, value: any) => {
    setAccountsConfig(prev => ({
      ...prev,
      [accountKey]: {
        ...prev[accountKey as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const getAvailableAssets = () => {
    if (!userAssets || !Array.isArray(userAssets)) return [];
    return userAssets.filter((asset: any) => 
      asset.category === 'Conti Correnti' || 
      asset.category === 'Carte' || 
      asset.category === 'Depositi'
    );
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Configurazione Guidata - Architettura dei Conti</CardTitle>
        <CardDescription>
          Passo {step} di {totalSteps}: Configura i tuoi 6 conti fondamentali associandoli alle tue banche
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Passo 1: Informazioni Generali */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Benvenuto nel Sistema Operativo Finanziario</h3>
              <p className="text-gray-600 mb-6">
                Configureremo insieme i tuoi 6 conti standard per organizzare il tuo denaro come un professionista
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="monthlyIncome">Il tuo Reddito Mensile Netto (€)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="3000"
                  className="text-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Inserisci il totale che ricevi ogni mese dopo le tasse
                </p>
              </div>

              <div>
                <Label htmlFor="distributionDay">Giorno di Distribuzione Mensile</Label>
                <Select value={distributionDay} onValueChange={setDistributionDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il giorno" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} del mese
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Il giorno in cui preferisci distribuire i soldi tra i conti
                </p>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Switch
                  id="autoDistribution"
                  checked={autoDistribution}
                  onCheckedChange={setAutoDistribution}
                />
                <div>
                  <Label htmlFor="autoDistribution" className="font-medium">Distribuzione Automatica</Label>
                  <p className="text-sm text-gray-600">
                    Il sistema distribuirà automaticamente il denaro ogni mese
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full"
              disabled={!monthlyIncome}
            >
              Inizia Configurazione Conti
            </Button>
          </div>
        )}

        {/* Passi 2-7: Configurazione dei 6 conti */}
        {step >= 2 && step <= 7 && (
          <AccountConfigurationStep
            step={step}
            accountKey={accountKeys[step - 2]}
            accountInfo={STANDARD_ACCOUNTS[accountKeys[step - 2] as keyof typeof STANDARD_ACCOUNTS]}
            accountConfig={accountsConfig[accountKeys[step - 2] as keyof typeof accountsConfig]}
            availableAssets={getAvailableAssets()}
            monthlyIncome={safeFloat(monthlyIncome)}
            onUpdateConfig={updateAccountConfig}
            onNext={() => setStep(step + 1)}
            onBack={() => setStep(step - 1)}
            onComplete={step === 7 ? handleComplete : undefined}
            isCompleting={isCompleting}
            investmentConfig={investmentConfig}
            setInvestmentConfig={setInvestmentConfig}
          />
        )}
      </CardContent>
    </Card>
  );
}

function AccountConfigurationStep({
  step,
  accountKey,
  accountInfo,
  accountConfig,
  availableAssets,
  monthlyIncome,
  onUpdateConfig,
  onNext,
  onBack,
  onComplete,
  isCompleting,
  investmentConfig,
  setInvestmentConfig
}: {
  step: number;
  accountKey: string;
  accountInfo: any;
  accountConfig: any;
  availableAssets: any[];
  monthlyIncome: number;
  onUpdateConfig: (accountKey: string, field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete?: () => void;
  isCompleting?: boolean;
  investmentConfig?: any;
  setInvestmentConfig?: (config: any) => void;
}) {
  const Icon = accountIcons[accountKey as keyof typeof accountIcons];
  const colorClass = accountColors[accountKey as keyof typeof accountColors];

  const suggestedAllocation = {
    wealth: Math.round(monthlyIncome * 0.2), // 20%
    operating: Math.round(monthlyIncome * 0.5), // 50%
    emergency: Math.round(monthlyIncome * 0.1), // 10%
    investment: Math.round(monthlyIncome * 0.15), // 15%
    savings: Math.round(monthlyIncome * 0.05) // 5%
  };

  return (
    <div className="space-y-6">
      {/* Header del conto */}
      <div className="text-center">
        <div className={`inline-flex p-4 rounded-full ${colorClass} text-white mb-4`}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold mb-2">{accountInfo.name}</h3>
        <p className="text-gray-600 mb-4">{accountInfo.description}</p>
        <Badge variant="outline" className="mb-4">{accountInfo.type}</Badge>
      </div>

      {/* Associazione Banca/Carta */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Associa a una Banca o Carta</h4>

        {availableAssets.length > 0 ? (
          <div className="space-y-3">
            <div>
              <Label>Seleziona Banca/Carta Esistente</Label>
              <Select 
                value={accountConfig.bankName} 
                onValueChange={(value) => {
                  const selectedAsset = availableAssets.find(asset => asset.name === value);
                  onUpdateConfig(accountKey, 'bankName', value);
                  if (selectedAsset?.iban) {
                    onUpdateConfig(accountKey, 'iban', selectedAsset.iban);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Scegli da elenco esistente" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map((asset: any) => (
                    <SelectItem key={asset.id} value={asset.name}>
                      {asset.name} - {asset.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-gray-500">oppure</div>
          </div>
        ) : (
          <div className="text-center p-4 bg-yellow-50 rounded-lg mb-4">
            <p className="text-yellow-700">
              Non hai ancora configurato nessuna banca o carta. Puoi farlo ora o saltare per configurare in seguito.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="bankName">Nome Banca/Carta</Label>
            <Input
              id="bankName"
              value={accountConfig.bankName}
              onChange={(e) => onUpdateConfig(accountKey, 'bankName', e.target.value)}
              placeholder="es. Intesa Sanpaolo, Revolut, N26..."
            />
          </div>

          <div>
            <Label htmlFor="iban">IBAN (opzionale)</Label>
            <Input
              id="iban"
              value={accountConfig.iban}
              onChange={(e) => onUpdateConfig(accountKey, 'iban', e.target.value)}
              placeholder="IT60 X054 2811 1010 0000 0123 456"
            />
          </div>
        </div>
      </Card>

      {/* Configurazione Importi */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Configurazione Importi</h4>

        <div className="space-y-3">
          <div>
            <Label htmlFor="balance">Saldo Attuale (€)</Label>
            <Input
              id="balance"
              type="number"
              value={accountConfig.balance}
              onChange={(e) => onUpdateConfig(accountKey, 'balance', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {accountKey !== 'income' && (
            <div>
              <Label htmlFor="allocation">Allocazione Mensile (€)</Label>
              <div className="flex space-x-2">
                <Input
                  id="allocation"
                  type="number"
                  value={accountConfig.monthlyAllocation}
                  onChange={(e) => onUpdateConfig(accountKey, 'monthlyAllocation', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                {suggestedAllocation[accountKey as keyof typeof suggestedAllocation] && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onUpdateConfig(accountKey, 'monthlyAllocation', suggestedAllocation[accountKey as keyof typeof suggestedAllocation])}
                  >
                    Suggerito: €{suggestedAllocation[accountKey as keyof typeof suggestedAllocation]}
                  </Button>
                )}
              </div>
            </div>
          )}

          {accountKey === 'emergency' && (
            <div>
              <Label htmlFor="targetAmount">Obiettivo Fondo Emergenza (€)</Label>
              <div className="flex space-x-2">
                <Input
                  id="targetAmount"
                  type="number"
                  value={accountConfig.targetAmount}
                  onChange={(e) => onUpdateConfig(accountKey, 'targetAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onUpdateConfig(accountKey, 'targetAmount', monthlyIncome * 6)}
                >
                  6 Mesi: €{monthlyIncome * 6}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Raccomandato: 3-6 mesi di spese
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Configurazione Investimenti per il Conto Investimenti */}
      {accountKey === 'investment' && investmentConfig && setInvestmentConfig && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Investimenti Esistenti
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Inserisci i tuoi investimenti attuali. Verranno automaticamente aggiunti al tuo portafoglio nell'Area Investimenti.
            Puoi cercare tramite simbolo/ticker o inserire manualmente.
          </p>

          {/* Validazione Saldi */}
          {(() => {
            const totalInvestments = investmentConfig.existingInvestments.reduce((sum: number, inv: any) => 
              sum + (inv.totalValue || inv.currentValue || 0), 0
            );
            const accountBalance = accountConfig.balance || 0;
            const difference = Math.abs(totalInvestments - accountBalance);

            // Mostra sempre il riepilogo se ci sono investimenti o un saldo
            if (totalInvestments > 0 || accountBalance > 0) {
              const isBalanced = difference <= 1; // Tolleranza di 1€
              return (
                <div className={`mb-4 p-4 rounded-lg border ${
                  isBalanced 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`flex items-center space-x-2 mb-2 ${
                    isBalanced ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isBalanced ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {isBalanced ? 'Saldi corrispondenti' : 'Attenzione: Saldi non corrispondenti'}
                    </span>
                  </div>
                  <div className={`text-sm mb-2 ${
                    isBalanced ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Totale investimenti:</span><br/>
                        <span className="text-lg font-bold">€{totalInvestments.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Saldo conto:</span><br/>
                        <span className="text-lg font-bold">€{accountBalance.toLocaleString()}</span>
                      </div>
                    </div>
                    {!isBalanced && (
                      <div className="mt-2 text-center">
                        <span className="font-medium">Differenza: €{difference.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {!isBalanced && (
                    <p className={`text-xs ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {difference > 0 ? (
                        accountBalance > totalInvestments
                          ? 'Il saldo del conto è maggiore del totale investimenti. Potresti avere liquidità extra.'
                          : 'Il totale investimenti è maggiore del saldo del conto. Verifica gli importi inseriti.'
                      ) : 'I valori corrispondono perfettamente.'}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div className="space-y-4">
            {investmentConfig.existingInvestments.map((investment: any, index: number) => (
              <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <Label htmlFor={`inv-name-${index}`}>Nome Investimento</Label>
                    <Input
                      id={`inv-name-${index}`}
                      value={investment.name}
                      onChange={(e) => {
                        const updated = [...investmentConfig.existingInvestments];
                        updated[index] = { ...updated[index], name: e.target.value };
                        setInvestmentConfig({
                          ...investmentConfig,
                          existingInvestments: updated
                        });
                      }}
                      placeholder="es. VWCE ETF, Apple Stock..."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`inv-symbol-${index}`}>Simbolo/Ticker</Label>
                    <Input
                      id={`inv-symbol-${index}`}
                      value={investment.symbol}
                      onChange={(e) => {
                        const updated = [...investmentConfig.existingInvestments];
                        updated[index] = { ...updated[index], symbol: e.target.value };
                        setInvestmentConfig({
                          ...investmentConfig,
                          existingInvestments: updated
                        });
                      }}
                      placeholder="VWCE, AAPL..."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`inv-quantity-${index}`}>Quantità *</Label>
                    <Input
                      id={`inv-quantity-${index}`}
                      type="number"
                      value={investment.quantity || ''}
                      onChange={(e) => {
                        const quantity = parseFloat(e.target.value) || 0;
                        const purchasePrice = investment.purchasePrice || 0;
                        const updated = [...investmentConfig.existingInvestments];
                        updated[index] = {
                          ...updated[index],
                          quantity: quantity,
                          // Aggiorna automaticamente il valore totale basato su quantità x prezzo di acquisto
                          totalValue: quantity * purchasePrice,
                          currentValue: quantity * purchasePrice
                        };
                        setInvestmentConfig({
                          ...investmentConfig,
                          existingInvestments: updated,
                        });
                      }}
                      placeholder="10"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`inv-purchase-price-${index}`}>Prezzo di Acquisto (€) *</Label>
                    <Input
                      id={`inv-purchase-price-${index}`}
                      type="number"
                      value={investment.purchasePrice || ''}
                      onChange={(e) => {
                        const purchasePrice = parseFloat(e.target.value) || 0;
                        const quantity = investment.quantity || 0;
                        const updated = [...investmentConfig.existingInvestments];
                        updated[index] = {
                          ...updated[index],
                          purchasePrice: purchasePrice,
                          // Aggiorna automaticamente il valore totale basato su quantità x prezzo di acquisto
                          totalValue: quantity * purchasePrice,
                          currentValue: quantity * purchasePrice
                        };
                        setInvestmentConfig({
                          ...investmentConfig,
                          existingInvestments: updated,
                        });
                      }}
                      placeholder="100"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`inv-value-${index}`}>Totale Investito (€)</Label>
                    <Input
                      id={`inv-value-${index}`}
                      type="number"
                      value={investment.totalValue || investment.currentValue || ''}
                      onChange={(e) => {
                        const totalValue = parseFloat(e.target.value) || 0;
                        const updated = [...investmentConfig.existingInvestments];
                        updated[index] = { 
                          ...updated[index], 
                          currentValue: totalValue,
                          totalValue: totalValue
                        };
                        setInvestmentConfig({
                          ...investmentConfig,
                          existingInvestments: updated
                        });
                      }}
                      placeholder="Calcolato automaticamente"
                      disabled={investment.quantity && investment.purchasePrice}
                      className={investment.quantity && investment.purchasePrice ? 'bg-gray-100' : ''}
                    />
                    {investment.quantity && investment.purchasePrice && (
                      <p className="text-xs text-gray-500 mt-1">
                        Calcolato: {investment.quantity} × €{investment.purchasePrice} = €{(investment.quantity * investment.purchasePrice).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`inv-purchase-date-${index}`}>Data di Acquisto</Label>
                    <Input
                      id={`inv-purchase-date-${index}`}
                      type="date"
                      value={investment.purchaseDate || ''}
                      onChange={(e) => {
                        const updated = [...investmentConfig.existingInvestments];
                        updated[index] = { ...updated[index], purchaseDate: e.target.value };
                        setInvestmentConfig({
                          ...investmentConfig,
                          existingInvestments: updated
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`inv-type-${index}`}>Tipo</Label>
                    <div className="flex space-x-2">
                      <Select
                        value={investment.type}
                        onValueChange={(value) => {
                          const updated = [...investmentConfig.existingInvestments];
                          updated[index] = { ...updated[index], type: value };
                          setInvestmentConfig({
                            ...investmentConfig,
                            existingInvestments: updated
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="etf">ETF</SelectItem>
                          <SelectItem value="stocks">Azioni</SelectItem>
                          <SelectItem value="bonds">Obbligazioni</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                          <SelectItem value="real_estate">Immobiliare</SelectItem>
                          <SelectItem value="other">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = investmentConfig.existingInvestments.filter((_: any, i: number) => i !== index);
                          setInvestmentConfig({
                            ...investmentConfig,
                            existingInvestments: updated
                          });
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInvestmentConfig({
                    ...investmentConfig,
                    existingInvestments: [
                      ...investmentConfig.existingInvestments,
                      { 
                        name: '', 
                        symbol: '', 
                        currentValue: 0, 
                        totalValue: 0, 
                        quantity: 0, 
                        purchasePrice: 0, 
                        type: 'etf',
                        purchaseDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() // Data odierna come default
                      }
                    ]
                  });
                }}
                className="w-full"
              >
                + Aggiungi Manualmente
              </Button>
              <InvestmentSearchModal 
                onAddInvestment={(investment) => {
                  const newInvestment = {
                    name: investment.name,
                    symbol: investment.symbol,
                    currentValue: investment.currentValue || 0,
                    totalValue: investment.currentValue || 0,
                    quantity: investment.quantity || 1,
                    purchasePrice: investment.purchasePrice || investment.currentValue || 0, 
                    type: investment.type || 'stock'
                  };
                  setInvestmentConfig({
                    ...investmentConfig,
                    existingInvestments: [
                      ...investmentConfig.existingInvestments,
                      newInvestment
                    ]
                  });
                }}
              />
            </div>
          </div>

          {/* Obiettivo Portafoglio */}
          <div className="mt-6 pt-6 border-t">
            <h5 className="font-medium mb-3 flex items-center">
              Obiettivo Portafoglio Investimenti
              <span className="ml-2 text-red-500">*</span>
            </h5>
            <p className="text-sm text-gray-600 mb-3">
              Imposta l'obiettivo per il tuo portafoglio. Verrà automaticamente aggiunto alla sezione Obiettivi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="portfolio-target">Obiettivo Totale (€)</Label>
                <Input
                  id="portfolio-target"
                  type="number"
                  value={investmentConfig.portfolioGoal.targetAmount}
                  onChange={(e) => setInvestmentConfig({
                    ...investmentConfig,
                    portfolioGoal: {
                      ...investmentConfig.portfolioGoal,
                      targetAmount: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="portfolio-date">Data Obiettivo</Label>
                <Input
                  id="portfolio-date"
                  type="date"
                  value={investmentConfig.portfolioGoal.targetDate}
                  onChange={(e) => setInvestmentConfig({
                    ...investmentConfig,
                    portfolioGoal: {
                      ...investmentConfig.portfolioGoal,
                      targetDate: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="portfolio-monthly">Contributo Mensile (€)</Label>
                <Input
                  id="portfolio-monthly"
                  type="number"
                  value={investmentConfig.portfolioGoal.monthlyContribution}
                  onChange={(e) => setInvestmentConfig({
                    ...investmentConfig,
                    portfolioGoal: {
                      ...investmentConfig.portfolioGoal,
                      monthlyContribution: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Navigazione */}
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Indietro
        </Button>

        {!accountConfig.bankName && (
          <Button 
            variant="ghost" 
            onClick={onComplete ? onComplete : onNext}
            className="flex-1"
          >
            Salta per ora
          </Button>
        )}

        {onComplete ? (
          <Button 
            onClick={onComplete}
            className="flex-1"
            disabled={isCompleting || (() => {
              if (accountKey === 'investment' && investmentConfig) {
                const totalInvestments = investmentConfig.existingInvestments.reduce((sum: number, inv: any) => 
                  sum + (inv.totalValue || inv.currentValue || 0), 0
                );
                const accountBalance = accountConfig.balance || 0;
                const difference = Math.abs(totalInvestments - accountBalance);
                return difference > 1; // Non permette di procedere se la differenza è maggiore di 1€
              }
              return false;
            })()}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completa Configurazione
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={onNext} 
            className="flex-1"
            disabled={
              (!accountConfig.bankName && accountKey === 'income') ||
              (accountKey === 'investment' && (!investmentConfig || 
                investmentConfig.existingInvestments.length === 0 ||
                !investmentConfig.portfolioGoal.targetAmount ||
                !investmentConfig.portfolioGoal.targetDate ||
                (() => {
                  const totalInvestments = investmentConfig.existingInvestments.reduce((sum: number, inv: any) => 
                    sum + (inv.totalValue || inv.currentValue || 0), 0
                  );
                  const accountBalance = accountConfig.balance || 0;
                  const difference = Math.abs(totalInvestments - accountBalance);
                  return difference > 1; // Non permette di procedere se la differenza è maggiore di 1€
                })()
              ))
            }
          >
            Continua
          </Button>
        )}
      </div>

      {accountKey === 'income' && !accountConfig.bankName && (
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-700 text-sm">
            Il Conto di Ingresso è obbligatorio - è dove arriva il tuo stipendio
          </p>
        </div>
      )}

      {accountKey === 'investment' && investmentConfig && (
        <>
          {investmentConfig.existingInvestments.length === 0 && (
            <div className="text-center p-3 bg-orange-50 rounded-lg mb-2">
              <p className="text-orange-700 text-sm">
                Devi aggiungere almeno un investimento per procedere.
              </p>
            </div>
          )}
          {(!investmentConfig.portfolioGoal.targetAmount || !investmentConfig.portfolioGoal.targetDate) && (
            <div className="text-center p-3 bg-red-50 rounded-lg mb-2">
              <p className="text-red-700 text-sm">
                L'obiettivo portafoglio (importo e data) è obbligatorio per procedere.
              </p>
            </div>
          )}
          {(() => {
            const totalInvestments = investmentConfig.existingInvestments.reduce((sum: number, inv: any) => 
              sum + (inv.totalValue || inv.currentValue || 0), 0
            );
            const accountBalance = accountConfig.balance || 0;
            const difference = Math.abs(totalInvestments - accountBalance);

            if (difference > 1 && totalInvestments > 0 && accountBalance > 0) {
              return (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">
                    I saldi non corrispondono! Correggi prima di procedere.
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Il saldo del conto (€{accountBalance}) deve corrispondere al totale degli investimenti (€{totalInvestments}).                  </p>
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
}

function PatrimonyDashboard({ 
  architecture, 
  distributionPlan,
  resetArchitectureMutation,
  transferForm,
  setTransferForm,
  isTransferOpen,
  setIsTransferOpen,
  transferMutation,
  handleTransferSubmit,
  setForceSetup
}: { 
  architecture: AccountArchitecture;
  distributionPlan?: DistributionPlan;
  resetArchitectureMutation: any;
  transferForm: any;
  setTransferForm: any;
  isTransferOpen: boolean;
  setIsTransferOpen: any;
  transferMutation: any;
  handleTransferSubmit: any;
  setForceSetup: (value: boolean) => void;
}) {
  const totalWealth = Object.values(architecture.accounts || {}).reduce((sum, account) => sum + (account?.balance || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Building2 className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Architettura dei Conti Intelligente</h1>
                <p className="mt-1 text-blue-100">
                  Il Sistema Operativo Finanziario - Trasforma il tuo flusso di denaro in canali intelligenti
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Trasferisci Fondi
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <ArrowLeftRight className="w-5 h-5 text-blue-500" />
                      <span>Trasferimento tra Conti</span>
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleTransferSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fromAccount">Da Conto</Label>
                      <Select 
                        value={transferForm.fromAccount} 
                        onValueChange={(value) => setTransferForm((prev: any) => ({ ...prev, fromAccount: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona conto di origine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Conto di Ingresso/Smistamento</SelectItem>
                          <SelectItem value="wealth">Conto Pila (Wealth Account)</SelectItem>
                          <SelectItem value="operating">Conto Circolante</SelectItem>
                          <SelectItem value="emergency">Conto Emergenze/Sicurezza</SelectItem>
                          <SelectItem value="investment">Conto Investimenti/Libertà</SelectItem>
                          <SelectItem value="savings">Conto Accantonamenti/Tasse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="toAccount">A Conto</Label>
                      <Select 
                        value={transferForm.toAccount} 
                        onValueChange={(value) => setTransferForm((prev: any) => ({ ...prev, toAccount: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona conto di destinazione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Conto di Ingresso/Smistamento</SelectItem>
                          <SelectItem value="wealth">Conto Pila (Wealth Account)</SelectItem>
                          <SelectItem value="operating">Conto Circolante</SelectItem>
                          <SelectItem value="emergency">Conto Emergenze/Sicurezza</SelectItem>
                          <SelectItem value="investment">Conto Investimenti/Libertà</SelectItem>
                          <SelectItem value="savings">Conto Accantonamenti/Tasse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Importo (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm((prev: any) => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrizione (opzionale)</Label>
                      <Textarea
                        id="description"
                        value={transferForm.description}
                        onChange={(e) => setTransferForm((prev: any) => ({ ...prev, description: e.target.value }))}
                        placeholder="Motivo del trasferimento..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsTransferOpen(false)}
                      >
                        Annulla
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={transferMutation.isPending}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {transferMutation.isPending ? 'Trasferimento...' : 'Trasferisci'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => {
                  if (confirm('Vuoi riconfigurare completamente l\'architettura dei conti? Dovrai impostare di nuovo tutti i 6 conti.')) {
                    resetArchitectureMutation.mutate();
                  }
                }}
                disabled={resetArchitectureMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {resetArchitectureMutation.isPending ? 'Resettando...' : 'Riconfigura'}
              </Button>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Badge variant="secondary" className="bg-blue-800 text-blue-100">
              <BookOpen className="h-4 w-4 mr-1" />
              Modulo 6
            </Badge>
            <Badge variant="secondary" className="bg-purple-800 text-purple-100">
              6 Conti Standard
            </Badge>
            <Badge variant="secondary" className="bg-green-800 text-green-100">
              <CheckCircle className="h-4 w-4 mr-1" />
              Configurato
            </Badge>
          </div>
        </div>
      </div>

        <div className="space-y-6">
            {/* Avviso Conti Mancanti o Configurazione Completa */}
            {(() => {
              const missingAccounts = Object.entries(architecture.accounts || {})
                .filter(([key, account]) => !account?.iban || account?.iban === '')
                .map(([key]) => key);

              if (missingAccounts.length > 0) {
                return (
                  <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-800 mb-2">
                          Configurazione Incompleta
                        </h3>
                        <p className="text-orange-700 text-sm mb-3">
                          Hai {missingAccounts.length} {missingAccounts.length === 1 ? 'conto' : 'conti'} che {missingAccounts.length === 1 ? 'richiede' : 'richiedono'} ancora la configurazione completa.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {missingAccounts.map(accountKey => {
                            const account = architecture.accounts[accountKey as keyof typeof architecture.accounts];
                            return (
                              <Badge key={accountKey} variant="outline" className="border-orange-300 text-orange-700">
                                {account?.name || accountKey}
                              </Badge>
                            );
                          })}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => {
                            if (confirm('Vuoi configurare ora i conti mancanti? Verrai reindirizzato al setup guidato.')) {
                              setForceSetup(true);
                            }
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configura Conti Mancanti
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              } else {
                // Tutti i conti sono configurati
                return (
                  <Card className="p-4 border-l-4 border-l-green-500 bg-green-50">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800 mb-2">
                          Ottimo! Hai configurato tutto
                        </h3>
                        <p className="text-green-700 text-sm mb-3">
                          Tutti i tuoi 6 conti standard sono stati configurati correttamente con i dettagli bancari.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-green-600 text-green-700 hover:bg-green-100"
                          onClick={() => {
                            setForceSetup(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Modifica Configurazione
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              }
            })()}

            {/* Patrimonio Totale */}
            <Card className="text-center p-6">
              <h2 className="text-2xl font-bold mb-2">Dashboard Patrimonio</h2>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                €{totalWealth.toLocaleString()}
              </div>
              <p className="text-gray-600">Patrimonio Totale</p>
            </Card>

            {/* Conti Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(architecture.accounts || {}).map(([key, account]) => {
                const Icon = accountIcons[key as keyof typeof accountIcons];
                const colorClass = accountColors[key as keyof typeof accountColors];
                const isIncomplete = !account?.iban || account?.iban === '';

                return (
                  <Card key={key} className={`p-4 relative ${isIncomplete ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                    {isIncomplete && (
                      <div className="absolute top-2 right-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </div>
                    )}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-full ${colorClass} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{account?.name || 'Account'}</h3>
                        {isIncomplete && (
                          <p className="text-xs text-orange-600">Configurazione incompleta</p>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      €{(account?.balance || 0).toLocaleString()}
                    </div>
                    {isIncomplete && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-3 border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => {
                          // Naviga alla tab di gestione conti
                          const tabsList = document.querySelector('[role="tablist"]');
                          const accountsTab = Array.from(tabsList?.querySelectorAll('[role="tab"]') || [])
                            .find(tab => tab.textContent?.includes('Gestione Conti'));
                          if (accountsTab) {
                            (accountsTab as HTMLElement).click();
                          }
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configura
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Flusso di Distribuzione */}
            {distributionPlan && distributionPlan.totalIncome && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Flusso di Distribuzione Mensile</h3>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600">
                    €{distributionPlan.totalIncome.toLocaleString()}
                  </div>
                  <p className="text-gray-600">Reddito Mensile</p>
                  <ArrowRight className="h-6 w-6 mx-auto mt-2 text-gray-400" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      €{(distributionPlan.distributions?.operating || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Operating</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      €{(distributionPlan.distributions?.emergency || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Emergency</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      €{(distributionPlan.distributions?.investment || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Investment</p>
                  </div>
                </div>
              </Card>
            )}
        </div>
    </div>
  );
}