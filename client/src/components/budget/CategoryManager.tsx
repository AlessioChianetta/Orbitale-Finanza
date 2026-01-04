import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { 
  AVAILABLE_ICONS, 
  AVAILABLE_COLORS, 
  CATEGORY_TEMPLATES,
  getIconComponent,
  type BudgetCategory,
  type BudgetSubcategory 
} from "@/constants/budgetCategories";

import { 
  Plus, Edit3, Trash2, Save, X, Palette, Sparkles, 
  Copy, Download, Upload, Search, Filter, MoreVertical,
  Zap, Heart, Star, Check
} from "lucide-react";

interface CustomCategory extends BudgetCategory {
  name: string;
  isCustom: true;
  userId: number;
}

interface CategoryManagerProps {
  budgetSettings: any;
  onUpdate: () => void;
}

interface CategoryFormData {
  name: string;
  budgetType: 'needs' | 'wants' | 'savings';
  iconKey: string;
  color: string;
  subcategories: Array<{
    name: string;
    iconKey: string;
    color: string;
  }>;
}

export function CategoryManager({ budgetSettings, onUpdate }: CategoryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'needs' | 'wants' | 'savings'>('all');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    budgetType: 'wants',
    iconKey: 'MoreHorizontal',
    color: 'text-blue-600',
    subcategories: []
  });

  // Get custom categories from budget settings
  const customCategories: Record<string, CustomCategory> = budgetSettings?.customCategories || {};

  // Use only custom categories (transaction-based categories are handled elsewhere)
  const allCategories = { ...customCategories };

  // Filter categories
  const filteredCategories = Object.entries(allCategories).filter(([name, category]) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || category.budgetType === filterType;
    return matchesSearch && matchesFilter;
  });

  // Mutation for updating budget settings with custom categories
  const updateCategoriesMutation = useMutation({
    mutationFn: async (newCustomCategories: Record<string, CustomCategory>) => {
      const updatedSettings = {
        ...budgetSettings,
        customCategories: newCustomCategories
      };
      
      if (budgetSettings?.id) {
        const response = await apiRequest('PUT', `/api/budget/settings/${budgetSettings.id}`, updatedSettings);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/budget/settings', updatedSettings);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Categorie aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget/settings'] });
      setIsCreateDialogOpen(false);
      setEditingCategory(null);
      onUpdate();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento delle categorie",
        variant: "destructive"
      });
    }
  });

  const handleCreateCategory = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della categoria è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    const newCategory: CustomCategory = {
      ...formData,
      isCustom: true,
      userId: budgetSettings?.userId || 0,
      subcategories: formData.subcategories.map(sub => ({
        ...sub
      }))
    };

    const newCustomCategories = {
      ...customCategories,
      [formData.name]: newCategory
    };

    updateCategoriesMutation.mutate(newCustomCategories);
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (!customCategories[categoryName]) {
      toast({
        title: "Errore", 
        description: "Non puoi eliminare categorie predefinite",
        variant: "destructive"
      });
      return;
    }

    const newCustomCategories = { ...customCategories };
    delete newCustomCategories[categoryName];
    updateCategoriesMutation.mutate(newCustomCategories);
  };

  const handleApplyTemplate = (templateType: keyof typeof CATEGORY_TEMPLATES) => {
    const templates = CATEGORY_TEMPLATES[templateType];
    const newCustomCategories = { ...customCategories };

    templates.forEach(template => {
      const newCategory: CustomCategory = {
        ...template,
        isCustom: true,
        userId: budgetSettings?.userId || 0,
        subcategories: []
      };
      newCustomCategories[template.name] = newCategory;
    });

    updateCategoriesMutation.mutate(newCustomCategories);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      budgetType: 'wants',
      iconKey: 'MoreHorizontal',
      color: 'text-blue-600',
      subcategories: []
    });
  };

  const IconComponent = getIconComponent(formData.iconKey);

  return (
    <div className="space-y-6" data-testid="category-manager">
      {/* Header con azioni */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gestione Categorie
          </h2>
          <p className="text-gray-600 mt-1">
            Personalizza le tue categorie di budget e sottocategorie
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="create-category-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Crea Nuova Categoria
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Informazioni base */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Nome Categoria</Label>
                    <Input
                      id="category-name"
                      placeholder="Es: Hobby e Passatempi"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      data-testid="category-name-input"
                    />
                  </div>

                  <div>
                    <Label>Tipo di Budget</Label>
                    <Select value={formData.budgetType} onValueChange={(value: any) => setFormData({...formData, budgetType: value})}>
                      <SelectTrigger data-testid="budget-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="needs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            Bisogni (50%)
                          </div>
                        </SelectItem>
                        <SelectItem value="wants">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                            Desideri (30%)
                          </div>
                        </SelectItem>
                        <SelectItem value="savings">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            Risparmi (20%)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selezione icona e colore */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Personalizzazione Visiva
                  </h4>

                  {/* Preview */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                      <IconComponent className={`w-6 h-6 ${formData.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{formData.name || 'Nome Categoria'}</p>
                      <Badge variant="outline" className="capitalize">
                        {formData.budgetType}
                      </Badge>
                    </div>
                  </div>

                  {/* Selezione icona */}
                  <div>
                    <Label>Icona</Label>
                    <ScrollArea className="h-32 w-full border rounded-md p-2">
                      <div className="grid grid-cols-8 gap-2">
                        {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => (
                          <Button
                            key={key}
                            variant={formData.iconKey === key ? "default" : "outline"}
                            size="sm"
                            className="h-10 w-10 p-0"
                            onClick={() => setFormData({...formData, iconKey: key})}
                            data-testid={`icon-${key}`}
                          >
                            <Icon className="w-4 h-4" />
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Selezione colore */}
                  <div>
                    <Label>Colore</Label>
                    <div className="grid grid-cols-10 gap-2 mt-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <Button
                          key={color}
                          className={`h-8 w-8 p-0 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          onClick={() => setFormData({...formData, color})}
                          data-testid={`color-${color}`}
                        >
                          <div className={`w-full h-full rounded-full bg-current ${color}`} />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sottocategorie */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Sottocategorie (Opzionale)</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newSubcategory = { name: '', iconKey: 'MoreHorizontal', color: 'text-gray-600' };
                        setFormData({...formData, subcategories: [...formData.subcategories, newSubcategory]});
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Aggiungi
                    </Button>
                  </div>

                  {formData.subcategories.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.subcategories.map((sub, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Input
                            placeholder="Nome sottocategoria"
                            value={sub.name}
                            onChange={(e) => {
                              const newSubs = [...formData.subcategories];
                              newSubs[index].name = e.target.value;
                              setFormData({...formData, subcategories: newSubs});
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSubs = formData.subcategories.filter((_, i) => i !== index);
                              setFormData({...formData, subcategories: newSubs});
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Annulla
                  </Button>
                  <Button 
                    onClick={handleCreateCategory}
                    disabled={updateCategoriesMutation.isPending || !formData.name.trim()}
                    data-testid="save-category-btn"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateCategoriesMutation.isPending ? 'Salvando...' : 'Salva Categoria'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Templates rapidi */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="templates-btn">
                <Zap className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Template Categorie</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {Object.entries(CATEGORY_TEMPLATES).map(([key, templates]) => (
                  <Card key={key} className="p-4">
                    <h4 className="font-semibold mb-2 capitalize">{key}</h4>
                    <div className="space-y-2 mb-3">
                      {templates.map((template, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {template.budgetType}
                          </Badge>
                          {template.name}
                        </div>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApplyTemplate(key as keyof typeof CATEGORY_TEMPLATES)}
                      disabled={updateCategoriesMutation.isPending}
                      data-testid={`apply-template-${key}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Applica Template
                    </Button>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtri e ricerca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cerca categorie o sottocategorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-categories"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-48" data-testid="filter-categories">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                <SelectItem value="needs">Bisogni</SelectItem>
                <SelectItem value="wants">Desideri</SelectItem>
                <SelectItem value="savings">Risparmi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista categorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(([name, category]) => {
          const IconComponent = getIconComponent(category.iconKey || 'MoreHorizontal');
          const isCustom = 'isCustom' in category && category.isCustom;
          
          return (
            <Card key={name} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      category.budgetType === 'needs' ? 'bg-red-50' :
                      category.budgetType === 'wants' ? 'bg-amber-50' : 'bg-emerald-50'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs capitalize ${
                          category.budgetType === 'needs' ? 'border-red-200 text-red-700' :
                          category.budgetType === 'wants' ? 'border-amber-200 text-amber-700' : 
                          'border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {category.budgetType}
                      </Badge>
                      {isCustom && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          Custom
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isCustom && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`delete-category-${name}`}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Elimina Categoria</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare la categoria "{name}"? 
                              Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCategory(name)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>

              {category.subcategories.length > 0 && (
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Sottocategorie:</p>
                    <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                      {category.subcategories.map((sub, index) => {
                        const SubIcon = getIconComponent(sub.iconKey || 'MoreHorizontal');
                        return (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <SubIcon className={`w-3 h-3 ${sub.color || 'text-gray-600'}`} />
                            <span className="truncate">{sub.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nessuna categoria trovata
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Prova a cambiare i termini di ricerca' : 'Inizia creando la tua prima categoria personalizzata'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea Prima Categoria
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}