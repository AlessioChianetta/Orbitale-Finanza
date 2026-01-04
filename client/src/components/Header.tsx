import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, BarChart3, CreditCard, Wallet, BookOpen, Calculator, Building2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Header() {
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Utente";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-trust-blue rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-dark-gray">Percorso Capitale</h1>
                <p className="text-sm text-medium-gray">La Tua Libertà Finanziaria</p>
              </div>
            </Link>
            
            {isAuthenticated && (
              <nav className="flex items-center space-x-6">
                <Link 
                  href="/" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link 
                  href="/goals" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/goals' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Obiettivi</span>
                </Link>
                <Link 
                  href="/transactions" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/transactions' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="font-medium">Transazioni</span>
                </Link>
                <Link 
                  href="/budget" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/budget' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="font-medium">Budget</span>
                </Link>
                <Link 
                  href="/investments" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/investments' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Investimenti</span>
                </Link>

                <Link 
                  href="/investment-academy" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/investment-academy' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Accademia</span>
                </Link>
                <Link 
                  href="/simulator" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/simulator' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span className="font-medium">Simulatore</span>
                </Link>
                <Link 
                  href="/account-architecture" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === '/account-architecture' 
                      ? 'bg-trust-blue text-white' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">Conti</span>
                </Link>
              </nav>
            )}
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-medium-gray">Benvenuto,</p>
                <p className="font-semibold text-dark-gray">{getUserName()}</p>
              </div>
              <div className="w-10 h-10 bg-growth-green rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-medium-gray hover:text-dark-gray"
              >
                Esci
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
