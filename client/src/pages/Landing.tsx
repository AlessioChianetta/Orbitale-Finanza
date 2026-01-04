
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Shield, 
  Target, 
  Calculator, 
  BookOpen, 
  Zap,
  CheckCircle,
  ArrowRight,
  Users,
  Clock,
  Star,
  PiggyBank,
  Building2,
  ChevronDown,
  Sparkles,
  Award,
  Globe,
  AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();
  
  const handleLogin = () => {
    navigate("/auth");
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Percorso Capitale
                </h1>
                <p className="text-sm text-slate-500">La Tua Libertà Finanziaria</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={scrollToFeatures} className="hidden md:flex text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                Funzionalità
              </Button>
              <Button onClick={handleLogin} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                Accedi
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50">
        {/* Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-xl"></div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* Trust Badge */}
            <Badge className="mb-8 bg-blue-100 text-blue-800 border-blue-200 px-6 py-3 text-sm font-semibold shadow-sm">
              <Shield className="w-4 h-4 mr-2" />
              Piattaforma Sicura e Certificata
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight">
              Costruisci un patrimonio di
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                100.000-500.000€
              </span>
              <span className="text-slate-700 text-3xl md:text-4xl lg:text-5xl block mt-4">in 2-4 anni</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Aiuto <span className="text-blue-600 font-semibold">imprenditori, liberi professionisti e dipendenti</span> a creare, gestire e proteggere il proprio denaro, risparmiarlo e investirlo strategicamente grazie al 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold"> Metodo ORBITALE</span>.
            </p>

            <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-8 mb-12 max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md mr-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Attacco frontale al mercato</h3>
              </div>
              <div className="space-y-4 text-left">
                <p className="text-lg text-slate-700 leading-relaxed">
                  Tutti ti dicono che per vivere meglio devi crearti una rendita extra, aprire un'attività parallela o fare più soldi.
                </p>
                <p className="text-xl font-bold text-slate-900 bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                  Noi ti diciamo il contrario: <span className="text-blue-600">non ti serve un'attività nuova.</span>
                </p>
                <p className="text-lg text-slate-700 leading-relaxed">
                  Ti servono <span className="text-blue-600 font-semibold">soldi sul conto che generano altri soldi</span>, senza correre dietro all'ennesimo business. 
                  Questo è ciò che fa il Metodo ORBITALE: trasforma anche piccoli risparmi in patrimonio reale.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                size="lg"
                onClick={handleLogin}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-lg px-12 py-5 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-semibold rounded-xl"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Inizia il Check-up Gratuito
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="flex items-center space-x-6 text-slate-600">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Solo 15 minuti</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">10,000+ utenti</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-1 text-amber-400 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
              <span className="ml-3 text-slate-700 font-semibold text-lg">4.9/5 da 2,847 recensioni</span>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={scrollToFeatures}
              className="animate-bounce hover:animate-none text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <ChevronDown className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Posizionamento Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-red-100 text-red-700 border-red-200 px-6 py-3 font-semibold text-lg shadow-sm">
              <AlertTriangle className="w-5 h-5 mr-2" />
              CHI SIAMO E CHI NON SIAMO
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
              Prima di tutto, lascia che sia
              <span className="text-red-600 block mt-2">chiarissimo</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* CHI SIAMO */}
            <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 ml-4">QUELLO CHE FACCIAMO</h3>
                </div>
                <div className="space-y-4 text-green-800">
                  <p className="font-semibold text-lg bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
                    Ti guidiamo a costruire un <span className="bg-green-200 px-2 py-1 rounded">patrimonio reale di almeno 100.000€ in 2-4 anni</span>, 
                    indipendentemente che tu sia imprenditore, libero professionista o dipendente.
                  </p>
                  <div className="space-y-3 text-green-700">
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p><strong>Processo concreto</strong> che ti porta a generare una rendita stabile di almeno 2.000€ al mese</p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p><strong>Effetto Valanga</strong>: il nostro metodo esclusivo per uscire dai debiti</p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p><strong>Sistemi automatizzati</strong> che ti liberano dalla ruota del criceto finanziario</p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p><strong>Risparmio e investimenti efficaci</strong> anche se oggi credi di non avere fondi</p>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Lavoriamo solo con <strong>persone determinate a cambiare vita</strong></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CHI NON SIAMO */}
            <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-800 ml-4">QUELLO CHE NON FACCIAMO</h3>
                </div>
                <div className="space-y-3 text-red-700">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-white text-xs font-bold">×</span>
                    </div>
                    <p><strong>Non lavoriamo</strong> con clienti che non sono pronti a impegnarsi fino in fondo</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-white text-xs font-bold">×</span>
                    </div>
                    <p><strong>Non promettiamo</strong> scorciatoie o formule magiche</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-white text-xs font-bold">×</span>
                    </div>
                    <p><strong>Non offriamo</strong> consulenze a basso costo - siamo un percorso esclusivo</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-white text-xs font-bold">×</span>
                    </div>
                    <p><strong>Non ci occupiamo</strong> di argomenti fuori dalla nostra esperienza diretta</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-white text-xs font-bold">×</span>
                    </div>
                    <p><strong>Non garantiamo</strong> miracoli o risultati senza sforzo</p>
                  </div>
                  <div className="bg-red-100 border border-red-300 rounded-xl p-4 mt-4">
                    <p className="font-bold text-red-800 text-center">
                      Se cerchi scuse o non sei proattivo, <strong>non siamo la scelta giusta per te</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Metodo ORBITALE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30 px-6 py-3 font-semibold text-lg shadow-lg">
              <Sparkles className="w-5 h-5 mr-2" />
              IL METODO ORBITALE
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Come funziona
              <span className="text-blue-400 block mt-2">(macro-fasi)</span>
            </h2>
            <Card className="bg-white border border-white/20 rounded-2xl p-8 mb-12 max-w-4xl mx-auto shadow-2xl">
              <CardContent className="p-0">
                <p className="text-2xl font-bold text-blue-600 mb-4">
                  "Non ti serve un lavoro in più. Ti serve un patrimonio che lavora al posto tuo."
                </p>
                <p className="text-xl text-slate-700">
                  Il Metodo ORBITALE ti porta dai primi 100€ risparmiati fino a 100.000–500.000€ di patrimonio in 2-4 anni. 
                  <span className="font-semibold text-slate-900"> Niente teorie, niente magie. Solo metodo, disciplina e risultati.</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Fase 1 */}
            <Card className="group bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Liberazione</h3>
                <p className="text-slate-300 leading-relaxed">
                  Uscita dai debiti e creazione di liquidità con l'<span className="text-orange-400 font-semibold">Effetto Valanga</span>
                </p>
              </CardContent>
            </Card>

            {/* Fase 2 */}
            <Card className="group bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Accumulo</h3>
                <p className="text-slate-300 leading-relaxed">
                  Sistema di risparmio e <span className="text-amber-400 font-semibold">gestione automatizzata</span>
                </p>
              </CardContent>
            </Card>

            {/* Fase 3 */}
            <Card className="group bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Moltiplicazione</h3>
                <p className="text-slate-300 leading-relaxed">
                  <span className="text-emerald-400 font-semibold">Investimenti semplici e sicuri</span> che fanno crescere il capitale
                </p>
              </CardContent>
            </Card>

            {/* Fase 4 */}
            <Card className="group bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Stabilità</h3>
                <p className="text-slate-300 leading-relaxed">
                  Patrimonio che <span className="text-cyan-400 font-semibold">genera rendita</span> e ti libera dalla ruota del criceto
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 px-6 py-3 font-semibold shadow-lg">
            Perché Scegliere Percorso Capitale
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Il Sistema Completo per la
            <span className="text-blue-300 block mt-2">Tua Crescita Finanziaria</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16">
            <Card className="bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Sistema Integrato</h3>
                <p className="text-slate-300 leading-relaxed">6 moduli che lavorano in sinergia per coprire ogni aspetto della tua vita finanziaria, dal budgeting agli investimenti</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Automazione Intelligente</h3>
                <p className="text-slate-300 leading-relaxed">Trasforma decisioni complesse in azioni automatiche, risparmiando tempo e riducendo errori</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Educazione Pratica</h3>
                <p className="text-slate-300 leading-relaxed">Impara mentre agisci con contenuti educativi integrati nel tuo workflow quotidiano</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-6 py-3 font-semibold shadow-sm">
              6 Moduli Integrati
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Il tuo percorso verso la
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block mt-2">
                libertà finanziaria
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
              Ogni modulo è progettato per lavorare in sinergia con gli altri, 
              creando un ecosistema finanziario completo e potente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Modulo 1 - Check-up Finanziario */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200 bg-white shadow-lg">
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 font-semibold shadow-sm">Modulo 1</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                  Check-up Finanziario
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Scopri il tuo patrimonio netto e la tua "potenza di fuoco" mensile. 
                  Una fotografia cristallina della tua situazione in soli 15 minuti.
                </p>
                <div className="flex items-center text-sm text-blue-600 font-semibold bg-blue-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Analisi patrimonio completa
                </div>
              </CardContent>
            </Card>

            {/* Modulo 2 - Pianificatore Obiettivi */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200 bg-white shadow-lg">
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 font-semibold shadow-sm">Modulo 2</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">
                  Pianificatore Obiettivi
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Trasforma i tuoi sogni in traguardi concreti e misurabili. 
                  Calcola esattamente quanto investire per raggiungerli.
                </p>
                <div className="flex items-center text-sm text-indigo-600 font-semibold bg-indigo-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pianificazione con interesse composto
                </div>
              </CardContent>
            </Card>

            {/* Modulo 3 - Money Management */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200 bg-white shadow-lg">
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <PiggyBank className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 font-semibold shadow-sm">Modulo 3</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-green-600 transition-colors">
                  Money Management
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Sistema intelligente 50/30/20 che automatizza il tuo budgeting. 
                  Scopri dove trovare i soldi per i tuoi obiettivi.
                </p>
                <div className="flex items-center text-sm text-green-600 font-semibold bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Budgeting automatico e ottimizzato
                </div>
              </CardContent>
            </Card>

            {/* Modulo 4 - Area Investimenti */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200 bg-white shadow-lg">
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calculator className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 font-semibold shadow-sm">Modulo 4</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-purple-600 transition-colors">
                  Area Investimenti
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Portafogli modello educativi e tracking delle performance in tempo reale. 
                  Dal piano all'azione concreta.
                </p>
                <div className="flex items-center text-sm text-purple-600 font-semibold bg-purple-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Portfolio tracking e analisi
                </div>
              </CardContent>
            </Card>

            {/* Modulo 5 - Accademia & Simulatore */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200 bg-white shadow-lg">
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 font-semibold shadow-sm">Modulo 5</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-amber-600 transition-colors">
                  Accademia & Simulatore
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Contenuti educativi bite-sized e simulazioni "E se...?" per visualizzare 
                  l'impatto delle tue decisioni finanziarie.
                </p>
                <div className="flex items-center text-sm text-amber-600 font-semibold bg-amber-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Educazione finanziaria integrata
                </div>
              </CardContent>
            </Card>

            {/* Modulo 6 - Sistema Conti */}
            <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-slate-200 bg-white shadow-lg">
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-teal-100 text-teal-700 font-semibold shadow-sm">Modulo 6</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-teal-600 transition-colors">
                  Architettura dei Conti
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Trasforma il tuo denaro da fiume caotico in canali irrigui intelligenti. 
                  Ogni euro sa automaticamente dove andare.
                </p>
                <div className="flex items-center text-sm text-teal-600 font-semibold bg-teal-50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Automazione flussi finanziari
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <Badge className="mb-8 bg-white/20 text-white border-white/30 px-6 py-3 font-semibold shadow-lg">
            <Award className="w-4 h-4 mr-2" />
            Inizia Oggi Stesso
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Sei pronto a costruire
            <span className="block text-blue-200 mt-4">100.000-500.000€ di patrimonio?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-14 leading-relaxed max-w-3xl mx-auto font-medium">
            Se sei <span className="font-bold text-white">davvero determinato</span> a cambiare la tua situazione finanziaria e non stai cercando scorciatoie, 
            il Metodo ORBITALE è quello che ti serve. Inizia con il Check-up Gratuito.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <Button
              size="lg"
              onClick={handleLogin}
              className="bg-white text-blue-600 hover:bg-slate-50 text-xl px-12 py-6 shadow-2xl hover:shadow-white/25 transform hover:-translate-y-2 transition-all duration-300 font-bold rounded-xl"
            >
              <Globe className="w-6 h-6 mr-3" />
              Inizia Gratuitamente
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <div className="text-blue-100 text-base font-medium">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                Nessuna carta di credito richiesta
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Setup completamente guidato
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Percorso Capitale
                </div>
                <div className="text-sm text-slate-400 font-medium">La Tua Libertà Finanziaria</div>
              </div>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Trasforma il modo in cui gestisci, investi e fai crescere il tuo denaro. 
              Un sistema completo progettato per il tuo successo finanziario a lungo termine.
            </p>
          </div>
          
          <div className="border-t border-slate-700 pt-10 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Sicuro e Certificato</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="font-medium">10,000+ Utenti Attivi</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Star className="w-5 h-5 fill-current text-amber-400" />
                <span className="font-medium">4.9/5 Recensioni</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
