import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Plus,
  Search,
  Edit,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  occupation?: string;
  financialGoals?: string;
  riskTolerance?: string;
  monthlyIncome?: number;
  currentAssets?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  occupation?: string;
  financialGoals?: string;
  riskTolerance?: string;
  monthlyIncome?: number;
  currentAssets?: number;
  notes?: string;
}

interface AssignedExercise {
  id: number;
  clientId: number;
  exerciseId: number;
  assignedDate: string;
  dueDate: string;
  notes: string;
}


export default function ClientsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    occupation: '',
    financialGoals: '',
    riskTolerance: 'moderate',
    monthlyIncome: 0,
    currentAssets: 0,
    notes: ''
  });

  const { toast } = useToast();

  // Fetch clients
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/admin/consultation/clients'],
  });

  // Fetch assigned exercises for all clients
  const { data: assignedExercises, isLoading: isLoadingExercises } = useQuery<AssignedExercise[]>({
    queryKey: ['/api/consultation/client-exercises/assigned'],
  });

  // Function to get assigned exercises for a specific client
  const getClientExercises = (clientId: number): AssignedExercise[] => {
    if (!assignedExercises) return [];
    return assignedExercises.filter(exercise => exercise.clientId === clientId);
  };

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => apiRequest('/admin/consultation/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/consultation/clients'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Cliente aggiunto",
        description: "Il cliente è stato aggiunto con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiunta del cliente.",
        variant: "destructive",
      });
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ClientFormData }) =>
      apiRequest(`/admin/consultation/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/consultation/clients'] });
      setIsDialogOpen(false);
      setSelectedClient(null);
      resetForm();
      toast({
        title: "Cliente aggiornato",
        description: "I dati del cliente sono stati aggiornati con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento del cliente.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      occupation: '',
      financialGoals: '',
      riskTolerance: 'moderate',
      monthlyIncome: 0,
      currentAssets: 0,
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (selectedClient) {
      updateClientMutation.mutate({ id: selectedClient.id, data: formData });
    } else {
      createClientMutation.mutate(formData);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone || '',
      dateOfBirth: client.dateOfBirth || '',
      occupation: client.occupation || '',
      financialGoals: client.financialGoals || '',
      riskTolerance: client.riskTolerance || 'moderate',
      monthlyIncome: client.monthlyIncome || 0,
      currentAssets: client.currentAssets || 0,
      notes: client.notes || ''
    });
    setIsDialogOpen(true);
  };

  const filteredClients = clients?.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRiskToleraneBadgeColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-green-100 text-green-800';
      case 'aggressive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading || isLoadingExercises) {
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Clienti</h1>
          <p className="text-gray-600 mt-1">Gestisci i profili e le informazioni dei tuoi clienti</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedClient(null);
                resetForm();
              }}
              data-testid="add-client-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedClient ? 'Modifica Cliente' : 'Aggiungi Nuovo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {selectedClient ? 'Modifica le informazioni del cliente' : 'Inserisci i dati del nuovo cliente'}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Dati Personali</TabsTrigger>
                <TabsTrigger value="financial">Situazione Finanziaria</TabsTrigger>
                <TabsTrigger value="notes">Note e Obiettivi</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      data-testid="input-firstName"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Cognome *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      data-testid="input-lastName"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Data di Nascita</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      data-testid="input-dateOfBirth"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="occupation">Professione</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    data-testid="input-occupation"
                  />
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyIncome">Reddito Mensile (€)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                      data-testid="input-monthlyIncome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentAssets">Patrimonio Attuale (€)</Label>
                    <Input
                      id="currentAssets"
                      type="number"
                      value={formData.currentAssets}
                      onChange={(e) => setFormData({ ...formData, currentAssets: Number(e.target.value) })}
                      data-testid="input-currentAssets"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="riskTolerance">Tolleranza al Rischio</Label>
                  <select
                    id="riskTolerance"
                    value={formData.riskTolerance}
                    onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-riskTolerance"
                  >
                    <option value="conservative">Conservativa</option>
                    <option value="moderate">Moderata</option>
                    <option value="aggressive">Aggressiva</option>
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div>
                  <Label htmlFor="financialGoals">Obiettivi Finanziari</Label>
                  <Textarea
                    id="financialGoals"
                    value={formData.financialGoals}
                    onChange={(e) => setFormData({ ...formData, financialGoals: e.target.value })}
                    rows={3}
                    data-testid="textarea-financialGoals"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Note Private</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Note private visibili solo a te..."
                    data-testid="textarea-notes"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.firstName || !formData.lastName || !formData.email}
                data-testid="save-client-btn"
              >
                {selectedClient ? 'Aggiorna' : 'Aggiungi'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cerca clienti per nome o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-clients"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredClients.length} clienti
        </Badge>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {client.firstName} {client.lastName}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Mail className="w-3 h-3 mr-1" />
                    {client.email}
                  </CardDescription>
                </div>
                <Badge
                  className={client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {client.isActive ? 'Attivo' : 'Inattivo'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {client.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-3 h-3 mr-2" />
                  {client.phone}
                </div>
              )}

              {client.occupation && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-2" />
                  {client.occupation}
                </div>
              )}

              {client.riskTolerance && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rischio:</span>
                  <Badge className={getRiskToleraneBadgeColor(client.riskTolerance)}>
                    {client.riskTolerance === 'conservative' ? 'Conservativo' :
                     client.riskTolerance === 'moderate' ? 'Moderato' : 'Aggressivo'}
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                {client.monthlyIncome && (
                  <div>
                    <span className="text-gray-500">Reddito:</span>
                    <p className="font-medium">{formatCurrency(client.monthlyIncome)}/mese</p>
                  </div>
                )}
                {client.currentAssets && (
                  <div>
                    <span className="text-gray-500">Patrimonio:</span>
                    <p className="font-medium">{formatCurrency(client.currentAssets)}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Cliente dal {client.createdAt && !isNaN(new Date(client.createdAt).getTime())
                    ? format(new Date(client.createdAt), 'MMM yyyy', { locale: it })
                    : 'Data non disponibile'}
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {getClientExercises(client.id).length} esercizi
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun cliente trovato</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Prova a modificare i criteri di ricerca' : 'Inizia aggiungendo il tuo primo cliente'}
          </p>
        </div>
      )}
    </div>
  );
}