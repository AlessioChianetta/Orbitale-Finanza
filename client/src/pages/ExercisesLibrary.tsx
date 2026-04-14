import { useState } from 'react';
import { safeFloat, safeInt } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  BookOpen, 
  Clock, 
  Target, 
  UserPlus,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

// Tipi semplificati per il nuovo sistema
interface Exercise {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime?: number;
  assignedCount?: number;
}

interface ClientExercise {
  id: number;
  exerciseId: number;
  exerciseTitle: string;
  exerciseDescription: string;
  status: string;
  assignedDate: string;
  consultantNotes?: string;
  priority: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Client {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export default function ExercisesLibrary() {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [exerciseToAssign, setExerciseToAssign] = useState<Exercise | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const { toast } = useToast();

  // Recupera informazioni utente per determinare il ruolo
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Determina se l'utente è consulente/admin basato sul role dal backend
  const isConsultant = user?.role === 'consultant' || user?.role === 'admin';

  // Query per consulenti: ottieni esercizi pubblici
  const { data: consultantExercises, isLoading: isLoadingConsultant } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises-library/consultant'],
    enabled: !!user && isConsultant,
  });

  // Query per clienti: ottieni esercizi assegnati
  const { data: clientExercises, isLoading: isLoadingClient } = useQuery<ClientExercise[]>({
    queryKey: ['/api/exercises-library/client'],
    enabled: !!user && !isConsultant,
  });

  // Query per lista clienti (solo per consulenti)
  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/consultation/clients'],
    enabled: !!user && isConsultant,
  });

  // Mutation per assegnare esercizio
  const assignExerciseMutation = useMutation({
    mutationFn: async ({ clientId, exerciseId, priority = 'medium', consultantNotes = '' }: {
      clientId: number;
      exerciseId: number;
      priority?: string;
      consultantNotes?: string;
    }) => {
      return apiRequest('POST', '/api/exercises-library/assign', {
        clientId,
        exerciseId,
        priority,
        consultantNotes
      });
    },
    onSuccess: () => {
      toast({
        title: "Esercizio assegnato",
        description: "L'esercizio è stato assegnato con successo al cliente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exercises-library/consultant'] });
      setIsAssignDialogOpen(false);
      setSelectedClient('');
    },
    onError: (error) => {
      console.error('Error assigning exercise:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile assegnare l'esercizio. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleAssignExercise = () => {
    if (!exerciseToAssign || !selectedClient) {
      toast({
        title: "Errore",
        description: "Seleziona un cliente per assegnare l'esercizio.",
        variant: "destructive",
      });
      return;
    }

    assignExerciseMutation.mutate({
      clientId: safeInt(selectedClient),
      exerciseId: exerciseToAssign.id,
      priority: 'medium',
      consultantNotes: 'Esercizio assegnato tramite biblioteca'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case 'facile':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
      case 'difficile':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="loading-state">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="exercises-library">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-purple-600 rounded-xl shadow-lg flex-shrink-0">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate" data-testid="page-title">
                        {isConsultant ? 'Biblioteca Esercizi - Consulente' : 'I Miei Esercizi'}
                      </h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                        <span className="text-gray-100 text-xs sm:text-sm font-medium truncate" data-testid="page-description">
                          {isConsultant ? 'Gestione esercizi' : 'Esercizi assegnati'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">
                    {isConsultant 
                      ? 'Gestisci e assegna esercizi ai tuoi clienti' 
                      : 'Visualizza gli esercizi assegnati dal tuo consulente'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isConsultant ? (
        // Vista Consulente
        <div data-testid="consultant-view">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4" data-testid="available-exercises-title">
              Esercizi Disponibili ({consultantExercises?.length || 0})
            </h2>
          </div>

          {isLoadingConsultant ? (
            <div className="text-center py-8" data-testid="loading-consultant">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Caricamento esercizi...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="exercises-grid">
              {consultantExercises?.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-lg transition-shadow" data-testid={`exercise-card-${exercise.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg" data-testid={`exercise-title-${exercise.id}`}>
                          {exercise.title}
                        </CardTitle>
                        <CardDescription className="mt-1" data-testid={`exercise-description-${exercise.id}`}>
                          {exercise.description}
                        </CardDescription>
                      </div>
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getDifficultyColor(exercise.difficulty)} data-testid={`exercise-difficulty-${exercise.id}`}>
                          {exercise.difficulty}
                        </Badge>
                        <Badge variant="outline" data-testid={`exercise-category-${exercise.id}`}>
                          {exercise.category}
                        </Badge>
                      </div>
                      
                      {exercise.estimatedTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-600" data-testid={`exercise-time-${exercise.id}`}>
                          <Clock className="h-4 w-4" />
                          <span>{exercise.estimatedTime} min</span>
                        </div>
                      )}

                      {exercise.assignedCount !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-gray-600" data-testid={`exercise-assigned-count-${exercise.id}`}>
                          <Target className="h-4 w-4" />
                          <span>Assegnato {exercise.assignedCount} volte</span>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          setExerciseToAssign(exercise);
                          setIsAssignDialogOpen(true);
                        }}
                        className="w-full"
                        data-testid={`assign-button-${exercise.id}`}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assegna Cliente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Vista Cliente
        <div data-testid="client-view">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4" data-testid="assigned-exercises-title">
              Esercizi Assegnati ({clientExercises?.length || 0})
            </h2>
          </div>

          {isLoadingClient ? (
            <div className="text-center py-8" data-testid="loading-client">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Caricamento esercizi...</p>
            </div>
          ) : clientExercises && clientExercises.length > 0 ? (
            <div className="grid gap-4" data-testid="client-exercises-grid">
              {clientExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow" data-testid={`client-exercise-card-${exercise.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg" data-testid={`client-exercise-title-${exercise.id}`}>
                          {exercise.exerciseTitle}
                        </CardTitle>
                        <CardDescription className="mt-1" data-testid={`client-exercise-description-${exercise.id}`}>
                          {exercise.exerciseDescription}
                        </CardDescription>
                      </div>
                      {exercise.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(exercise.status)} data-testid={`client-exercise-status-${exercise.id}`}>
                          {exercise.status === 'completed' ? 'Completato' : 
                           exercise.status === 'in_progress' ? 'In Corso' : 'Da Iniziare'}
                        </Badge>
                        <Badge variant="outline" data-testid={`client-exercise-priority-${exercise.id}`}>
                          Priorità: {exercise.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600" data-testid={`client-exercise-date-${exercise.id}`}>
                        <Calendar className="h-4 w-4" />
                        <span>Assegnato: {new Date(exercise.assignedDate).toLocaleDateString()}</span>
                      </div>

                      {exercise.consultantNotes && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded" data-testid={`client-exercise-notes-${exercise.id}`}>
                          <strong>Note del consulente:</strong> {exercise.consultantNotes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="no-exercises">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nessun esercizio assegnato
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Il tuo consulente non ti ha ancora assegnato alcun esercizio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dialog per assegnazione esercizio */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent data-testid="assign-dialog">
          <DialogHeader>
            <DialogTitle data-testid="assign-dialog-title">Assegna Esercizio</DialogTitle>
            <DialogDescription data-testid="assign-dialog-description">
              Seleziona il cliente a cui assegnare "{exerciseToAssign?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Select value={selectedClient} onValueChange={setSelectedClient} data-testid="client-select">
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()} data-testid={`client-option-${client.id}`}>
                      {client.firstName} {client.lastName} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedClient('');
                }}
                data-testid="cancel-assign-button"
              >
                Annulla
              </Button>
              <Button
                onClick={handleAssignExercise}
                disabled={assignExerciseMutation.isPending}
                data-testid="confirm-assign-button"
              >
                {assignExerciseMutation.isPending ? 'Assegnazione...' : 'Assegna'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}