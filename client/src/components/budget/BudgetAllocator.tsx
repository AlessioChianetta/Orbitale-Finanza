import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { 
  getIconComponent,
  type BudgetCategory 
} from "@/constants/budgetCategories";

import { 
  PieChart, Wallet, TrendingUp, Calculator, 
  Target, Settings, Save, RefreshCw, Sparkles
} from "lucide-react";

interface BudgetAllocatorProps {
  budgetSettings: any;
  onUpdate: () => void;
}

interface AllocationData {
  needs: number;
  wants: number;
  savings: number;
  monthlyIncome: number;
}

interface CategoryAllocation {
  type: 'needs' | 'wants' | 'savings';
  percentage: number;
  amount: number;
  color: string;
  icon: string;
  description: string;
}

export function BudgetAllocator({ budgetSettings, onUpdate }: BudgetAllocatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize allocation data
  const [allocation, setAllocation] = useState<AllocationData>({
    needs: parseFloat(budgetSettings?.needsPercentage) || 50,
    wants: parseFloat(budgetSettings?.wantsPercentage) || 30,
    savings: parseFloat(budgetSettings?.savingsPercentage) || 20,
    monthlyIncome: parseFloat(budgetSettings?.monthlyIncome) || 0
  });

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Update mutation
  const updateBudgetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/budget-settings', data),
    onSuccess: () => {
      toast({
        title: "✅ Budget Aggiornato",
        description: "Le tue allocazioni sono state salvate con successo!"
      });
      onUpdate();
      queryClient.invalidateQueries({ queryKey: ['/api/budget-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: "Impossibile salvare le modifiche. Riprova.",
        variant: "destructive"
      });
      console.error('Budget update error:', error);
    }
  });

  // Calculate category data
  const calculateCategoryData = (): CategoryAllocation[] => {
    return [
      {
        type: 'needs',
        percentage: allocation.needs,
        amount: (allocation.monthlyIncome * allocation.needs) / 100,
        color: 'bg-red-500',
        icon: 'Home',
        description: 'Casa, cibo, trasporti, salute - essenziali per la vita'
      },
      {
        type: 'wants',
        percentage: allocation.wants,
        amount: (allocation.monthlyIncome * allocation.wants) / 100,
        color: 'bg-amber-500',
        icon: 'Sparkles',
        description: 'Intrattenimento, hobby, ristorazione - piaceri della vita'
      },
      {
        type: 'savings',
        percentage: allocation.savings,
        amount: (allocation.monthlyIncome * allocation.savings) / 100,
        color: 'bg-emerald-500',
        icon: 'PiggyBank',
        description: 'Investimenti, obiettivi, fondo emergenza - il tuo futuro'
      }
    ];
  };

  // Handle slider changes
  const handleSliderChange = (type: 'needs' | 'wants' | 'savings', value: number[]) => {
    const newValue = value[0];
    const oldValue = allocation[type];
    const diff = newValue - oldValue;
    
    setAllocation(prev => {
      let newAllocation = { ...prev, [type]: newValue };
      
      // Auto-adjust other categories to maintain 100% total
      const remaining = 100 - newValue;
      const otherTypes = type === 'needs' ? ['wants', 'savings'] : 
                        type === 'wants' ? ['needs', 'savings'] : 
                        ['needs', 'wants'];
      
      const otherTotal = otherTypes.reduce((sum, t) => sum + prev[t as keyof AllocationData], 0) as number;
      
      if (otherTotal > 0) {
        otherTypes.forEach(t => {
          const currentValue = prev[t as keyof AllocationData] as number;
          const proportion = currentValue / otherTotal;
          newAllocation[t as keyof AllocationData] = Math.round(remaining * proportion * 100) / 100;
        });
      }
      
      return newAllocation;
    });
  };

  // Handle monthly income change
  const handleIncomeChange = (value: string) => {
    const income = parseFloat(value) || 0;
    setAllocation(prev => ({ ...prev, monthlyIncome: income }));
  };

  // Save allocation
  const handleSave = () => {
    const total = allocation.needs + allocation.wants + allocation.savings;
    
    if (Math.abs(total - 100) > 0.01) {
      toast({
        title: "⚠️ Errore di Validazione",
        description: `Le percentuali devono sommare a 100%. Attualmente: ${total.toFixed(1)}%`,
        variant: "destructive"
      });
      return;
    }

    updateBudgetMutation.mutate({
      needsPercentage: allocation.needs.toString(),
      wantsPercentage: allocation.wants.toString(),
      savingsPercentage: allocation.savings.toString(),
      monthlyIncome: allocation.monthlyIncome
    });
  };

  // Reset to defaults
  const handleReset = () => {
    setAllocation({
      needs: 50,
      wants: 30,
      savings: 20,
      monthlyIncome: allocation.monthlyIncome
    });
    toast({
      title: "🔄 Ripristinato",
      description: "Allocazioni ripristinate alla regola 50/30/20"
    });
  };

  const categoryData = calculateCategoryData();
  const total = allocation.needs + allocation.wants + allocation.savings;
  const isValidTotal = Math.abs(total - 100) < 0.01;

  return (
    <Card className="w-full">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <PieChart className="h-6 w-6 text-primary" />
              Budget Allocator
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Distribuisci intelligentemente il tuo reddito mensile
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            data-testid="toggle-advanced-mode"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isAdvancedMode ? 'Semplice' : 'Avanzato'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Monthly Income Input */}
        <div className="space-y-3">
          <Label htmlFor="monthlyIncome" className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Entrata Mensile Netta
          </Label>
          <div className="relative">
            <Input
              id="monthlyIncome"
              type="number"
              value={allocation.monthlyIncome}
              onChange={(e) => handleIncomeChange(e.target.value)}
              placeholder="Inserisci il tuo reddito mensile..."
              className="text-lg pl-8"
              data-testid="input-monthly-income"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          </div>
        </div>

        <Separator />

        {/* Allocation Controls */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Allocazione Budget</h3>
            <div className="flex items-center gap-2">
              <Badge variant={isValidTotal ? "default" : "destructive"}>
                Totale: {total.toFixed(1)}%
              </Badge>
              {!isValidTotal && (
                <Badge variant="outline">
                  Diff: {(100 - total).toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>

          {categoryData.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            
            return (
              <div key={category.type} className="space-y-4 p-6 border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                      <IconComponent className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold capitalize">
                        {category.type === 'needs' ? 'Bisogni' : 
                         category.type === 'wants' ? 'Desideri' : 'Risparmi'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {category.percentage.toFixed(1)}%
                    </div>
                    <div className="text-lg text-muted-foreground">
                      €{category.amount.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-3">
                  <Slider
                    value={[category.percentage]}
                    onValueChange={(value) => handleSliderChange(category.type, value)}
                    max={100}
                    step={0.5}
                    className="w-full"
                    data-testid={`slider-${category.type}`}
                  />
                  
                  {/* Progress Bar */}
                  <Progress 
                    value={category.percentage} 
                    className="h-3"
                    style={{
                      background: `linear-gradient(to right, ${category.color.replace('bg-', '')
                        .replace('-500', '')} ${category.percentage}%, #e5e7eb ${category.percentage}%)`
                    }}
                  />
                </div>

                {/* Advanced Mode - Direct Input */}
                {isAdvancedMode && (
                  <div className="flex gap-3 mt-4">
                    <div className="flex-1">
                      <Label className="text-sm">Percentuale</Label>
                      <Input
                        type="number"
                        value={category.percentage}
                        onChange={(e) => handleSliderChange(category.type, [parseFloat(e.target.value) || 0])}
                        min="0"
                        max="100"
                        step="0.1"
                        className="mt-1"
                        data-testid={`input-${category.type}-percentage`}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm">Importo (€)</Label>
                      <Input
                        type="number"
                        value={category.amount.toFixed(0)}
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          const percentage = allocation.monthlyIncome > 0 ? (amount / allocation.monthlyIncome) * 100 : 0;
                          handleSliderChange(category.type, [percentage]);
                        }}
                        min="0"
                        className="mt-1"
                        data-testid={`input-${category.type}-amount`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <Button
            onClick={handleSave}
            disabled={!isValidTotal || updateBudgetMutation.isPending}
            className="flex-1"
            data-testid="button-save-budget"
          >
            {updateBudgetMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Allocazione
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            className="px-6"
            data-testid="button-reset-budget"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset 50/30/20
          </Button>
        </div>

        {/* Summary Statistics */}
        {allocation.monthlyIncome > 0 && (
          <div className="mt-8 p-6 bg-muted/30 rounded-lg border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Riepilogo Mensile
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoryData.map((category) => (
                <div key={category.type} className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    €{category.amount.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {category.type === 'needs' ? 'Bisogni' : 
                     category.type === 'wants' ? 'Desideri' : 'Risparmi'} 
                    ({category.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}