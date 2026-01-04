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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Consulenze</h1>
        <p className="text-gray-600 mt-1">Panoramica delle tue attività di consulenza</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Clienti Attivi</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {stats?.activeClients || 0}
            </div>
            <p className="text-xs text-blue-700">
              di {stats?.totalClients || 0} totali
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Consulenze Oggi</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {stats?.consultationsToday || 0}
            </div>
            <p className="text-xs text-green-700">
              {stats?.consultationsThisWeek || 0} questa settimana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Esercizi Attivi</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats?.activeExercises || 0}
            </div>
            <p className="text-xs text-purple-700">
              {stats?.completedExercisesThisWeek || 0} completati questa settimana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Soddisfazione Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {stats?.avgClientSatisfaction ? `${stats.avgClientSatisfaction.toFixed(1)}/5` : 'N/A'}
            </div>
            <p className="text-xs text-orange-700">
              {stats?.followUpRequired || 0} follow-up richiesti
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Consultations */}
        <Card className="lg:col-span-2">
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
        <Card>
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
  );
}