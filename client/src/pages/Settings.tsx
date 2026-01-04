import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Globe, Mail, Save } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Carica i dati utente all'avvio
  useEffect(() => {
    // Se abbiamo già i dati da user, usali immediatamente
    if (user && typeof user === 'object') {
      setFirstName(('firstName' in user ? user.firstName as string : '') || '');
      setLastName(('lastName' in user ? user.lastName as string : '') || '');
      setWebsiteUrl(('websiteUrl' in user ? user.websiteUrl as string : '') || '');
    }

    const loadUserSettings = async () => {
      try {
        console.log('[SETTINGS FRONTEND] Caricamento dati utente da API...');
        const response = await fetch('/api/user/settings', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('[SETTINGS FRONTEND] Response status:', response.status);
        console.log('[SETTINGS FRONTEND] Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          console.error('[SETTINGS FRONTEND] Errore HTTP:', response.status, response.statusText);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[SETTINGS FRONTEND] Risposta non JSON:', contentType);
          const text = await response.text();
          console.error('[SETTINGS FRONTEND] Risposta ricevuta:', text.substring(0, 200));
          return;
        }
        
        const userData = await response.json();
        console.log('[SETTINGS FRONTEND] Dati ricevuti dal DB:', userData);
        
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setWebsiteUrl(userData.websiteUrl || '');
        
        console.log('[SETTINGS FRONTEND] Stato aggiornato:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          websiteUrl: userData.websiteUrl
        });
      } catch (error) {
        console.error('[SETTINGS FRONTEND] Errore nel caricamento:', error);
      }
    };
    
    loadUserSettings();
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; websiteUrl: string }) => {
      const response = await apiRequest('PUT', '/api/user/settings', data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Aggiorna immediatamente lo stato locale con i dati del server
      if (data.user) {
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setWebsiteUrl(data.user.websiteUrl || '');
      }

      toast({
        title: "Impostazioni salvate",
        description: "Le tue impostazioni sono state aggiornate con successo",
      });

      // Invalida e ricarica i dati utente
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      await queryClient.refetchQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({ firstName, lastName, websiteUrl });
  };

  return (
    <div className="min-h-screen bg-soft-gray p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-gray mb-2">Impostazioni</h1>
          <p className="text-medium-gray">Gestisci le tue informazioni personali e collegamenti esterni</p>
        </div>

        <div className="space-y-6">
          {/* Informazioni Personali */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-trust-blue" />
                <span>Informazioni Personali</span>
              </CardTitle>
              <CardDescription>
                Aggiorna il tuo nome e cognome
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Il tuo nome"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Il tuo cognome"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-medium-gray" />
                  <Input
                    id="email"
                    value={user && typeof user === 'object' && 'email' in user ? (user.email as string) : ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <p className="text-xs text-medium-gray mt-1">L'email non può essere modificata</p>
              </div>
            </CardContent>
          </Card>

          {/* Collegamenti Esterni */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-trust-blue" />
                <span>Collegamenti Esterni</span>
              </CardTitle>
              <CardDescription>
                Configura il tuo sito web personale per accedervi velocemente da SiteAle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="websiteUrl">URL Sito Web</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://tuosito.it"
                />
                <p className="text-xs text-medium-gray mt-1">
                  Questo link sarà accessibile dal menu "Servizi esterni" → "SiteAle"
                </p>
                {websiteUrl && (
                  <a 
                    href={websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-trust-blue hover:underline mt-1 inline-block"
                  >
                    Visualizza il tuo sito →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Salva Modifiche */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="bg-trust-blue hover:bg-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}