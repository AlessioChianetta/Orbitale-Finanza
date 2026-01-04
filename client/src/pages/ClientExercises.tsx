import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  BookOpen,
  Clock,
  Target,
  Star,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Exercise {
  id: number;
  title: string;
  description: string;
  instructions?: string;
  category: string;
  difficulty: string;
  estimatedTime?: number;
  type: string;
  template?: string;
  isPublic: boolean;
  isActive: boolean;
  successCriteria?: string;
  resources: string[];
  tags: string[];
  usageCount: number;
  averageCompletion?: number;
  averageRating?: number;
  createdAt: string;
}

interface ClientExerciseAssignment {
  id: number;
  exerciseId: number;
  clientId: number;
  consultantId: number;
  assignedAt: string;
  dueDate?: string;
  status: string;
  completedAt?: string;
  clientFeedback?: string;
  priority: string;
  consultantNotes?: string;
  customInstructions?: string;
  exercise: Exercise;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const categoryColors = {
  'financial-planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'budgeting': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'investment': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'debt-management': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'savings': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'retirement': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'insurance': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'tax-planning': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
};

const statusColors = {
  'assigned': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export default function ClientExercises() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const { toast } = useToast();

  // Fetch all public exercises (library) - using client-accessible endpoint
  const { data: allExercises = [], isLoading: loadingExercises, error: exercisesError } = useQuery<Exercise[]>({
    queryKey: ['/api/consultation/exercises', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/consultation/exercises/public');
      if (res.status === 401 || res.status === 403) {
        throw new Error('Non hai i permessi necessari per visualizzare questa sezione');
      }
      if (!res.ok) {
        throw new Error('Errore nel caricamento degli esercizi');
      }
      return res.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('permessi') || failureCount >= 2) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Fetch assigned exercises for the current client using the proper client endpoint
  // TODO: Replace hardcoded clientId with actual client ID from auth context
  const { data: assignedExercises = [], isLoading: loadingAssignments, error: assignmentsError } = useQuery<ClientExerciseAssignment[]>({
    queryKey: ['/api/my-exercises'],
    queryFn: async () => {
      const res = await fetch('/api/my-exercises');
      if (res.status === 401 || res.status === 403) {
        throw new Error('Non hai i permessi necessari per visualizzare i tuoi esercizi');
      }
      if (!res.ok) {
        throw new Error('Errore nel caricamento dei tuoi esercizi');
      }
      return res.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('permessi') || failureCount >= 2) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Handle errors with toast notifications
  if (exercisesError && !loadingExercises) {
    toast({
      title: "Errore",
      description: (exercisesError as any)?.message || "Errore nel caricamento degli esercizi pubblici",
      variant: "destructive",
    });
  }

  if (assignmentsError && !loadingAssignments) {
    toast({
      title: "Errore",
      description: (assignmentsError as any)?.message || "Errore nel caricamento dei tuoi esercizi assegnati",
      variant: "destructive",
    });
  }

  // Filter exercises based on search and filters
  const filteredAllExercises = (allExercises as Exercise[]).filter((exercise: Exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty && exercise.isPublic && exercise.isActive;
  });

  const filteredAssignedExercises = (assignedExercises as ClientExerciseAssignment[]).filter((assignment: ClientExerciseAssignment) => {
    const exercise = assignment.exercise;
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = [
    { value: 'all', label: 'Tutte le categorie' },
    { value: 'financial-planning', label: 'Pianificazione Finanziaria' },
    { value: 'budgeting', label: 'Budgeting' },
    { value: 'investment', label: 'Investimenti' },
    { value: 'debt-management', label: 'Gestione Debiti' },
    { value: 'savings', label: 'Risparmio' },
    { value: 'retirement', label: 'Pensione' },
    { value: 'insurance', label: 'Assicurazioni' },
    { value: 'tax-planning', label: 'Pianificazione Fiscale' }
  ];

  const difficulties = [
    { value: 'all', label: 'Tutti i livelli' },
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzato' }
  ];

  const renderExerciseCard = (exercise: Exercise, assignment?: ClientExerciseAssignment) => (
    <Card key={`${exercise.id}-${assignment?.id || 'public'}`} className="h-full hover:shadow-lg transition-shadow duration-200" data-testid={`card-exercise-${exercise.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 break-words" data-testid={`text-exercise-title-${exercise.id}`}>
              {exercise.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={categoryColors[exercise.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}
                data-testid={`badge-category-${exercise.id}`}
              >
                {categories.find(c => c.value === exercise.category)?.label || exercise.category}
              </Badge>
              <Badge 
                variant="outline"
                className={difficultyColors[exercise.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800'}
                data-testid={`badge-difficulty-${exercise.id}`}
              >
                {difficulties.find(d => d.value === exercise.difficulty)?.label || exercise.difficulty}
              </Badge>
              {assignment && (
                <>
                  <Badge 
                    className={statusColors[assignment.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                    data-testid={`badge-status-${assignment.id}`}
                  >
                    {assignment.status === 'assigned' && 'Assegnato'}
                    {assignment.status === 'in-progress' && 'In Corso'}
                    {assignment.status === 'completed' && 'Completato'}
                    {assignment.status === 'overdue' && 'Scaduto'}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={priorityColors[assignment.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}
                    data-testid={`badge-priority-${assignment.id}`}
                  >
                    {assignment.priority === 'low' && 'Bassa'}
                    {assignment.priority === 'medium' && 'Media'}
                    {assignment.priority === 'high' && 'Alta'}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="break-words" data-testid={`text-exercise-description-${exercise.id}`}>
          {exercise.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {exercise.instructions && (
            <div>
              <Label className="text-sm font-medium">Istruzioni:</Label>
              <p className="text-sm text-muted-foreground mt-1 break-words" data-testid={`text-instructions-${exercise.id}`}>
                {exercise.instructions}
              </p>
            </div>
          )}
          
          {assignment?.customInstructions && (
            <div>
              <Label className="text-sm font-medium">Istruzioni Personalizzate:</Label>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 break-words" data-testid={`text-custom-instructions-${assignment.id}`}>
                {assignment.customInstructions}
              </p>
            </div>
          )}
          
          {assignment?.consultantNotes && (
            <div>
              <Label className="text-sm font-medium">Note del Consulente:</Label>
              <p className="text-sm text-muted-foreground mt-1 break-words" data-testid={`text-consultant-notes-${assignment.id}`}>
                {assignment.consultantNotes}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {exercise.estimatedTime && (
              <div className="flex items-center gap-1" data-testid={`text-estimated-time-${exercise.id}`}>
                <Clock className="w-4 h-4" />
                <span>{exercise.estimatedTime} min</span>
              </div>
            )}
            
            {assignment?.dueDate && (
              <div className="flex items-center gap-1" data-testid={`text-due-date-${assignment.id}`}>
                <Calendar className="w-4 h-4" />
                <span>Scadenza: {new Date(assignment.dueDate).toLocaleDateString('it-IT')}</span>
              </div>
            )}
            
            {assignment?.completedAt && (
              <div className="flex items-center gap-1 text-green-600" data-testid={`text-completed-date-${assignment.id}`}>
                <CheckCircle className="w-4 h-4" />
                <span>Completato: {new Date(assignment.completedAt).toLocaleDateString('it-IT')}</span>
              </div>
            )}
          </div>

          {exercise.tags && exercise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {exercise.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-tag-${exercise.id}-${index}`}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {assignment && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Assegnato il: {new Date(assignment.assignedAt).toLocaleDateString('it-IT')}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`button-view-exercise-${exercise.id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Visualizza
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">I Miei Esercizi</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Esplora la biblioteca degli esercizi e visualizza quelli assegnati dal tuo consulente
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri di Ricerca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cerca esercizi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-exercises"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                data-testid="select-category-filter"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                data-testid="select-difficulty-filter"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different exercise views */}
      <Tabs defaultValue="assigned" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assigned" data-testid="tab-assigned-exercises">
            I Miei Esercizi ({filteredAssignedExercises.length})
          </TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library-exercises">
            Tutti gli Esercizi ({filteredAllExercises.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-6">
          {loadingAssignments ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Caricamento esercizi assegnati...</p>
            </div>
          ) : assignmentsError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-assignments-error">
                  Errore nel caricamento
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {assignmentsError?.message || 'Non è stato possibile caricare i tuoi esercizi assegnati.'}
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  data-testid="button-reload-assignments"
                >
                  Riprova
                </Button>
              </CardContent>
            </Card>
          ) : filteredAssignedExercises.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-no-assigned-exercises">
                  Nessun esercizio assegnato
                </h3>
                <p className="text-muted-foreground text-center">
                  Non hai ancora esercizi assegnati dal tuo consulente.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignedExercises.map(assignment => 
                renderExerciseCard(assignment.exercise, assignment)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {loadingExercises ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Caricamento biblioteca esercizi...</p>
            </div>
          ) : exercisesError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-library-error">
                  Errore nel caricamento
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {exercisesError?.message || 'Non è stato possibile caricare la biblioteca degli esercizi.'}
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  data-testid="button-reload-library"
                >
                  Riprova
                </Button>
              </CardContent>
            </Card>
          ) : filteredAllExercises.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-no-library-exercises">
                  Nessun esercizio trovato
                </h3>
                <p className="text-muted-foreground text-center">
                  Prova a modificare i filtri di ricerca.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllExercises.map(exercise => 
                renderExerciseCard(exercise)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}