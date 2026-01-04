import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Calendar,
  Briefcase,
  Target,
  ArrowRight,
  CheckCircle,
  Heart,
  Home,
  Plane,
  GraduationCap,
  Car,
  Shield
} from "lucide-react";

export default function Registration() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Informazioni personali
    firstName: '',
    lastName: '',
    birthYear: '',
    occupation: '',
    city: '',
    
    // Step 2: Situazione finanziaria attuale
    monthlyIncome: '',
    financialKnowledge: '',
    primaryGoal: '',
    
    // Step 3: Obiettivi e motivazioni
    mainGoals: [] as string[],
    timeHorizon: '',
    motivation: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeRegistrationMutation = useMutation({
    mutationFn: async (data: any) => {
      // Aggiorna il profilo utente
      await apiRequest('POST', '/api/profile/complete', data);
      
      // Segna la registrazione come completata
      await apiRequest('POST', '/api/progress', {
        module: 'registration',
        completed: true,
        completedAt: new Date().toISOString(),
        data: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Registrazione completata!",
        description: "Benvenuto in Percorso Capitale! Ora puoi iniziare a gestire le tue finanze.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoalToggle = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      mainGoals: prev.mainGoals.includes(goalId)
        ? prev.mainGoals.filter(id => id !== goalId)
        : [...prev.mainGoals, goalId]
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeRegistrationMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.birthYear && formData.occupation;
      case 2:
        return formData.monthlyIncome && formData.financialKnowledge && formData.primaryGoal;
      case 3:
        return formData.mainGoals.length > 0 && formData.timeHorizon && formData.motivation;
      default:
        return false;
    }
  };

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-soft-gray">

      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-trust-blue to-blue-600 rounded-2xl p-8 text-white">
            <h1 className="text-3xl font-bold mb-2 text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
              Benvenuto in Percorso Capitale, {user?.firstName || 'nuovo utente'}!
            </h1>
            <p className="text-white text-lg mb-4" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>
              Raccontaci qualcosa di te per personalizzare la tua esperienza con Percorso Capitale.
            </p>
            <div className="flex items-center space-x-4">
              <Progress value={progressPercentage} className="flex-1 h-2 bg-blue-700" />
              <span className="text-sm text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.4)'}}>Step {step} di 3</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              {step === 1 && <User className="w-6 h-6 text-trust-blue" />}
              {step === 2 && <Briefcase className="w-6 h-6 text-trust-blue" />}
              {step === 3 && <Target className="w-6 h-6 text-trust-blue" />}
              <span>
                {step === 1 && "Informazioni Personali"}
                {step === 2 && "Situazione Attuale"} 
                {step === 3 && "I Tuoi Obiettivi"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Informazioni Personali */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Il tuo nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Cognome *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Il tuo cognome"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthYear">Anno di nascita *</Label>
                    <Select value={formData.birthYear} onValueChange={(value) => handleInputChange('birthYear', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona anno" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 50 }, (_, i) => {
                          const year = new Date().getFullYear() - 20 - i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">Città</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Milano, Roma, Napoli..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="occupation">Professione *</Label>
                  <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona la tua professione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Dipendente</SelectItem>
                      <SelectItem value="freelance">Libero professionista</SelectItem>
                      <SelectItem value="entrepreneur">Imprenditore</SelectItem>
                      <SelectItem value="student">Studente</SelectItem>
                      <SelectItem value="retired">Pensionato</SelectItem>
                      <SelectItem value="unemployed">In cerca di lavoro</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2: Situazione Finanziaria */}
            {step === 2 && (
              <>
                <div>
                  <Label htmlFor="monthlyIncome">Reddito mensile netto approssimativo *</Label>
                  <Select value={formData.monthlyIncome} onValueChange={(value) => handleInputChange('monthlyIncome', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona fascia di reddito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-1000">Meno di €1.000</SelectItem>
                      <SelectItem value="1000-1500">€1.000 - €1.500</SelectItem>
                      <SelectItem value="1500-2500">€1.500 - €2.500</SelectItem>
                      <SelectItem value="2500-4000">€2.500 - €4.000</SelectItem>
                      <SelectItem value="4000-6000">€4.000 - €6.000</SelectItem>
                      <SelectItem value="over-6000">Oltre €6.000</SelectItem>
                      <SelectItem value="variable">Reddito variabile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="financialKnowledge">La tua conoscenza finanziaria *</Label>
                  <Select value={formData.financialKnowledge} onValueChange={(value) => handleInputChange('financialKnowledge', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Valuta la tua preparazione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante - So poco di finanza</SelectItem>
                      <SelectItem value="basic">Base - Conosco i concetti principali</SelectItem>
                      <SelectItem value="intermediate">Intermedio - Ho qualche esperienza</SelectItem>
                      <SelectItem value="advanced">Avanzato - Sono esperto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="primaryGoal">Qual è il tuo obiettivo principale? *</Label>
                  <Select value={formData.primaryGoal} onValueChange={(value) => handleInputChange('primaryGoal', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Scegli il tuo obiettivo principale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency-fund">Creare un fondo di emergenza</SelectItem>
                      <SelectItem value="home-purchase">Comprare casa</SelectItem>
                      <SelectItem value="financial-freedom">Raggiungere l'indipendenza finanziaria</SelectItem>
                      <SelectItem value="retirement">Pianificare la pensione</SelectItem>
                      <SelectItem value="education">Finanziare gli studi (miei o dei figli)</SelectItem>
                      <SelectItem value="debt-reduction">Ridurre i debiti</SelectItem>
                      <SelectItem value="investment-growth">Far crescere i miei investimenti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Obiettivi */}
            {step === 3 && (
              <>
                <div>
                  <Label>Seleziona i tuoi obiettivi principali (puoi sceglierne più di uno) *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {[
                      { id: 'emergency', label: 'Fondo Emergenze', icon: Shield },
                      { id: 'home', label: 'Comprare Casa', icon: Home },
                      { id: 'travel', label: 'Viaggi', icon: Plane },
                      { id: 'education', label: 'Formazione', icon: GraduationCap },
                      { id: 'car', label: 'Auto Nuova', icon: Car },
                      { id: 'freedom', label: 'Libertà Finanziaria', icon: Heart }
                    ].map((goal) => {
                      const IconComponent = goal.icon;
                      const isSelected = formData.mainGoals.includes(goal.id);
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => handleGoalToggle(goal.id)}
                          className={`p-4 rounded-lg border-2 text-center transition-colors ${
                            isSelected
                              ? 'border-trust-blue bg-blue-50 text-trust-blue'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-trust-blue' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{goal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeHorizon">In quanto tempo vorresti raggiungere i tuoi obiettivi? *</Label>
                  <Select value={formData.timeHorizon} onValueChange={(value) => handleInputChange('timeHorizon', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona orizzonte temporale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-year">Entro 1 anno</SelectItem>
                      <SelectItem value="2-3-years">2-3 anni</SelectItem>
                      <SelectItem value="5-years">Entro 5 anni</SelectItem>
                      <SelectItem value="10-years">Entro 10 anni</SelectItem>
                      <SelectItem value="long-term">Più di 10 anni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="motivation">Cosa ti ha spinto a iniziare questo percorso? *</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    placeholder="Raccontaci brevemente cosa ti ha motivato a prenderti cura delle tue finanze..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={step === 1}
          >
            Indietro
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!isStepValid() || completeRegistrationMutation.isPending}
            className="bg-trust-blue hover:bg-blue-600"
          >
            {step === 3 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completa Registrazione
              </>
            ) : (
              <>
                Avanti
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}