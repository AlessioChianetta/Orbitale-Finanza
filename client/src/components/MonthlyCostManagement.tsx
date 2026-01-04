import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { Calculator, Clock, Calendar, ChevronLeft, ChevronRight, TrendingUp, Building, Zap, Users, ChefHat, Wrench, FileText, Save, Target, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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

// Componente per la gestione costi mensili dinamici
const MonthlyCostManagement = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<{[key: string]: any}>({});
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // Carica dati dal localStorage all'avvio
  useEffect(() => {
    const savedData = localStorage.getItem('monthlyCostData');
    if (savedData) {
      try {
        setMonthlyData(JSON.parse(savedData));
      } catch (error) {
        console.error('Errore nel caricamento dati mensili:', error);
      }
    }
  }, []);

  // Salva dati nel localStorage quando cambiano
  const saveDataToStorage = (data: any) => {
    try {
      localStorage.setItem('monthlyCostData', JSON.stringify(data));
      console.log('Dati mensili salvati con successo');
    } catch (error) {
      console.error('Errore nel salvataggio dati mensili:', error);
    }
  };
  
  const getCurrentMonthKey = () => {
    return format(currentDate, 'yyyy-MM');
  };

  const handleMonthlyDataChange = (field: string, value: number) => {
    const monthKey = getCurrentMonthKey();
    const updatedData = {
      ...monthlyData,
      [monthKey]: {
        ...monthlyData[monthKey],
        [field]: value
      }
    };
    setMonthlyData(updatedData);
    saveDataToStorage(updatedData);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const currentMonthData = monthlyData[getCurrentMonthKey()] || {};

  const renderDailyAnalysis = () => {
    const dailyFixedCosts = Object.values(currentMonthData).reduce((sum: number, val: any) => sum + (val || 0), 0) / 30;
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-800">Costi Fissi Giornalieri</span>
            <span className="text-lg font-bold text-blue-900">{formatCurrency(dailyFixedCosts)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm">Affitto/giorno</span>
            <span className="font-semibold">{formatCurrency((currentMonthData.rent || 0) / 30)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm">Utenze/giorno</span>
            <span className="font-semibold">{formatCurrency((currentMonthData.utilities || 0) / 30)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm">Personale/giorno</span>
            <span className="font-semibold">{formatCurrency((currentMonthData.staffSalaries || 0) / 30)}</span>
          </div>
        </div>

        <div className="bg-amber-50 p-3 rounded-lg">
          <p className="text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Per raggiungere il break-even devi generare almeno <strong>{formatCurrency(dailyFixedCosts)}</strong> di ricavo al giorno.
          </p>
        </div>
      </div>
    );
  };

  const renderMonthlyAnalysis = () => {
    const totalMonthlyCosts = Object.values(currentMonthData).reduce((sum: number, val: any) => sum + (val || 0), 0);
    
    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-800">Totale Costi Mensili</span>
            <span className="text-lg font-bold text-green-900">{formatCurrency(totalMonthlyCosts)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            rent: 'Affitto',
            utilities: 'Utenze', 
            staffSalaries: 'Personale',
            foodCosts: 'Cibo',
            marketingSpend: 'Marketing',
            maintenance: 'Manutenzione',
            other: 'Altri'
          }).map(([key, label]) => (
            <div key={key} className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">{label}</span>
              <span className="font-semibold">{formatCurrency(currentMonthData[key] || 0)}</span>
            </div>
          ))}
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-700">
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Break-even mensile: <strong>{formatCurrency(totalMonthlyCosts)}</strong>
          </p>
        </div>
      </div>
    );
  };

  const renderAnnualAnalysis = () => {
    const monthlyAverage = Object.values(monthlyData).reduce((sum: number, monthData: any) => {
      const monthTotal = Object.values(monthData).reduce((monthSum: number, val: any) => monthSum + (val || 0), 0);
      return sum + monthTotal;
    }, 0) / Math.max(Object.keys(monthlyData).length, 1);
    
    const annualProjection = monthlyAverage * 12;
    
    return (
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-800">Proiezione Annuale</span>
            <span className="text-lg font-bold text-purple-900">{formatCurrency(annualProjection)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b">
            <span>Media mensile</span>
            <span className="font-semibold">{formatCurrency(monthlyAverage)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span>Media giornaliera</span>
            <span className="font-semibold">{formatCurrency(monthlyAverage / 30)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span>Break-even annuale</span>
            <span className="font-semibold text-purple-600">{formatCurrency(annualProjection)}</span>
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-purple-700">
            <Target className="w-4 h-4 inline mr-1" />
            Per essere profittevoli, pianifica ricavi annuali superiori a <strong>{formatCurrency(annualProjection)}</strong>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Controlli di Navigazione Temporale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              Gestione Costi Dinamica per Periodo
              <HelpTooltip
                title="Costi Variabili per Periodo"
                className="ml-2"
              >
                Inserisci i costi reali mese per mese per ottenere analisi precise. I dati vengono salvati automaticamente e utilizzati per calcoli di break-even accurati.
              </HelpTooltip>
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={(value: 'daily' | 'monthly' | 'annual') => setSelectedPeriod(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Vista Giornaliera</SelectItem>
                  <SelectItem value="monthly">Vista Mensile</SelectItem>
                  <SelectItem value="annual">Vista Annuale</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedPeriod === 'monthly' && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold text-lg px-3">
                    {format(currentDate, 'MMMM yyyy', { locale: it })}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Costi per il Mese Corrente */}
      {selectedPeriod === 'monthly' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Costi per {format(currentDate, 'MMMM yyyy', { locale: it })}
            </CardTitle>
            <CardDescription>
              Inserisci i costi reali sostenuti in questo mese per calcolare il break-even preciso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Costi Fissi */}
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Costi Fissi Mensili
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'rent', label: 'Affitto', icon: Building },
                    { key: 'utilities', label: 'Utenze', icon: Zap },
                    { key: 'insurance', label: 'Assicurazioni', icon: FileText },
                    { key: 'staffSalaries', label: 'Stipendi fissi', icon: Users },
                    { key: 'equipment', label: 'Attrezzature', icon: Wrench },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4 text-blue-500" />
                        {label}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={currentMonthData[key] || ''}
                        onChange={(e: any) => handleMonthlyDataChange(key, Number(e.target.value))}
                        className="text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Costi Operativi */}
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Costi Operativi Variabili
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'foodCostPercentage', label: 'Costi Cibo (%)', icon: ChefHat },
                    { key: 'beverageCostPercentage', label: 'Costi Bevande (%)', icon: ChefHat },
                    { key: 'packagingCosts', label: 'Packaging', icon: FileText },
                    { key: 'deliveryCommissions', label: 'Commissioni Delivery', icon: TrendingUp },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4 text-green-500" />
                        {label}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={currentMonthData[key] || ''}
                        onChange={(e: any) => handleMonthlyDataChange(key, Number(e.target.value))}
                        className="text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing */}
              <div>
                <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Marketing e Promozioni
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'marketingBudget', label: 'Budget Marketing', icon: TrendingUp },
                    { key: 'socialMediaAds', label: 'Social Media Ads', icon: TrendingUp },
                    { key: 'loyaltyProgramCosts', label: 'Programma Fedeltà', icon: Target },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4 text-purple-500" />
                        {label}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={currentMonthData[key] || ''}
                        onChange={(e: any) => handleMonthlyDataChange(key, Number(e.target.value))}
                        className="text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Altri Costi */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Altri Costi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'maintenanceEquipment', label: 'Manutenzione', icon: Wrench },
                    { key: 'cleaningSupplies', label: 'Pulizia', icon: Wrench },
                    { key: 'phoneTelecomm', label: 'Telecomunicazioni', icon: Zap },
                    { key: 'training', label: 'Formazione', icon: Users },
                    { key: 'wasteDisposal', label: 'Smaltimento', icon: FileText },
                    { key: 'other', label: 'Altri', icon: FileText }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4 text-gray-500" />
                        {label}
                      </Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={currentMonthData[key] || ''}
                        onChange={(e: any) => handleMonthlyDataChange(key, Number(e.target.value))}
                        className="text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezioni di Analisi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analisi Giornaliera */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-blue-700">
              <Clock className="w-5 h-5 mr-2" />
              Analisi Giornaliera
              <HelpTooltip
                title="Analisi Costi Giornaliera"
                className="ml-2"
              >
                Calcola i costi giornalieri basandosi sui dati mensili inseriti. Utile per monitorare il break-even quotidiano.
              </HelpTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderDailyAnalysis()}
          </CardContent>
        </Card>

        {/* Analisi Mensile */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-green-700">
              <Calendar className="w-5 h-5 mr-2" />
              Analisi Mensile
              <HelpTooltip
                title="Analisi Costi Mensile"
                className="ml-2"
              >
                Mostra tutti i costi per il mese selezionato con calcolo del break-even mensile totale.
              </HelpTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderMonthlyAnalysis()}
          </CardContent>
        </Card>

        {/* Analisi Annuale */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg text-purple-700">
              <TrendingUp className="w-5 h-5 mr-2" />
              Analisi Annuale
              <HelpTooltip
                title="Analisi Costi Annuale"
                className="ml-2"
              >
                Proiezione annuale basata sui dati storici inseriti. Include pianificazione strategica e obiettivi annuali.
              </HelpTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderAnnualAnalysis()}
          </CardContent>
        </Card>
      </div>

      {/* Riepilogo e Azioni */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Dati salvati per {Object.keys(monthlyData).length} mesi
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                saveDataToStorage(monthlyData);
                alert('Dati mensili salvati con successo!');
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Dati Mensili
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCostManagement;