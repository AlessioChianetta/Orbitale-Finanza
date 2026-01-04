import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User,
  MapPin,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';

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

interface EventFormData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  clientId?: number;
  eventType: string;
  location?: string;
  notes?: string;
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

export default function ConsultationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    clientId: undefined,
    eventType: 'consultation',
    location: '',
    notes: ''
  });

  const { toast } = useToast();

  // Get month range
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch calendar events
  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/consultation/calendar', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM')],
  });

  // Fetch clients for dropdown
  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/consultation/clients'],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) => apiRequest('POST', '/api/consultation/calendar', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultation/calendar'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Evento creato",
        description: "L'evento è stato aggiunto al calendario.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la creazione dell'evento.",
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: EventFormData }) => 
      apiRequest('PUT', `/api/consultation/calendar/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultation/calendar'] });
      setIsDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
      toast({
        title: "Evento aggiornato",
        description: "L'evento è stato aggiornato con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento dell'evento.",
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/consultation/calendar/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultation/calendar'] });
      toast({
        title: "Evento eliminato",
        description: "L'evento è stato rimosso dal calendario.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione dell'evento.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      clientId: undefined,
      eventType: 'consultation',
      location: '',
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data: formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime,
      endTime: event.endTime,
      clientId: event.clientId,
      eventType: event.eventType,
      location: event.location || '',
      notes: event.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateTimeString = format(date, 'yyyy-MM-dd') + 'T09:00';
    const endTimeString = format(date, 'yyyy-MM-dd') + 'T10:00';
    setFormData({
      ...formData,
      startTime: dateTimeString,
      endTime: endTimeString
    });
    setSelectedEvent(null);
    setIsDialogOpen(true);
  };

  const getEventsForDate = (date: Date) => {
    return events?.filter(event => 
      isSameDay(new Date(event.startTime), date)
    ) || [];
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

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario Consulenze</h1>
          <p className="text-gray-600 mt-1">Gestisci i tuoi appuntamenti e la disponibilità</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setSelectedEvent(null);
                resetForm();
              }}
              data-testid="add-event-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? 'Modifica Evento' : 'Nuovo Evento'}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent ? 'Modifica le informazioni dell\'evento' : 'Aggiungi un nuovo evento al calendario'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventType">Tipo Evento</Label>
                  <select
                    id="eventType"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-eventType"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="clientId">Cliente</Label>
                  <select
                    id="clientId"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-clientId"
                  >
                    <option value="">Nessun cliente specifico</option>
                    {clients?.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Data e Ora Inizio *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    data-testid="input-startTime"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endTime">Data e Ora Fine *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    data-testid="input-endTime"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Luogo/Link</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ufficio, Zoom, Teams, ecc..."
                  data-testid="input-location"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  data-testid="textarea-description"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Note Private</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Note private visibili solo a te..."
                  data-testid="textarea-notes"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
              {selectedEvent && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    deleteEventMutation.mutate(selectedEvent.id);
                    setIsDialogOpen(false);
                  }}
                  data-testid="delete-event-btn"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title || !formData.startTime || !formData.endTime}
                data-testid="save-event-btn"
              >
                {selectedEvent ? 'Aggiorna' : 'Crea'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-xl">
              {format(currentDate, 'MMMM yyyy', { locale: it })}
            </CardTitle>
            <Button variant="outline" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div 
                  key={index}
                  className={`min-h-[120px] p-2 border cursor-pointer transition-colors ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${
                    isCurrentDay ? 'ring-2 ring-blue-500' : ''
                  } hover:bg-blue-50`}
                  onClick={() => handleDateClick(day)}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${
                    isCurrentDay ? 'text-blue-600' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded border cursor-pointer ${getEventTypeColor(event.eventType)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(event);
                        }}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="flex items-center text-xs opacity-75">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(event.startTime), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} altri
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
            Eventi di Oggi
          </CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: it })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getEventsForDate(new Date()).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(new Date()).map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      event.eventType === 'consultation' ? 'bg-blue-500' :
                      event.eventType === 'initial' ? 'bg-green-500' :
                      event.eventType === 'follow_up' ? 'bg-orange-500' :
                      event.eventType === 'emergency' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          data-testid={`edit-today-event-${event.id}`}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                        {event.clientName && (
                          <>
                            <User className="w-3 h-3 ml-2 mr-1" />
                            {event.clientName}
                          </>
                        )}
                        {event.location && (
                          <>
                            <MapPin className="w-3 h-3 ml-2 mr-1" />
                            {event.location}
                          </>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-1 text-xs text-gray-500">{event.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm">Nessun evento in programma per oggi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}