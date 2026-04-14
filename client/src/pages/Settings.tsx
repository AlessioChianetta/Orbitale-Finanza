import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Globe, Mail, Save, Settings as SettingsIcon, Calendar } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
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
      if (data.user) {
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setWebsiteUrl(data.user.websiteUrl || '');
      }

      toast({
        title: "Impostazioni salvate",
        description: "Le tue impostazioni sono state aggiornate con successo",
      });

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                    <div className="p-2 sm:p-3 bg-indigo-600 rounded-xl shadow-lg flex-shrink-0">
                      <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">
                        Impostazioni
                      </h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                        <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Gestione Profilo e Preferenze</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">
                    Gestisci le tue informazioni personali e collegamenti esterni
                  </p>
                </div>

                <div className="flex items-center justify-center text-gray-300 text-xs bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm self-center sm:self-auto">
                  <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {new Date().toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
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
                  <Mail className="w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    value={user && typeof user === 'object' && 'email' in user ? (user.email as string) : ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <Globe className="w-4 h-4 text-white" />
                </div>
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
                <p className="text-xs text-gray-500 mt-1">
                  Questo link sarà accessibile dal menu "Servizi esterni" → "SiteAle"
                </p>
                {websiteUrl && (
                  <a 
                    href={websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Visualizza il tuo sito →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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