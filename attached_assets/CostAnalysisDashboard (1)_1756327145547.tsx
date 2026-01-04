import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, TrendingDown, Calculator, DollarSign, Clock, Users, ChefHat, Building, Zap, Shield, Wrench, FileText, Save, Target, AlertTriangle, CheckCircle, Lightbulb, Settings, ShoppingCart, HelpCircle, Calendar, CalendarDays, ChevronLeft, ChevronRight, Download, FileDown, Info, BarChart3, Euro, History, CreditCard, PieChart, StickyNote, NotebookPen, Heart } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CostNoteField } from "./CostNoteField.tsx";

// Dichiarazione globale per la funzione di callback
declare global {
  interface Window {
    updateCurrentMonthFromAdvanced?: (newDate: Date) => void;
  }
}


interface BreakEvenAnalysis {
  period: string;
  totalFixedCosts: number;
  averageVariableCostPercentage: number;
  breakEvenRevenue: number;
  breakEvenUnits: number;
  actualRevenue: number;
  profitLoss: number;
  marginOfSafety: number;
}

interface MenuProfitability {
  itemId: number;
  itemName: string;
  sellingPrice: number;
  foodCost: number;
  laborCost: number;
  totalCost: number;
  contributionMargin: number;
  contributionMarginPercentage: number;
  unitsSold: number;
  totalProfit: number;
  costConfigured: boolean;
}

interface LaborEfficiency {
  date: string;
  totalLaborHours: number;
  totalLaborCost: number;
  revenue: number;
  laborCostPercentage: number;
  revenuePerLaborHour: number;
  laborCostPerOrder: number;
  totalOrders: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

// Componente Mini-Tutorial discreto
const HelpTooltip = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <Tooltip
    content={
      <div className="text-sm max-w-xs">
        <div className="font-semibold mb-1 text-white">{title}</div>
        <div className="text-gray-200">{children}</div>
      </div>
    }
    position="top"
  >
    <HelpCircle className={`w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help transition-colors ${className}`} />
  </Tooltip>
);

// Componente avanzato per analisi profittabilità menu
const MenuProfitabilityAnalysis = () => {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: menuData, isLoading, refetch } = useQuery({
    queryKey: ['/api/cost-analysis/menu-profitability', dateRange.start, dateRange.end],
    queryFn: () => fetch(`/api/cost-analysis/menu-profitability?startDate=${dateRange.start}&endDate=${dateRange.end}`).then(res => res.json())
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('totalProfit');
  const [showCostConfig, setShowCostConfig] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Messaggi informativi quando non ci sono dati
  if (!menuData || !menuData.menuItems || menuData.menuItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Analisi Profittabilità Menu</h3>
            <p className="text-sm text-gray-600">
              Analisi dettagliata dei margini e della redditività per ogni piatto
            </p>
          </div>
        </div>

        {/* Controlli data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data inizio</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div>
            <Label>Data fine</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nessun dato di vendita trovato
              </h3>
              <p className="text-gray-600 mb-6">
                Per vedere l'analisi di profittabilità del menu, hai bisogno di:
              </p>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Avere vendite nel periodo selezionato</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm">Configurare il "Costo Prodotto" per ogni piatto nel menu</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Avere un menu attivo con prezzi di vendita configurati</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Button 
                  onClick={() => refetch()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Ricarica Analisi
                </Button>
                <p className="text-xs text-gray-500">
                  Suggerimento: Modifica le date o controlla se hai ordini completati nel periodo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = ['all', 'antipasti', 'primi', 'secondi', 'dolci', 'bevande'];

  const filteredData = menuData?.menuItems?.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  ) || [];

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    return bValue - aValue;
  });

  const topPerformers = sortedData.slice(0, 5);
  const underperformers = sortedData.filter(item => (item.contributionMarginPercentage || 0) < 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Analisi Profittabilità Menu</h3>
          <p className="text-sm text-gray-600">
            Analisi dettagliata dei margini e della redditività per ogni piatto
          </p>
        </div>
      </div>

      {/* Filtri e controlli */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Data inizio</Label>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>
        <div>
          <Label>Data fine</Label>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'Tutte le categorie' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ordina per</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalProfit">Profitto Totale</SelectItem>
              <SelectItem value="contributionMarginPercentage">Margine %</SelectItem>
              <SelectItem value="unitsSold">Unità Vendute</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Configurazione rapida costi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configurazione Costi Menu
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCostConfig(!showCostConfig)}
            >
              {showCostConfig ? 'Nascondi' : 'Configura Costi'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showCostConfig && (
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Come configurare i costi:</strong> I costi dei piatti vengono presi dal campo "Costo Prodotto" 
                di ogni piatto nel menu. Il margine viene calcolato come: <strong>Prezzo Vendita - Costo Prodotto</strong>.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                💡 <strong>Per configurare i costi:</strong> Vai in "Gestione Menu" → "Prodotti" e inserisci 
                il "Costo Prodotto" per ogni piatto. Senza questo dato l'analisi non sarà precisa.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Aggiorna Analisi
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margine Medio</p>
                <p className="text-2xl font-bold text-green-600">
                  {menuData?.summary?.averageMargin?.toFixed(1) || '0'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performer</p>
                <p className="text-xl font-bold text-blue-600">
                  {topPerformers[0]?.itemName || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  €{topPerformers[0]?.totalProfit?.toFixed(0) || '0'} profit
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sottoperformanti</p>
                <p className="text-2xl font-bold text-red-600">
                  {underperformers.length}
                </p>
                <p className="text-xs text-gray-500">piatti &lt; 30% margine</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Food Cost Medio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {menuData?.summary?.averageFoodCost?.toFixed(1) || '0'}%
                </p>
              </div>
              <ChefHat className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spiegazione calcolo margini */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Calcolo Margini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Margine Lordo</strong> = Prezzo Vendita - Costo Prodotto. 
              Es.: Bruschetta €13 - €2 = <strong>€11.00 margine lordo</strong>
            </p>
            <p>
              <strong>Margine Netto</strong> = Margine Lordo - Overhead (2%). 
              Es.: €11.00 - €0.26 (overhead) = <strong>€10.74 margine netto</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabella dettagliata */}
      <Card>
        <CardHeader>
          <CardTitle>Dettaglio Profittabilità per Piatto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Piatto</th>
                  <th className="text-right p-2">Prezzo</th>
                  <th className="text-right p-2">Costo Prodotto (€)</th>
                  <th className="text-right p-2">Margine Lordo</th>
                  <th className="text-right p-2">
                    Margine Netto
                    <span className="text-xs text-gray-500 ml-1">(- overhead)</span>
                  </th>
                  <th className="text-right p-2">Margine %</th>
                  <th className="text-right p-2">Vendite</th>
                  <th className="text-right p-2">Profitto Tot.</th>
                  <th className="text-right p-2">Stato</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={item.itemId} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.itemName}</td>
                    <td className="text-right p-2">€{item.sellingPrice?.toFixed(2) || '0'}</td>
                    <td className="text-right p-2">
                      {item.costConfigured ? (
                        <span className="font-medium">
                          €{item.foodCost?.toFixed(2) || '0.00'}
                        </span>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                          Non configurato
                        </Badge>
                      )}
                    </td>
                    <td className="text-right p-2 text-gray-600">
                      €{((item.sellingPrice || 0) - (item.foodCost || 0)).toFixed(2)}
                    </td>
                    <td className="text-right p-2 font-medium">
                      €{item.contributionMargin?.toFixed(2) || '0'}
                    </td>
                    <td className="text-right p-2">
                      <Badge 
                        variant={item.contributionMarginPercentage > 40 ? "default" : 
                                item.contributionMarginPercentage > 25 ? "secondary" : "destructive"}
                      >
                        {item.contributionMarginPercentage?.toFixed(1) || '0'}%
                      </Badge>
                    </td>
                    <td className="text-right p-2">{item.unitsSold || 0}</td>
                    <td className="text-right p-2 font-bold">€{item.totalProfit?.toFixed(0) || '0'}</td>
                    <td className="text-right p-2">
                      {!item.costConfigured ? (
                        <Badge variant="destructive">Configura Costo</Badge>
                      ) : item.contributionMarginPercentage < 25 ? (
                        <Badge variant="destructive">Rivedi Prezzo</Badge>
                      ) : item.contributionMarginPercentage > 45 ? (
                        <Badge variant="default">Promuovi</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Suggerimenti automatici */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Suggerimenti di Ottimizzazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Opportunità di Crescita</h4>
              <ul className="space-y-2 text-sm">
                {topPerformers.slice(0, 3).map(item => (
                  <li key={item.itemId} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>
                      <strong>{item.itemName}</strong>: Aumenta visibilità nel menu
                      (margine {item.contributionMarginPercentage?.toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-2">Necessitano Revisione</h4>
              <ul className="space-y-2 text-sm">
                {underperformers.slice(0, 3).map(item => (
                  <li key={item.itemId} className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>
                      <strong>{item.itemName}</strong>: Ottimizza costi o aumenta prezzo
                      (margine {item.contributionMarginPercentage?.toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente per la gestione del fatturato (manuale vs automatico)
const RevenueManagement = ({ currentMonth, setCurrentMonth, onRevenueSettingsChange, onMonthChange }: {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onRevenueSettingsChange?: () => void;
  onMonthChange?: () => void;
}) => {
  const [isManualMode, setIsManualMode] = useState(true); // Default a manuale per sicurezza
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const monthKey = format(currentMonth, 'yyyy-MM');

  

  // Navigazione mesi
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    console.log('💰 [REVENUE NAVIGATION] === CAMBIO MESE IN REVENUE MANAGEMENT ===');
    console.log('💰 [REVENUE NAVIGATION] Direction:', direction);
    console.log('💰 [REVENUE NAVIGATION] Data precedente:', currentMonth);
    console.log('💰 [REVENUE NAVIGATION] Nuova data:', newDate);
    console.log('💰 [REVENUE NAVIGATION] Nuovo monthKey:', format(newDate, 'yyyy-MM'));
    
    setCurrentMonth(newDate);
    
    // Notifica il componente parent che il mese è cambiato
    if (onMonthChange) {
      setTimeout(() => onMonthChange(), 100); // Timeout per permettere l'aggiornamento dello stato
    }
  };

  // Carica impostazioni fatturato
  const { data: revenueSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/cost-analysis/revenue-settings', monthKey],
    queryFn: () => fetch(`/api/cost-analysis/revenue-settings?monthKey=${monthKey}`).then(res => res.json())
  });

  // Carica dati fatturato manuale (sempre abilitato per recuperare dati esistenti)
  const { data: manualRevenueData, refetch: refetchManualData } = useQuery({
    queryKey: ['/api/cost-analysis/manual-revenue', monthKey],
    queryFn: () => fetch(`/api/cost-analysis/manual-revenue?monthKey=${monthKey}`).then(res => res.json())
  });

  // Carica automaticamente le impostazioni quando cambiano
  useEffect(() => {
    if (revenueSettings) {
      setIsManualMode(revenueSettings.isManualMode !== undefined ? revenueSettings.isManualMode : true);
      if (revenueSettings.settings?.isSimpleMode !== undefined) {
        setIsSimpleMode(revenueSettings.settings.isSimpleMode);
      }
    }
  }, [revenueSettings]);

  useEffect(() => {
    if (manualRevenueData && Array.isArray(manualRevenueData)) {
      setDailyRevenueData(manualRevenueData);
      // Calcola totale mensile dai dati esistenti
      const total = manualRevenueData.reduce((sum: number, day: any) => {
        const value = parseFloat(day.monthlyRevenue || day.dailyRevenue || 0);
        return sum + value;
      }, 0);
      setMonthlyRevenue(total);
    } else {
      setDailyRevenueData([]);
      setMonthlyRevenue(0);
    }
  }, [manualRevenueData]);

  // Salva impostazioni fatturato
  const saveRevenueSettings = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/cost-analysis/revenue-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthKey,
          isManualMode,
          settings: { isSimpleMode }
        })
      });
      refetchSettings();

      // Notifica il dashboard che le impostazioni sono cambiate
      if (onRevenueSettingsChange) {
        onRevenueSettingsChange();
      }
    } catch (error) {
      console.error('Errore salvataggio impostazioni:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salva fatturato manuale semplificato
  const saveSimpleRevenue = async () => {
    try {
      setIsLoading(true);
      
      // Usa il primo giorno del mese selezionato invece della data corrente
      const targetDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), 'yyyy-MM-dd');
      
      console.log('💰 [Frontend] Preparando salvataggio fatturato:');
      console.log('💰 [Frontend] currentMonth:', currentMonth);
      console.log('💰 [Frontend] monthKey:', monthKey);
      console.log('💰 [Frontend] targetDate:', targetDate);
      console.log('💰 [Frontend] monthlyRevenue:', monthlyRevenue);
      
      const requestBody = {
        monthKey,
        date: targetDate,
        monthlyRevenue,
        notes: `Fatturato mensile inserito per ${format(currentMonth, 'MMMM yyyy', { locale: it })}`
      };
      
      console.log('💰 [Frontend] Request body:', requestBody);
      
      const response = await fetch('/api/cost-analysis/manual-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('💰 [Frontend] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('💰 [Frontend] Errore response:', errorText);
        throw new Error(errorText);
      }
      
      const result = await response.json();
      console.log('💰 [Frontend] Salvataggio completato:', result);
      
      refetchManualData();

      // Notifica il dashboard che i dati del fatturato sono cambiati
      if (onRevenueSettingsChange) {
        onRevenueSettingsChange();
      }
    } catch (error) {
      console.error('💰 [Frontend] Errore salvataggio fatturato:', error);
      alert('Errore nel salvataggio del fatturato: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Modifica fatturato esistente
  const editRevenue = (record: any) => {
    setMonthlyRevenue(record.monthlyRevenue || record.dailyRevenue || 0);
  };

  // Elimina fatturato
  const deleteRevenue = async (recordId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo record di fatturato?')) return;

    try {
      setIsLoading(true);
      await fetch(`/api/cost-analysis/manual-revenue/${recordId}`, {
        method: 'DELETE'
      });
      refetchManualData();

      if (onRevenueSettingsChange) {
        onRevenueSettingsChange();
      }
    } catch (error) {
      console.error('Errore eliminazione fatturato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Genera giorni del mese per modalità avanzata
  const generateMonthDays = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i), 'yyyy-MM-dd');
      const existingData = dailyRevenueData.find(d => d.date === date);
      days.push({
        date,
        day: i,
        dailyRevenue: existingData?.dailyRevenue || 0,
        notes: existingData?.notes || ''
      });
    }
    return days;
  };

  const monthDays = generateMonthDays();

  return (
    <div className="space-y-6">
      {/* Header Navigazione Mese */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-cyan-900">
                <div className="p-3 rounded-xl bg-white shadow-md border-2 border-cyan-200">
                  <BarChart3 className="w-7 h-7 text-cyan-600" />
                </div>
                Gestione Fatturato
                <HelpTooltip title="Gestione Fatturato" className="ml-2">
                  Scegli se utilizzare i dati automatici degli ordini o inserire manualmente il fatturato per calcoli più precisi del break-even
                </HelpTooltip>
              </CardTitle>
              <p className="text-cyan-700 text-sm">
                Configura come calcolare il fatturato per l'analisi break-even
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-700">Mese Analizzato</p>
              <p className="text-2xl font-bold text-cyan-900">
                {format(currentMonth, 'MMMM yyyy', { locale: it })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Mese Precedente
            </Button>

            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: it })}
              </h4>
              <p className="text-sm text-gray-500">
                Configurazione fatturato per questo mese
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="flex items-center gap-2"
            >
              Prossimo Mese
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Switch Modalità Automatica/Manuale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            Modalità di Calcolo Fatturato
          </CardTitle>
          <CardDescription>
            Scegli se utilizzare i dati degli ordini automatici o inserire il fatturato manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-gray-600" />
                <span className={`font-medium ${!isManualMode ? 'text-blue-600' : 'text-gray-500'}`}>
                  Automatico (da ordini)
                </span>
              </div>
              <Switch
                checked={isManualMode}
                onCheckedChange={setIsManualMode}
              />
              <div className="flex items-center space-x-2">
                <Euro className="w-5 h-5 text-gray-600" />
                <span className={`font-medium ${isManualMode ? 'text-cyan-600' : 'text-gray-500'}`}>
                  Manuale (inserimento)
                </span>
              </div>
            </div>
            <Button onClick={saveRevenueSettings} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salva Modalità'}
            </Button>
          </div>

          {isManualMode && (
            <div className="mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-cyan-600" />
                  <span className={`font-medium ${isSimpleMode ? 'text-cyan-600' : 'text-gray-500'}`}>
                    Semplice (1 minuto)
                  </span>
                </div>
                <Switch
                  checked={!isSimpleMode}
                  onCheckedChange={(checked) => setIsSimpleMode(!checked)}
                />
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-cyan-600" />
                  <span className={`font-medium ${!isSimpleMode ? 'text-cyan-600' : 'text-gray-500'}`}>
                    Avanzata (complessa)
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenuto basato sulla modalità */}
      {!isManualMode ? (
        // Modalità Automatica
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-600">
              <Calculator className="w-6 h-6" />
              Modalità Automatica Attiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calculator className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Calcolo Automatico dal Sistema Ordini
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Il fatturato viene calcolato automaticamente dai dati degli ordini nel sistema. 
                I calcoli di break-even utilizzeranno questi dati reali.
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Vantaggi:</strong> Dati sempre aggiornati, nessun inserimento manuale richiesto, 
                  integrazione completa con il sistema di gestione ordini.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Modalità Manuale
        isSimpleMode ? (
          // Modalità Semplice
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-cyan-600">
                <Zap className="w-6 h-6" />
                Modalità Semplice - Inserimento Rapido
              </CardTitle>
              <CardDescription>
                Inserisci il fatturato mensile totale in meno di 1 minuto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthlyRevenue">Fatturato Mensile Totale</Label>
                  <div className="flex items-center space-x-2">
                    <Euro className="w-5 h-5 text-gray-400" />
                    <Input
                      id="monthlyRevenue"
                      type="number"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                      placeholder="Inserisci il fatturato mensile"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Inserisci il fatturato totale previsto o effettivo per {format(currentMonth, 'MMMM yyyy', { locale: it })}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    onClick={saveSimpleRevenue} 
                    disabled={isLoading || monthlyRevenue <= 0}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salva Fatturato
                      </>
                    )}
                  </Button>
                </div>

                {/* Visualizza dati esistenti per il mese selezionato */}
                {dailyRevenueData.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <History className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Dati esistenti per {format(currentMonth, 'MMMM yyyy', { locale: it })}
                        </span>
                      </div>
                      <span className="text-sm text-blue-600">
                        {dailyRevenueData.length} record{dailyRevenueData.length !== 1 ? 'i' : 'o'}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {dailyRevenueData.slice(0, 5).map((record, index) => (
                        <div key={record.id || index} className="flex justify-between items-center text-sm group">
                          <span className="text-blue-700">
                            {record.date ? format(new Date(record.date), 'dd/MM/yyyy') : 'Totale mensile'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-800">
                              €{(record.monthlyRevenue || record.dailyRevenue || 0).toLocaleString()}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                onClick={() => editRevenue(record)}
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                onClick={() => deleteRevenue(record.id)}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dailyRevenueData.length > 5 && (
                        <div className="text-xs text-blue-600 text-center pt-2">
                          ...e altri {dailyRevenueData.length - 5} record
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {monthlyRevenue > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Fatturato configurato: €{monthlyRevenue.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Questo valore sarà utilizzato per i calcoli di break-even
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Modalità Avanzata
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-cyan-600">
                <Target className="w-6 h-6" />
                Modalità Avanzata - Inserimento Dettagliato
              </CardTitle>
              <CardDescription>
                Gestione completa con fatturati giornalieri per {format(currentMonth, 'MMMM yyyy', { locale: it })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-cyan-50 rounded-lg">
                    <p className="text-sm text-gray-600">Giorni nel Mese</p>
                    <p className="text-2xl font-bold text-cyan-600">{monthDays.length}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Giorni Configurati</p>
                    <p className="text-2xl font-bold text-green-600">
                      {monthDays.filter(d => d.dailyRevenue > 0).length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Totale Mensile</p>
                    <p className="text-2xl font-bold text-blue-600">
                      €{monthDays.reduce((sum, d) => sum + Number(d.dailyRevenue), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800">
                        <strong>Modalità Avanzata:</strong> Inserisci il fatturato per ogni giorno del mese. 
                        Lascia a 0 i giorni di chiusura. I dati verranno salvati automaticamente.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-gray-500 text-sm">
                  La funzionalità avanzata sarà implementata nel prossimo aggiornamento.
                  Per ora utilizza la modalità semplice.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default function CostAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  const [analysisType, setAnalysisType] = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Stato unico per la navigazione mensile condiviso tra tutti i componenti
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // monthKey dinamico basato sul mese selezionato
  const monthKey = format(currentMonth, 'yyyy-MM');

  // Funzioni per navigazione mensile centralizzate
  const goToPreviousMonth = () => {
    console.log('🔙 [NAVIGATION] Clic su "Mese Precedente"');
    console.log('🔙 [NAVIGATION] currentMonth prima del cambio:', currentMonth);
    console.log('🔙 [NAVIGATION] monthKey prima del cambio:', monthKey);
    
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      console.log('🔙 [NAVIGATION] Data precedente:', prev);
      console.log('🔙 [NAVIGATION] Mese precedente (before):', prev.getMonth());
      
      newDate.setMonth(newDate.getMonth() - 1);
      
      console.log('🔙 [NAVIGATION] Nuova data calcolata:', newDate);
      console.log('🔙 [NAVIGATION] Nuovo mese (after):', newDate.getMonth());
      console.log('🔙 [NAVIGATION] Nuovo monthKey sarà:', format(newDate, 'yyyy-MM'));
      
      return newDate;
    });
  };

  const goToNextMonth = () => {
    console.log('▶️ [NAVIGATION] Clic su "Prossimo Mese"');
    console.log('▶️ [NAVIGATION] currentMonth prima del cambio:', currentMonth);
    console.log('▶️ [NAVIGATION] monthKey prima del cambio:', monthKey);
    
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      console.log('▶️ [NAVIGATION] Data precedente:', prev);
      console.log('▶️ [NAVIGATION] Mese precedente (before):', prev.getMonth());
      
      newDate.setMonth(newDate.getMonth() + 1);
      
      console.log('▶️ [NAVIGATION] Nuova data calcolata:', newDate);
      console.log('▶️ [NAVIGATION] Nuovo mese (after):', newDate.getMonth());
      console.log('▶️ [NAVIGATION] Nuovo monthKey sarà:', format(newDate, 'yyyy-MM'));
      
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Funzione globale per permettere all'AdvancedCostManagement di cambiare il mese
  useEffect(() => {
    window.updateCurrentMonthFromAdvanced = (newDate: Date) => {
      console.log('🌍 [GLOBAL] Aggiornamento currentMonth da AdvancedCostManagement:', newDate);
      setCurrentMonth(newDate);
    };
    
    return () => {
      delete window.updateCurrentMonthFromAdvanced;
    };
  }, []);

  // Stati per la gestione avanzata dei costi - inizializzati a 0
  const [fixedCosts, setFixedCosts] = useState({
    rent: 0,
    utilities: 0,
    insurance: 0,
    staffSalaries: 0,
    equipment: 0,
    other: 0
  });

  const [laborSettings, setLaborSettings] = useState({
    averageHourlyWage: 0,
    hoursPerDay: 0,
    daysPerMonth: 0
  });

  const [advancedCosts, setAdvancedCosts] = useState({
    // Costi variabili mensili fissi in euro
    foodCostMonthly: 0,
    beverageCostMonthly: 0,
    packagingCosts: 0,
    deliveryCommissions: 0,

    // Costi di marketing e promozione
    marketingBudget: 0,
    socialMediaAds: 0,
    loyaltyProgramCosts: 0,

    // Costi operativi avanzati
    maintenanceEquipment: 0,
    cleaningSupplies: 0,
    uniformsAndLaundry: 0,
    phoneTelecomm: 0,

    // Ammortamenti dettagliati
    kitchenEquipment: 0,
    furnitureFixtures: 0,
    posSystemSoftware: 0,

    // Costi del personale dettagliati - tutti in euro
    socialContributions: 0,
    training: 0,
    overtimePremium: 0,

    // Costi stagionali e variabili
    seasonalStaffing: 0,
    energyCostIncrease: 0,
    wasteDisposal: 0,

    // KPI
    targetProfitMargin: 0,
    averageCustomerValue: 0,
    customerRetentionRate: 0,
    peakHoursMultiplier: 0
  });

  const [debts, setDebts] = useState({
    bankLoan: 0,
    equipmentFinancing: 0,
    supplierCredit: 0,
    leasing: 0,
    otherDebts: 0
  });

  // Query per dashboard principale con mese specifico
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ["/api/cost-analysis/dashboard", monthKey],
    queryFn: async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      console.log('🔄 [DASHBOARD QUERY] === INIZIO FETCH DASHBOARD ===');
      console.log('🔄 [DASHBOARD QUERY] currentMonth object:', currentMonth);
      console.log('🔄 [DASHBOARD QUERY] currentMonth.getFullYear():', year);
      console.log('🔄 [DASHBOARD QUERY] currentMonth.getMonth():', currentMonth.getMonth(), '(zero-based)');
      console.log('🔄 [DASHBOARD QUERY] month per API (getMonth + 1):', month);
      console.log('🔄 [DASHBOARD QUERY] monthKey:', monthKey);
      console.log('🔄 [DASHBOARD QUERY] URL chiamata:', `/api/cost-analysis/dashboard?year=${year}&month=${month}`);
      
      const response = await fetch(`/api/cost-analysis/dashboard?year=${year}&month=${month}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Query per analisi break-even - ora usa la configurazione costi reale
  const { data: breakEvenData, isLoading: isBreakEvenLoading, refetch: refetchBreakEven } = useQuery({
    queryKey: ["/api/cost-analysis/break-even", selectedDate.year, selectedDate.month, selectedDate.day, analysisType],
    queryFn: async () => {
      console.log('🔄 [BREAK-EVEN QUERY] Fetching break-even data for:', { 
        year: selectedDate.year, 
        month: selectedDate.month, 
        day: selectedDate.day, 
        type: analysisType 
      });
      const response = await fetch(`/api/cost-analysis/break-even?year=${selectedDate.year}&month=${selectedDate.month}&day=${selectedDate.day}&type=${analysisType}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('✅ [BREAK-EVEN QUERY] Break-even data received:', data);
      return data;
    },
    enabled: activeTab === "break-even",
  });

  // Query per profittabilità menu con mese specifico
  const { data: menuProfitability, isLoading: isMenuLoading, refetch: refetchMenu } = useQuery({
    queryKey: ["/api/cost-analysis/menu-profitability", monthKey, dateRange.start, dateRange.end],
    queryFn: async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(`/api/cost-analysis/menu-profitability?startDate=${dateRange.start}&endDate=${dateRange.end}&year=${year}&month=${month}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    enabled: activeTab === "menu-profitability",
  });

  // Query per efficienza del lavoro con mese specifico
  const { data: laborEfficiency, isLoading: isLaborLoading, refetch: refetchLabor } = useQuery({
    queryKey: ["/api/cost-analysis/labor-efficiency", monthKey, dateRange.start, dateRange.end],
    queryFn: async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(`/api/cost-analysis/labor-efficiency?startDate=${dateRange.start}&endDate=${dateRange.end}&year=${year}&month=${month}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    enabled: activeTab === "labor-efficiency",
  });

  // Query per caricare configurazione salvata del mese corrente
  const { data: savedConfiguration, isLoading: isLoadingConfig, refetch: refetchConfiguration } = useQuery({
    queryKey: ["/api/cost-analysis/load-configuration", monthKey],
    queryFn: async () => {
      const response = await fetch(`/api/cost-analysis/load-configuration?month=${monthKey}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Funzioni per generare report PDF
  const generateReport = async (type: 'monthly' | 'annual') => {
    setIsGeneratingReport(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const url = `/api/cost-analysis-reports/generate-pdf-report?type=${type}&year=${year}${type === 'monthly' ? `&month=${month}` : ''}`;

      console.log(`🚀 [PDF Report] Inizio generazione report ${type}`);
      console.log(`📋 [PDF Report] URL richiesta: ${url}`);
      console.log(`📅 [PDF Report] Anno: ${year}, Mese: ${month}`);

      // Usa fetch per gestire meglio la risposta
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      console.log(`📡 [PDF Report] Risposta ricevuta:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   StatusText: ${response.statusText}`);
      console.log(`   OK: ${response.ok}`);

      // Log degli headers della risposta
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log(`   Headers:`, headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [PDF Report] Errore del server:`, errorText);
        throw new Error(`Errore del server: ${response.status} - ${errorText}`);
      }

      // Controlla che la risposta sia effettivamente un PDF
      const contentType = response.headers.get('content-type');
      console.log(`📄 [PDF Report] Content-Type ricevuto: ${contentType}`);

      if (!contentType || !contentType.includes('application/pdf')) {
        // Leggi il contenuto della risposta per capire cosa è stato restituito
        const responseText = await response.text();
        console.error(`❌ [PDF Report] Contenuto risposta (non PDF):`, responseText.substring(0, 500));
        throw new Error(`La risposta del server non è un PDF valido. Content-Type: ${contentType}`);
      }

      // Ottieni il blob del PDF
      const blob = await response.blob();
      console.log(`📦 [PDF Report] Blob ricevuto:`);
      console.log(`   Dimensione: ${blob.size} bytes`);
      console.log(`   Tipo: ${blob.type}`);

      if (blob.size === 0) {
        console.error(`❌ [PDF Report] Il blob è vuoto`);
        throw new Error('Il PDF generato è vuoto');
      }

      if (blob.size < 1000) {
        console.warn(`⚠️ [PDF Report] Il blob è molto piccolo (${blob.size} bytes), potrebbe essere corrotto`);
      }

      // Crea un URL per il blob
      const blobUrl = window.URL.createObjectURL(blob);
      console.log(`🔗 [PDF Report] Blob URL creato: ${blobUrl}`);

      // Crea un link temporaneo per scaricare il PDF
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `report-${type}-${year}${type === 'monthly' ? `-${month.toString().padStart(2, '0')}` : ''}.pdf`;

      // Triggera il download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Pulisci l'URL del blob
      window.URL.revokeObjectURL(blobUrl);

      console.log(`✅ [PDF Report] Report ${type} generato con successo`);

      // Mostra notifica di successo
      alert(`Report ${type} scaricato con successo!`);

    } catch (error) {
      console.error('❌ [PDF Report] Errore nella generazione del report:', error);
      console.error('❌ [PDF Report] Stack trace:', error.stack);
      alert(`Errore nella generazione del report: ${error.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Effect per ricaricare configurazione quando cambia il mese
  useEffect(() => {
    console.log('📅 [EFFECT] Month changed to:', monthKey, '- Refetching configuration...');
    console.log('📅 [EFFECT] currentMonth nell\'effect:', currentMonth);
    console.log('📅 [EFFECT] currentMonth.getFullYear():', currentMonth.getFullYear());
    console.log('📅 [EFFECT] currentMonth.getMonth():', currentMonth.getMonth());
    console.log('📅 [EFFECT] format(currentMonth, "yyyy-MM"):', format(currentMonth, 'yyyy-MM'));
    
    refetchConfiguration();
    // Ricarica anche i dati del dashboard quando cambia il mese
    refetchDashboard();
  }, [monthKey, refetchConfiguration, refetchDashboard]);

  // Effect per aggiornare gli stati quando si cambiano i dati o il mese
  useEffect(() => {
    if (savedConfiguration && !isLoadingConfig) {
      console.log('Loading configuration for month:', monthKey);
      // Sempre aggiorna con i dati dal database, anche se sono 0
      if (savedConfiguration.fixedCosts) {
        setFixedCosts(savedConfiguration.fixedCosts);
        console.log('Costi fissi caricati dal database per', monthKey, ':', savedConfiguration.fixedCosts);
      }
      if (savedConfiguration.laborSettings) {
        setLaborSettings(savedConfiguration.laborSettings);
        console.log('Impostazioni lavoro caricate dal database per', monthKey, ':', savedConfiguration.laborSettings);
      }
      if (savedConfiguration.advancedCosts) {
        setAdvancedCosts(savedConfiguration.advancedCosts);
        console.log('Costi avanzati caricati dal database per', monthKey, ':', savedConfiguration.advancedCosts);
      }
      if (savedConfiguration.debts) {
        setDebts(savedConfiguration.debts);
        console.log('Debiti caricati dal database per', monthKey, ':', savedConfiguration.debts);
      }
    }
  }, [savedConfiguration, isLoadingConfig, monthKey]);

  // Render Dashboard Principale
  const renderDashboard = () => {
    if (isDashboardLoading) {
      return <div className="text-center py-8">Caricamento dashboard...</div>;
    }

    if (!dashboardData) {
      return <div className="text-center py-8">Nessun dato disponibile</div>;
    }

    const { monthlyAnalysis, dailyAnalysis, topProfitableItems, averageLaborEfficiency } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Header con navigazione mensile */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Dashboard Finanziaria</h3>
            <p className="text-sm text-gray-600">
              Analisi per {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('🎯 [DASHBOARD MAIN] Clic su pulsante "Mese Precedente" del dashboard principale');
                goToPreviousMonth();
              }}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('🎯 [DASHBOARD MAIN] Clic su pulsante "Oggi" del dashboard principale');
                goToCurrentMonth();
              }}
              className="px-3 py-2 text-sm"
            >
              Oggi
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('🎯 [DASHBOARD MAIN] Clic su pulsante "Prossimo Mese" del dashboard principale');
                goToNextMonth();
              }}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchDashboard();
                refetchBreakEven();
                refetchMenu();
                refetchLabor();
              }}
              className="px-3 py-2 text-sm text-green-600 hover:text-green-800 border-green-200 hover:border-green-300"
            >
              🔄 Aggiorna
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Break-Even Giornaliero</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dailyAnalysis?.breakEvenRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {dailyAnalysis?.breakEvenUnits || 0} ordini necessari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Break-Even Mensile</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyAnalysis?.breakEvenRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {monthlyAnalysis?.breakEvenUnits || 0} ordini necessari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profitto/Perdita Oggi</CardTitle>
              {(dailyAnalysis?.profitLoss || 0) >= 0 ? 
                <TrendingUp className="h-4 w-4 text-green-600" /> : 
                <TrendingDown className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(dailyAnalysis?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dailyAnalysis?.profitLoss || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margine di sicurezza: {(dailyAnalysis?.marginOfSafety || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficienza Lavoro Media</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(averageLaborEfficiency?.avgLaborCostPercentage || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(averageLaborEfficiency?.avgRevenuePerLaborHour || 0)}/ora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analisi Dettagliate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Piatti Redditizi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Piatti Più Redditizi (Ultimi 7 giorni)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProfitableItems?.slice(0, 5).map((item: MenuProfitability, index: number) => (
                  <div key={item.itemId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-sm text-gray-500">
                        Venduti: {item.unitsSold} | Margine: {item.contributionMarginPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(item.totalProfit)}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(item.contributionMargin)}/unità</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Riepilogo Costi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Riepilogo Costi Mensili
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costi Fissi</span>
                  <span className="font-bold">{formatCurrency(monthlyAnalysis?.totalFixedCosts || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costi Variabili</span>
                  <span className="font-bold">{formatCurrency(monthlyAnalysis?.totalVariableCosts || 0)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Fatturato Necessario</span>
                    <span className="font-bold text-blue-600">{formatCurrency(monthlyAnalysis?.breakEvenRevenue || 0)}</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Situazione Attuale:</strong><br/>
                    Fatturato: {formatCurrency(monthlyAnalysis?.actualRevenue || 0)}<br/>
                    {(monthlyAnalysis?.profitLoss || 0) >= 0 ? 
                      <span className="text-green-600">Profitto: {formatCurrency(monthlyAnalysis?.profitLoss || 0)}</span> :
                      <span className="text-red-600">Perdita: {formatCurrency(Math.abs(monthlyAnalysis?.profitLoss || 0))}</span>
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render Break-Even Analysis
  const renderBreakEvenAnalysis = () => {
    if (isBreakEvenLoading) {
      return <div className="text-center py-8">Caricamento analisi break-even...</div>;
    }

    if (!breakEvenData) {
      return <div className="text-center py-8">Nessun dato disponibile</div>;
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Analisi Break-Even</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Tipo di Analisi</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giorno Specifico</SelectItem>
                  <SelectItem value="monthly">Mese Completo</SelectItem>
                  <SelectItem value="annual">Anno Completo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {analysisType === 'daily' && 'Analisi break-even per il giorno selezionato'}
                {analysisType === 'monthly' && 'Analisi break-even per tutto il mese selezionato'}
                {analysisType === 'annual' && 'Analisi break-even per tutto l\'anno selezionato'}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <Label className="text-sm">Data:</Label>
              <Select 
                value={selectedDate.day.toString()} 
                onValueChange={(value) => setSelectedDate(prev => ({...prev, day: parseInt(value)}))}
                disabled={analysisType !== 'daily'}
              >
                <SelectTrigger className={`w-16 ${analysisType !== 'daily' ? 'opacity-50' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={selectedDate.month.toString()} 
                onValueChange={(value) => {
                  const newMonth = parseInt(value);
                  setSelectedDate(prev => ({...prev, month: newMonth}));
                  console.log('📅 Break-even month changed to:', newMonth);
                  // Sincronizza il currentMonth per caricare la configurazione corretta
                  const newDate = new Date(selectedDate.year, newMonth - 1, selectedDate.day);
                  setCurrentMonth(newDate);
                  console.log('📅 CurrentMonth synchronized for cost configuration:', newDate);
                }}
                disabled={analysisType === 'annual'}
              >
                <SelectTrigger className={`w-32 ${analysisType === 'annual' ? 'opacity-50' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Gennaio</SelectItem>
                  <SelectItem value="2">Febbraio</SelectItem>
                  <SelectItem value="3">Marzo</SelectItem>
                  <SelectItem value="4">Aprile</SelectItem>
                  <SelectItem value="5">Maggio</SelectItem>
                  <SelectItem value="6">Giugno</SelectItem>
                  <SelectItem value="7">Luglio</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Settembre</SelectItem>
                  <SelectItem value="10">Ottobre</SelectItem>
                  <SelectItem value="11">Novembre</SelectItem>
                  <SelectItem value="12">Dicembre</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDate.year.toString()} onValueChange={(value) => {
                  const newYear = parseInt(value);
                  setSelectedDate(prev => ({...prev, year: newYear}));
                  console.log('📅 Break-even year changed to:', newYear);
                  // Sincronizza il currentMonth per caricare la configurazione corretta
                  const newDate = new Date(newYear, selectedDate.month - 1, selectedDate.day);
                  setCurrentMonth(newDate);
                  console.log('📅 CurrentMonth synchronized for cost configuration:', newDate);
                }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Punto di Pareggio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(breakEvenData.breakEvenRevenue)}
                </div>
                <div className="text-sm text-gray-500">Fatturato necessario</div>
              </div>
              <div>
                <div className="text-xl font-semibold">
                  {breakEvenData.breakEvenUnits} ordini
                </div>
                <div className="text-sm text-gray-500">Unità da vendere</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Struttura Costi Dettagliata
                <Badge variant="outline" className="ml-2">
                  {analysisType === 'daily' ? 'Giornaliera' : 
                   analysisType === 'monthly' ? 'Mensile' : 'Annuale'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                let displayTotal, displayFixed, displayVariable, displayOperational, displayDepreciation, displayLabor, displayDebts;
                
                if (analysisType === 'annual') {
                  // Per l'analisi annuale, usa i dati dal backend che ha già calcolato la somma di tutti i mesi
                  displayFixed = breakEvenData.totalFixedCosts || 0;
                  displayVariable = breakEvenData.totalVariableCosts || 0;
                  displayOperational = 0; // I costi operativi sono inclusi nei costi fissi dal backend
                  displayDepreciation = 0; // Gli ammortamenti sono inclusi nei costi fissi dal backend
                  displayLabor = 0; // I costi lavoro sono inclusi nei costi fissi o variabili dal backend
                  displayDebts = 0; // I debiti sono inclusi nei costi fissi dal backend
                  displayTotal = displayFixed + displayVariable;
                } else {
                  // Per analisi giornaliera e mensile, usa la configurazione locale
                  const fixedTotal = Object.values(fixedCosts).reduce((sum, val) => sum + (Number(val) || 0), 0);
                  const variableTotal = (advancedCosts.foodCostMonthly || 0) + (advancedCosts.beverageCostMonthly || 0) + (advancedCosts.packagingCosts || 0) + (advancedCosts.deliveryCommissions || 0);
                  const operationalTotal = (advancedCosts.maintenanceEquipment || 0) + (advancedCosts.cleaningSupplies || 0) + (advancedCosts.uniformsAndLaundry || 0) + (advancedCosts.phoneTelecomm || 0) + (advancedCosts.marketingBudget || 0) + (advancedCosts.socialMediaAds || 0) + (advancedCosts.loyaltyProgramCosts || 0) + (advancedCosts.wasteDisposal || 0);
                  const depreciationTotal = (advancedCosts.kitchenEquipment || 0) + (advancedCosts.furnitureFixtures || 0) + (advancedCosts.posSystemSoftware || 0);
                  const laborTotal = (advancedCosts.socialContributions || 0) + (advancedCosts.training || 0) + (advancedCosts.overtimePremium || 0) + (advancedCosts.seasonalStaffing || 0);
                  const debtsTotal = (debts.bankLoan || 0) + (debts.equipmentFinancing || 0) + (debts.supplierCredit || 0) + (debts.leasing || 0) + (debts.otherDebts || 0);
                  
                  const monthlyTotal = fixedTotal + variableTotal + operationalTotal + depreciationTotal + laborTotal + debtsTotal;
                  const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
                  
                  if (analysisType === 'daily') {
                    displayTotal = monthlyTotal / daysInMonth;
                    displayFixed = fixedTotal / daysInMonth;
                    displayVariable = variableTotal / daysInMonth;
                    displayOperational = operationalTotal / daysInMonth;
                    displayDepreciation = depreciationTotal / daysInMonth;
                    displayLabor = laborTotal / daysInMonth;
                    displayDebts = debtsTotal / daysInMonth;
                  } else {
                    displayTotal = monthlyTotal;
                    displayFixed = fixedTotal;
                    displayVariable = variableTotal;
                    displayOperational = operationalTotal;
                    displayDepreciation = depreciationTotal;
                    displayLabor = laborTotal;
                    displayDebts = debtsTotal;
                  }
                }

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Costi Fissi</span>
                      <span className="font-semibold">{formatCurrency(displayFixed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Costi Variabili</span>
                      <span className="font-semibold">{formatCurrency(displayVariable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Costi Operativi</span>
                      <span className="font-semibold">{formatCurrency(displayOperational)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Ammortamenti</span>
                      <span className="font-semibold">{formatCurrency(displayDepreciation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Costi Lavoro</span>
                      <span className="font-semibold">{formatCurrency(displayLabor)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        Debiti e Rate
                      </span>
                      <span className="font-semibold text-red-600">{formatCurrency(displayDebts)}</span>
                    </div>
                    <div className="border-t-2 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">
                          Totale {analysisType === 'daily' ? 'Giornaliero' : analysisType === 'monthly' ? 'Mensile' : 'Annuale'}
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(displayTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Performance Attuale
                <Badge variant="outline" className="ml-2">
                  {analysisType === 'daily' ? 'Giornaliera' : 
                   analysisType === 'monthly' ? 'Mensile' : 'Annuale'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                let displayRevenue, displayProfit;
                
                if (analysisType === 'annual') {
                  // Per l'analisi annuale, usa i dati dal backend che contengono già i valori corretti
                  displayRevenue = breakEvenData.actualRevenue || 0;
                  displayProfit = breakEvenData.profitLoss || 0;
                } else {
                  // Per analisi giornaliera e mensile
                  const monthlyRevenue = breakEvenData.actualRevenue || 0;
                  const monthlyProfit = breakEvenData.profitLoss || 0;
                  const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
                  
                  if (analysisType === 'daily') {
                    displayRevenue = monthlyRevenue / daysInMonth;
                    displayProfit = monthlyProfit / daysInMonth;
                  } else {
                    displayRevenue = monthlyRevenue;
                    displayProfit = monthlyProfit;
                  }
                }

                const profitMargin = displayRevenue > 0 ? (displayProfit / displayRevenue) * 100 : 0;

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Fatturato</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(displayRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {displayProfit >= 0 ? 'Profitto' : 'Perdita'}
                      </span>
                      <span className={`text-xl font-bold ${displayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(displayProfit))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Margine di Profitto</span>
                      <span className="text-lg font-semibold">
                        {profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-700">Margine di Sicurezza</span>
                      <span className="text-lg font-semibold text-amber-600">
                        {(breakEvenData.marginOfSafety || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Analisi Break-Even Dettagliata con Scenari */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Analisi Scenari Break-Even
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Scenario Attuale */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">📊 Scenario Attuale</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Fatturato Attuale:</span>
                      <div className="font-semibold">{formatCurrency(breakEvenData.actualRevenue || 0)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Break-Even:</span>
                      <div className="font-semibold text-blue-600">{formatCurrency(breakEvenData.breakEvenRevenue)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Gap:</span>
                      <div className={`font-semibold ${(breakEvenData.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(breakEvenData.profitLoss || 0))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Stato:</span>
                      <div className={`font-semibold ${(breakEvenData.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(breakEvenData.profitLoss || 0) >= 0 ? 'In Profitto' : 'In Perdita'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario Ottimistico */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🚀 Scenario Ottimistico (+20%)</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Fatturato Previsto:</span>
                      <div className="font-semibold text-green-700">{formatCurrency((breakEvenData.actualRevenue || 0) * 1.2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Profitto Stimato:</span>
                      <div className="font-semibold text-green-700">
                        {formatCurrency(((breakEvenData.actualRevenue || 0) * 1.2) - breakEvenData.breakEvenRevenue)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario Pessimistico */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Scenario Pessimistico (-15%)</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Fatturato Ridotto:</span>
                      <div className="font-semibold text-red-700">{formatCurrency((breakEvenData.actualRevenue || 0) * 0.85)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Perdita Stimata:</span>
                      <div className="font-semibold text-red-700">
                        {formatCurrency(breakEvenData.breakEvenRevenue - ((breakEvenData.actualRevenue || 0) * 0.85))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Obiettivi di Fatturato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Calcoli per diversi margini di profitto */}
                {[0, 10, 20, 30].map(profitMargin => {
                  const totalCosts = Object.values(fixedCosts).reduce((sum, val) => sum + (Number(val) || 0), 0) + 
                                   (advancedCosts.foodCostMonthly || 0) + (advancedCosts.beverageCostMonthly || 0) + (advancedCosts.packagingCosts || 0) + (advancedCosts.deliveryCommissions || 0) +
                                   (advancedCosts.maintenanceEquipment || 0) + (advancedCosts.cleaningSupplies || 0) + (advancedCosts.uniformsAndLaundry || 0) + (advancedCosts.phoneTelecomm || 0) + (advancedCosts.marketingBudget || 0) + (advancedCosts.socialMediaAds || 0) + (advancedCosts.loyaltyProgramCosts || 0) + (advancedCosts.wasteDisposal || 0) +
                                   (advancedCosts.kitchenEquipment || 0) + (advancedCosts.furnitureFixtures || 0) + (advancedCosts.posSystemSoftware || 0) +
                                   (advancedCosts.socialContributions || 0) + (advancedCosts.training || 0) + (advancedCosts.overtimePremium || 0) + (advancedCosts.seasonalStaffing || 0) +
                                   (debts.bankLoan || 0) + (debts.equipmentFinancing || 0) + (debts.supplierCredit || 0) + (debts.leasing || 0) + (debts.otherDebts || 0);
                  
                  const targetRevenue = totalCosts * (1 + profitMargin / 100);
                  const ordersNeeded = Math.ceil(targetRevenue / (advancedCosts.averageCustomerValue || 25));
                  
                  return (
                    <div key={profitMargin} className={`p-4 rounded-lg border-2 ${
                      profitMargin === 0 ? 'bg-yellow-50 border-yellow-200' :
                      profitMargin === 10 ? 'bg-blue-50 border-blue-200' :
                      profitMargin === 20 ? 'bg-green-50 border-green-200' :
                      'bg-purple-50 border-purple-200'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-semibold ${
                          profitMargin === 0 ? 'text-yellow-800' :
                          profitMargin === 10 ? 'text-blue-800' :
                          profitMargin === 20 ? 'text-green-800' :
                          'text-purple-800'
                        }`}>
                          {profitMargin === 0 ? '🎯 Break-Even' : `💰 +${profitMargin}% Profitto`}
                        </h4>
                        <Badge variant={profitMargin === 0 ? "secondary" : "default"}>
                          {profitMargin}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Fatturato Target:</span>
                          <div className="font-bold">{formatCurrency(targetRevenue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Ordini Necessari:</span>
                          <div className="font-bold">{ordersNeeded.toLocaleString()}</div>
                        </div>
                      </div>
                      {profitMargin > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-xs text-gray-600">Profitto mensile: </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(targetRevenue - totalCosts)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interpretazione Risultati */}
        <Card>
          <CardHeader>
            <CardTitle>Interpretazione e Raccomandazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(breakEvenData.profitLoss || 0) >= 0 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Situazione Positiva</h4>
                  <p className="text-green-700">
                    Il ristorante sta generando profitto. Il margine di sicurezza del {(breakEvenData.marginOfSafety || 0).toFixed(1)}% 
                    indica la distanza dal punto di pareggio.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ Attenzione Richiesta</h4>
                  <p className="text-red-700">
                    Il ristorante non ha ancora raggiunto il punto di pareggio. 
                    Servono {formatCurrency(breakEvenData.breakEvenRevenue - (breakEvenData.actualRevenue || 0))} 
                    aggiuntivi di fatturato per andare in pareggio.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Suggerimenti per Aumentare i Ricavi</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Promuovere piatti con maggior margine di contribuzione</li>
                    <li>• Ottimizzare i prezzi dei piatti sottoperformanti</li>
                    <li>• Aumentare il numero medio di portate per tavolo</li>
                    <li>• Implementare strategie di upselling</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚡ Suggerimenti per Ridurre i Costi</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Negoziare contratti con fornitori</li>
                    <li>• Ottimizzare le porzioni per ridurre sprechi</li>
                    <li>• Migliorare l'efficienza del personale</li>
                    <li>• Rivedere i costi fissi non essenziali</li>
                    <li>• Rinegoziare debiti per ridurre rate mensili</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Mini tutorial discreto che si nasconde dopo essere stato visualizzato
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('cost_analysis_tutorial_seen');
  });

  const hideTutorial = () => {
    localStorage.setItem('cost_analysis_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  return (
    <div className="space-y-6">
      {showTutorial && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 relative">
          <button 
            onClick={hideTutorial}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">💡 Come utilizzare l'Analisi Costi</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1. Gestione Costi:</strong> Inserisci i tuoi costi reali nelle categorie (fissi, lavoro, variabili, operativi)</p>
                <p><strong>2. Salvataggio:</strong> Clicca "Salva Configurazione" per memorizzare i dati nel database</p>
                <p><strong>3. Break-Even:</strong> Visualizza automaticamente quando il tuo ristorante va in pareggio</p>
                <p><strong>4. Tooltip:</strong> Passa il mouse sui punti interrogativi <HelpCircle className="w-3 h-3 inline text-gray-500" /> per spiegazioni dettagliate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analisi Costi e Break-Even</h2>
          <p className="text-gray-600 mt-1">Monitora la redditività e ottimizza la gestione finanziaria</p>
        </div>
        <Button onClick={() => {
          refetchDashboard();
          refetchBreakEven();
          refetchMenu();
          refetchLabor();
        }}>
          <Calculator className="w-4 h-4 mr-2" />
          Aggiorna Analisi
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 gap-1 mb-6">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <DollarSign className="mr-1 text-lg" />
            Dashboard
          </TabsTrigger>
          
          <TabsTrigger value="break-even" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
            <Calculator className="mr-1 text-lg" />
            Break-Even
          </TabsTrigger>
          <TabsTrigger value="menu-profitability" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600">
            <ChefHat className="mr-1 text-lg" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="revenue-management" className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-600">
            <TrendingUp className="mr-1 text-lg" />
            Fatturato
          </TabsTrigger>
          <TabsTrigger value="costs-management" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
            <Users className="mr-1 text-lg" />
            Gestione Costi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="objectives" className="mt-0">
          <div className="space-y-6">
            <div className="text-center py-8">
              <Target className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gestione Obiettivi
              </h3>
              <p className="text-gray-600">
                Questa sezione per la gestione degli obiettivi sarà implementata nel prossimo aggiornamento.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="break-even" className="mt-0">
          {renderBreakEvenAnalysis()}
        </TabsContent>

        <TabsContent value="menu-profitability" className="mt-0">
          <MenuProfitabilityAnalysis />
        </TabsContent>

        <TabsContent value="revenue-management" className="mt-0">
          <RevenueManagement 
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            onRevenueSettingsChange={() => {
              // Ricarica i dati del dashboard quando cambiano le impostazioni fatturato
              refetchDashboard();
              refetchBreakEven();
            }}
            onMonthChange={() => {
              // Ricarica tutti i dati quando cambia il mese
              refetchDashboard();
              refetchBreakEven();
              refetchMenu();
              refetchLabor();
              refetchConfiguration();
            }}
          />
        </TabsContent>

        <TabsContent value="costs-management" className="mt-0">
          <AdvancedCostManagement 
            fixedCosts={fixedCosts}
            setFixedCosts={setFixedCosts}
            laborSettings={laborSettings}
            setLaborSettings={setLaborSettings}
            advancedCosts={advancedCosts}
            setAdvancedCosts={setAdvancedCosts}
            debts={debts}
            setDebts={setDebts}
            generateReport={generateReport}
            isGeneratingReport={isGeneratingReport}
            currentMonth={currentMonth}
            onMonthChange={() => {
              // Ricarica tutti i dati quando cambia il mese
              refetchDashboard();
              refetchBreakEven();
              refetchMenu();
              refetchLabor();
              refetchConfiguration();
            }}
            setIsGeneratingReport={setIsGeneratingReport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AdvancedCostManagementProps {
  fixedCosts: any;
  setFixedCosts: (costs: any) => void;
  laborSettings: any;
  setLaborSettings: (settings: any) => void;
  advancedCosts: any;
  setAdvancedCosts: (costs: any) => void;
  debts: any;
  setDebts: (debts: any) => void;
  generateReport: (type: 'monthly' | 'annual') => Promise<void>;
  isGeneratingReport: boolean;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  setIsGeneratingReport: (isGenerating: boolean) => void;
}

// Componente avanzato per la gestione completa dei costi
interface AdvancedCostManagementProps {
  fixedCosts: any;
  setFixedCosts: (costs: any) => void;
  laborSettings: any;
  setLaborSettings: (settings: any) => void;
  advancedCosts: any;
  setAdvancedCosts: (costs: any) => void;
  debts: any;
  setDebts: (debts: any) => void;
  generateReport: (type: 'monthly' | 'annual') => Promise<void>;
  isGeneratingReport: boolean;
  currentMonth: Date;
  onMonthChange: () => void;
  setIsGeneratingReport: (isGenerating: boolean) => void;
}

const AdvancedCostManagement = ({ 
  fixedCosts, 
  setFixedCosts, 
  laborSettings, 
  setLaborSettings, 
  advancedCosts, 
  setAdvancedCosts,
  debts,
  setDebts,
  generateReport,
  isGeneratingReport,
  currentMonth,
  onMonthChange,
  setIsGeneratingReport
}: AdvancedCostManagementProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openNotesSection, setOpenNotesSection] = useState<string | null>(null);
  // La configurazione viene ora caricata dal componente parent, non serve caricarla qui
  // I dati arrivano già attraverso le props fixedCosts, laborSettings, advancedCosts

  const handleAdvancedCostChange = (field: string, value: number) => {
    setAdvancedCosts((prev: any) => ({ ...prev, [field]: value }));
  };

  const calculateCategorySummary = (category: string) => {
    const categoryFields = {
      'fixed': ['rent', 'utilities', 'insurance', 'staffSalaries', 'equipment', 'other'],
      'variable': ['foodCostMonthly', 'beverageCostMonthly', 'packagingCosts', 'deliveryCommissions'],
      'operational': ['maintenanceEquipment', 'cleaningSupplies', 'uniformsAndLaundry', 'phoneTelecomm', 'marketingBudget', 'socialMediaAds', 'loyaltyProgramCosts', 'wasteDisposal'],
      'depreciation': ['kitchenEquipment', 'furnitureFixtures', 'posSystemSoftware'],
      'labor': ['socialContributions', 'training', 'overtimePremium', 'seasonalStaffing'],
      'debts': ['bankLoan', 'equipmentFinancing', 'supplierCredit', 'leasing', 'otherDebts'],
      'kpi': ['averageCustomerValue', 'targetProfitMargin', 'customerRetentionRate', 'peakHoursMultiplier']
    };

    if (category === 'fixed') {
      return Object.entries(fixedCosts).reduce((sum, [key, value]) => sum + (Number(value) || 0), 0);
    }

    if (category === 'debts') {
      return Object.entries(debts).reduce((sum, [key, value]) => sum + (Number(value) || 0), 0);
    }

    return categoryFields[category as keyof typeof categoryFields]?.reduce((sum, field) => 
      sum + (Number(advancedCosts[field]) || 0), 0) || 0;
  };

  const renderCostSection = (title: string, icon: any, fields: any[], category: string, color: string) => {
    const Icon = icon;
    const getTooltipContent = (category: string) => {
      switch(category) {
        case 'fixed': return "Costi che rimangono costanti indipendentemente dal volume di vendite (affitto, assicurazioni, stipendi fissi)";
        case 'labor': return "Costi legati al personale oltre agli stipendi base (contributi, formazione, straordinari)";
        case 'variable': return "Costi variabili mensili fissi (cibo, bevande, packaging, commissioni delivery)";
        case 'operational': return "Costi operativi quotidiani per mantenere il ristorante funzionante";
        case 'depreciation': return "Ammortamento mensile di attrezzature, mobili e software";
        case 'debts': return "Rate mensili di debiti e finanziamenti (prestiti bancari, leasing, finanziamenti attrezzature)";
        case 'kpi': return "Metriche chiave per misurare performance e definire obiettivi di profittabilità";
        default: return "Categoria di costi del ristorante";
      }
    };

    const total = calculateCategorySummary(category);
    const getColorClasses = (color: string) => {
      const colorMap = {
        'blue': { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', border: 'border-blue-200' },
        'green': { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600', border: 'border-green-200' },
        'yellow': { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600', border: 'border-yellow-200' },
        'orange': { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600', border: 'border-orange-200' },
        'red': { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', border: 'border-red-200' },
        'purple': { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600', border: 'border-purple-200' }
      };
      return colorMap[color as keyof typeof colorMap] || colorMap['blue'];
    };

    const colors = getColorClasses(color);

    return (
      <Card className={`h-full border-2 ${colors.border} shadow-lg hover:shadow-xl transition-all duration-200`}>
        <CardHeader className={`${colors.bg} border-b-2 ${colors.border} rounded-t-lg`}>
          <CardTitle className={`flex items-center gap-3 ${colors.text} text-lg font-bold`}>
            <div className={`p-3 rounded-xl bg-white shadow-md border-2 ${colors.border}`}>
              <Icon className={`w-7 h-7 ${colors.icon}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{title}</span>
                  <HelpTooltip title={`Come funziona: ${title}`} className="ml-1">
                    {getTooltipContent(category)}
                  </HelpTooltip>
                </div>
                <Dialog open={openNotesSection === category} onOpenChange={(open) => setOpenNotesSection(open ? category : null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-1 hover:${colors.bg} hover:${colors.text} hover:border-${colors.border}`}
                    >
                      <StickyNote className="w-4 h-4" />
                      Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <NotebookPen className="w-5 h-5" />
                        Note per {title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      {/* Note generali per la sezione */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Note generali della sezione</h4>
                        <CostNoteField
                          sectionType={category}
                          sectionKey={`section_${category}`}
                          monthKey={format(currentMonth, 'yyyy-MM')}
                          placeholder={`Aggiungi note generali per ${title}...`}
                          onSave={() => {}}
                        />
                      </div>
                      
                      {/* Tabella delle sottocategorie */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Note per ogni voce di costo</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voce di Costo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore Attuale</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {fields.map(({ key, label, type = 'currency' }) => {
                                const value = category === 'fixed' ? fixedCosts[key] : 
                                             category === 'debts' ? debts[key] : 
                                             advancedCosts[key];
                                return (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{label}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className={`text-sm ${value > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                                        €{(value || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                        {type === 'percentage' && '%'}
                                        {type === 'multiplier' && '×'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="w-full">
                                        <CostNoteField
                                          sectionType={category}
                                          sectionKey={key}
                                          monthKey={format(currentMonth, 'yyyy-MM')}
                                          placeholder={`Note per ${label}...`}
                                          onSave={() => {}}
                                          className="text-xs"
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="text-sm font-medium text-gray-600 mt-1">
                {category === 'kpi' 
                  ? `Metriche chiave di performance`
                  : `${fields.length} voci di costo configurabili`
                }
              </div>
            </div>
          </CardTitle>
          <div className={`bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 shadow-lg border-2 ${colors.border} mt-3`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-700 block">
                  {category === 'kpi' ? 'Valore Cliente Medio' : 'Totale Categoria'}
                </span>
                <span className="text-xs text-gray-500">
                  {category === 'kpi' ? 'Target per cliente' : 'Somma mensile'}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${colors.text} tracking-tight`}>
                  €{total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {total === 0 ? 'Non configurato' : `${fields.length} campi configurati`}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 pb-6">
          {fields.map(({ key, label, type = 'currency', step = 0.01 }) => {
            const value = category === 'fixed' ? fixedCosts[key] : 
                         category === 'debts' ? debts[key] : 
                         advancedCosts[key];
            return (
              <div key={key} className={`group p-4 rounded-xl border-2 transition-all duration-200 ${
                value > 0 
                  ? `${colors.border} ${colors.bg} shadow-md hover:shadow-lg` 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <Label className={`text-sm font-medium ${value > 0 ? colors.text : 'text-gray-700'} group-hover:text-gray-900`}>
                      {label}
                    </Label>
                    {value > 0 && (
                      <div className={`text-xs font-semibold mt-1 ${colors.text}`}>
                        Configurato: €{value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {value > 0 && (
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                        €{value.toLocaleString('it-IT')}
                      </div>
                    )}
                    <div className="relative">
                      <Input
                        type="number"
                        value={value || ''}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          if (category === 'fixed') {
                            setFixedCosts((prev: any) => ({ ...prev, [key]: newValue }));
                          } else if (category === 'debts') {
                            setDebts((prev: any) => ({ ...prev, [key]: newValue }));
                          } else {
                            handleAdvancedCostChange(key, newValue);
                          }
                        }}
                        className={`w-28 text-right text-sm font-medium transition-all ${
                          value > 0 
                            ? `border-2 ${colors.border} focus:ring-2 focus:ring-opacity-20` 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        step={step}
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <span className={`text-xs font-medium ${value > 0 ? colors.text : 'text-gray-400'}`}>
                          {type === 'percentage' ? '%' : type === 'multiplier' ? '×' : '€'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  // Funzioni per la navigazione temporale
  const getCurrentMonthKey = () => format(currentMonth, 'yyyy-MM');

  const navigateMonth = (direction: 'prev' | 'next') => {
    console.log('🎛️ [ADVANCED COSTS] === NAVIGAZIONE MESE IN GESTIONE COSTI ===');
    console.log('🎛️ [ADVANCED COSTS] Direction:', direction);
    console.log('🎛️ [ADVANCED COSTS] currentMonth prima:', currentMonth);
    
    // Calcola la nuova data basata sulla direzione
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    console.log('🎛️ [ADVANCED COSTS] Nuova data calcolata:', newDate);
    console.log('🎛️ [ADVANCED COSTS] Nuovo monthKey sarà:', format(newDate, 'yyyy-MM'));
    
    // Aggiorna il currentMonth nel componente principale usando la prop del Dashboard
    // Questo deve essere passato come callback dal Dashboard principale
    if (window.updateCurrentMonthFromAdvanced) {
      window.updateCurrentMonthFromAdvanced(newDate);
    }
    
    // Notifica il componente parent che il mese è cambiato
    setTimeout(() => onMonthChange(), 100);
    
    console.log('🎛️ [ADVANCED COSTS] Navigazione completata');
  };

  // La configurazione viene ora caricata dal componente parent, non serve caricarla qui
  // I dati arrivano già attraverso le props fixedCosts, laborSettings, advancedCosts, debts

  return (
    <div className="space-y-6">
      {/* Controlli di navigazione temporale */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Periodo di Analisi</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Configurazione mensile attuale
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🎛️ [ADVANCED COSTS] Clic su "Mese Precedente" in Gestione Costi');
                navigateMonth('prev');
              }}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Mese Precedente
            </Button>

            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: it })}
              </h4>
              <p className="text-sm text-gray-500">
                Configurazione costi per questo mese
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🎛️ [ADVANCED COSTS] Clic su "Prossimo Mese" in Gestione Costi');
                navigateMonth('next');
              }}
              className="flex items-center gap-2"
            >
              Prossimo Mese
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header con overview migliorato */}
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="bg-white p-3 rounded-xl shadow-md border-2 border-purple-200">
            <Settings className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-2xl font-bold text-purple-900">Gestione Avanzata dei Costi</h3>
              <div className="text-right">
                <p className="text-sm text-purple-700">Totale Mensile Configurato</p>
                <p className="text-3xl font-bold text-purple-900">
                  €{(calculateCategorySummary('fixed') + calculateCategorySummary('variable') + calculateCategorySummary('operational') + calculateCategorySummary('depreciation') + calculateCategorySummary('labor') + calculateCategorySummary('debts')).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-purple-700 mb-6">
              Sistema professionale per il controllo finanziario completo • 
              <span className="font-semibold"> {Object.keys(fixedCosts).length + Object.keys(advancedCosts).length} variabili di costo configurabili</span>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Costi Fissi</p>
                    <p className="text-2xl font-bold text-blue-600">€{calculateCategorySummary('fixed').toLocaleString()}</p>
                  </div>
                  <Building className="w-8 h-8 text-blue-500 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{Object.values(fixedCosts).filter(v => v > 0).length} voci attive</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Costi Variabili</p>
                    <p className="text-2xl font-bold text-green-600">€{calculateCategorySummary('variable').toLocaleString()}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-green-500 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{['foodCostMonthly', 'beverageCostMonthly', 'packagingCosts', 'deliveryCommissions'].filter(field => advancedCosts[field] > 0).length} voci attive</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Costi Operativi</p>
                    <p className="text-2xl font-bold text-orange-600">€{calculateCategorySummary('operational').toLocaleString()}</p>
                  </div>
                  <Wrench className="w-8 h-8 text-orange-500 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{['maintenanceEquipment', 'cleaningSupplies', 'uniformsAndLaundry', 'phoneTelecomm', 'marketingBudget', 'socialMediaAds', 'loyaltyProgramCosts', 'wasteDisposal'].filter(field => advancedCosts[field] > 0).length} voci attive</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Ammortamenti</p>
                    <p className="text-2xl font-bold text-red-600">€{calculateCategorySummary('depreciation').toLocaleString()}</p>
                  </div>
                  <Building className="w-8 h-8 text-red-500 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{['kitchenEquipment', 'furnitureFixtures', 'posSystemSoftware'].filter(field => advancedCosts[field] > 0).length} voci attive</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Costi Lavoro</p>
                    <p className="text-2xl font-bold text-green-700">€{calculateCategorySummary('labor').toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{['socialContributions', 'training', 'overtimePremium', 'seasonalStaffing'].filter(field => advancedCosts[field] > 0).length} voci attive</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Debiti e Rate</p>
                    <p className="text-2xl font-bold text-purple-600">€{calculateCategorySummary('debts').toLocaleString()}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-purple-500 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{Object.values(debts).filter((v: number) => v > 0).length} debiti attivi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      {/* Sezioni dei costi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Costi Fissi */}
        {renderCostSection(
          'Costi Fissi',
          Building,
          [
            { key: 'rent', label: 'Affitto' },
            { key: 'utilities', label: 'Utenze' },
            { key: 'insurance', label: 'Assicurazioni' },
            { key: 'staffSalaries', label: 'Stipendi fissi' },
            { key: 'equipment', label: 'Attrezzature' },
            { key: 'other', label: 'Altri costi fissi' }
          ],
          'fixed',
          'blue'
        )}

        {/* Costi del Lavoro */}
        {renderCostSection(
          'Costi del Lavoro',
          Users,
          [
            { key: 'socialContributions', label: 'Contributi sociali' },
            { key: 'training', label: 'Formazione' },
            { key: 'overtimePremium', label: 'Premio straordinari' },
            { key: 'seasonalStaffing', label: 'Personale stagionale' }
          ],
          'labor',
          'green'
        )}

        {/* Debiti e Rate */}
        {renderCostSection(
          'Debiti e Rate',
          CreditCard,
          [
            { key: 'bankLoan', label: 'Prestito bancario' },
            { key: 'equipmentFinancing', label: 'Finanziamento attrezzature' },
            { key: 'supplierCredit', label: 'Credito fornitori' },
            { key: 'leasing', label: 'Leasing' },
            { key: 'otherDebts', label: 'Altri debiti' }
          ],
          'debts',
          'purple'
        )}

        {/* Costi Variabili */}
        {renderCostSection(
          'Costi Variabili',
          ShoppingCart,
          [
            { key: 'foodCostMonthly', label: 'Costo cibo mensile' },
            { key: 'beverageCostMonthly', label: 'Costo bevande mensile' },
            { key: 'packagingCosts', label: 'Packaging mensile' },
            { key: 'deliveryCommissions', label: 'Commissioni delivery mensili' }
          ],
          'variable',
          'yellow'
        )}

        {/* Costi Operativi */}
        {renderCostSection(
          'Costi Operativi',
          Wrench,
          [
            { key: 'maintenanceEquipment', label: 'Manutenzione' },
            { key: 'cleaningSupplies', label: 'Prodotti pulizia' },
            { key: 'uniformsAndLaundry', label: 'Divise e lavanderia' },
            { key: 'phoneTelecomm', label: 'Telefonia' }
          ],
          'operational',
          'orange'
        )}

        {/* Ammortamenti */}
        {renderCostSection(
          'Ammortamenti',
          Building,
          [
            { key: 'kitchenEquipment', label: 'Attrezzature cucina' },
            { key: 'furnitureFixtures', label: 'Mobili e arredi' },
            { key: 'posSystemSoftware', label: 'POS e software' }
          ],
          'depreciation',
          'red'
        )}


      </div>

      {/* Report PDF */}
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-200 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-blue-900 text-xl font-bold">
            <div className="p-3 rounded-xl bg-white shadow-md border-2 border-blue-200">
              <FileDown className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Generazione Report Dettagliati</span>
                <HelpTooltip title="Report PDF Professionali" className="ml-1">
                  Genera report PDF completi con analisi dettagliate, grafici, raccomandazioni e dati finanziari per presentazioni professionali o archiviazione
                </HelpTooltip>
              </div>
              <div className="text-sm font-medium text-gray-600 mt-1">
                Report professionali in formato PDF con grafici e analisi complete
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-green-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-green-800">Report Mensile</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Analisi completa per il mese di <strong>{format(currentMonth, 'MMMM yyyy', { locale: it })}</strong>
                <br />• Break-even analysis dettagliata
                <br />• Top piatti redditizi
                <br />• Raccomandazioni personalizzate
                <br />• Grafici e statistiche avanzate
              </p>
              <Button
                onClick={() => generateReport('monthly')}
                disabled={isGeneratingReport}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                {isGeneratingReport ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Scarica Report Mensile
                  </>
                )}
              </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-purple-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-purple-800">Report Annuale</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Analisi completa per l'anno <strong>{currentMonth.getFullYear()}</strong>
                <br />• Performance annuale completa
                <br />• Trend e confronti temporali
                <br />• Analisi stagionalità
                <br />• Piano strategico suggerito
              </p>
              <Button
                onClick={() => generateReport('annual')}
                disabled={isGeneratingReport}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
              >
                {isGeneratingReport ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Scarica Report Annuale
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">📋 Cosa Contiene il Report PDF</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>• Analisi Finanziaria:</strong> Break-even, ricavi, costi, profitti
                    <br /><strong>• Performance Menu:</strong> Piatti più redditizi e analisi margini
                    <br /><strong>• Costi Dettagliati:</strong> Breakdown per categoria
                  </div>
                  <div>
                    <strong>• Raccomandazioni:</strong> Suggerimenti personalizzati di ottimizzazione
                    <br /><strong>• Grafici Visuali:</strong> Rappresentazioni chiare dei dati
                    <br /><strong>• Layout Professionale:</strong> Pronto per presentazioni
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azioni */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button 
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  const currentMonthKey = format(currentMonth, 'yyyy-MM');
                  const configData = {
                    fixedCosts,
                    laborSettings,
                    advancedCosts,
                    debts,
                    month: currentMonthKey
                  };

                  const response = await fetch('/api/cost-analysis/save-configuration', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(configData),
                  });

                  if (response.ok) {
                    // Mostra messaggio di successo
                    console.log('Configurazione salvata con successo');

                    // Ricarica la configurazione per confermare il salvataggio
                    setTimeout(async () => {
                      try {
                        const loadResponse = await fetch(`/api/cost-analysis/load-configuration?month=${currentMonthKey}`);

                        if (!loadResponse.ok) {
                          console.log('Server non disponibile per ricaricamento, configurazione già salvata');
                          return;
                        }

                        const contentType = loadResponse.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                          console.log('Server in riavvio, configurazione già salvata');
                          return;
                        }

                        const text = await loadResponse.text();
                        if (!text || text.trim().length === 0) {
                          console.log('Risposta vuota, configurazione già salvata');
                          return;
                        }

                        let reloadedConfig;
                        try {
                          reloadedConfig = JSON.parse(text);
                        } catch (parseError) {
                          console.log('Risposta non valida, configurazione già salvata');
                          return;
                        }

                        console.log('Configurazione ricaricata:', reloadedConfig);

                        if (reloadedConfig.fixedCosts) {
                          setFixedCosts(reloadedConfig.fixedCosts);
                        }
                        if (reloadedConfig.laborSettings) {
                          setLaborSettings(reloadedConfig.laborSettings);
                        }
                        if (reloadedConfig.advancedCosts) {
                          setAdvancedCosts(reloadedConfig.advancedCosts);
                        }
                        if (reloadedConfig.debts) {
                          setDebts(reloadedConfig.debts);
                        }
                      } catch (reloadError) {
                        console.log('Errore di rete nel ricaricamento, configurazione già salvata');
                      }
                    }, 500);
                  } else {
                    console.error('Errore nel salvataggio della configurazione');
                    alert('Errore nel salvataggio della configurazione');
                  }
                } catch (error) {
                  console.error('Errore durante il salvataggio:', error);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Salvando configurazione avanzata...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Configurazione Completa
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

// Componente per la gestione dei costi reali
const CostManagement = () => {
  // Gestione temporale per navigazione mese/anno
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = format(currentDate, 'yyyy-MM');
  const monthKey = currentMonth;

  // Funzioni di navigazione temporale
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const [fixedCosts, setFixedCosts] = useState({
    rent: 2500,
    utilities: 400,
    insurance: 300,
    staffSalaries: 3200,
    equipment: 500,
    other: 600
  });

  const [laborSettings, setLaborSettings] = useState({
    averageHourlyWage: 15,
    hoursPerDay: 10,
    daysPerMonth: 26
  });

  // Nuove variabili avanzate per analisi più dettagliata
  const [advancedCosts, setAdvancedCosts] = useState({
    // Costi variabili per categoria
    foodCostPercentage: 28, // % del ricavo
    beverageCostPercentage: 25,
    packagingCosts: 150, // mensili
    deliveryCommissions: 12, // % per delivery

    // Costi di marketing e promozione
    marketingBudget: 800,
    socialMediaAds: 200,
    loyaltyProgramCosts: 100,

    // Costi operativi avanzati
    maintenanceEquipment: 180,
    cleaningSupplies: 120,
    uniformsAndLaundry: 80,
    phoneTelecomm: 90,

    // Ammortamenti dettagliati
    kitchenEquipment: 400, // ammortamento mensile
    furnitureFixtures: 150,
    posSystemSoftware: 120,

    // Costi del personale dettagliati
    socialContributions: 22, // % sugli stipendi
    training: 150,
    overtimePremium: 8, // % extra per straordinari

    // Costi stagionali e variabili
    seasonalStaffing: 0, // extra nei picchi
    energyCostIncrease: 5, // % aumento estivo
    wasteDisposal: 95,

    // Nuovi KPI
    targetProfitMargin: 15, // % obiettivo
    averageCustomerValue: 25,
    customerRetentionRate: 70, // %
    peakHoursMultiplier: 1.3 // moltiplicatore costi nei picchi
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carica la configurazione salvata all'avvio e quando cambia il mese
  useEffect(() => {
    const loadSavedConfiguration = async () => {
      try {
        const response = await fetch(`/api/cost-analysis/load-configuration?month=${monthKey}`);
        if (response.ok) {
          const savedConfig = await response.json();

          // Carica costi fissi se presenti
          if (savedConfig.fixedCosts && Object.keys(savedConfig.fixedCosts).length > 0) {
            setFixedCosts(prev => ({ ...prev, ...savedConfig.fixedCosts }));
          }

          // Carica impostazioni lavoro se presenti
          if (savedConfig.laborSettings) {
            setLaborSettings(prev => ({ ...prev, ...savedConfig.laborSettings }));
          }

          // Carica costi avanzati se presenti
          if (savedConfig.advancedCosts) {
            setAdvancedCosts(prev => ({ ...prev, ...savedConfig.advancedCosts }));
          }

          console.log('Configurazione caricata:', savedConfig);
        } else {
          console.log('Nessuna configurazione salvata trovata, uso valori di default');
        }
      } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);
      }
    };

    loadSavedConfiguration();
  }, []);

  const handleFixedCostChange = (field: string, value: number) => {
    setFixedCosts(prev => ({ ...prev, [field]: value }));
  };

  const handleLaborSettingChange = (field: string, value: number) => {
    setLaborSettings(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalFixedCosts = () => {
    return Object.values(fixedCosts).reduce((sum, cost) => sum + cost, 0);
  };

  const calculateMonthlyLaborCost = () => {
    return laborSettings.averageHourlyWage * laborSettings.hoursPerDay * laborSettings.daysPerMonth;
  };

  return (
    <div className="space-y-6">
      {/* Sezione Costi Reali */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calculator className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Gestione Costi Reali
              </h3>
              <p className="text-sm text-blue-700">
                Configura i tuoi costi operativi per analisi precise
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Come Utilizzare questa Sezione</h3>
            <p className="text-sm text-blue-700">
              Inserisci i tuoi costi reali degli ultimi 12 mesi per ottenere un calcolo preciso del break-even. 
              Il sistema calcolerà automaticamente il punto di pareggio basato sui tuoi dati storici di vendite e questi costi.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Costi Fissi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Costi Fissi Mensili
            </CardTitle>
            <CardDescription>
              Inserisci i tuoi costi fissi reali per calcolare il break-even preciso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'rent', label: 'Affitto', icon: Building },
              { key: 'utilities', label: 'Utenze (luce, gas, acqua)', icon: Zap },
              { key: 'insurance', label: 'Assicurazioni', icon: Shield },
              { key: 'staffSalaries', label: 'Stipendi fissi', icon: Users },
              { key: 'equipment', label: 'Attrezzature/Ammortamenti', icon: Wrench },
              { key: 'other', label: 'Altri costi fissi', icon: FileText }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-gray-500" />
                <Label className="flex-1 text-sm">{label}</Label>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={fixedCosts[key as keyof typeof fixedCosts]}
                    onChange={(e) => handleFixedCostChange(key, parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                    step="0.01"
                  />
                  <span className="text-xs text-gray-500">€</span>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Totale Costi Fissi Mensili</span>
                <span className="text-blue-600">€{calculateTotalFixedCosts().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impostazioni Lavoro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Costo del Lavoro
            </CardTitle>
            <CardDescription>
              Configura i parametri per calcolare il costo del lavoro per piatto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'averageHourlyWage', label: 'Costo orario medio del personale', unit: '€/ora' },
              { key: 'hoursPerDay', label: 'Ore di lavoro per giorno', unit: 'ore' },
              { key: 'daysPerMonth', label: 'Giorni lavorativi al mese', unit: 'giorni' }
            ].map(({ key, label, unit }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={laborSettings[key as keyof typeof laborSettings]}
                    onChange={(e) => handleLaborSettingChange(key, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                    step="0.01"
                  />
                  <span className="text-xs text-gray-500">{unit}</span>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Costo Lavoro Mensile</span>
                <span className="text-green-600">€{calculateMonthlyLaborCost().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Riepilogo e Salvataggio */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Costi Totali</CardTitle>
          <CardDescription>
            Il tuo break-even sarà calcolato in base a questi valori reali
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Costi Fissi Mensili</p>
              <p className="text-2xl font-bold text-blue-600">€{calculateTotalFixedCosts().toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Costi Variabili Mensili</p>
              <p className="text-2xl font-bold text-green-600">€{0}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Costi Totali Mensili</p>
              <p className="text-2xl font-bold text-purple-600">
                €{(calculateTotalFixedCosts() + calculateMonthlyLaborCost()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={async () => {
                setIsSubmitting(true);

                try {
                  const currentMonthKey = format(currentDate, 'yyyy-MM');
                  const configData = {
                    fixedCosts,
                    laborSettings,
                    advancedCosts,
                    debts,
                    month: currentMonthKey
                  };

                  console.log('=== INIZIO SALVATAGGIO ===');
                  console.log('Dati da salvare:', configData);
                  console.log(`Chiamando API /api/cost-analysis/save-configuration per mese: ${currentMonthKey}`);

                  const response = await fetch('/api/cost-analysis/save-configuration', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(configData),
                  });

                  console.log('Risposta API ricevuta:', {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                  });

                  if (response.ok) {
                    const responseText = await response.text();
                    console.log('Risposta body:', responseText);
                    console.log('Configurazione costi salvata con successo');

                    // Ricarica la configurazione per confermare il salvataggio
                    setTimeout(async () => {
                      try {
                        const loadResponse = await fetch(`/api/cost-analysis/load-configuration?month=${currentMonthKey}`);

                        if (!loadResponse.ok) {
                          console.log('Server non disponibile per ricaricamento, configurazione già salvata');
                          return;
                        }

                        const contentType = loadResponse.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                          console.log('Server in riavvio, configurazione già salvata');
                          return;
                        }

                        const text = await loadResponse.text();
                        if (!text || text.trim().length === 0) {
                          console.log('Risposta vuota, configurazione già salvata');
                          return;
                        }

                        let reloadedConfig;
                        try {
                          reloadedConfig = JSON.parse(text);
                        } catch (parseError) {
                          console.log('Risposta non valida, configurazione già salvata');
                          return;
                        }

                        console.log('Configurazione costi ricaricata:', reloadedConfig);

                        if (reloadedConfig.fixedCosts) {
                          setFixedCosts(reloadedConfig.fixedCosts);
                        }
                        if (reloadedConfig.laborSettings) {
                          setLaborSettings(reloadedConfig.laborSettings);
                        }
                        if (reloadedConfig.advancedCosts) {
                          setAdvancedCosts(reloadedConfig.advancedCosts);
                        }
                        if (reloadedConfig.debts) {
                          setDebts(reloadedConfig.debts);
                        }
                      } catch (reloadError) {
                        console.log('Errore di rete nel ricaricamento, configurazione già salvata');
                      }
                    }, 500);
                  } else {
                    console.error('Errore nel salvataggio della configurazione costi');
                    alert('Errore nel salvataggio della configurazione costi');
                  }
                } catch (error) {
                  console.error('Errore durante il salvataggio:', error);
                  alert('Errore durante il salvataggio della configurazione');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Configurazione Costi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};