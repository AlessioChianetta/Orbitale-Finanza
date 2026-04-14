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
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-gray-900 shadow-lg'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Percorso Capitale</h1>
                <p className="text-xs text-gray-400">La Tua Libertà Finanziaria</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        )}

        {/* Sidebar - Desktop & Mobile Overlay */}
        <div className={`shadow-2xl transition-all duration-300 flex flex-col ${
          isMobile 
            ? `fixed top-0 left-0 h-full z-50 transform ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } w-80`
            : `${isExpanded ? 'w-64' : 'w-16'}`
        } ${
          isAcademyPage 
            ? 'bg-gradient-to-b from-gray-900 to-black border-r border-gray-800' 
            : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50'
        }`}>
          {/* Header */}
          <div className={`p-4 ${
            isAcademyPage ? 'border-b border-gray-800' : 'border-b border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              {(isExpanded || isMobile) && (
                <Link href="/" className="flex items-center space-x-3" onClick={isMobile ? closeMobileMenu : undefined}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-white">Percorso Capitale</h1>
                    <p className="text-xs text-slate-400">La Tua Libertà Finanziaria</p>
                  </div>
                </Link>
              )}
              {!isExpanded && !isMobile && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              )}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMobileMenu}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Toggle Button - Desktop Only */}
          {!isMobile && (
            <div className={`px-4 py-2 ${
              isAcademyPage ? 'border-b border-gray-800' : 'border-b border-white/10'
            }`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/10"
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
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {/* Main navigation items */}
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={`${item.href}-${index}`} href={item.href} onClick={() => isMobile && closeMobileMenu()}>
                  <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? (isAcademyPage 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                          : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25')
                      : (isAcademyPage 
                          ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                        )
                  }`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'opacity-75'}`} />
                    {(isExpanded || isMobile) && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* External services section */}
            {(isExpanded || isMobile) && (
              <div className={`pt-4 mt-4 space-y-1 ${
                isAcademyPage ? 'border-t border-gray-800' : 'border-t border-white/10'
              }`}>
                <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Servizi esterni
                </div>
                {externalServicesItems.map((item, index) => {
                  const Icon = item.icon;

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
                      const url = userWebsite.startsWith('http') ? userWebsite : `https://${userWebsite}`;
                      window.open(url, '_blank');
                    }
                  };

                  return (
                    <div key={`${item.href}-${index}`} onClick={handleClick}>
                      <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isDisabled 
                          ? 'cursor-not-allowed opacity-40' 
                          : 'cursor-pointer'
                      } ${
                        isAcademyPage 
                          ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}>
                        <Icon className="w-5 h-5 flex-shrink-0 opacity-75" />
                        <span className="font-medium text-sm">{item.label}</span>
                        {isDisabled && (
                          <span className="text-xs text-slate-600">(configura)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Consultation section */}
            {consultationItems.length > 0 && (
              <div className="space-y-1 border-t border-white/10 pt-4 mt-4">
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isAcademyPage 
                      ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setConsultationMenuExpanded(!consultationMenuExpanded)}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0 opacity-75" />
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
                          <div className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                            isActive 
                              ? (isAcademyPage 
                                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                                  : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25')
                              : (isAcademyPage 
                                  ? 'text-gray-300 hover:text-white hover:bg-white/5' 
                                  : 'text-slate-400 hover:text-white hover:bg-white/10'
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
          <div className={`p-3 ${
            isAcademyPage ? 'border-t border-gray-800' : 'border-t border-white/10'
          }`}>
            {(isExpanded || isMobile) ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-2 py-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <span className="text-white font-semibold text-xs">{getUserInitials()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Benvenuto,</p>
                    <p className="font-semibold text-sm truncate text-white">{getUserName()}</p>
                  </div>
                </div>
                <Link href="/settings" onClick={() => isMobile && closeMobileMenu()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Impostazioni
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Esci
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <span className="text-white font-semibold text-xs">{getUserInitials()}</span>
                </div>
                <Link href="/settings">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-8 h-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="w-8 h-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
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