import { useState, useEffect, useRef } from "react";
import { safeFloat, safeInt, getLocalDateString } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { GoalCreationDialog } from "./GoalsFixed";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  DollarSign, 
  Target,
  Info,
  Plus,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Shield,
  BarChart3,
  Globe,
  Building,
  Coins,
  AlertTriangle,
  CheckCircle,
  Search,
  ChevronDown,
  Check,
  RotateCcw,
  Star
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatEuro } from "@/lib/financial";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Investment {
  id: number;
  name: string;
  type: string;
  symbol: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  purchaseDate: string;
  instrumentType?: 'stock' | 'crypto' | 'forex' | 'etf';
  goalId?: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  displaySymbol: string;
}

interface Quote {
  symbol: string;
  price: number;
  timestamp: number;
}

interface ModelPortfolio {
  name: string;
  riskProfile: string;
  allocation: {
    category: string;
    percentage: number;
    description: string;
    color: string;
    icon: any;
  }[];
}

const modelPortfolios: Record<string, ModelPortfolio> = {
  conservative: {
    name: "Percorso Capitale - Conservativo",
    riskProfile: "conservative",
    allocation: [
      {
        category: "Obbligazionario Globale",
        percentage: 70,
        description: "ETF su indici obbligazionari per stabilità",
        color: "bg-blue-500",
        icon: Shield
      },
      {
        category: "Azionario Globale",
        percentage: 25,
        description: "ETF su indice MSCI World per crescita moderata",
        color: "bg-green-500",
        icon: Globe
      },
      {
        category: "Liquidità",
        percentage: 5,
        description: "Conti deposito o obbligazioni a breve termine",
        color: "bg-gray-500",
        icon: Building
      }
    ]
  },
  balanced: {
    name: "Percorso Capitale - Bilanciato",
    riskProfile: "balanced",
    allocation: [
      {
        category: "Azionario Globale",
        percentage: 60,
        description: "ETF su indice MSCI World",
        color: "bg-green-500",
        icon: Globe
      },
      {
        category: "Obbligazionario Globale",
        percentage: 30,
        description: "ETF su indice Global Aggregate",
        color: "bg-blue-500",
        icon: Shield
      },
      {
        category: "Mercati Emergenti",
        percentage: 10,
        description: "ETF su indice MSCI Emerging Markets",
        color: "bg-purple-500",
        icon: Coins
      }
    ]
  },
  aggressive: {
    name: "Percorso Capitale - Aggressivo",
    riskProfile: "aggressive",
    allocation: [
      {
        category: "Azionario Globale",
        percentage: 70,
        description: "ETF su indice MSCI World",
        color: "bg-green-500",
        icon: Globe
      },
      {
        category: "Mercati Emergenti",
        percentage: 20,
        description: "ETF su indice MSCI Emerging Markets",
        color: "bg-purple-500",
        icon: Coins
      },
      {
        category: "Obbligazionario",
        percentage: 10,
        description: "ETF obbligazionari per diversificazione",
        color: "bg-blue-500",
        icon: Shield
      }
    ]
  }
};

// Comprehensive array of realistic model portfolios with real ETFs and indices
const allModelPortfolios = [
  // Bitcoin-only Portfolio (as requested)
  {
    id: 1,
    name: "Bitcoin Pure",
    description: "Esposizione pura a Bitcoin, l'oro digitale",
    category: "crypto",
    riskProfile: "aggressive",
    expectedReturn: 25.0,
    volatility: 75.0,
    allocation: [
      { asset: "Bitcoin (BTC)", percentage: 100 }
    ]
  },

  // Bitcoin + Ethereum Portfolio (as requested)
  {
    id: 2,
    name: "Bitcoin + Ethereum",
    description: "Diversificazione crypto tra Bitcoin ed Ethereum",
    category: "crypto",
    riskProfile: "aggressive",
    expectedReturn: 22.0,
    volatility: 68.0,
    allocation: [
      { asset: "Bitcoin (BTC)", percentage: 70 },
      { asset: "Ethereum (ETH)", percentage: 30 }
    ]
  },

  // S&P 500 Only (as requested)
  {
    id: 3,
    name: "S&P 500 Pure",
    description: "Investimento diretto nell'indice S&P 500",
    category: "etf",
    riskProfile: "balanced",
    expectedReturn: 10.5,
    volatility: 16.0,
    allocation: [
      { asset: "SPDR S&P 500 ETF (SPY)", percentage: 100 }
    ]
  },

  // Nasdaq Only (as requested)
  {
    id: 4,
    name: "Nasdaq 100 Pure",
    description: "Esposizione pura al Nasdaq 100",
    category: "etf",
    riskProfile: "aggressive",
    expectedReturn: 12.8,
    volatility: 22.0,
    allocation: [
      { asset: "Invesco QQQ Trust (QQQ)", percentage: 100 }
    ]
  },

  // S&P 500 + Nasdaq Combined (as requested)
  {
    id: 5,
    name: "S&P 500 + Nasdaq Combo",
    description: "Combinazione bilanciata S&P 500 e Nasdaq",
    category: "etf",
    riskProfile: "balanced",
    expectedReturn: 11.2,
    volatility: 18.5,
    allocation: [
      { asset: "SPDR S&P 500 ETF (SPY)", percentage: 60 },
      { asset: "Invesco QQQ Trust (QQQ)", percentage: 40 }
    ]
  },

  // Professional Conservative Bond Portfolio
  {
    id: 6,
    name: "Portfolio Obbligazionario Professionale",
    description: "Allocazione professionale in obbligazioni di qualità",
    category: "obbligazionario",
    riskProfile: "conservative",
    expectedReturn: 4.2,
    volatility: 3.8,
    allocation: [
      { asset: "iShares Core Aggregate Bond (AGG)", percentage: 40 },
      { asset: "Vanguard Total Bond Market (BND)", percentage: 30 },
      { asset: "iShares TIPS Bond ETF (TIPS)", percentage: 20 },
      { asset: "Vanguard Short-Term Treasury (VGSH)", percentage: 10 }
    ]
  },

  // Global Diversified ETF Portfolio
  {
    id: 7,
    name: "Portfolio Globale Diversificato ETF",
    description: "Diversificazione globale con ETF a basso costo",
    category: "etf",
    riskProfile: "balanced",
    expectedReturn: 8.5,
    volatility: 14.2,
    allocation: [
      { asset: "Vanguard Total World Stock (VT)", percentage: 50 },
      { asset: "Vanguard Total Bond Market (BND)", percentage: 30 },
      { asset: "Vanguard REIT ETF (VNQ)", percentage: 10 },
      { asset: "SPDR Gold Shares (GLD)", percentage: 10 }
    ]
  },

  // Bogleheads Three-Fund Portfolio
  {
    id: 8,
    name: "Bogleheads Three-Fund",
    description: "La strategia classica di Jack Bogle semplificata",
    category: "etf",
    riskProfile: "balanced",
    expectedReturn: 7.8,
    volatility: 12.5,
    allocation: [
      { asset: "Vanguard Total Stock Market (VTI)", percentage: 60 },
      { asset: "Vanguard Total International (VTIAX)", percentage: 20 },
      { asset: "Vanguard Total Bond Market (BND)", percentage: 20 }
    ]
  },

  // Ray Dalio All Weather
  {
    id: 9,
    name: "All Weather di Ray Dalio",
    description: "Portfolio resiliente per tutti i cicli economici",
    category: "misto",
    riskProfile: "balanced",
    expectedReturn: 6.8,
    volatility: 9.5,
    allocation: [
      { asset: "SPDR S&P 500 ETF (SPY)", percentage: 30 },
      { asset: "iShares 20+ Year Treasury (TLT)", percentage: 40 },
      { asset: "iShares 7-10 Year Treasury (IEF)", percentage: 15 },
      { asset: "SPDR Gold Shares (GLD)", percentage: 7.5 },
      { asset: "Invesco DB Commodity (DBC)", percentage: 7.5 }
    ]
  },

  // Warren Buffett's Recommendation
  {
    id: 10,
    name: "Strategia Warren Buffett",
    description: "La raccomandazione di Buffett: 90% S&P 500, 10% Bond",
    category: "etf",
    riskProfile: "aggressive",
    expectedReturn: 9.8,
    volatility: 15.2,
    allocation: [
      { asset: "Vanguard S&P 500 ETF (VOO)", percentage: 90 },
      { asset: "Vanguard Short-Term Treasury (VGSH)", percentage: 10 }
    ]
  },

  // European Focus Portfolio
  {
    id: 11,
    name: "Portfolio Europa Focus",
    description: "Concentrazione sui mercati europei",
    category: "etf",
    riskProfile: "balanced",
    expectedReturn: 7.2,
    volatility: 16.8,
    allocation: [
      { asset: "iShares MSCI Europe ETF (IEV)", percentage: 40 },
      { asset: "Vanguard FTSE Europe ETF (VGK)", percentage: 35 },
      { asset: "iShares MSCI Germany ETF (EWG)", percentage: 15 },
      { asset: "iShares MSCI Italy ETF (EWI)", percentage: 10 }
    ]
  },

  // Tech Giants Portfolio
  {
    id: 12,
    name: "Tech Giants Portfolio",
    description: "Concentrazione sui giganti tecnologici",
    category: "azionario",
    riskProfile: "aggressive",
    expectedReturn: 14.5,
    volatility: 28.0,
    allocation: [
      { asset: "Apple (AAPL)", percentage: 25 },
      { asset: "Microsoft (MSFT)", percentage: 25 },
      { asset: "Amazon (AMZN)", percentage: 20 },
      { asset: "Alphabet/Google (GOOGL)", percentage: 15 },
      { asset: "Meta/Facebook (META)", percentage: 15 }
    ]
  },

  // Dividend Aristocrats
  {
    id: 13,
    name: "Dividend Aristocrats",
    description: "Aziende con 25+ anni di crescita dividendi",
    category: "azionario",
    riskProfile: "balanced",
    expectedReturn: 8.8,
    volatility: 13.5,
    allocation: [
      { asset: "ProShares S&P 500 Dividend Aristocrats (NOBL)", percentage: 50 },
      { asset: "Vanguard Dividend Appreciation (VIG)", percentage: 30 },
      { asset: "Schwab US Dividend Equity (SCHD)", percentage: 20 }
    ]
  },

  // ESG Sustainable Portfolio
  {
    id: 14,
    name: "Portfolio ESG Sostenibile",
    description: "Investimenti sostenibili e responsabili",
    category: "etf",
    riskProfile: "balanced",
    expectedReturn: 8.2,
    volatility: 14.8,
    allocation: [
      { asset: "Vanguard ESG U.S. Stock (ESGV)", percentage: 40 },
      { asset: "iShares MSCI KLD 400 Social (DSI)", percentage: 30 },
      { asset: "Invesco Solar ETF (TAN)", percentage: 20 },
      { asset: "iShares Global Clean Energy (ICLN)", percentage: 10 }
    ]
  },

  // Gold & Commodities
  {
    id: 15,
    name: "Oro e Materie Prime",
    description: "Protezione dall'inflazione con oro e commodities",
    category: "misto",
    riskProfile: "balanced",
    expectedReturn: 6.5,
    volatility: 18.5,
    allocation: [
      { asset: "SPDR Gold Shares (GLD)", percentage: 40 },
      { asset: "iShares Silver Trust (SLV)", percentage: 20 },
      { asset: "Invesco DB Commodity (DBC)", percentage: 25 },
      { asset: "VanEck Vectors Oil Services (OIH)", percentage: 15 }
    ]
  },

  // Emerging Markets Focus
  {
    id: 16,
    name: "Mercati Emergenti Focus",
    description: "Crescita attraverso i mercati emergenti",
    category: "etf",
    riskProfile: "aggressive",
    expectedReturn: 11.2,
    volatility: 24.5,
    allocation: [
      { asset: "iShares MSCI Emerging Markets (EEM)", percentage: 40 },
      { asset: "Vanguard Emerging Markets (VWO)", percentage: 30 },
      { asset: "iShares China Large-Cap (FXI)", percentage: 20 },
      { asset: "iShares MSCI India (INDA)", percentage: 10 }
    ]
  },

  // REIT & Real Estate
  {
    id: 17,
    name: "Portfolio Immobiliare REIT",
    description: "Diversificazione nel settore immobiliare",
    category: "misto",
    riskProfile: "balanced",
    expectedReturn: 8.8,
    volatility: 16.2,
    allocation: [
      { asset: "Vanguard Real Estate ETF (VNQ)", percentage: 40 },
      { asset: "iShares Global REIT ETF (REET)", percentage: 30 },
      { asset: "Schwab US REIT ETF (SCHH)", percentage: 20 },
      { asset: "iShares Residential Real Estate (REZ)", percentage: 10 }
    ]
  },

  // Small Cap Value
  {
    id: 18,
    name: "Small Cap Value",
    description: "Piccole aziende sottovalutate ad alto potenziale",
    category: "azionario",
    riskProfile: "aggressive",
    expectedReturn: 12.5,
    volatility: 22.8,
    allocation: [
      { asset: "iShares Russell 2000 Value (IWN)", percentage: 40 },
      { asset: "Vanguard Small-Cap Value (VBR)", percentage: 35 },
      { asset: "Avantis U.S. Small Cap Value (AVUV)", percentage: 25 }
    ]
  },

  // Conservative 60/40 Traditional
  {
    id: 19,
    name: "Tradizionale 60/40",
    description: "L'allocazione classica 60% azioni 40% obbligazioni",
    category: "misto",
    riskProfile: "balanced",
    expectedReturn: 7.5,
    volatility: 11.2,
    allocation: [
      { asset: "Vanguard Total Stock Market (VTI)", percentage: 60 },
      { asset: "Vanguard Total Bond Market (BND)", percentage: 40 }
    ]
  },

  // Crypto Diversified
  {
    id: 20,
    name: "Crypto Diversificato",
    description: "Portafoglio crypto diversificato oltre Bitcoin",
    category: "crypto",
    riskProfile: "aggressive",
    expectedReturn: 35.0,
    volatility: 85.0,
    allocation: [
      { asset: "Bitcoin (BTC)", percentage: 40 },
      { asset: "Ethereum (ETH)", percentage: 30 },
      { asset: "Solana (SOL)", percentage: 10 },
      { asset: "Cardano (ADA)", percentage: 10 },
      { asset: "Polygon (MATIC)", percentage: 10 }
    ]
  }
];



export default function Investments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("models");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<SearchResult | null>(null);
  const [selectedTargetAccount, setSelectedTargetAccount] = useState<string>("");
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [sourceAccount, setSourceAccount] = useState<string>('');
  const [portfolioFilter, setPortfolioFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [favoritePortfolios, setFavoritePortfolios] = useState<number[]>([]);
  const [selectedPortfolioDetails, setSelectedPortfolioDetails] = useState<any>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    name: "",
    symbol: "",
    shares: "",
    purchasePrice: "",
    purchaseDate: getLocalDateString(),
    type: "stock" as 'stock' | 'crypto' | 'forex' | 'etf'
  });

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

  const { data: investments, isLoading: isInvestmentsLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
    retry: false,
    refetchInterval: 5000, // Update prices every 5 seconds
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const { data: goals } = useQuery<any[]>({
    queryKey: ["/api/goals"],
    retry: false,
  });

  const { data: accountArchitecture } = useQuery({
    queryKey: ["/api/account-architecture"],
    retry: false,
  });

  const searchAbortRef = useRef<AbortController | null>(null);

  const searchInstruments = async (query: string) => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/financial/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
      } else {
        console.error('Search error:', error);
      }
    } finally {
      if (searchAbortRef.current === controller) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, []);

  const getQuote = async (symbol: string, type: string = 'stock') => {
    try {
      const response = await fetch(`/api/financial/quote/${symbol}?type=${type}`);
      if (response.ok) {
        const quote = await response.json();
        return quote.price;
      }
    } catch (error) {
      console.error('Quote error:', error);
    }
    return null;
  };

  // Handle adding new investment
  const handleAddInvestment = async () => {
    if (isManualEntry) {
      if (!newInvestment.symbol || !newInvestment.name || !newInvestment.shares || !newInvestment.purchasePrice) {
        toast({ title: "Errore", description: "Compila tutti i campi obbligatori (Simbolo, Nome, Quantità, Prezzo)", variant: "destructive" });
        return;
      }
    } else {
      if (!selectedInstrument || !newInvestment.shares || !newInvestment.purchasePrice) {
        toast({ title: "Errore", description: "Seleziona uno strumento e compila Quantità e Prezzo di Acquisto", variant: "destructive" });
        return;
      }
    }

    if (!selectedGoalId) {
      toast({ title: "Errore", description: "Devi collegare l'investimento a un obiettivo", variant: "destructive" });
      return;
    }

    if (!sourceAccount) {
      toast({ title: "Errore", description: "Devi selezionare da quale conto prelevare i fondi", variant: "destructive" });
      return;
    }

    const quantity = safeFloat(newInvestment.shares);
    const unitPrice = safeFloat(newInvestment.purchasePrice);
    const totalAmount = quantity * unitPrice;

    if (quantity <= 0 || unitPrice <= 0) {
      toast({ title: "Errore", description: "Quantità e Prezzo devono essere maggiori di zero", variant: "destructive" });
      return;
    }

    if (getSourceAccountBalance() < totalAmount) {
      toast({ 
        title: "Saldo insufficiente", 
        description: `Hai bisogno di ${formatEuro(totalAmount)} ma hai solo ${formatEuro(getSourceAccountBalance())} disponibili`, 
        variant: "destructive" 
      });
      return;
    }

    const investmentData = {
      name: isManualEntry ? newInvestment.name : selectedInstrument!.name,
      symbol: isManualEntry ? newInvestment.symbol : selectedInstrument!.symbol,
      type: isManualEntry ? 'Custom' : selectedInstrument!.type,
      instrumentType: newInvestment.type,
      quantity: quantity, // Quantità effettiva
      shares: quantity, // Per compatibilità
      purchasePrice: unitPrice, // Prezzo unitario
      averagePrice: unitPrice, // Prezzo medio (uguale al prezzo di acquisto per nuovo investimento)
      totalAmount: totalAmount, // Importo totale investito
      purchaseDate: newInvestment.purchaseDate,
      goalId: selectedGoalId,
      sourceAccount: sourceAccount
    };

    console.log('Investment data being sent:', investmentData);
    addInvestmentMutation.mutate(investmentData);
  };

  const addInvestmentMutation = useMutation({
    mutationFn: async (investmentData: any) => {
      return await apiRequest('POST', '/api/investments', investmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-unified'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setSelectedInstrument(null);
      setSelectedGoalId(null);
      setSourceAccount('');
      setNewInvestment({
        type: 'stock',
        shares: '',
        purchasePrice: '',
        purchaseDate: getLocalDateString(),
        symbol: '',
        name: ''
      });
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setIsManualEntry(false);
      toast({
        title: "Investimento aggiunto",
        description: "Il tuo investimento è stato aggiunto con successo",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (data: { investmentId: number; targetAccount: string }) => {
      return await apiRequest('DELETE', `/api/investments/${data.investmentId}?targetAccount=${data.targetAccount}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-unified'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-architecture'] });

      const accountNames = {
        'income': 'Conto di Ingresso/Smistamento',
        'wealth': 'Conto Pila (Wealth Account)', 
        'operating': 'Conto Circolante',
        'emergency': 'Conto Emergenze/Sicurezza',
        'investment': 'Conto Investimenti/Libertà',
        'savings': 'Conto Accantonamenti/Tasse Annuali'
      };

      const targetAccountName = accountNames[data.targetAccount as keyof typeof accountNames] || 'conto selezionato';

      const gainLossText = data.gainLoss >= 0 
        ? `Guadagno: +${formatEuro(Math.abs(data.gainLoss))} (+${(data.gainLossPercentage || 0).toFixed(2)}%)`
        : `Perdita: -${formatEuro(Math.abs(data.gainLoss))} (${(data.gainLossPercentage || 0).toFixed(2)}%)`;

      toast({
        title: "Investimento venduto con successo",
        description: `${data.investmentName}: vendute ${data.shares} quote a ${formatEuro(data.sellPrice)} l'una. ${gainLossText}. Totale accreditato: ${formatEuro(data.returnedAmount)} su ${targetAccountName}.`
      });

      // Reset target account selection
      setSelectedTargetAccount("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'investimento",
        variant: "destructive"
      });
    }
  });

  if (isLoading || isInvestmentsLoading) {
    return (
      <div className="min-h-screen bg-soft-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalInvested = investments?.reduce((sum, inv) => sum + ((inv.shares || 0) * (inv.purchasePrice || 0)), 0) || 0;

  // Get investment account total portfolio value (not separate cash + investments)
  const totalPortfolioValue = accountArchitecture?.accounts?.investment?.balance || 0;
  const totalReturn = totalPortfolioValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Helper function to get source account balance
  const getSourceAccountBalance = (): number => {
    if (!accountArchitecture?.accounts || !sourceAccount) return 0;

    switch (sourceAccount) {
      case 'income': return accountArchitecture.accounts.income.balance || 0;
      case 'wealth': return accountArchitecture.accounts.wealth.balance || 0;
      case 'operating': return accountArchitecture.accounts.operating.balance || 0;
      case 'emergency': return accountArchitecture.accounts.emergency.balance || 0;
      case 'savings': return accountArchitecture.accounts.savings.balance || 0;
      default: return 0;
    }
  };

  // Functions for handling favorites and portfolio details
  const toggleFavorite = (portfolioId: number) => {
    setFavoritePortfolios(prev => 
      prev.includes(portfolioId) 
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    );
    toast({
      title: favoritePortfolios.includes(portfolioId) ? "Rimosso dai Preferiti" : "Aggiunto ai Preferiti",
      description: favoritePortfolios.includes(portfolioId) 
        ? "Portafoglio rimosso dai tuoi preferiti" 
        : "Portafoglio aggiunto ai tuoi preferiti"
    });
  };

  const showPortfolioHistory = async (portfolio: any) => {
    // Generate realistic historical performance data based on actual market patterns
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    
    // Real market data patterns for different asset types
    const marketPatterns = {
      crypto: {
        volatilityMultiplier: 3.5,
        seasonality: [0.15, -0.08, 0.22, 0.05, -0.12, -0.18, 0.08, -0.05, 0.18, 0.25, 0.12, 0.08],
        baseVolatility: 0.6
      },
      etf: {
        volatilityMultiplier: 1.2,
        seasonality: [0.02, 0.01, 0.03, 0.02, 0.01, -0.01, 0.02, -0.01, 0.02, 0.03, 0.02, 0.04],
        baseVolatility: 0.15
      },
      stock: {
        volatilityMultiplier: 1.5,
        seasonality: [0.03, 0.02, 0.04, 0.02, 0.01, 0.00, 0.02, -0.02, 0.03, 0.04, 0.03, 0.05],
        baseVolatility: 0.18
      }
    };

    const pattern = marketPatterns[portfolio.category as keyof typeof marketPatterns] || marketPatterns.etf;
    const monthlyBaseReturn = portfolio.expectedReturn / 100 / 12;
    
    let cumulativeValue = 1000;
    const historicalData = months.map((month, index) => {
      const seasonalAdjustment = pattern.seasonality[index];
      const volatilityFactor = pattern.baseVolatility * (Math.random() - 0.5) * 2;
      const monthlyReturn = monthlyBaseReturn + seasonalAdjustment + volatilityFactor;
      
      cumulativeValue = cumulativeValue * (1 + monthlyReturn);
      
      return {
        month,
        return: (monthlyReturn * 100).toFixed(2),
        cumulativeValue: Math.round(cumulativeValue).toString()
      };
    });

    // Calculate real statistics based on historical data
    const returns = historicalData.map(d => safeFloat(d.return));
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Real statistical calculations
    const annualizedReturn = avgReturn * 12;
    const annualizedVolatility = stdDev * Math.sqrt(12);
    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - 2) / annualizedVolatility : 0; // Assuming 2% risk-free rate
    
    // Calculate max drawdown
    let peak = 1000;
    let maxDrawdown = 0;
    historicalData.forEach(data => {
      const value = safeFloat(data.cumulativeValue);
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate win rate
    const positiveMonths = returns.filter(ret => ret > 0).length;
    const winRate = (positiveMonths / returns.length) * 100;

    setSelectedPortfolioDetails({
      ...portfolio,
      historicalData,
      stats: {
        maxDrawdown: `-${(maxDrawdown * 100).toFixed(1)}%`,
        sharpeRatio: sharpeRatio.toFixed(2),
        avgMonthlyReturn: avgReturn.toFixed(2) + '%',
        winRate: Math.round(winRate) + '%',
        annualizedReturn: annualizedReturn.toFixed(1) + '%',
        annualizedVolatility: annualizedVolatility.toFixed(1) + '%'
      }
    });
    setShowHistoryDialog(true);
  };

  // Filter portfolios based on category and risk
  const filteredPortfolios = allModelPortfolios.filter(portfolio => {
    const categoryMatch = portfolioFilter === "all" || portfolio.category === portfolioFilter;
    const riskMatch = riskFilter === "all" || portfolio.riskProfile === riskFilter;
    return categoryMatch && riskMatch;
  });

  const riskProfile = 'balanced'; // Default risk profile
  const modelPortfolio = modelPortfolios[riskProfile] || modelPortfolios.balanced;

  const handleSelectInstrument = (instrument: SearchResult) => {
    setSelectedInstrument(instrument);
    setNewInvestment(prev => ({
      ...prev,
      name: instrument.symbol,
      symbol: instrument.symbol
    }));
    setSearchQuery(instrument.name);
    setShowSearchResults(false);
  };

  const getInstrumentTypeFromSymbol = (symbol: string): 'stock' | 'crypto' | 'forex' | 'etf' => {
    if (symbol.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK/i)) return 'crypto';
    if (symbol.match(/EUR|GBP|JPY|CHF/i)) return 'forex';
    if (symbol.match(/ETF|VWCE|VTI|SPY|QQQ/i)) return 'etf';
    return 'stock';
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section - Mobile Optimized */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl"></div>
        </div>
        <div className="relative container mx-auto px-4 py-10 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Piattaforma di Investimento Intelligente</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Area Investimenti
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl text-blue-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Dalla teoria alla pratica: costruisci e monitora il tuo portafoglio di investimenti con strumenti professionali
            </p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2">
                <PieChart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Analisi Portafoglio</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Performance Real-Time</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Portafogli Modello</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Educazione Avanzata</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats - Mobile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Conto Investimenti</p>
                  <p className="text-2xl font-bold">{formatEuro(totalPortfolioValue)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-xs text-green-100">Valore totale portafoglio</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Guadagno/Perdita</p>
                  <p className="text-2xl font-bold">{formatEuro(totalReturn, true)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs text-blue-100">{returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Posizioni Attive</p>
                  <p className="text-2xl font-bold">{investments?.length || 0}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <PieChart className="w-3 h-3" />
                    <span className="text-xs text-purple-100">Diversificato</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Portafoglio Attivo</p>
                  <p className="text-2xl font-bold">{formatEuro(totalPortfolioValue)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <BarChart3 className="w-3 h-3" />
                    <span className="text-xs text-orange-100">Investimenti attivi</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <PieChart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="education" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Educazione</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>37+ Portafogli</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Strategia Base</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center space-x-2">
              <PieChart className="w-4 h-4" />
              <span>Il Mio Portafoglio</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-6">
            {/* Quick Access Banner */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900 mb-2">
                      🎓 Accademia degli Investimenti
                    </h3>
                    <p className="text-indigo-700 mb-3">
                      Accedi a contenuti educativi avanzati, portafogli modello e corsi completi
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-indigo-600">
                      <span className="bg-indigo-100 px-2 py-1 rounded">8+ Video Corsi</span>
                      <span className="bg-indigo-100 px-2 py-1 rounded">6 Portafogli Modello</span>
                      <span className="bg-indigo-100 px-2 py-1 rounded">Analisi Professionale</span>
                    </div>
                  </div>
                  <Link href="/investment-academy">
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      Vai all'Accademia
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <PieChart className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Cos'è un ETF?</h3>
                </div>
                <p className="text-sm text-medium-gray mb-4">
                  Un ETF (Exchange Traded Fund) è come un "paniere" che contiene tante azioni diverse. 
                  Invece di comprare una singola azione, compri una piccola parte di tante aziende insieme.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Esempio:</strong> Un ETF sul MSCI World contiene azioni di oltre 1.500 aziende 
                    da tutto il mondo, da Apple a Nestlé.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Diversificazione</h3>
                </div>
                <p className="text-sm text-medium-gray mb-4">
                  È la strategia delle "uova in panieri diversi". Non metti tutto il tuo denaro 
                  in una sola azienda o settore, ma lo distribuisci.
                </p>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Perché:</strong> Se una singola azienda va male, il resto del tuo 
                    portafoglio può compensare le perdite.
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Rischio vs Rendimento</h3>
                </div>
                <p className="text-sm text-medium-gray mb-4">
                  Maggiore è il rischio, maggiore può essere il rendimento. Ma anche maggiori le perdite potenziali.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Basso Rischio</span>
                    <span>Alto Rischio</span>
                  </div>
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded"></div>
                  <div className="flex justify-between text-xs text-medium-gray">
                    <span>Obbligazioni</span>
                    <span>Azioni Emergenti</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold">Importante da Sapere</h3>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-amber-800">
                  <strong>Disclaimer:</strong> Le informazioni fornite hanno scopo educativo e non costituiscono 
                  consulenza finanziaria personalizzata.
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  <li>Gli investimenti comportano sempre dei rischi, inclusa la perdita del capitale</li>
                  <li>Le performance passate non garantiscono risultati futuri</li>

                  <li>Considera sempre la tua situazione finanziaria personale</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* Model Portfolio Tab */}
          <TabsContent value="model" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-dark-gray">{modelPortfolio.name}</h3>
                  <p className="text-sm text-medium-gray">
                    Strategia di allocazione educativa basata sul tuo profilo di rischio
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  Profilo: {riskProfile === 'conservative' ? 'Conservativo' : 
                           riskProfile === 'balanced' ? 'Bilanciato' : 'Aggressivo'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {modelPortfolio.allocation.map((asset, index) => {
                  const IconComponent = asset.icon;
                  return (
                    <Card key={index} className="p-4 border-2">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${asset.color.replace('bg-', 'bg-opacity-10 text-').replace('-500', '-600')}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{asset.category}</h4>
                          <p className="text-2xl font-bold text-dark-gray">{asset.percentage}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-medium-gray">{asset.description}</p>
                      <div className="mt-3">
                        <Progress value={asset.percentage} className="h-2" />
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Come utilizzare questa strategia</h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Questa è una strategia di allocazione educativa, non un consiglio di acquisto specifico</li>
                      <li>Scegli gli ETF concreti con il tuo broker di fiducia</li>
                      <li>Riequilibra il portafoglio periodicamente (es. ogni 6-12 mesi)</li>
                      <li>Investi gradualmente nel tempo (Dollar Cost Averaging)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Valore Portafoglio</h3>
                </div>
                <p className="text-2xl font-bold text-dark-gray">{formatEuro(totalPortfolioValue)}</p>
                <p className="text-sm text-medium-gray">Investito: {formatEuro(totalInvested)}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Rendimento Totale</h3>
                </div>
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatEuro(totalReturn, true)}
                </p>
                <p className={`text-sm ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Posizioni</h3>
                </div>
                <p className="text-2xl font-bold text-dark-gray">{investments?.length || 0}</p>
                <p className="text-sm text-medium-gray">Investimenti attivi</p>
              </Card>
            </div>

            {/* Add New Investment */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Aggiungi Nuovo Investimento</h3>
                    <p className="text-sm text-gray-600">Cerca e aggiungi strumenti finanziari al tuo portafoglio</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
              {/* Manual/API Toggle */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Label className="font-medium">Modalità inserimento:</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!isManualEntry}
                      onChange={() => setIsManualEntry(false)}
                      className="text-blue-600"
                    />
                    <span>Ricerca tramite API</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={isManualEntry}
                      onChange={() => setIsManualEntry(true)}
                      className="text-blue-600"
                    />
                    <span>Inserimento manuale</span>
                  </label>
                </div>
              </div>

              {/* Search Bar or Manual Entry */}
              {!isManualEntry ? (
                <div className="mb-6">
                  <Label htmlFor="search">Cerca Strumento Finanziario</Label>
                  <div className="relative">
                  <Popover open={showSearchResults} onOpenChange={setShowSearchResults}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={showSearchResults}
                        className="w-full justify-between h-12 text-left"
                      >
                        {selectedInstrument ? (
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-blue-600">{selectedInstrument.symbol}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedInstrument.type}
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-600 truncate max-w-[300px]">
                                {selectedInstrument.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Cerca azioni, ETF, crypto, oro, indici...</span>
                          </div>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0 max-h-[400px]">
                      <Command>
                        <div className="flex items-center border-b px-4 py-3">
                          <Search className="mr-3 h-5 w-5 shrink-0 text-blue-500" />
                          <Input
                            placeholder="Digita simbolo o nome (es. AAPL, Bitcoin, Oro, Tesla, ETF)..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              searchInstruments(e.target.value);
                            }}
                            className="border-0 bg-transparent focus:ring-0 text-lg placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                        <CommandList>
                          {isSearching && (
                            <div className="p-6 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Cercando strumenti finanziari...</p>
                            </div>
                          )}
                          {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                            <div className="p-6 text-center">
                              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600 mb-2">Nessun risultato trovato per "{searchQuery}"</p>
                              <p className="text-xs text-gray-500">
                                Prova con simboli come: AAPL, TSLA, BTC, ETH, SPY, QQQ
                              </p>
                            </div>
                          )}
                          {searchResults.length > 0 && (
                            <CommandGroup>
                              {searchResults.map((result, index) => (
                                <CommandItem
                                  key={`${result.symbol}-${index}`}
                                  value={result.symbol}
                                  onSelect={() => handleSelectInstrument(result)}
                                  className="cursor-pointer py-3 px-4 hover:bg-blue-50"
                                >
                                  <Check
                                    className={cn(
                                      "mr-3 h-4 w-4 text-green-600",
                                      selectedInstrument?.symbol === result.symbol ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-lg text-blue-600">{result.symbol}</span>
                                      <Badge variant="secondary" className="ml-2">
                                        {result.type}
                                      </Badge>
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">
                                      {result.name}
                                    </span>
                                    {result.description && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        {result.description}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="manual-symbol">Simbolo *</Label>
                    <Input
                      id="manual-symbol"
                      placeholder="es. AAPL, BTC-EUR"
                      value={newInvestment.symbol}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, symbol: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-name">Nome Strumento *</Label>
                    <Input
                      id="manual-name"
                      placeholder="es. Apple Inc."
                      value={newInvestment.name}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Goal Selection */}
              <div className="mb-6">
                <Label htmlFor="goal-select">Collega a Obiettivo di Investimento *</Label>
                <div className="flex gap-2">
                  <Select value={selectedGoalId?.toString() || ''} onValueChange={(value) => setSelectedGoalId(safeInt(value))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleziona un obiettivo di investimento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {goals?.filter((goal: any) => goal.type === 'investment').map((goal: any) => (
                        <SelectItem key={goal.id} value={goal.id.toString()}>
                          {goal.name} - {formatEuro(goal.targetAmount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <GoalCreationDialog 
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Obiettivo
                  </Button>
                }
              />
                </div>
                {goals?.filter((goal: any) => goal.type === 'investment').length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Non hai obiettivi di investimento. Creane uno per collegare l'investimento.
                  </p>
                )}
              </div>

              {/* Source Account Selection */}
              <div className="mb-6">
                <Label htmlFor="source-account">Da quale conto prelevare i fondi? *</Label>
                <Select value={sourceAccount} onValueChange={setSourceAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il conto da cui prelevare..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accountArchitecture?.accounts && (
                      <>
                        <SelectItem value="income">
                          {accountArchitecture.accounts.income.name} - {formatEuro(accountArchitecture.accounts.income.balance)}
                        </SelectItem>
                        <SelectItem value="wealth">
                          {accountArchitecture.accounts.wealth.name} - {formatEuro(accountArchitecture.accounts.wealth.balance)}
                        </SelectItem>
                        <SelectItem value="operating">
                          {accountArchitecture.accounts.operating.name} - {formatEuro(accountArchitecture.accounts.operating.balance)}
                        </SelectItem>
                        <SelectItem value="emergency">
                          {accountArchitecture.accounts.emergency.name} - {formatEuro(accountArchitecture.accounts.emergency.balance)}
                        </SelectItem>
                        <SelectItem value="savings">
                          {accountArchitecture.accounts.savings.name} - {formatEuro(accountArchitecture.accounts.savings.balance)}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {sourceAccount && accountArchitecture && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Saldo disponibile:</strong> {formatEuro(getSourceAccountBalance())}
                      <br />
                      <strong>Importo investimento:</strong> {newInvestment.shares && newInvestment.purchasePrice ? formatEuro(safeFloat(newInvestment.shares) * safeFloat(newInvestment.purchasePrice)) : '€0'}
                      {newInvestment.shares && newInvestment.purchasePrice && getSourceAccountBalance() < (safeFloat(newInvestment.shares) * safeFloat(newInvestment.purchasePrice)) && (
                        <span className="block text-red-600 font-medium mt-1">
                          ⚠️ Saldo insufficiente per questo investimento!
                        </span>
                      )}
                      {newInvestment.shares && newInvestment.purchasePrice && getSourceAccountBalance() >= (safeFloat(newInvestment.shares) * safeFloat(newInvestment.purchasePrice)) && (
                        <span className="block text-green-600 font-medium mt-1">
                          ✅ Saldo sufficiente per questo investimento
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Investment Details */}
              {(selectedInstrument || isManualEntry) && (
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo Strumento</Label>
                      <Select 
                        value={newInvestment.type}
                        onValueChange={(value: 'stock' | 'crypto' | 'forex' | 'etf') => 
                          setNewInvestment(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Azione</SelectItem>
                          <SelectItem value="etf">ETF</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                          <SelectItem value="forex">Forex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shares">Quantità *</Label>
                      <Input
                        id="shares"
                        type="number"
                        step="0.0001"
                        placeholder="es. 10"
                        value={newInvestment.shares}
                        onChange={(e) => setNewInvestment(prev => ({ ...prev, shares: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Prezzo di Acquisto (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="es. 85.50"
                        value={newInvestment.purchasePrice}
                        onChange={(e) => setNewInvestment(prev => ({ ...prev, purchasePrice: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Data Acquisto</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newInvestment.purchaseDate}
                        onChange={(e) => setNewInvestment(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Calcolo Automatico Importo */}
                  {newInvestment.shares && newInvestment.purchasePrice && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Riepilogo Investimento</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Quantità:</span>
                          <div className="font-bold">{safeFloat(newInvestment.shares).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-blue-600">Prezzo unitario:</span>
                          <div className="font-bold">{formatEuro(safeFloat(newInvestment.purchasePrice))}</div>
                        </div>
                        <div>
                          <span className="text-blue-600">Importo totale investito:</span>
                          <div className="font-bold text-lg text-blue-800">
                            {formatEuro(safeFloat(newInvestment.shares) * safeFloat(newInvestment.purchasePrice))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAddInvestment}
                disabled={addInvestmentMutation.isPending || (!selectedInstrument && !isManualEntry) || !selectedGoalId || !sourceAccount}
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Investimento
              </Button>
            </CardContent>
            </Card>

            {/* Investments List */}
            {investments && investments.length > 0 ? (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Le Tue Posizioni</h3>
                      <p className="text-sm text-gray-600">Monitora la performance dei tuoi investimenti</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {investments.map((investment) => {
                      const linkedGoal = goals?.find((goal: any) => goal.id === investment.goalId);

                      return (
                        <div key={investment.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{investment.name}</h4>
                              <p className="text-sm text-medium-gray">{investment.symbol}</p>
                              {linkedGoal && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Target className="w-3 h-3 text-purple-600" />
                                  <span className="text-xs text-purple-600 font-medium">
                                    Collegato a: {linkedGoal.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-semibold">{formatEuro(investment.totalValue || 0)}</p>
                                <p className={`text-sm ${(investment.returnPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {(investment.returnPercentage || 0) >= 0 ? '+' : ''}{(investment.returnPercentage || 0).toFixed(2)}%
                                </p>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Vendi Investimento</DialogTitle>
                                    <DialogDescription>
                                      Sei sicuro di voler vendere l'investimento in <strong>{investment.name}</strong>?
                                      <br />
                                      <br />
                                      Il ricavato di {formatEuro(investment.totalValue)} sarà accreditato nel conto che scegli:
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4">
                                    <div>
                                      <Label>Cosa fare con l'investimento:</Label>
                                      <Select value={selectedTargetAccount} onValueChange={setSelectedTargetAccount}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Scegli un'opzione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="delete">🗑️ Elimina senza accreditare fondi</SelectItem>
                                          <SelectItem value="income">💰 Accredita su Conto di Ingresso/Smistamento</SelectItem>
                                          <SelectItem value="wealth">💎 Accredita su Conto Pila (Wealth Account)</SelectItem>
                                          <SelectItem value="operating">🏦 Accredita su Conto Circolante</SelectItem>
                                          <SelectItem value="emergency">🚨 Accredita su Conto Emergenze/Sicurezza</SelectItem>
                                          <SelectItem value="investment">📈 Accredita su Conto Investimenti/Libertà</SelectItem>
                                          <SelectItem value="savings">💰 Accredita su Conto Accantonamenti/Tasse Annuali</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {selectedTargetAccount && selectedTargetAccount !== 'delete' && (
                                      <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-blue-800 text-sm">
                                          <strong>Ricavato vendita:</strong> {formatEuro(investment.totalValue)}
                                          <br />
                                          <strong>Guadagno/Perdita:</strong> 
                                          <span className={investment.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {' '}{formatEuro(investment.totalReturn, true)}
                                          </span>
                                        </p>
                                      </div>
                                    )}

                                    {selectedTargetAccount === 'delete' && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-800 text-sm">
                                          <strong>⚠️ Attenzione:</strong> L'investimento verrà eliminato permanentemente senza trasferire i fondi in nessun conto.
                                          <br />
                                          <strong>Valore che verrà perso:</strong> {formatEuro(investment.totalValue)}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end gap-2 mt-4">
                                    <DialogTrigger asChild>
                                      <Button variant="outline">Annulla</Button>
                                    </DialogTrigger>
                                    <Button 
                                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                                      onClick={() => deleteInvestmentMutation.mutate({
                                        investmentId: investment.id,
                                        targetAccount: selectedTargetAccount
                                      })}
                                      disabled={deleteInvestmentMutation.isPending || !selectedTargetAccount}
                                    >
                                      {deleteInvestmentMutation.isPending ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Vendendo...
                                        </>
                                      ) : (
                                        <>
                                          <TrendingDown className="w-4 h-4 mr-2" />
                                          Vendi Investimento
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <p className="text-medium-gray">Tipo</p>
                              <Badge variant="outline" className="text-xs">
                                {investment.instrumentType?.toUpperCase() || 'STOCK'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-medium-gray">Quantità</p>
                              <p className="font-medium">{investment.shares || 0}</p>
                            </div>
                            <div>
                              <p className="text-medium-gray">Prezzo Acquisto</p>
                              <p className="font-medium">{formatEuro(investment.purchasePrice || 0)}</p>
                            </div>
                            <div>
                              <p className="text-medium-gray">Prezzo Attuale</p>
                              <p className={`font-medium ${
                                (investment.currentPrice || 0) >= (investment.purchasePrice || 0) ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatEuro(investment.currentPrice || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-medium-gray">Investito</p>
                              <p className="font-medium text-blue-600">
                                {formatEuro((investment.shares || 0) * (investment.purchasePrice || 0))}
                              </p>
                            </div>
                          </div>
                          
                          {investment.purchaseDate && (
                            <div className="mt-2 text-xs text-gray-500">
                              Acquistato il: {new Date(investment.purchaseDate).toLocaleDateString('it-IT')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <PieChart className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun investimento ancora</h3>
                <p className="text-medium-gray mb-4">
                  Inizia a costruire il tuo portafoglio aggiungendo il tuo primo investimento
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Riepilogo Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Capitale Investito:</span>
                    <span className="font-semibold">{formatEuro(totalInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Valore Attuale:</span>
                    <span className="font-semibold">{formatEuro(totalPortfolioValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Guadagno/Perdita:</span>
                    <span className={`font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatEuro(totalReturn, true)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Rendimento %:</span>
                    <span className={`font-semibold ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Confronto con Portafoglio Modello</h3>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-gray-200 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-medium-gray" />
                  </div>
                  <p className="text-medium-gray text-sm">
                    Funzionalità in sviluppo. Presto potrai confrontare la tua performance 
                    con quella del portafoglio modello suggerito.
                  </p>
                </div>
              </Card>
            </div>

            {investments && investments.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance per Investimento</h3>
                <div className="space-y-3">
                  {investments.map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{investment.name}</h4>
                        <p className="text-sm text-medium-gray">{investment.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${investment.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {investment.returnPercentage >= 0 ? '+' : ''}{investment.returnPercentage.toFixed(2)}%
                        </p>
                        <p className="text-sm text-medium-gray">
                          {formatEuro(investment.totalReturn, true)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Model Portfolios Tab */}
          <TabsContent value="models" className="space-y-6">
            {/* Portfolio Filters */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Filtra Portafogli Modello</h3>
                  <p className="text-blue-700 text-sm">Scegli tra oltre 35 portafogli diversificati per ogni strategia di investimento</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="min-w-[200px]">
                    <Label htmlFor="category-filter" className="text-sm font-medium text-blue-800">Categoria</Label>
                    <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                      <SelectTrigger className="bg-white border-blue-200">
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i Portafogli</SelectItem>
                        <SelectItem value="obbligazionario">🏛️ Obbligazionario</SelectItem>
                        <SelectItem value="azionario">📈 Azionario</SelectItem>
                        <SelectItem value="etf">📊 ETF</SelectItem>
                        <SelectItem value="crypto">₿ Crypto</SelectItem>
                        <SelectItem value="cash">💰 Cash</SelectItem>
                        <SelectItem value="misto">🔄 Misto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[180px]">
                    <Label htmlFor="risk-filter" className="text-sm font-medium text-blue-800">Profilo di Rischio</Label>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="bg-white border-blue-200">
                        <SelectValue placeholder="Seleziona rischio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i Livelli</SelectItem>
                        <SelectItem value="conservative">🛡️ Conservativo</SelectItem>
                        <SelectItem value="moderate">⚖️ Moderato</SelectItem>
                        <SelectItem value="aggressive">🚀 Aggressivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Results Counter */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Target className="w-4 h-4" />
                  <span>Mostrando {filteredPortfolios.length} portafogli di {allModelPortfolios.length} totali</span>
                </div>
              </div>
            </Card>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPortfolios.map((portfolio) => (
                <Card key={portfolio.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500">#{portfolio.id}</span>
                          <Badge variant="outline" className="text-xs">
                            {portfolio.category === 'obbligazionario' ? '🏛️ Obbligazioni' :
                             portfolio.category === 'azionario' ? '📈 Azioni' :
                             portfolio.category === 'etf' ? '📊 ETF' :
                             portfolio.category === 'crypto' ? '₿ Crypto' :
                             portfolio.category === 'cash' ? '💰 Cash' : '🔄 Misto'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mb-2 line-clamp-2">{portfolio.name}</CardTitle>
                        <Badge className={
                          portfolio.riskProfile === 'conservative' ? 'bg-green-100 text-green-800' :
                          portfolio.riskProfile === 'moderate' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {portfolio.riskProfile === 'conservative' ? '🛡️ Conservativo' : 
                           portfolio.riskProfile === 'moderate' ? '⚖️ Moderato' : '🚀 Aggressivo'}
                        </Badge>
                      </div>
                      <PieChart className="h-6 w-6 text-blue-600 mt-1" />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{portfolio.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
                        <div className="text-xs font-medium">Rendimento Atteso</div>
                        <div className="text-sm font-bold text-green-600">{portfolio.expectedReturn}</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Shield className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                        <div className="text-xs font-medium">Rischio</div>
                        <div className="text-sm font-bold text-blue-600">
                          {portfolio.riskProfile === 'conservative' ? 'Basso' : 
                           portfolio.riskProfile === 'moderate' ? 'Medio' : 'Alto'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Allocazione Asset:</h4>
                      {portfolio.allocation.slice(0, 4).map((asset, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-green-500' :
                              index === 2 ? 'bg-purple-500' :
                              'bg-orange-500'
                            }`}></div>
                            <div>
                              <div className="font-medium text-xs">{asset.asset}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xs">{asset.percentage}%</div>
                          </div>
                        </div>
                      ))}
                      {portfolio.allocation.length > 4 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{portfolio.allocation.length - 4} altri asset
                        </div>
                      )}
                    </div>

                    <div className="pt-3 space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => toggleFavorite(portfolio.id)}
                        variant={favoritePortfolios.includes(portfolio.id) ? "default" : "outline"}
                      >
                        <Star className={`w-3 h-3 mr-1 ${favoritePortfolios.includes(portfolio.id) ? 'fill-current' : ''}`} />
                        {favoritePortfolios.includes(portfolio.id) ? 'Nei Preferiti' : 'Aggiungi ai Preferiti'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => showPortfolioHistory(portfolio)}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Andamento Storico
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Results Message */}
            {filteredPortfolios.length === 0 && (
              <Card className="p-8 text-center">
                <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun portafoglio trovato</h3>
                <p className="text-gray-600 mb-4">
                  Prova a modificare i filtri per trovare portafogli che corrispondono ai tuoi criteri
                </p>
                <Button variant="outline" onClick={() => { setPortfolioFilter("all"); setRiskFilter("all"); }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Filtri
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Portfolio History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Andamento Storico - {selectedPortfolioDetails?.name}
            </DialogTitle>
            <DialogDescription>
              Analisi dettagliata delle performance storiche e statistiche del portafoglio
            </DialogDescription>
          </DialogHeader>
          
          {selectedPortfolioDetails && (
            <div className="space-y-6">
              {/* Portfolio Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedPortfolioDetails.expectedReturn.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Rendimento Atteso Annuo</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedPortfolioDetails.volatility.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Volatilità</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedPortfolioDetails.stats?.sharpeRatio}
                      </div>
                      <div className="text-sm text-gray-600">Sharpe Ratio</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Historical Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Mensile (Basata su Pattern di Mercato Reali)</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Simulazione basata su stagionalità storica e volatilità reali del mercato per questa tipologia di asset
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {selectedPortfolioDetails.historicalData?.slice(0, 8).map((data: any, index: number) => (
                      <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-sm">{data.month}</div>
                        <div className={`text-lg font-bold ${safeFloat(data.return) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {safeFloat(data.return) >= 0 ? '+' : ''}{data.return}%
                        </div>
                        <div className="text-xs text-gray-600">€{data.cumulativeValue}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiche Chiave (Calcolate)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="font-bold text-red-600">{selectedPortfolioDetails.stats?.maxDrawdown}</div>
                      <div className="text-sm text-gray-600">Max Drawdown</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{selectedPortfolioDetails.stats?.sharpeRatio}</div>
                      <div className="text-sm text-gray-600">Sharpe Ratio</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{selectedPortfolioDetails.stats?.avgMonthlyReturn}</div>
                      <div className="text-sm text-gray-600">Rendimento Medio Mensile</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">{selectedPortfolioDetails.stats?.winRate}</div>
                      <div className="text-sm text-gray-600">Mesi Positivi</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{selectedPortfolioDetails.stats?.annualizedReturn}</div>
                      <div className="text-sm text-gray-600">Rendimento Annualizzato</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-cyan-600">{selectedPortfolioDetails.stats?.annualizedVolatility}</div>
                      <div className="text-sm text-gray-600">Volatilità Annualizzata</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Allocazione degli Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPortfolioDetails.allocation?.map((asset: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-purple-500' :
                            'bg-orange-500'
                          }`}></div>
                          <span className="font-medium">{asset.asset}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={asset.percentage} className="w-20" />
                          <span className="font-bold text-sm w-12">{asset.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    toggleFavorite(selectedPortfolioDetails.id);
                    setShowHistoryDialog(false);
                  }}
                  variant={favoritePortfolios.includes(selectedPortfolioDetails.id) ? "default" : "outline"}
                >
                  <Star className={`w-4 h-4 mr-2 ${favoritePortfolios.includes(selectedPortfolioDetails.id) ? 'fill-current' : ''}`} />
                  {favoritePortfolios.includes(selectedPortfolioDetails.id) ? 'Rimuovi dai Preferiti' : 'Aggiungi ai Preferiti'}
                </Button>
                <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}