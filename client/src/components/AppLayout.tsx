import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  CreditCard, 
  Wallet, 
  BookOpen, 
  Calculator, 
  Building2,
  Menu,
  ChevronLeft,
  LogOut,
  X,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Briefcase,
  Globe,
  Settings
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarContextType {
  isExpanded: boolean;
  isMobileMenuOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [consultationMenuExpanded, setConsultationMenuExpanded] = useState(false);
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Auto-collapse sidebar on Academy page and on mobile
  useEffect(() => {
    if (location === "/investment-academy") {
      setIsExpanded(false);
    }
    // Auto-collapse sidebar on mobile
    if (isMobile) {
      setIsExpanded(false);
      setIsMobileMenuOpen(false);
    } else {
      // On desktop, ensure sidebar is expanded by default
      if (location !== "/investment-academy") {
        setIsExpanded(true);
      }
    }
  }, [location, isMobile]);

  const toggleSidebar = useCallback(() => {
    if (!isMobile) {
      setIsExpanded(!isExpanded);
    }
  }, [isMobile, isExpanded]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Check if current page is Academy
  const isAcademyPage = location === "/investment-academy";

  const getUserInitials = () => {
    if (user && typeof user === 'object' && 'firstName' in user && 'lastName' in user && user.firstName && user.lastName) {
      return `${(user.firstName as string)[0]}${(user.lastName as string)[0]}`.toUpperCase();
    }
    if (user && typeof user === 'object' && 'email' in user && user.email) {
      return (user.email as string)[0].toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user && typeof user === 'object' && 'firstName' in user && 'lastName' in user && user.firstName && user.lastName) {
      return `${user.firstName as string} ${user.lastName as string}`;
    }
    if (user && typeof user === 'object' && 'firstName' in user && user.firstName) {
      return user.firstName as string;
    }
    if (user && typeof user === 'object' && 'email' in user && user.email) {
      return (user.email as string).split('@')[0];
    }
    return "Utente";
  };

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const navigationItems = [
    { href: "/", icon: BarChart3, label: "Dashboard" },
    { href: "/goals", icon: Target, label: "Obiettivi" },
    { href: "/transactions", icon: CreditCard, label: "Transazioni" },
    { href: "/budget", icon: Wallet, label: "Budget" },
    { href: "/investments", icon: TrendingUp, label: "Investimenti" },
    { href: "/simulator", icon: Calculator, label: "Simulatore" },
    { href: "/account-architecture", icon: Building2, label: "Conti" },
    { href: "/business-analysis", icon: Briefcase, label: "Analisi Aziendale" },
  ];

  // Get user's first name for personalized site label
  const userFirstName = user && typeof user === 'object' && 'firstName' in user ? user.firstName as string : '';
  const siteLabel = userFirstName ? `Sito di ${userFirstName}` : 'Il tuo Sito';

  // Get user website URL - aggiorna ad ogni render per riflettere i cambiamenti
  const userWebsite = useMemo(() => {
    const websiteUrlCamelCase = (user as any)?.websiteUrl;
    const websiteUrlSnakeCase = (user as any)?.website_url;
    const url = websiteUrlCamelCase || websiteUrlSnakeCase;

    if (!url || url.trim() === '') {
      return '';
    }

    return url;
  }, [user]);

  const externalServicesItems = [
    { href: "#coachale", icon: Users, label: "Esercitazioni", isExternal: true },
    { href: "#crmale", icon: Briefcase, label: "CRM", isExternal: true },
    { href: "#siteale", icon: Globe, label: siteLabel, isExternal: true, requiresWebsite: true },
  ];

  // Get user email for admin check
  const userEmail = user && typeof user === 'object' && 'email' in user ? user.email as string : '';
  const isAdmin = userEmail === 'alessio@gmail.com';

  // Consultation items based on user role - removed all items
  const consultationItems: any[] = [];

  if (!isAuthenticated) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, isMobileMenuOpen, toggleSidebar, toggleMobileMenu, closeMobileMenu }}>
      <div className="min-h-screen bg-gray-50 flex relative">
        {/* Mobile Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className={`fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between ${
            isAcademyPage 
              ? 'bg-gradient-to-r from-gray-900 to-black border-b border-gray-800' 
              : 'bg-white border-b border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isAcademyPage 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                  : 'bg-trust-blue'
              }`}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-sm font-bold ${
                  isAcademyPage ? 'text-white' : 'text-dark-gray'
                }`}>Percorso Capitale</h1>
                <p className={`text-xs ${
                  isAcademyPage ? 'text-gray-400' : 'text-medium-gray'
                }`}>La Tua Libertà Finanziaria</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className={`p-2 ${
                isAcademyPage 
                  ? 'text-white hover:bg-gray-800' 
                  : 'text-dark-gray hover:bg-gray-100'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        )}

        {/* Sidebar - Desktop & Mobile Overlay */}
        <div className={`shadow-lg transition-all duration-300 flex flex-col ${
          isMobile 
            ? `fixed top-0 left-0 h-full z-50 transform ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } w-80`
            : `${isExpanded ? 'w-64' : 'w-16'}`
        } ${
          isAcademyPage 
            ? 'bg-gradient-to-b from-gray-900 to-black border-r border-gray-800' 
            : 'bg-white border-r border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 ${
            isAcademyPage ? 'border-b border-gray-800' : 'border-b border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              {(isExpanded || isMobile) && (
                <Link href="/" className="flex items-center space-x-3" onClick={isMobile ? closeMobileMenu : undefined}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isAcademyPage 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                      : 'bg-trust-blue'
                  }`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-sm font-bold ${
                      isAcademyPage ? 'text-white' : 'text-dark-gray'
                    }`}>Percorso Capitale</h1>
                    <p className={`text-xs ${
                      isAcademyPage ? 'text-gray-400' : 'text-medium-gray'
                    }`}>La Tua Libertà Finanziaria</p>
                  </div>
                </Link>
              )}
              {!isExpanded && !isMobile && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                  isAcademyPage 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                    : 'bg-trust-blue'
                }`}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              )}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMobileMenu}
                  className={`p-2 ${
                    isAcademyPage 
                      ? 'text-white hover:bg-gray-800' 
                      : 'text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Toggle Button - Desktop Only */}
          {!isMobile && (
            <div className={`px-4 py-2 ${
              isAcademyPage ? 'border-b border-gray-800' : 'border-b border-gray-200'
            }`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={`w-full justify-start ${
                  isAcademyPage 
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {isExpanded ? (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Comprimi
                  </>
                ) : (
                  <Menu className="w-4 h-4 mx-auto" />
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {/* Main navigation items */}
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={`${item.href}-${index}`} href={item.href} onClick={() => isMobile && closeMobileMenu()}>
                  <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive 
                      ? (isAcademyPage ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-trust-blue text-white')
                      : (isAcademyPage 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                        )
                  }`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {(isExpanded || isMobile) && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* External services section */}
            {(isExpanded || isMobile) && (
              <div className={`pt-4 mt-4 space-y-2 ${
                isAcademyPage ? 'border-t border-gray-800' : 'border-t border-gray-200'
              }`}>
                <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  isAcademyPage ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Servizi esterni
                </div>
                {externalServicesItems.map((item, index) => {
                  const Icon = item.icon;

                  // Check if user has website URL configured
                  const isDisabled = item.requiresWebsite && !userWebsite;

                  const handleClick = () => {
                    if (isDisabled) {
                      toast({
                        title: "Sito non configurato",
                        description: "Configura il tuo sito web nelle Impostazioni per accedere a questo link.",
                        variant: "destructive"
                      });
                      return;
                    }
                    if (isMobile) closeMobileMenu();

                    if (item.href === "#coachale") {
                      window.open('https://coachAle.replit.app', '_blank');
                    } else if (item.href === "#crmale") {
                      window.open('https://crmale.replit.app', '_blank');
                    } else if (item.href === "#siteale" && userWebsite) {
                      // Aggiungi https:// se manca
                      const url = userWebsite.startsWith('http') ? userWebsite : `https://${userWebsite}`;
                      window.open(url, '_blank');
                    }
                  };

                  return (
                    <div key={`${item.href}-${index}`} onClick={handleClick}>
                      <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isDisabled 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'cursor-pointer'
                      } ${
                        isAcademyPage 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                      }`}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                        {isDisabled && (
                          <span className="text-xs text-gray-400">(configura)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Consultation section */}
            {consultationItems.length > 0 && (
              <div className="space-y-1 border-t border-gray-200 pt-4 mt-4">
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isAcademyPage 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                  onClick={() => setConsultationMenuExpanded(!consultationMenuExpanded)}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  {(isExpanded || isMobile) && (
                    <>
                      <span className="font-medium text-sm flex-1">Consulenze</span>
                      {consultationMenuExpanded ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </>
                  )}
                </div>

                {/* Consultation submenu */}
                {consultationMenuExpanded && (isExpanded || isMobile) && (
                  <div className="ml-6 space-y-1">
                    {consultationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;

                      return (
                        <Link key={item.href} href={item.href} onClick={() => isMobile && closeMobileMenu()}>
                          <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            isActive 
                              ? (isAcademyPage ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-trust-blue text-white')
                              : (isAcademyPage 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                                  : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                                )
                          }`}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium text-sm">{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className={`p-4 ${
            isAcademyPage ? 'border-t border-gray-800' : 'border-t border-gray-200'
          }`}>
            {(isExpanded || isMobile) ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isAcademyPage 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                      : 'bg-growth-green'
                  }`}>
                    <span className="text-white font-semibold text-xs">{getUserInitials()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${
                      isAcademyPage ? 'text-gray-400' : 'text-medium-gray'
                    }`}>Benvenuto,</p>
                    <p className={`font-semibold text-sm truncate ${
                      isAcademyPage ? 'text-white' : 'text-dark-gray'
                    }`}>{getUserName()}</p>
                  </div>
                </div>
                <Link href="/settings" onClick={() => isMobile && closeMobileMenu()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`w-full justify-start ${
                      isAcademyPage 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                        : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Impostazioni
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className={`w-full justify-start ${
                    isAcademyPage 
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' 
                      : 'text-medium-gray hover:text-dark-gray hover:bg-gray-100'
                  }`}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Esci
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-growth-green rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">{getUserInitials()}</span>
                </div>
                <Link href="/settings">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-8 h-8 p-0 text-medium-gray hover:text-dark-gray hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="w-8 h-8 p-0 text-medium-gray hover:text-dark-gray hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 overflow-hidden ${
          isMobile ? 'pt-16' : ''
        }`}>
          <div className={`h-full ${
            isMobile && !isAcademyPage ? 'px-4 py-4' : ''
          }`}>
            {children}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}