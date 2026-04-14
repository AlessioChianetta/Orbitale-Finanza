import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Calendar, 
  Target,
  TrendingUp,
  Clock,
  Award,
  Star,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  MessageSquare
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

interface ClientExercise {
  id: number;
  exerciseId: number;
  exerciseTitle: string;
  exerciseDescription: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  assignedDate: string;
  dueDate?: string;
  status: string;
  progress: number;
  clientNotes?: string;
  consultantFeedback?: string;
  completedDate?: string;
  rating?: number;
  timeSpent?: number;
  isStarred: boolean;
}

interface UpcomingConsultation {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  consultantName: string;
  location?: string;
  status: string;
}

interface ProgressData {
  id: number;
  category: string;
  currentLevel: string;
  nextLevel: string;
  progressPercentage: number;
  totalExercises: number;
  completedExercises: number;
  averageScore: number;
  lastUpdated: string;
}

export default function ClientDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch client exercises
  const { data: exercises, isLoading: exercisesLoading } = useQuery<ClientExercise[]>({
    queryKey: ['/api/my-exercises'],
  });

  // Fetch upcoming consultations
  const { data: consultations, isLoading: consultationsLoading } = useQuery<UpcomingConsultation[]>({
    queryKey: ['/api/my-appointments'],
  });

  // Fetch progress data
  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData[]>({
    queryKey: ['/api/my-progress'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return PlayCircle;
      case 'overdue': return AlertCircle;
      case 'assigned': return Clock;
      default: return Clock;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'budget': return 'bg-blue-100 text-blue-800';
      case 'investments': return 'bg-purple-100 text-purple-800';
      case 'debt': return 'bg-orange-100 text-orange-800';
      case 'planning': return 'bg-emerald-100 text-emerald-800';
      case 'education': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingExercises = exercises?.filter(ex => ex.status === 'assigned' || ex.status === 'in_progress') || [];
  const completedExercises = exercises?.filter(ex => ex.status === 'completed') || [];
  const overdueExercises = exercises?.filter(ex => {
    if (ex.status === 'completed' || !ex.dueDate) return false;
    return isAfter(new Date(), new Date(ex.dueDate));
  }) || [];

  const isLoading = exercisesLoading || consultationsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                  <div className="p-2 sm:p-3 bg-emerald-600 rounded-xl shadow-lg flex-shrink-0">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">Il Tuo Percorso Finanziario</h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                      <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Percorso attivo</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">Monitora i tuoi progressi e gestisci le attività assegnate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 via-blue-50 to-white">
          <CardContent className="relative p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-800 mb-1 uppercase truncate">Esercizi Attivi</p>
                  <p className="text-lg md:text-xl font-black text-blue-700 truncate">{upcomingExercises.length}</p>
                  <p className="text-xs text-blue-600">{overdueExercises.length > 0 ? `${overdueExercises.length} in ritardo` : ''}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 via-green-50 to-white">
          <CardContent className="relative p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex-shrink-0">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-800 mb-1 uppercase truncate">Completati</p>
                  <p className="text-lg md:text-xl font-black text-green-700 truncate">{completedExercises.length}</p>
                  <p className="text-xs text-green-600">{exercises?.length ? `${((completedExercises.length / exercises.length) * 100).toFixed(0)}% del totale` : '0% del totale'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-purple-50 via-purple-50 to-white">
          <CardContent className="relative p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-800 mb-1 uppercase truncate">Prossima Consulenza</p>
                  {consultations && consultations.length > 0 ? (
                    <>
                      <p className="text-lg md:text-xl font-black text-purple-700 truncate">{format(new Date(consultations[0].startTime), 'dd MMM', { locale: it })}</p>
                      <p className="text-xs text-purple-600">{format(new Date(consultations[0].startTime), 'HH:mm', { locale: it })}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg md:text-xl font-black text-purple-700 truncate">--</p>
                      <p className="text-xs text-purple-600">Nessuna pianificata</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-orange-50 via-orange-50 to-white">
          <CardContent className="relative p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-orange-800 mb-1 uppercase truncate">Livello Attuale</p>
                  <p className="text-lg md:text-xl font-black text-orange-700 truncate">{progressData && progressData.length > 0 ? progressData[0].currentLevel : 'Principiante'}</p>
                  <p className="text-xs text-orange-600">{progressData && progressData.length > 0 ? `${progressData[0].progressPercentage}% verso ${progressData[0].nextLevel}` : 'Inizia il tuo percorso'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="exercises">Esercizi</TabsTrigger>
          <TabsTrigger value="consultations">Consulenze</TabsTrigger>
          <TabsTrigger value="progress">Progressi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Exercises */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Prossimi Esercizi
                </CardTitle>
                <CardDescription>Esercizi da completare</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingExercises.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingExercises.slice(0, 3).map((exercise) => {
                      const StatusIcon = getStatusIcon(exercise.status);
                      const isOverdue = exercise.dueDate && isAfter(new Date(), new Date(exercise.dueDate));
                      
                      return (
                        <div key={exercise.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <StatusIcon className={`w-5 h-5 mt-0.5 ${
                            isOverdue ? 'text-red-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {exercise.exerciseTitle}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {exercise.exerciseDescription}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={getDifficultyColor(exercise.difficulty)}>
                                {exercise.difficulty}
                              </Badge>
                              <Badge className={getCategoryColor(exercise.category)}>
                                {exercise.category}
                              </Badge>
                              {exercise.dueDate && (
                                <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                  Scadenza: {format(new Date(exercise.dueDate), 'dd/MM/yyyy', { locale: it })}
                                </span>
                              )}
                            </div>
                            {exercise.progress > 0 && (
                              <div className="mt-2">
                                <Progress value={exercise.progress} className="h-2" />
                                <span className="text-xs text-gray-500">{exercise.progress}% completato</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">Nessun esercizio assegnato</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Consultations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Prossime Consulenze
                </CardTitle>
                <CardDescription>I tuoi appuntamenti</CardDescription>
              </CardHeader>
              <CardContent>
                {consultations && consultations.length > 0 ? (
                  <div className="space-y-3">
                    {consultations.slice(0, 3).map((consultation) => (
                      <div key={consultation.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">{consultation.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{consultation.consultantName}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(consultation.startTime), "dd MMM 'alle' HH:mm", { locale: it })}
                          </div>
                          {consultation.location && (
                            <p className="text-xs text-gray-500 mt-1">{consultation.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm">Nessuna consulenza in programma</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {exercises && exercises.length > 0 ? (
              exercises.map((exercise) => {
                const StatusIcon = getStatusIcon(exercise.status);
                const isOverdue = exercise.dueDate && exercise.status !== 'completed' && isAfter(new Date(), new Date(exercise.dueDate));
                
                return (
                  <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center text-lg">
                            <StatusIcon className={`w-5 h-5 mr-2 ${
                              isOverdue ? 'text-red-500' : 
                              exercise.status === 'completed' ? 'text-green-500' : 'text-blue-500'
                            }`} />
                            {exercise.exerciseTitle}
                            {exercise.isStarred && <Star className="w-4 h-4 ml-2 text-yellow-500 fill-current" />}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {exercise.exerciseDescription}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(exercise.status)}>
                          {exercise.status === 'completed' ? 'Completato' :
                           exercise.status === 'in_progress' ? 'In Corso' :
                           exercise.status === 'overdue' ? 'In Ritardo' : 'Assegnato'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getCategoryColor(exercise.category)}>
                          {exercise.category}
                        </Badge>
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {exercise.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {exercise.estimatedTime} min
                        </Badge>
                      </div>
                      
                      {exercise.progress > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progresso</span>
                            <span>{exercise.progress}%</span>
                          </div>
                          <Progress value={exercise.progress} className="h-2" />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Assegnato:</span>
                          <p>{format(new Date(exercise.assignedDate), 'dd/MM/yyyy', { locale: it })}</p>
                        </div>
                        {exercise.dueDate && (
                          <div>
                            <span className="font-medium">Scadenza:</span>
                            <p className={isOverdue ? 'text-red-600' : ''}>
                              {format(new Date(exercise.dueDate), 'dd/MM/yyyy', { locale: it })}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {exercise.completedDate && (
                        <div className="text-sm text-green-600">
                          <span className="font-medium">Completato:</span>
                          <span className="ml-1">
                            {format(new Date(exercise.completedDate), "dd/MM/yyyy 'alle' HH:mm", { locale: it })}
                          </span>
                          {exercise.timeSpent && (
                            <span className="ml-2">in {exercise.timeSpent} minuti</span>
                          )}
                        </div>
                      )}
                      
                      {exercise.rating && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">La tua valutazione:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= exercise.rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {exercise.consultantFeedback && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-blue-800">Feedback del consulente:</span>
                          <p className="text-blue-700 text-sm mt-1">{exercise.consultantFeedback}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        {exercise.status !== 'completed' && (
                          <Button size="sm" data-testid={`start-exercise-${exercise.id}`}>
                            {exercise.status === 'in_progress' ? 'Continua' : 'Inizia'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" data-testid={`exercise-details-${exercise.id}`}>
                          Dettagli
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun esercizio assegnato</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Il tuo consulente ti assegnerà presto i primi esercizi
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {consultations && consultations.length > 0 ? (
              consultations.map((consultation) => (
                <Card key={consultation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{consultation.title}</CardTitle>
                        <CardDescription className="mt-1">
                          con {consultation.consultantName}
                        </CardDescription>
                      </div>
                      <Badge className={consultation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {consultation.status === 'confirmed' ? 'Confermata' : 'In Attesa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {format(new Date(consultation.startTime), "EEEE, d MMMM yyyy", { locale: it })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {format(new Date(consultation.startTime), 'HH:mm')} - {format(new Date(consultation.endTime), 'HH:mm')}
                      </div>
                      {consultation.location && (
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-2 text-gray-500">📍</span>
                          {consultation.location}
                        </div>
                      )}
                    </div>
                    {consultation.description && (
                      <p className="text-sm text-gray-600 mt-3">{consultation.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna consulenza in programma</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contatta il tuo consulente per programmare un appuntamento
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {progressData && progressData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {progressData.map((progress) => (
                <Card key={progress.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-600" />
                      Progresso in {progress.category}
                    </CardTitle>
                    <CardDescription>
                      Livello attuale: {progress.currentLevel} → Prossimo: {progress.nextLevel}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso verso il livello successivo</span>
                        <span>{progress.progressPercentage}%</span>
                      </div>
                      <Progress value={progress.progressPercentage} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{progress.completedExercises}</div>
                        <div className="text-sm text-blue-800">Esercizi Completati</div>
                        <div className="text-xs text-blue-600">di {progress.totalExercises} totali</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{progress.averageScore.toFixed(1)}</div>
                        <div className="text-sm text-green-800">Punteggio Medio</div>
                        <div className="text-xs text-green-600">su 5.0</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {((progress.completedExercises / progress.totalExercises) * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-purple-800">Completamento</div>
                        <div className="text-xs text-purple-600">del percorso</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Ultimo aggiornamento: {format(new Date(progress.lastUpdated), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun dato sui progressi</h3>
              <p className="mt-1 text-sm text-gray-500">
                Completa alcuni esercizi per vedere i tuoi progressi
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}