import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  parseISO 
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  clientId?: number;
  clientName?: string;
  status: string;
  eventType: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const EVENT_TYPES = [
  { value: 'consultation', label: 'Consulenza' },
  { value: 'initial', label: 'Prima Consulenza' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'review', label: 'Revisione' },
  { value: 'emergency', label: 'Urgente' },
  { value: 'available', label: 'Disponibilità' }
];

const statusColors = {
  'scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'rescheduled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
};

export default function ClientCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // TODO: Replace with actual client ID from auth context
  const currentClientId = 1; // This should come from authentication context

  // Get month range
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch calendar events for the current client
  const { data: allEvents = [], isLoading, error, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/consultation/calendar', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM')],
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) return false;
      if (error instanceof Error && error.message.includes('403')) return false;
      return failureCount < 3;
    }
  });

  // Filter events for the current client
  const events = allEvents.filter(event => event.clientId === currentClientId);

  // Fetch clients for displaying client names
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/consultation/clients'],
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) return false;
      if (error instanceof Error && error.message.includes('403')) return false;
      return failureCount < 3;
    }
  });

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter(event => 
      isSameDay(new Date(event.startTime), day)
    );
  };

  const getClientName = (clientId?: number) => {
    if (!clientId) return 'Cliente non specificato';
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : `Cliente ${clientId}`;
  };

  const getEventTypeLabel = (type: string) => {
    const typeEntry = EVENT_TYPES.find(et => et.value === type);
    return typeEntry ? typeEntry.label : type;
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'consultation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'initial': return 'bg-green-100 text-green-800 border-green-200';
      case 'follow_up': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'available': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses = {
      'scheduled': 'Programmato',
      'confirmed': 'Confermato',
      'completed': 'Completato',
      'cancelled': 'Annullato',
      'rescheduled': 'Riprogrammato'
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Errore di caricamento</h3>
            <p className="text-muted-foreground text-center mb-4">
              {error instanceof Error && error.message.includes('401') 
                ? 'Non sei autorizzato a visualizzare questi dati.'
                : error instanceof Error && error.message.includes('403')
                ? 'Non hai i permessi per accedere a questa sezione.'
                : 'Si è verificato un errore durante il caricamento del calendario.'}
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry">
              Riprova
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Il Mio Calendario</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Visualizza i tuoi appuntamenti e consultazioni programmate
          </p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                data-testid="button-previous-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                data-testid="button-today"
              >
                Oggi
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Caricamento calendario...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => (
                  <div key={index} className="p-2 text-center font-medium text-muted-foreground border-b">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-border/50 ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isDayToday ? 'bg-primary/5 border-primary' : ''}`}
                      data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                    >
                      <div className={`text-sm mb-1 ${
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      } ${isDayToday ? 'font-bold' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${getEventTypeColor(event.eventType)}`}
                            onClick={() => setSelectedEvent(event)}
                            data-testid={`event-${event.id}`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">
                              {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} altri
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal/Card */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2" data-testid={`text-event-title-${selectedEvent.id}`}>
                  <Calendar className="w-5 h-5" />
                  {selectedEvent.title}
                </CardTitle>
                <CardDescription data-testid={`text-event-description-${selectedEvent.id}`}>
                  {selectedEvent.description}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                data-testid="button-close-event-details"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2" data-testid={`text-event-date-${selectedEvent.id}`}>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(selectedEvent.startTime), 'dd MMMM yyyy', { locale: it })}</span>
                </div>
                
                <div className="flex items-center gap-2" data-testid={`text-event-time-${selectedEvent.id}`}>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(selectedEvent.startTime), 'HH:mm')} - {format(new Date(selectedEvent.endTime), 'HH:mm')}</span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2" data-testid={`text-event-location-${selectedEvent.id}`}>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.clientName && (
                  <div className="flex items-center gap-2" data-testid={`text-event-client-${selectedEvent.id}`}>
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedEvent.clientName}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className={getEventTypeColor(selectedEvent.eventType)}
                    data-testid={`badge-event-type-${selectedEvent.id}`}
                  >
                    {getEventTypeLabel(selectedEvent.eventType)}
                  </Badge>
                  <Badge 
                    className={statusColors[selectedEvent.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
                    data-testid={`badge-event-status-${selectedEvent.id}`}
                  >
                    {getStatusLabel(selectedEvent.status)}
                  </Badge>
                </div>
                
                {selectedEvent.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Note:</h4>
                    <p className="text-sm text-muted-foreground" data-testid={`text-event-notes-${selectedEvent.id}`}>
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prossimi Appuntamenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .filter(event => new Date(event.startTime) >= new Date())
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                    data-testid={`upcoming-event-${event.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium" data-testid={`text-upcoming-title-${event.id}`}>
                        {event.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.startTime), 'dd MMM yyyy', { locale: it })} • {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                      </div>
                      {event.clientName && (
                        <div className="text-sm text-muted-foreground">
                          con {event.clientName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={statusColors[event.status as keyof typeof statusColors]}
                        data-testid={`badge-upcoming-status-${event.id}`}
                      >
                        {getStatusLabel(event.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" data-testid={`button-view-upcoming-${event.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              
              {events.filter(event => new Date(event.startTime) >= new Date()).length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-upcoming-events">
                    Non hai appuntamenti programmati
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-events">
              Nessun appuntamento
            </h3>
            <p className="text-muted-foreground text-center">
              Non hai ancora appuntamenti programmati per questo mese.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}