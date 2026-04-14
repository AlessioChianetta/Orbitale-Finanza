import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Lock, 
  Trophy,
  TrendingUp,
  Calculator,
  Target,
  Award,
  PlayCircle,
  Star
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AcademyContent {
  id: number;
  title: string;
  description: string;
  content: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  unlockDay: number; // days after registration
  isCompleted: boolean;
  isUnlocked: boolean;
  points: number;
}

interface UserProgress {
  totalPoints: number;
  completedLessons: number;
  currentStreak: number;
  level: number;
  nextLevelPoints: number;
}

const academyContent: AcademyContent[] = [
  {
    id: 1,
    title: "L'Interesse Composto: La Forza più Potente nell'Universo",
    description: "Scopri come Einstein definiva l'interesse composto e perché può trasformare la tua vita finanziaria.",
    content: `
# L'Interesse Composto: La Tua Arma Segreta

L'interesse composto è il fenomeno per cui i tuoi guadagni generano a loro volta altri guadagni. È come una palla di neve che rotolando diventa sempre più grande.

## Come Funziona

Supponiamo di investire €1.000 con un rendimento del 7% annuo:
- Anno 1: €1.000 × 1.07 = €1.070
- Anno 2: €1.070 × 1.07 = €1.144,90
- Anno 10: €1.967,15
- Anno 30: €7.612,26

## La Regola del 72

Per calcolare rapidamente in quanti anni il tuo capitale raddoppia:
**72 ÷ tasso di rendimento = anni per raddoppiare**

Con il 7%: 72 ÷ 7 = circa 10 anni

## Il Tempo è il Tuo Migliore Alleato

Iniziare prima fa una differenza enorme:
- A 25 anni, investendo €200/mese al 7% = €1.37 milioni a 65 anni
- A 35 anni, stesso investimento = €610.000 a 65 anni

**La differenza di 10 anni costa €760.000!**
    `,
    category: 'beginner',
    estimatedTime: 5,
    unlockDay: 1,
    isCompleted: false,
    isUnlocked: true,
    points: 100
  },
  {
    id: 2,
    title: "ETF vs Fondi Comuni: La Battaglia per i Tuoi Soldi",
    description: "Scopri perché gli ETF stanno rivoluzionando il mondo degli investimenti e come scegliere quello giusto.",
    content: `
# ETF vs Fondi Comuni: Cosa Scegliere?

## ETF (Exchange Traded Fund)
**Vantaggi:**
- Costi bassi (0.1-0.5% annui)
- Trasparenti (sai sempre cosa contengono)
- Liquidi (puoi vendere in qualsiasi momento)
- Diversificati automaticamente

**Svantaggi:**
- Nessuna gestione attiva
- Seguono sempre il mercato (anche quando scende)

## Fondi Comuni di Investimento
**Vantaggi:**
- Gestione professionale
- Possibilità di "battere" il mercato

**Svantaggi:**
- Costi elevati (1-3% annui)
- Solo l'1% batte davvero il mercato nel lungo periodo
- Meno trasparenti

## La Verità sui Costi

Su un investimento di €100.000 in 30 anni:
- ETF (0.2% annuo): costi totali €6.000
- Fondo attivo (2% annuo): costi totali €60.000

**Differenza: €54.000 in meno nel tuo portafoglio!**

## I Migliori ETF per Iniziare

1. **MSCI World (VWCE)**: 1.500+ aziende globali
2. **S&P 500**: Le 500 migliori aziende USA
3. **FTSE All-World**: Il mondo intero in un ETF
    `,
    category: 'beginner',
    estimatedTime: 8,
    unlockDay: 7,
    isCompleted: false,
    isUnlocked: false,
    points: 150
  },
  {
    id: 3,
    title: "Ottimizzazione Fiscale: Non Dare Tutto allo Stato",
    description: "Strategie legali per ridurre le tasse sui tuoi investimenti e massimizzare i rendimenti netti.",
    content: `
# Ottimizzazione Fiscale per Investitori Smart

## Il Regime Amministrato vs Dichiarativo

### Regime Amministrato (Più Semplice)
- La banca/broker paga le tasse per te
- Aliquota fissa 26% su capital gains
- Nessuna dichiarazione necessaria
- Perfetto per principianti

### Regime Dichiarativo (Più Vantaggioso)
- Tu gestisci le tasse nella dichiarazione
- Puoi compensare perdite con guadagni
- Maggiore flessibilità
- Richiede più competenze

## La Strategia del Tax Loss Harvesting

Realizzi le perdite per compensare i guadagni:
- Hai guadagnato €1.000 su ETF A
- Hai perso €500 su ETF B
- Vendi entrambi: paghi tasse solo su €500

## ETF ad Accumulazione vs Distribuzione

**ETF ad Accumulazione:**
- Reinvestono automaticamente i dividendi
- Tassazione differita fino alla vendita
- Più efficiente fiscalmente

**ETF a Distribuzione:**
- Pagano dividendi regolari
- Tassati immediatamente al 26%
- Buoni per chi cerca reddito

## Conti Deposito e Investimenti

- Interessi conti deposito: tassati al 26%
- Capital gains investimenti: tassati al 26%
- Ma gli investimenti offrono molto più potenziale di crescita!
    `,
    category: 'intermediate',
    estimatedTime: 12,
    unlockDay: 60,
    isCompleted: false,
    isUnlocked: false,
    points: 200
  },
  {
    id: 4,
    title: "Ribilanciamento: Il Segreto dei Professionisti",
    description: "Come mantenere il tuo portafoglio ottimale nel tempo e sfruttare la volatilità a tuo vantaggio.",
    content: `
# Ribilanciamento: L'Arte di Comprare Basso e Vendere Alto

## Cos'è il Ribilanciamento?

È il processo di riportare il tuo portafoglio alla composizione target originale.

**Esempio:**
- Target: 70% Azioni, 30% Obbligazioni
- Dopo un anno: 80% Azioni, 20% Obbligazioni (le azioni sono cresciute)
- Ribilanciamento: Vendi il 10% delle azioni e compri obbligazioni

## Perché Funziona?

1. **Vendi Alto, Compri Basso**: Automaticamente
2. **Disciplina**: Ti obbliga a non farsi prendere dalle emozioni
3. **Diversificazione**: Mantiene il rischio sotto controllo

## Strategie di Ribilanciamento

### Temporale
- Ogni 6/12 mesi
- Semplice da ricordare
- Può essere subottimale

### Basata su Soglie
- Quando un asset si discosta del 5-10% dal target
- Più efficiente
- Richiede monitoraggio

### Esempio Pratico

**Portafoglio da €10.000:**
- Target: 60% Azioni (€6.000), 40% Obbligazioni (€4.000)
- Dopo 1 anno: 70% Azioni (€7.700), 30% Obbligazioni (€3.300)
- Ribilanciamento: Vendi €1.100 di azioni, compra €1.100 di obbligazioni

## I Benefici nel Tempo

Studi dimostrano che il ribilanciamento può aggiungere 0.5-1% di rendimento annuo al tuo portafoglio nel lungo periodo.

Su €100.000 in 30 anni = €50.000-100.000 extra!
    `,
    category: 'advanced',
    estimatedTime: 15,
    unlockDay: 180,
    isCompleted: false,
    isUnlocked: false,
    points: 250
  }
];

export default function Academy() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<AcademyContent | null>(null);
  const [selectedTab, setSelectedTab] = useState("lessons");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Accesso Richiesto",
        description: "Effettua il login per accedere all'Accademia",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userProgress } = useQuery<UserProgress>({
    queryKey: ["/api/academy/progress"],
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await fetch('/api/academy/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      });
      if (!response.ok) throw new Error('Failed to complete lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/progress"] });
      toast({
        title: "Lezione Completata!",
        description: "Hai guadagnato punti esperienza. Continua così!",
      });
    }
  });

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

  // Simulate days since registration for demo
  const daysSinceRegistration = 180; // You would calculate this from userProfile.createdAt

  // Update unlock status based on days since registration
  const updatedContent = academyContent.map(lesson => ({
    ...lesson,
    isUnlocked: daysSinceRegistration >= lesson.unlockDay,
    isCompleted: false // This would be determined from actual progress data
  }));

  const progress = userProgress || {
    totalPoints: 100,
    completedLessons: 1,
    currentStreak: 2,
    level: 1,
    nextLevelPoints: 500
  };

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
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
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">L'Accademia</h1>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                          <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Formazione attiva</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">La tua crescita finanziaria continua: impara, simula e ottimizza i tuoi investimenti</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="lessons" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1.5 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lezioni</span>
              <span className="sm:hidden">Corsi</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1.5 text-xs sm:text-sm">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">I Tuoi Progressi</span>
              <span className="sm:hidden">Progressi</span>
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1.5 text-xs sm:text-sm">
              <Calculator className="w-4 h-4" />
              <span>Simulatore</span>
            </TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4 sm:space-y-6">
            {/* Progress Overview */}
            <Card className="p-4 sm:p-6 border-0 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Il Tuo Percorso</h3>
                  <p className="text-xs sm:text-sm text-medium-gray">
                    {progress.completedLessons} di {academyContent.length} lezioni completate
                  </p>
                </div>
                <div className="flex items-center justify-between sm:text-right">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-500" />
                    <span className="text-base sm:text-lg font-bold">{progress.totalPoints} punti</span>
                  </div>
                  <p className="text-xs sm:text-sm text-medium-gray sm:mt-1">Livello {progress.level}</p>
                </div>
              </div>
              <Progress 
                value={(progress.completedLessons / academyContent.length) * 100} 
                className="h-2 sm:h-3"
              />
            </Card>

            {/* Lessons Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {updatedContent.map((lesson) => (
                <Card 
                  key={lesson.id} 
                  className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-md touch-target ${
                    !lesson.isUnlocked ? 'opacity-60' : ''
                  } ${lesson.isCompleted ? 'border-green-200 bg-green-50' : ''}`}
                  onClick={() => lesson.isUnlocked && setSelectedLesson(lesson)}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      {lesson.isCompleted ? (
                        <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-green-600 flex-shrink-0" />
                      ) : lesson.isUnlocked ? (
                        <PlayCircle className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Lock className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 flex-shrink-0" />
                      )}
                      <Badge variant={
                        lesson.category === 'beginner' ? 'secondary' :
                        lesson.category === 'intermediate' ? 'default' : 'destructive'
                      } className="text-xs">
                        {lesson.category === 'beginner' ? 'Base' :
                         lesson.category === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-medium-gray flex-shrink-0">
                      <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span>{lesson.estimatedTime}min</span>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">{lesson.title}</h3>
                  <p className="text-xs sm:text-sm text-medium-gray mb-3 sm:mb-4 line-clamp-3">{lesson.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs sm:text-sm">
                      <Award className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-500" />
                      <span>{lesson.points} punti</span>
                    </div>
                    {!lesson.isUnlocked && (
                      <p className="text-xs text-medium-gray">
                        {lesson.unlockDay}gg
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Level Progress */}
              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Livello {progress.level}</h3>
                    <p className="text-sm text-medium-gray">Investitore in Crescita</p>
                  </div>
                </div>
                <Progress 
                  value={(progress.totalPoints / progress.nextLevelPoints) * 100} 
                  className="h-3 mb-2"
                />
                <p className="text-sm text-medium-gray">
                  {progress.nextLevelPoints - progress.totalPoints} punti al prossimo livello
                </p>
              </Card>

              {/* Streak */}
              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{progress.currentStreak} giorni</h3>
                    <p className="text-sm text-medium-gray">Striscia di apprendimento</p>
                  </div>
                </div>
                <p className="text-xs text-medium-gray">
                  Continua a studiare ogni giorno per mantenere la striscia!
                </p>
              </Card>

              {/* Total Points */}
              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{progress.totalPoints}</h3>
                    <p className="text-sm text-medium-gray">Punti Totali</p>
                  </div>
                </div>
                <p className="text-xs text-medium-gray">
                  Guadagna punti completando le lezioni e usando il simulatore
                </p>
              </Card>
            </div>

            {/* Achievements */}
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Obiettivi e Traguardi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Primo Passo", description: "Completa la tua prima lezione", completed: progress.completedLessons >= 1 },
                  { name: "Studente Costante", description: "Mantieni una striscia di 7 giorni", completed: progress.currentStreak >= 7 },
                  { name: "Esperto in Crescita", description: "Raggiungi 500 punti", completed: progress.totalPoints >= 500 },
                  { name: "Maestro degli Investimenti", description: "Completa tutte le lezioni", completed: progress.completedLessons >= academyContent.length }
                ].map((achievement, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${achievement.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 ${achievement.completed ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-medium-gray">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Simulator Tab */}
          <TabsContent value="simulator" className="space-y-6">
            <Card className="p-6 border-0 shadow-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Simulatore "E se...?"</h3>
                <p className="text-medium-gray mb-6">
                  Scopri come piccole modifiche possono trasformare il tuo futuro finanziario
                </p>
                <Button 
                  onClick={() => {
                    // Navigate to simulator (will be implemented next)
                    toast({
                      title: "Simulatore in Arrivo",
                      description: "Il simulatore interattivo sarà disponibile a breve!",
                    });
                  }}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Apri Simulatore
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Lesson Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">
                        {selectedLesson.estimatedTime} minuti
                      </Badge>
                      <Badge variant="outline">
                        {selectedLesson.points} punti
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedLesson(null)}
                  >
                    Chiudi
                  </Button>
                </div>

                <div className="prose max-w-none mb-6">
                  <div dangerouslySetInnerHTML={{ 
                    __html: selectedLesson.content.replace(/\n/g, '<br>').replace(/#{1,3}\s/g, '<h3>').replace(/<h3>/g, '</p><h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }} />
                </div>

                {!selectedLesson.isCompleted && (
                  <Button 
                    onClick={() => {
                      completeLessonMutation.mutate(selectedLesson.id);
                      setSelectedLesson(null);
                    }}
                    disabled={completeLessonMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Segna come Completata
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}