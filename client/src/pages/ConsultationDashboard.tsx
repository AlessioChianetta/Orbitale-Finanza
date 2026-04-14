import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  Clock,
  Target,
  MessageSquare,
  Award
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isToday, isTomorrow } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  consultationsToday: number;
  consultationsThisWeek: number;
  activeExercises: number;
  completedExercisesThisWeek: number;
  avgClientSatisfaction: number;
  followUpRequired: number;
}

interface ConsultationToday {
  id: number;
  clientName: string;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
}

interface RecentActivity {
  id: number;
  type: string;
  clientName: string;
  description: string;
  timestamp: Date;
}

export default function ConsultationDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/admin/consultation/dashboard/stats'],
  });

  // Fetch today's consultations
  const { data: consultationsToday, isLoading: consultationsLoading } = useQuery<ConsultationToday[]>({
    queryKey: ['/admin/consultation/dashboard/consultations-today'],
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['/admin/consultation/dashboard/recent-activity'],
  });

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm', { locale: it });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'consultation': return MessageSquare;
      case 'exercise_completed': return Award;
      case 'exercise_assigned': return BookOpen;
      case 'client_added': return Users;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'text-blue-600';
      case 'exercise_completed': return 'text-green-600';
      case 'exercise_assigned': return 'text-purple-600';
      case 'client_added': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent mb-4"></div>
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
                  <div className="p-2 sm:p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">Dashboard Consulenze</h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                      <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Panoramica attiva</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">Panoramica delle tue attività di consulenza</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 via-blue-50 to-white">
          <CardContent className="relative p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-800 mb-1 uppercase truncate">Clienti Attivi</p>
                  <p className="text-lg md:text-xl font-black text-blue-700 truncate">{stats?.activeClients || 0}</p>
                  <p className="text-xs text-blue-600">di {stats?.totalClients || 0} totali</p>
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
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-800 mb-1 uppercase truncate">Consulenze Oggi</p>
                  <p className="text-lg md:text-xl font-black text-green-700 truncate">{stats?.consultationsToday || 0}</p>
                  <p className="text-xs text-green-600">{stats?.consultationsThisWeek || 0} questa settimana</p>
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
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-800 mb-1 uppercase truncate">Esercizi Attivi</p>
                  <p className="text-lg md:text-xl font-black text-purple-700 truncate">{stats?.activeExercises || 0}</p>
                  <p className="text-xs text-purple-600">{stats?.completedExercisesThisWeek || 0} completati</p>
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
                  <p className="text-xs font-bold text-orange-800 mb-1 uppercase truncate">Soddisfazione</p>
                  <p className="text-lg md:text-xl font-black text-orange-700 truncate">{stats?.avgClientSatisfaction ? `${stats.avgClientSatisfaction.toFixed(1)}/5` : 'N/A'}</p>
                  <p className="text-xs text-orange-600">{stats?.followUpRequired || 0} follow-up</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Consultations */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Consulenze di Oggi
            </CardTitle>
            <CardDescription>
              I tuoi appuntamenti per {format(new Date(), 'dd MMMM yyyy', { locale: it })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consultationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : consultationsToday?.length ? (
              <div className="space-y-4">
                {consultationsToday.map((consultation) => (
                  <div key={consultation.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {consultation.clientName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)} • {consultation.type}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={consultation.status === 'confirmed' ? 'default' : 'secondary'}>
                        {consultation.status === 'confirmed' ? 'Confermata' : 'In Attesa'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna consulenza oggi</h3>
                <p className="mt-1 text-sm text-gray-500">La tua giornata è libera!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Attività Recente
            </CardTitle>
            <CardDescription>
              Ultimi aggiornamenti dei tuoi clienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity?.length ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100`}>
                        <Icon className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.clientName}</span> {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'dd/MM HH:mm', { locale: it })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Nessuna attività recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}