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
  X,
  TrendingDown
} from "lucide-react";
import { Link } from "wouter";
import libroCopertina from "@assets/libro-copertina-alessio.png";

export default function PatrimonioPage() {
  const handleCandidatura = () => {
    window.open('https://forms.gle/yourform', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="page-patrimonio">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Metodo ORBITALE
                </h1>
                <p className="text-sm text-slate-500">Costruisci il Tuo Patrimonio</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Page Switcher */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="bg-white/95 backdrop-blur-lg shadow-lg border-2 hover:bg-blue-50">
                  <Link href="/hybrid" data-testid="link-switch-hybrid">
                    🚀 Hybrid
                  </Link>
                </Button>
                <Button variant="default" size="sm" className="bg-blue-600 shadow-lg">
                  💎 Patrimonio
                </Button>
              </div>
              <Button onClick={handleCandidatura} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-candidatura-header">
                CANDIDATI ORA
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50">
        <div className="max-w-4xl mx-auto text-center">


          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-slate-900" data-testid="hero-title">
              Non ti serve un lavoro in più.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Ti serve un patrimonio che lavora al posto tuo.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto" data-testid="hero-subtitle">
              Il sistema scientifico per imprenditori, professionisti e dipendenti 
              determinati a costruire un patrimonio da 100.000€ a 500.000€ in 2-4 
              anni, anche partendo da una situazione di debiti o apparente 
              mancanza di fondi.
            </p>

            <div className="pt-4">
              <Button 
                size="lg" 
                onClick={handleCandidatura}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                data-testid="button-candidatura-hero"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                CANDIDATI PER UNA SESSIONE STRATEGICA
              </Button>
            </div>

            <p className="text-sm text-slate-500 italic max-w-2xl mx-auto" data-testid="hero-disclaimer">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Attenzione: Lavoriamo solo con persone proattive, pronte a seguire un metodo. 
              Se cerchi formule magiche o non sei disposto a impegnarti, questo percorso non fa per te.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-gradient-to-br from-blue-100/30 to-indigo-100/30"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700">
              🎯 Trasparenza Totale
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="filter-title">
              Prima di continuare, lascia che sia <span className="text-blue-600">brutalmente onesto</span> su chi siamo e su chi stiamo cercando.
            </h2>
            <p className="text-xl text-slate-600" data-testid="filter-subtitle">
              Il nostro tempo è prezioso. Il tuo anche. Mettiamo subito in chiaro le cose.
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
                    <span className="font-medium">Ti guidiamo a costruire un patrimonio reale, di almeno centomila euro in due-quattro anni</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Generiamo una rendita stabile di almeno duemila euro al mese</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Aiutiamo chi si trova soffocato dai debiti ad uscirne con il nostro metodo esclusivo, l'Effetto Valanga</span>
                  </li>
                  <li className="flex items-start">
                    <Sparkles className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Lavoriamo solo con persone davvero determinate a cambiare vita</span>
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
                    <span className="font-medium">Non lavoriamo con clienti che non sono pronti a impegnarsi fino in fondo</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non promettiamo scorciatoie o formule magiche</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non offriamo consulenze a basso costo - siamo un percorso esclusivo</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                    <span className="font-medium">Non garantiamo miracoli senza sforzo - il tuo impegno è parte del processo</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-blue-50 border-blue-200 text-blue-700">
              🤔 Una Storia Interessante...
            </Badge>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-6" data-testid="social-proof-intro">
              Magari ti chiedi: <span className="text-blue-600">"Ok, ma come siete arrivati a creare una cosa del genere?"</span>
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Card className="p-8 shadow-xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                <CardContent className="p-0">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4" data-testid="alessio-story-title">
                      🧑‍💻 La mia storia personale (Alessio)
                    </h3>
                    <div className="space-y-4 text-lg text-slate-700 leading-relaxed">
                      <p>
                        <strong className="text-blue-600">È una storia interessante.</strong> Io, Alessio, non nasco come marketer, 
                        ma come <strong>sviluppatore e programmatore</strong>. Sono partito da zero, letteralmente squattrinato, 
                        frustrato perché non sapevo come far fruttare i miei soldi.
                      </p>
                      <p className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <strong>In pochi anni, ho completamente ribaltato la situazione:</strong>
                        <br />• Oltre <strong className="text-green-600">300 mila euro</strong> generati online
                        <br />• Più di <strong className="text-green-600">600 imprenditori</strong> aiutati
                        <br />• Centinaia di consulenze in <strong className="text-green-600">33 nicchie</strong> diverse
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-blue-800">
                          <strong>💡 Ecco il "segreto" :</strong> Questo è importante per te perché sono 
                          <strong> l'unico in Italia</strong> ad aver unito questi due mondi: la strategia di creazione di business 
                          con una logica di crescita patrimoniale che non lascia nulla al caso.
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

      {/* Problem Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="problem-title">
              Se lavori sodo ma il tuo patrimonio è fermo, la colpa non è tua. È la mancanza di un sistema.
            </h2>
            <p className="text-xl text-slate-600" data-testid="problem-subtitle">
              Probabilmente, la tua situazione finanziaria assomiglia a una di queste.
            </p>
          </div>

          <div className="grid gap-6">
            {[
              {
                title: "L'Ansia da Estratto Conto",
                description: "Lavori 10 ore al giorno, generi un buon reddito, ma a fine mese ti chiedi dove siano finiti i soldi. Il tuo conto corrente è un campo di battaglia tra entrate e uscite impreviste.",
                icon: <AlertTriangle className="h-8 w-8" />
              },
              {
                title: "La Prigione dei Debiti \"Buoni\"",
                description: "Ti hanno detto che il mutuo o il finanziamento per l'auto sono \"investimenti\". La realtà è che ogni mese una fetta enorme del tuo reddito se ne va per ripagare il passato.",
                icon: <Building2 className="h-8 w-8" />
              },
              {
                title: "La Paralisi da Investimento",
                description: "Sai che dovresti investire, che l'inflazione sta divorando i tuoi risparmi. Ma il mondo della finanza ti sembra un casinò truccato.",
                icon: <BarChart3 className="h-8 w-8" />
              },
              {
                title: "La Ruota del Criceto",
                description: "Sei intrappolato in un ciclo senza fine. Lavori di più per guadagnare di più, ma più guadagni più spendi. Il tuo stile di vita cresce, ma il tuo patrimonio rimane immobile.",
                icon: <Target className="h-8 w-8" />
              }
            ].map((problem, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="text-red-500 flex-shrink-0 mt-1">
                      {problem.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2" data-testid={`problem-${index}-title`}>
                        {problem.title}
                      </h3>
                      <p className="text-slate-600" data-testid={`problem-${index}-description`}>
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="solution-title">
              Per uscire dal caos non serve più impegno.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Serve un piano d'azione ingegneristico.
              </span>
            </h2>
            <p className="text-xl text-slate-600" data-testid="solution-subtitle">
              Il Metodo ORBITALE è un sistema a 4 fasi che ti porta, passo dopo passo, dalla confusione alla libertà finanziaria. Niente teorie, solo azioni precise.
            </p>
          </div>

          <div className="grid gap-8">
            {[
              {
                phase: "Fase 1",
                title: "LIBERAZIONE: Uscita dai Debiti e Creazione di Liquidità",
                description: "Attraverso il nostro metodo \"Effetto Valanga\", creiamo un piano d'attacco chirurgico per eliminare i debiti che soffocano il tuo cash flow.",
                transformation: "Da indebitato a liquido",
                icon: <Shield className="h-8 w-8" />,
                color: "from-red-500 to-orange-500"
              },
              {
                phase: "Fase 2", 
                title: "ACCUMULO: Sistema di Risparmio e Gestione Automatizzata",
                description: "Installiamo il nostro sistema proprietario dei \"6 Conti Intelligenti\". Automatizziamo il processo di risparmio, costringendoti a \"pagare prima te stesso\".",
                transformation: "Da disorganizzato a una macchina da risparmio",
                icon: <PiggyBank className="h-8 w-8" />,
                color: "from-orange-500 to-yellow-500"
              },
              {
                phase: "Fase 3",
                title: "MOLTIPLICAZIONE: Investimenti Semplici e Sicuri", 
                description: "Ti guidiamo a implementare una strategia basata su strumenti semplici, a basso costo e storicamente solidi (ETF, Oro, etc.). Solo crescita costante e prevedibile.",
                transformation: "Da risparmiatore a investitore strategico",
                icon: <TrendingUp className="h-8 w-8" />,
                color: "from-yellow-500 to-green-500"
              },
              {
                phase: "Fase 4",
                title: "STABILITÀ: Il Patrimonio che Genera Rendita",
                description: "Il tuo capitale genera un flusso di reddito passivo che può coprire le tue spese. Non sei più dipendente dal tuo lavoro per vivere.",
                transformation: "Da dipendente del tuo lavoro a padrone del tuo patrimonio",
                icon: <Rocket className="h-8 w-8" />,
                color: "from-green-500 to-blue-500"
              }
            ].map((phase, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={`w-2 bg-gradient-to-b ${phase.color}`}></div>
                    <div className="p-6 flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center text-white`}>
                          {phase.icon}
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">{phase.phase}</Badge>
                          <h3 className="text-xl font-bold text-slate-900" data-testid={`phase-${index}-title`}>
                            {phase.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-4" data-testid={`phase-${index}-description`}>
                        {phase.description}
                      </p>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-slate-700">
                          <span className="text-green-600">Trasformazione:</span> {phase.transformation}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Stack Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4" data-testid="value-stack-title">
              Accedendo al Metodo ORBITALE, non compri un corso.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Acquisisci un intero arsenale per la costruzione della ricchezza.
              </span>
            </h2>
          </div>

          <div className="grid gap-6">
            {[
              {
                title: "La Piattaforma Software ORBITALE",
                value: "1.200€/anno",
                description: "Il tuo centro di controllo. Un software proprietario per tracciare il Net Worth in tempo reale, gestire i 6 conti, monitorare gli investimenti.",
                icon: <Calculator className="h-6 w-6" />
              },
              {
                title: "La Master Library Formativa Definitiva", 
                value: "2.997€",
                description: "La nostra enciclopedia della ricchezza personale. Oltre 17 categorie e decine di lezioni che coprono ogni aspetto.",
                icon: <BookOpen className="h-6 w-6" />
              },
              {
                title: "Coaching Esecutivo 1-a-1",
                value: "7.200€", 
                description: "Il nostro tempo dedicato a te. Sessioni strategiche dove non parliamo di teoria, ma agiamo nel tuo home banking, sul tuo broker.",
                icon: <Users className="h-6 w-6" />
              },
              {
                title: "Il Sistema di Accountability",
                value: "Inestimabile",
                description: "La vera arma segreta. Esercizi settimanali, revisioni personalizzate e una struttura che ti impedisce di procrastinare.",
                icon: <Target className="h-6 w-6" />
              }
            ].map((component, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="text-blue-600">
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

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-center">
            <h3 className="text-2xl font-bold mb-2" data-testid="total-value">VALORE TOTALE DEL PACCHETTO: 12.894€</h3>
            <p className="text-xl" data-testid="your-investment">IL TUO INVESTIMENTO OGGI: VEDI I PIANI</p>
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
                  <div className="text-3xl font-bold text-blue-600 mb-4">297€ / mese</div>
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
                  <strong>Ideale per:</strong> Chi vuole costruire fondamenta solide con un affiancamento costante e strategico.
                </p>

                <Button 
                  onClick={handleCandidatura} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="button-plan-costruttore"
                >
                  INIZIA IL PERCORSO COSTRUTTORE
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-xl transition-shadow border-2 border-orange-200">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2">
                <span className="font-semibold">CONSIGLIATO</span>
              </div>
              <CardContent className="p-8 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2" data-testid="plan-acceleratore-title">
                    Percorso ACCELERATORE
                  </h3>
                  <div className="text-3xl font-bold text-orange-600 mb-4">497€ / mese</div>
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
                  <strong>Ideale per:</strong> Chi vuole la massima velocità, il massimo supporto e la certezza assoluta di raggiungere il risultato nel minor tempo possibile.
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

      {/* Guarantee Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 mb-4" data-testid="guarantee-title">
              La Nostra Garanzia
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed" data-testid="guarantee-text">
              Siamo così sicuri della potenza del nostro sistema che mettiamo il rischio interamente sulle nostre spalle. 
              Se dopo i primi 30 giorni, seguendo alla lettera il piano d'azione iniziale e completando tutti gli esercizi assegnati, 
              non sarai assolutamente convinto del valore e della direzione che abbiamo impostato, 
              <strong className="text-green-600"> ti rimborsiamo l'intero importo versato. Senza fare domande.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* The Fork in the Road Section */}
      <section className="py-20 bg-white text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-semibold">IL MOMENTO DECISIVO</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" data-testid="fork-title">
              Sei arrivato al{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
            <Card className="relative overflow-hidden bg-white border-2 border-red-300 hover:border-red-400 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2">
                <span className="font-bold text-sm">❌ STRADA #1: STATUS QUO</span>
              </div>
              
              <CardContent className="p-8 pt-16">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="h-10 w-10 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">
                    Continuare Come Sempre
                  </h3>
                  <p className="text-slate-500 italic">
                    "Farò da solo, prima o poi ce la farò..."
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Tempo che passa</p>
                      <p className="text-sm text-slate-600">Altri 2-3 anni di tentativi casuali</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Ansia crescente</p>
                      <p className="text-sm text-slate-600">La paura del futuro aumenta ogni mese</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Opportunità perse</p>
                      <p className="text-sm text-slate-600">Guardare gli altri costruire quello che volevi tu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <TrendingDown className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Stesso risultato</p>
                      <p className="text-sm text-slate-600">Stessi problemi, stessa frustrazione</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 text-center font-semibold">
                    💭 "Tra un anno sarò ancora qui a cercare la soluzione magica..."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Path - Transformation */}
            <Card className="relative overflow-hidden bg-white border-2 border-green-400 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2">
                <span className="font-bold text-sm">✅ STRADA #2: TRASFORMAZIONE</span>
              </div>
              
              <CardContent className="p-8 pt-16">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">
                    Il Metodo ORBITALE
                  </h3>
                  <p className="text-slate-500 italic">
                    "Costruisco un patrimonio che lavora per me"
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Sistema consolidato</p>
                      <p className="text-sm text-slate-600">Uscita dai debiti e liberazione finanziaria</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <PiggyBank className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Risparmio automatizzato</p>
                      <p className="text-sm text-slate-600">6 conti intelligenti che lavorano per te</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Investimenti strategici</p>
                      <p className="text-sm text-slate-600">Crescita costante verso 100k-500k€</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Rocket className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-slate-800 font-medium">Libertà finanziaria</p>
                      <p className="text-sm text-slate-600">Patrimonio che genera rendita</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-center font-semibold">
                    🚀 "Tra un anno avrò costruito il mio patrimonio finanziario"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* The Decision Moment */}
          <div className="text-center">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 mb-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-bold text-slate-800">MOMENTO CRITICO</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              
              <p className="text-xl text-slate-700 leading-relaxed max-w-3xl mx-auto">
                Il Metodo ORBITALE è il nostro programma più esclusivo e intensivo. 
                <strong className="text-blue-600"> Accettiamo solo un numero limitato di nuovi clienti ogni trimestre</strong> 
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
                <span className="text-amber-800 font-semibold">ATTENZIONE: NON È UN ACQUISTO</span>
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

      {/* Final CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="final-cta-title">
            Hai passato abbastanza tempo a lavorare PER i soldi.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              È ora di farli lavorare PER TE.
            </span>
          </h2>

          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed" data-testid="final-cta-text">
            Il Metodo ORBITALE non è per tutti. È per chi ha deciso che "abbastanza" non è abbastanza. 
            È per chi vuole smettere di essere un passeggero della propria vita finanziaria e diventare il pilota. 
            Se sei quella persona, se sei pronto a scambiare le scuse con i risultati, allora sei nel posto giusto.
          </p>

          <Button 
            size="lg" 
            onClick={handleCandidatura}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xl px-12 py-6 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            data-testid="button-final-cta"
          >
            <ArrowRight className="mr-3 h-6 w-6" />
            CANDIDATI ORA E COSTRUISCI IL TUO PATRIMONIO
          </Button>

          <p className="text-sm text-slate-400 mt-6" data-testid="final-cta-subtitle">
            Compila il form per candidarti alla sessione strategica. Analizzeremo il tuo profilo e, se idoneo, ti contatteremo per definire il tuo piano di volo.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Metodo ORBITALE</h3>
                <p className="text-xs">Costruisci il Tuo Patrimonio</p>
              </div>
            </div>
            <p className="text-sm">
              © 2025 Metodo ORBITALE. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}