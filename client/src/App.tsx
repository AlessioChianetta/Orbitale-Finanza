import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/DashboardNew";

import Registration from "@/pages/Registration";
import Goals from "@/pages/GoalsFixed";
import Transactions from "@/pages/Transactions";
import Budget from "@/pages/Budget";
import Investments from "@/pages/Investments";
import Academy from "@/pages/Academy";
import InvestmentAcademy from "@/pages/InvestmentAcademy";
import CourseSelection from "@/pages/CourseSelection";
import AdminDashboard from "@/pages/AdminDashboard";
import Simulator from "@/pages/Simulator";
import AccountArchitectureNew from "@/pages/AccountArchitectureNew";
import AccountArchitecture from "@/pages/AccountArchitecture";
import AuthPage from "@/pages/auth-page";
import ConsultationDashboard from "@/pages/ConsultationDashboard";
import ClientsManagement from "@/pages/ClientsManagement";
import ExercisesLibrary from "@/pages/ExercisesLibrary";
import ConsultationCalendar from "@/pages/ConsultationCalendar";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientExercises from "@/pages/ClientExercises";
import ClientCalendar from "@/pages/ClientCalendar";
import PatrimonioPage from "@/pages/PatrimonioPage";
import HybridPage from "@/pages/HybridPage";
import BusinessAnalysis from "@/pages/BusinessAnalysis";
import Settings from "@/pages/Settings";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/patrimonio" component={PatrimonioPage} />
      <Route path="/hybrid" component={HybridPage} />

      {/* Protected routes */}
      <Route path="/registration" component={() => isAuthenticated ? <AppLayout><Registration /></AppLayout> : <Landing />} />
      <Route path="/goals" component={() => isAuthenticated ? <AppLayout><Goals /></AppLayout> : <Landing />} />
      <Route path="/transactions" component={() => isAuthenticated ? <AppLayout><Transactions /></AppLayout> : <Landing />} />
      <Route path="/budget" component={() => isAuthenticated ? <AppLayout><Budget /></AppLayout> : <Landing />} />
      <Route path="/investments" component={() => isAuthenticated ? <AppLayout><Investments /></AppLayout> : <Landing />} />
      <Route path="/academy" component={() => isAuthenticated ? <AppLayout><Academy /></AppLayout> : <Landing />} />
      <Route path="/investment-academy" component={() => isAuthenticated ? <AppLayout><InvestmentAcademy /></AppLayout> : <Landing />} />

      <Route path="/admin" component={() => isAuthenticated ? <AppLayout><AdminDashboard /></AppLayout> : <Landing />} />
      <Route path="/simulator" component={() => isAuthenticated ? <AppLayout><Simulator /></AppLayout> : <Landing />} />
      <Route path="/account-architecture" component={() => isAuthenticated ? <AppLayout><AccountArchitectureNew /></AppLayout> : <Landing />} />
      <Route path="/account-architecture-setup" component={() => isAuthenticated ? <AppLayout><AccountArchitecture /></AppLayout> : <Landing />} />
      <Route path="/business-analysis" component={() => isAuthenticated ? <AppLayout><BusinessAnalysis /></AppLayout> : <Landing />} />

      {/* Consultation System Routes */}
      <Route path="/admin/consulenze" component={() => isAuthenticated ? <AppLayout><ConsultationDashboard /></AppLayout> : <Landing />} />
      <Route path="/admin/clienti" component={() => isAuthenticated ? <AppLayout><ClientsManagement /></AppLayout> : <Landing />} />
      <Route path="/admin/esercizi" component={() => isAuthenticated ? <AppLayout><ExercisesLibrary /></AppLayout> : <Landing />} />
      <Route path="/admin/calendario" component={() => isAuthenticated ? <AppLayout><ConsultationCalendar /></AppLayout> : <Landing />} />

      {/* Client Consultation Routes */}
      <Route path="/consulenze" component={() => isAuthenticated ? <AppLayout><ClientDashboard /></AppLayout> : <Landing />} />
      <Route path="/consulenze/esercizi" component={() => isAuthenticated ? <AppLayout><ClientExercises /></AppLayout> : <Landing />} />
      <Route path="/consulenze/calendario" component={() => isAuthenticated ? <AppLayout><ClientCalendar /></AppLayout> : <Landing />} />

      {/* Home route */}
      <Route path="/" component={() => isAuthenticated ? <AppLayout><Dashboard /></AppLayout> : <Landing />} />
      <Route path="/dashboard" component={() => isAuthenticated ? <AppLayout><Dashboard /></AppLayout> : <Landing />} />
      <Route path="/dashboard-old" component={() => isAuthenticated ? <AppLayout><Dashboard /></AppLayout> : <Landing />} />

      {/* Settings route */}
      <Route path="/settings" component={() => isAuthenticated ? <AppLayout><Settings /></AppLayout> : <Landing />} />

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;