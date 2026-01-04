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
  Clock,
  Star,
  PiggyBank,
  Building2,
  ChevronDown,
  Sparkles,
  Award,
  Globe,
  AlertTriangle,
  Rocket,
  DollarSign,
  BarChart3,
  Users,
  Phone,
  Mail,
  Play,
  Layers,
  Cog,
  TrendingDown,
  X
} from "lucide-react";
import { Link } from "wouter";
import libroCopertina from "@assets/libro-copertina-alessio.png";

export default function HybridPage() {
  const handleCandidatura = () => {
    window.open('https://forms.gle/yourform', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="page-hybrid">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl flex items-center justify-center shadow-md">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent">
                  Doppio Motore Orbitale
                </h1>
                <p className="text-sm text-slate-500">Business + Patrimonio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Page Switcher */}
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="bg-orange-600 shadow-lg">
                  🚀 Hybrid
                </Button>
                <Button variant="outline" size="sm" asChild className="bg-white/95 backdrop-blur-lg shadow-lg border-2 hover:bg-orange-50">
                  <Link href="/patrimonio" data-testid="link-switch-patrimonio">
                    💎 Patrimonio
                  </Link>
                </Button>
              </div>
              <Button onClick={handleCandidatura} className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-candidatura-header">
                CANDIDATI ORA
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-red-50/50">
        <div className="max-w-4xl mx-auto text-center">
          

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-slate-900" data-testid="hero-title">
              Smetti di cercare un'entrata extra.{" "}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Costruisci un'impresa che finanzia il tuo impero.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto" data-testid="hero-subtitle">
              L'unico ecosistema in Italia che ti guida a creare un'attività profittevole 
              da zero (Motore 1) e poi usa i suoi profitti per costruire un patrimonio 
              da 100.000€ a 500.000€ (Motore 2).
            </p>

            <div className="pt-4">
              <Button 
                size="lg" 
                onClick={handleCandidatura}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                data-testid="button-candidatura-hero"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                CANDIDATI ORA PER ACCEDERE
              </Button>
            </div>

            <p className="text-sm text-slate-500 italic max-w-2xl mx-auto" data-testid="hero-disclaimer">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Avviso: Questo è un programma esecutivo per persone che vogliono costruire attivamente sia un business che un patrimonio. 
              Non è un corso passivo. Richiede impegno e ambizione.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-orange-50/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-gradient-to-br from-orange-100/30 to-red-100/30"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white/80 backdrop-blur-sm border-orange-200 text-orange-700">
              🎯 Trasparenza Totale
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="filter-title">
              Prima di continuare, mettiamo subito <span className="text-orange-600">le cose in chiaro</span>.
            </h2>
            <p className="text-xl text-slate-600" data-testid="filter-subtitle">
              Il nostro tempo è prezioso. Il tuo anche. Questo è ciò che rappresentiamo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-green-500 p-3 rounded-full mr-4 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800" data-testid="filter-what-we-do">✅ Quello che facciamo:</h3>
                </div>
                <ul className="space-y-4 text-green-700">
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Ti guidiamo a creare un'attività profittevole da zero che genera cash flow costante</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Trasformiamo sistematicamente quei profitti in un patrimonio da 100.000€ a 500.000€</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Costruiamo un ecosistema completo: Business + Sistema finanziario integrato</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Lavoriamo solo con persone davvero determinate a costruire attivamente</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-red-500 p-3 rounded-full mr-4 shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-800" data-testid="filter-what-we-dont-do">❌ Quello che NON facciamo:</h3>
                </div>
                <ul className="space-y-4 text-red-700">
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non è un corso passivo - richiede impegno attivo su entrambi i fronti</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non promettiamo risultati senza sforzo o formule magiche</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non lavoriamo con chi cerca solo consulenze a basso costo</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non garantiamo miracoli senza impegno e ambizione reale</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-red-50/50"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-orange-50 border-orange-200 text-orange-700">
              🤔 Una Storia Interessante...
            </Badge>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-6" data-testid="social-proof-intro">
              Magari ti chiedi: <span className="text-orange-600">"Ok, ma come siete arrivati a creare una cosa del genere?"</span>
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Card className="p-8 shadow-xl border-2 border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
                <CardContent className="p-0">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4" data-testid="alessio-story-title">
                      🧑‍💻 La mia storia personale (Alessio)
                    </h3>
                    <div className="space-y-4 text-lg text-slate-700 leading-relaxed">
                      <p>
                        <strong className="text-orange-600">È una storia interessante.</strong> Io, Alessio, non nasco come marketer, 
                        ma come <strong>sviluppatore e programmatore</strong>. Sono partito da zero, letteralmente squattrinato, 
                        frustrato perché non sapevo come far fruttare i miei soldi.
                      </p>
                      <p className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <strong>In pochi anni, ho completamente ribaltato la situazione:</strong>
                        <br />• Oltre <strong className="text-green-600">300 mila euro</strong> generati online
                        <br />• Più di <strong className="text-green-600">600 imprenditori</strong> aiutati
                        <br />• Centinaia di consulenze in <strong className="text-green-600">33 nicchie</strong> diverse
                      </p>
                      <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                        <p className="text-orange-800">
                          <strong>💡 Ecco il "segreto":</strong> Questo è importante per te perché sono 
                          <strong> l'unico in Italia</strong> ad aver unito questi due mondi: la strategia di creazione di business 
                          (come i software AI che ti insegnerò a creare) con una logica di crescita patrimoniale che non lascia nulla al caso.
                        </p>
                      </div>
                      <p>
                        Ho creato un sistema che <strong className="text-purple-600">elimina ogni rischio e ogni dubbio</strong>, 
                        portando al risultato in modo quasi matematico.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-3" data-testid="credibility-section">
                      🏆 Credibilità & Partnership
                    </h4>
                    <p className="text-slate-700 mb-4">
                      Siamo gli unici ad aver lanciato un <strong>software (Orbitale)</strong> così potente in Italia, 
                      che ti evita di dover comprare decine di altri tool. Siamo un'azienda seria, e i nostri risultati lo dimostrano.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Alfio Bardolla</Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Mirco Gasparotto</Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Roberto Re</Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Max Mariola</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      Ricercato da tutti per aiutare sia imprenditori sia persone ad incrementare oltre al proprio fatturato il proprio patrimonio personale.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 shadow-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 hover:scale-105 transition-all duration-300">
                <CardContent className="p-0 text-center">
                  <div className="mb-4">
                    <img 
                      src={libroCopertina} 
                      alt="Copertina libro Comanda le tue Finanze" 
                      className="w-full max-w-[200px] mx-auto rounded-lg shadow-lg"
                      data-testid="libro-copertina"
                    />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">
                    📖 Il Mio Libro su Amazon
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">
                    "Aiuto imprenditori, liberi professionisti e dipendenti a creare, gestire e proteggere il proprio denaro, 
                    risparmiarlo e investirlo strategicamente, per costruire un patrimonio compreso tra 100.000 e 500.000 euro in 2-4 anni, 
                    grazie al Metodo ORBITALE."
                  </p>
                  <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    <a 
                      href="https://amzn.eu/d/cS6D9Kj" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      data-testid="link-amazon-libro"
                    >
                      📚 Leggi su Amazon
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosis Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="diagnosis-title">
              Se non stai costruendo ricchezza, probabilmente stai cercando di risolvere il problema sbagliato.
            </h2>
            <p className="text-xl text-slate-600" data-testid="diagnosis-subtitle">
              Esistono due tipi di persone, bloccate in due prigioni diverse.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-blue-200">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <TrendingDown className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-900" data-testid="prison-1-title">
                    PRIGIONE #1: L'Ansia da Cash Flow
                  </h3>
                </div>
                <p className="text-blue-800 font-semibold mb-3">(Il Criceto Ambizioso)</p>
                <p className="text-slate-600 leading-relaxed" data-testid="prison-1-description">
                  Sei un professionista o un dipendente che lavora sodo. Sai gestire le tue finanze, risparmi, 
                  magari hai anche provato a investire. Ma c'è un limite invalicabile: il tuo reddito. 
                  Puoi ottimizzare quanto vuoi, ma senza più "carburante" da immettere nel sistema, 
                  la tua crescita patrimoniale è lenta, frustrante e vulnerabile. 
                  <strong className="text-blue-600"> Ti manca il motore per accelerare.</strong>
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-orange-200">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-900" data-testid="prison-2-title">
                    PRIGIONE #2: La Trappola del Profitto
                  </h3>
                </div>
                <p className="text-orange-800 font-semibold mb-3">(L'Imprenditore Ricco-Povero)</p>
                <p className="text-slate-600 leading-relaxed" data-testid="prison-2-description">
                  Sei un imprenditore o un professionista di successo. Generi ottimi profitti, il tuo business funziona. 
                  Ma quei profitti rimangono intrappolati nell'azienda o vengono erosi da uno stile di vita che cresce con il fatturato. 
                  Non hai un sistema scientifico per estrarre quel valore e trasformarlo in un patrimonio personale, 
                  solido e separato dal business. Sei ricco sulla carta, ma il tuo futuro finanziario è una scatola nera.
                  <strong className="text-orange-600"> Ti manca il veicolo per la destinazione.</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-2xl mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-red-800 font-semibold text-lg" data-testid="diagnosis-truth">
                La verità è che cercare di risolvere solo uno di questi due problemi è inutile. 
                Ti serve un sistema che li risolva entrambi contemporaneamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Doppio Motore */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="solution-title">
              Abbiamo unito due mondi che in Italia nessuno ha mai osato connettere.
            </h2>
            <p className="text-xl text-slate-600" data-testid="solution-subtitle">
              Il nostro ecosistema si basa su una logica spietatamente efficace: il Doppio Motore. 
              Prima creiamo il carburante, poi costruiamo il veicolo che ti porta alla libertà finanziaria.
            </p>
          </div>

          <div className="grid gap-8">
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-orange-200">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-2 bg-gradient-to-b from-orange-500 to-red-500"></div>
                  <div className="p-8 flex-1">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                        <Rocket className="h-8 w-8" />
                      </div>
                      <div>
                        <Badge variant="secondary" className="mb-2 bg-orange-100 text-orange-800">MOTORE #1</Badge>
                        <h3 className="text-2xl font-bold text-slate-900" data-testid="motor-1-title">
                          L'ACCELERATORE DI ENTRATE
                        </h3>
                        <p className="text-lg text-orange-600 font-semibold">(Costruisci la tua macchina da soldi)</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed mb-4" data-testid="motor-1-description">
                      Questa è la nostra risposta alla mancanza di cash flow. Invece di insegnarti a risparmiare sui caffè, 
                      ti guidiamo passo dopo passo a creare, lanciare e rendere profittevole un'attività di servizi da zero. 
                      Ti forniamo il modello di business, la strategia per trovare clienti e il sistema per erogare il servizio ad alto margine. 
                      Questo motore non è un "lavoretto extra". È un vero e proprio asset progettato per generare il flusso di cassa 
                      necessario per alimentare la tua crescita.
                    </p>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        <span className="text-orange-600">Trasformazione:</span> Da reddito limitato a creatore di cash flow.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-blue-200">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-2 bg-gradient-to-b from-blue-500 to-indigo-500"></div>
                  <div className="p-8 flex-1">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                        <Target className="h-8 w-8" />
                      </div>
                      <div>
                        <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800">MOTORE #2</Badge>
                        <h3 className="text-2xl font-bold text-slate-900" data-testid="motor-2-title">
                          IL SISTEMA ORBITALE
                        </h3>
                        <p className="text-lg text-blue-600 font-semibold">(Trasforma i profitti in patrimonio)</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed mb-4" data-testid="motor-2-description">
                      Questo è il nostro sistema collaudato per la gestione della ricchezza. Una volta che il Motore #1 inizia a generare profitti, 
                      li incanaliamo qui. Attraverso il software proprietario, la strategia dei 6 conti, l'automazione e gli investimenti strategici, 
                      trasformiamo sistematicamente e scientificamente quel flusso di cassa in un patrimonio netto che cresce nel tempo. 
                      Questo motore è il veicolo che prende i profitti e li converte in vera libertà finanziaria, proteggendoti e garantendo il tuo futuro.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        <span className="text-blue-600">Trasformazione:</span> Da profitto volatile a patrimonio solido.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Stack Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="value-stack-title">
              Questo non è un corso.{" "}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                È un programma di accelerazione imprenditoriale e finanziaria chiavi in mano.
              </span>
            </h2>
          </div>

          <div className="grid gap-6">
            {[
              {
                title: "Il Sistema \"Crea-Business da Zero\"",
                value: "4.997€",
                description: "Il nostro framework completo per lanciare la tua attività di servizi. Include la scelta della nicchia, la creazione dell'offerta irresistibile, le strategie di marketing per acquisire i primi clienti e i sistemi per erogare il servizio.",
                icon: <Rocket className="h-6 w-6" />
              },
              {
                title: "La Piattaforma Software ORBITALE", 
                value: "1.200€/anno",
                description: "Il tuo centro di controllo per il Motore #2. Traccia il Net Worth, gestisce i 6 conti, monitora gli investimenti. La dashboard che connette i tuoi profitti alla tua crescita patrimoniale.",
                icon: <Calculator className="h-6 w-6" />
              },
              {
                title: "La Master Library Formativa Definitiva",
                value: "2.997€", 
                description: "La nostra enciclopedia completa. Decine di lezioni che coprono ogni aspetto di entrambi i motori: dalla vendita e marketing alla gestione fiscale avanzata e alla pianificazione successoria.",
                icon: <BookOpen className="h-6 w-6" />
              },
              {
                title: "Coaching Esecutivo 1-a-1",
                value: "9.600€",
                description: "Il nostro affiancamento strategico. Sessioni dedicate dove costruiamo insieme il tuo business, impostiamo il sistema finanziario ed eseguiamo le prime operazioni. Agiamo, non parliamo.",
                icon: <Users className="h-6 w-6" />
              },
              {
                title: "Il Sistema di Accountability",
                value: "Inestimabile",
                description: "La struttura che ti garantisce di non fallire. Esercizi settimanali, revisioni personalizzate e scadenze che ti costringono a passare dalla teoria all'azione sia sul fronte business che su quello finanziario.",
                icon: <Target className="h-6 w-6" />
              }
            ].map((component, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <div className="text-orange-600">
                        {component.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-slate-900" data-testid={`component-${index}-title`}>
                          {component.title}
                        </h3>
                        <Badge variant="secondary" className="text-green-600 font-semibold">
                          Valore: {component.value}
                        </Badge>
                      </div>
                      <p className="text-slate-600" data-testid={`component-${index}-description`}>
                        {component.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card className="p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white text-center border-0">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold mb-2" data-testid="total-value">VALORE TOTALE DEL PACCHETTO: 20.291€</h3>
                <p className="text-xl" data-testid="your-investment">IL TUO INVESTIMENTO: SCOPRI I PIANI QUI SOTTO</p>
              </CardContent>
            </Card>
            
            <div className="mt-4 text-center">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 px-4 py-2">
                <Award className="h-4 w-4 mr-2" />
                BONUS AD ACCESSO IMMEDIATO: L'Acceleratore di ROI "Primi Clienti Subito" (Valore: 1.497€)
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="pricing-title">
              Scegli il Percorso Progettato per la Tua Velocità di Crociera
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2" data-testid="plan-costruttore-title">
                    Percorso COSTRUTTORE
                  </h3>
                  <div className="text-3xl font-bold text-orange-600 mb-4">297€ / mese</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>2 Sessioni Strategiche al mese</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Arsenale Completo (Software, Libreria, Template)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Supporto via Piattaforma (Risposta in 2/4h)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Canale di Supporto Diretto</span>
                  </li>
                </ul>

                <p className="text-sm text-slate-600 mb-6" data-testid="plan-costruttore-ideal">
                  <strong>Ideale per:</strong> Chi vuole costruire fondamenta solide con un affiancamento costante e strategico su entrambi i motori.
                </p>

                <Button 
                  onClick={handleCandidatura} 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  data-testid="button-plan-costruttore"
                >
                  INIZIA IL PERCORSO COSTRUTTORE
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-xl transition-shadow border-2 border-red-200">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2">
                <span className="font-semibold">CONSIGLIATO</span>
              </div>
              <CardContent className="p-8 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2" data-testid="plan-acceleratore-title">
                    Percorso ACCELERATORE
                  </h3>
                  <div className="text-3xl font-bold text-red-600 mb-4">497€ / mese</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>4 Sessioni Strategiche al mese</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Arsenale Completo (Software, Libreria, Template)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Supporto via Piattaforma (Risposta in 1h)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Onboarding Intensivo (4 sessioni nel primo mese)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Report Mensili Personalizzati</span>
                  </li>
                </ul>

                <p className="text-sm text-slate-600 mb-6" data-testid="plan-acceleratore-ideal">
                  <strong>Ideale per:</strong> Chi vuole la massima velocità, il massimo supporto e la certezza assoluta di costruire business e patrimonio nel minor tempo possibile.
                </p>

                <Button 
                  onClick={handleCandidatura} 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  data-testid="button-plan-acceleratore"
                >
                  INIZIA IL PERCORSO ACCELERATORE
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Transformation Section */}
      <section className="py-16 bg-white text-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" data-testid="transformation-title">
            Immagina la tua vita tra 12 mesi.
          </h2>
          
          <div className="text-xl leading-relaxed max-w-3xl mx-auto space-y-6" data-testid="transformation-text">
            <p>
              Non stai più scambiando il tuo tempo per denaro. Hai due motori di reddito che lavorano per te: 
              il tuo lavoro principale e la tua nuova attività. Ogni mese, vedi i profitti della tua impresa 
              fluire automaticamente nel Sistema ORBITALE, e osservi dalla tua dashboard il tuo patrimonio netto 
              crescere in modo prevedibile verso il tuo primo, importante traguardo: 100.000€.
            </p>
            
            <p>
              L'ansia è sparita. Al suo posto, c'è il controllo. La paura del futuro è svanita. Al suo posto, c'è un piano. 
              Non sei più solo un lavoratore o un imprenditore.{" "}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-bold">
                Sei un costruttore di ricchezza. Sei il CEO del tuo futuro finanziario.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 mb-4" data-testid="guarantee-title">
              La Nostra Garanzia
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed" data-testid="guarantee-text">
              Siamo così sicuri della potenza del nostro sistema a doppio motore che mettiamo il rischio interamente sulle nostre spalle. 
              Se dopo i primi 30 giorni, seguendo alla lettera il piano d'azione iniziale e completando tutti gli esercizi assegnati, 
              non sarai assolutamente convinto del valore e della direzione che abbiamo impostato per entrambi i motori (business e patrimonio), 
              <strong className="text-green-600"> ti rimborsiamo l'intero importo versato. Senza fare domande.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* The Fork in the Road Section */}
      <section className="py-20 bg-gradient-to-br from-white via-orange-50/20 to-red-50/20 text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-700 font-semibold">IL MOMENTO DECISIVO</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" data-testid="fork-title">
              Sei arrivato al{" "}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                BIVIO DEFINITIVO
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Oggi devi scegliere tra due strade completamente diverse. Non c'è via di mezzo.
            </p>
          </div>

          {/* The Two Paths */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Left Path - Status Quo */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 hover:border-red-400 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2">
                <span className="font-bold text-sm">❌ STRADA #1: STATUS QUO</span>
              </div>
              
              <CardContent className="p-8 pt-16">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="h-10 w-10 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-800 mb-2">
                    Continuare Come Sempre
                  </h3>
                  <p className="text-red-600 italic">
                    "Farò da solo, prima o poi ce la farò..."
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium">Tempo che passa</p>
                      <p className="text-sm text-red-600">Altri 2-3 anni di tentativi casuali</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium">Ansia crescente</p>
                      <p className="text-sm text-red-600">La paura del futuro aumenta ogni mese</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium">Opportunità perse</p>
                      <p className="text-sm text-red-600">Guardare gli altri costruire quello che volevi tu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <TrendingDown className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium">Stesso risultato</p>
                      <p className="text-sm text-red-600">Stessi problemi, stessa frustrazione</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-red-800 text-center font-semibold">
                    💭 "Tra un anno sarò ancora qui a cercare la soluzione magica..."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Path - Transformation */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 hover:border-green-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2">
                <span className="font-bold text-sm">✅ STRADA #2: TRASFORMAZIONE</span>
              </div>
              
              <CardContent className="p-8 pt-16">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="h-10 w-10 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    Il Sistema a Doppio Motore
                  </h3>
                  <p className="text-green-700 italic">
                    "Costruisco un ecosistema che lavora per me"
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Business funzionante</p>
                      <p className="text-sm text-green-700">Attività che genera cash flow costante</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Patrimonio in crescita</p>
                      <p className="text-sm text-green-700">Sistema automatizzato verso 100k-500k€</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Controllo totale</p>
                      <p className="text-sm text-green-700">Dashboard che monitora ogni aspetto</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Libertà finanziaria</p>
                      <p className="text-sm text-green-700">Due motori che lavorano per te</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg border border-orange-300">
                  <p className="text-orange-800 text-center font-semibold">
                    🚀 "Tra un anno avrò costruito il mio impero finanziario"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* The Decision Moment */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-8 border border-slate-300 mb-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-bold text-slate-800">MOMENTO CRITICO</span>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              
              <p className="text-xl text-slate-700 leading-relaxed max-w-3xl mx-auto">
                Il Sistema a Doppio Motore è il nostro programma più esclusivo e intensivo. 
                <strong className="text-orange-600"> Accettiamo solo un numero limitato di nuovi clienti ogni trimestre</strong> 
                per garantire un livello di supporto ossessivo.
              </p>
              
              <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
                Se sei un professionista, un imprenditore o un dipendente che ha capito che la vera libertà 
                non deriva solo dal guadagnare di più, ma dal <strong className="text-green-600">possedere un sistema 
                che trasforma quei guadagni in patrimonio</strong>, allora questo è il tuo momento.
              </p>
            </div>

            <Button 
              size="lg" 
              onClick={handleCandidatura}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xl px-12 py-6 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 mb-6"
              data-testid="button-final-cta"
            >
              <ArrowRight className="mr-3 h-6 w-6" />
              SCELGO LA STRADA #2: CANDIDATI ORA
            </Button>

            <div className="bg-slate-100 rounded-lg p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-700 font-semibold">ATTENZIONE: NON È UN ACQUISTO</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Questo è un <strong className="text-slate-800">form di candidatura</strong>. 
                Il nostro team analizzerà attentamente il tuo profilo e, solo se dimostra la determinazione 
                e l'impegno che cerchiamo, ti contatteremo per una sessione strategica approfondita.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-700 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Doppio Motore Orbitale</h3>
                <p className="text-xs">Business + Patrimonio</p>
              </div>
            </div>
            <p className="text-sm">
              © 2025 Doppio Motore Orbitale. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}