import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  StickyNote, Save, Trash2, Bell, Target, TrendingUp, AlertTriangle,
  Calendar, Plus, Edit3, Check, X, Tag
} from 'lucide-react';

interface BudgetNoteFieldProps {
  category: string;
  subcategory?: string;
  monthKey: string;
  className?: string;
  showAdvancedFeatures?: boolean;
  onNoteChange?: (noteData: any) => void;
}

interface BudgetNote {
  id?: number;
  category: string;
  subcategory?: string;
  monthKey: string;
  notes: string;
  budgetGoal?: number;
  actualSpent?: number;
  variance?: number;
  alertThreshold?: number;
  isAlertEnabled: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200'
};

const priorityIcons = {
  low: TrendingUp,
  medium: Target,
  high: AlertTriangle
};

export function BudgetNoteField({ 
  category,
  subcategory,
  monthKey,
  className = "",
  showAdvancedFeatures = true,
  onNoteChange
}: BudgetNoteFieldProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [noteData, setNoteData] = useState<BudgetNote>({
    category,
    subcategory,
    monthKey,
    notes: '',
    isAlertEnabled: false,
    priority: 'medium',
    tags: []
  });

  const [newTag, setNewTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing note
  const { data: existingNotes, isLoading } = useQuery({
    queryKey: ['/api/budget-notes', { category, monthKey }],
    queryFn: () => apiRequest('GET', `/api/budget-notes?category=${encodeURIComponent(category)}&monthKey=${monthKey}`),
  });

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: (data: Partial<BudgetNote>) => 
      apiRequest('POST', '/api/budget-notes', data),
    onSuccess: () => {
      toast({
        title: "✅ Nota Salvata",
        description: "Le tue note budget sono state salvate con successo!",
      });
      setHasChanges(false);
      setIsEditing(false);
      onNoteChange?.(noteData);
      queryClient.invalidateQueries({ queryKey: ['/api/budget-notes'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: "Errore nel salvataggio della nota.",
        variant: "destructive",
      });
      console.error('Error saving budget note:', error);
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/budget-notes/${id}`),
    onSuccess: () => {
      toast({
        title: "🗑️ Nota Eliminata",
        description: "La nota è stata eliminata con successo.",
      });
      setNoteData({
        category,
        subcategory,
        monthKey,
        notes: '',
        isAlertEnabled: false,
        priority: 'medium',
        tags: []
      });
      setHasChanges(false);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/budget-notes'] });
    },
    onError: () => {
      toast({
        title: "❌ Errore",
        description: "Errore nell'eliminazione della nota.",
        variant: "destructive",
      });
    }
  });

  // Load existing note data
  useEffect(() => {
    if (Array.isArray(existingNotes) && existingNotes.length > 0) {
      const note = existingNotes.find((n: any) => 
        n.category === category && 
        n.monthKey === monthKey &&
        (subcategory ? n.subcategory === subcategory : !n.subcategory)
      );
      
      if (note) {
        setNoteData({
          ...note,
          budgetGoal: note.budgetGoal ? parseFloat(note.budgetGoal) : undefined,
          actualSpent: note.actualSpent ? parseFloat(note.actualSpent) : undefined,
          variance: note.variance ? parseFloat(note.variance) : undefined,
          alertThreshold: note.alertThreshold ? parseFloat(note.alertThreshold) : undefined,
          tags: note.tags || []
        });
      }
    }
  }, [existingNotes, category, subcategory, monthKey]);

  // Track changes
  useEffect(() => {
    const originalNote = Array.isArray(existingNotes) ? existingNotes.find((n: any) => 
      n.category === category && 
      n.monthKey === monthKey &&
      (subcategory ? n.subcategory === subcategory : !n.subcategory)
    ) : undefined;
    
    if (originalNote) {
      const hasChangedData = 
        noteData.notes !== (originalNote.notes || '') ||
        noteData.budgetGoal !== (originalNote.budgetGoal ? parseFloat(originalNote.budgetGoal) : undefined) ||
        noteData.actualSpent !== (originalNote.actualSpent ? parseFloat(originalNote.actualSpent) : undefined) ||
        noteData.alertThreshold !== (originalNote.alertThreshold ? parseFloat(originalNote.alertThreshold) : undefined) ||
        noteData.isAlertEnabled !== originalNote.isAlertEnabled ||
        noteData.priority !== originalNote.priority ||
        JSON.stringify(noteData.tags) !== JSON.stringify(originalNote.tags || []);
      
      setHasChanges(hasChangedData);
    } else {
      const hasNewData = 
        noteData.notes.trim() !== '' ||
        noteData.budgetGoal !== undefined ||
        noteData.actualSpent !== undefined ||
        noteData.alertThreshold !== undefined ||
        noteData.isAlertEnabled ||
        noteData.priority !== 'medium' ||
        noteData.tags.length > 0;
      
      setHasChanges(hasNewData);
    }
  }, [noteData, existingNotes, category, subcategory, monthKey]);

  const handleSave = () => {
    if (!hasChanges) return;
    
    const dataToSave = {
      ...noteData,
      budgetGoal: noteData.budgetGoal?.toString(),
      actualSpent: noteData.actualSpent?.toString(),
      variance: noteData.variance?.toString(),
      alertThreshold: noteData.alertThreshold?.toString()
    };
    
    saveNoteMutation.mutate(dataToSave);
  };

  const handleDelete = () => {
    const existingNote = Array.isArray(existingNotes) ? existingNotes.find((n: any) => 
      n.category === category && 
      n.monthKey === monthKey &&
      (subcategory ? n.subcategory === subcategory : !n.subcategory)
    ) : undefined;
    
    if (existingNote?.id) {
      deleteNoteMutation.mutate(existingNote.id);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !noteData.tags.includes(newTag.trim())) {
      setNoteData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNoteData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateVariance = () => {
    if (noteData.budgetGoal && noteData.actualSpent) {
      const variance = noteData.actualSpent - noteData.budgetGoal;
      setNoteData(prev => ({ ...prev, variance }));
    }
  };

  useEffect(() => {
    calculateVariance();
  }, [noteData.budgetGoal, noteData.actualSpent]);

  const PriorityIcon = priorityIcons[noteData.priority];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-medium">
              Note per {category}
              {subcategory && ` - ${subcategory}`}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {monthKey}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              className={`text-xs ${priorityColors[noteData.priority]}`}
              variant="outline"
            >
              <PriorityIcon className="w-3 h-3 mr-1" />
              {noteData.priority.toUpperCase()}
            </Badge>
            {noteData.isAlertEnabled && (
              <Badge variant="outline" className="text-xs text-orange-600">
                <Bell className="w-3 h-3 mr-1" />
                Alert
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showAdvancedFeatures ? (
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes" className="text-xs">Note</TabsTrigger>
              <TabsTrigger value="budget" className="text-xs">Budget</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Impostazioni</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-3">
              <div>
                <Label htmlFor="notes-text" className="text-sm font-medium">
                  Note e Osservazioni
                </Label>
                <Textarea
                  id="notes-text"
                  value={noteData.notes}
                  onChange={(e) => setNoteData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Aggiungi note, osservazioni o obiettivi per questa categoria..."
                  className="min-h-[80px] resize-none mt-1"
                  disabled={saveNoteMutation.isPending || deleteNoteMutation.isPending}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                  {noteData.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-red-100"
                      onClick={() => removeTag(tag)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Aggiungi tag..."
                    className="text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag} disabled={!newTag.trim()}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="budget-goal" className="text-sm font-medium">
                    Budget Obiettivo (€)
                  </Label>
                  <Input
                    id="budget-goal"
                    type="number"
                    value={noteData.budgetGoal || ''}
                    onChange={(e) => setNoteData(prev => ({ 
                      ...prev, 
                      budgetGoal: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="actual-spent" className="text-sm font-medium">
                    Spesa Effettiva (€)
                  </Label>
                  <Input
                    id="actual-spent"
                    type="number"
                    value={noteData.actualSpent || ''}
                    onChange={(e) => setNoteData(prev => ({ 
                      ...prev, 
                      actualSpent: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              {noteData.variance !== undefined && (
                <Alert className={noteData.variance > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <span className="font-medium">
                      Varianza: {noteData.variance > 0 ? '+' : ''}€{noteData.variance.toFixed(2)}
                    </span>
                    <br />
                    {noteData.variance > 0 
                      ? `Superato il budget di €${noteData.variance.toFixed(2)}`
                      : `Risparmiati €${Math.abs(noteData.variance).toFixed(2)}`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Priorità</Label>
                <Select 
                  value={noteData.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNoteData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Bassa</SelectItem>
                    <SelectItem value="medium">🟡 Media</SelectItem>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Alert Attivi</Label>
                  <p className="text-xs text-gray-500">
                    Ricevi notifiche quando superi la soglia
                  </p>
                </div>
                <Switch
                  checked={noteData.isAlertEnabled}
                  onCheckedChange={(checked) => 
                    setNoteData(prev => ({ ...prev, isAlertEnabled: checked }))
                  }
                />
              </div>

              {noteData.isAlertEnabled && (
                <div>
                  <Label htmlFor="alert-threshold" className="text-sm font-medium">
                    Soglia Alert (%)
                  </Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    value={noteData.alertThreshold || ''}
                    onChange={(e) => setNoteData(prev => ({ 
                      ...prev, 
                      alertThreshold: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="85"
                    min="0"
                    max="100"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert quando raggiungi questa % del budget
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            <Label htmlFor="simple-notes" className="text-sm font-medium">
              Note
            </Label>
            <Textarea
              id="simple-notes"
              value={noteData.notes}
              onChange={(e) => setNoteData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Aggiungi una nota..."
              className="min-h-[80px] resize-none mt-1"
              disabled={saveNoteMutation.isPending || deleteNoteMutation.isPending}
            />
          </div>
        )}

        {(hasChanges || noteData.notes.trim() || noteData.tags.length > 0) && (
          <div className="flex gap-2 pt-2 border-t">
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={saveNoteMutation.isPending}
                size="sm"
                className="flex items-center gap-1"
              >
                {saveNoteMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Salva
              </Button>
            )}
            
            {(noteData.notes.trim() || noteData.tags.length > 0) && (
              <Button
                onClick={handleDelete}
                disabled={deleteNoteMutation.isPending}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                {deleteNoteMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Elimina
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}