
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "Il nome deve essere di almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve essere di almeno 2 caratteri"),
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(6, "La password deve essere di almeno 6 caratteri"),
  confirmPassword: z.string().min(6, "Conferma la password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  if (user) {
    navigate("/");
    return null;
  }

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto in Percorso Capitale!",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore di accesso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterFormData) => {
      const { confirmPassword, ...userData } = credentials;
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registrazione completata",
        description: "Benvenuto in Percorso Capitale!",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore di registrazione",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-teal-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-20 w-80 h-80 bg-cyan-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Hero Section (Desktop Only) */}
        {!isMobile && (
          <div className="hidden lg:flex lg:flex-1 relative">
            <div className="flex-1 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center p-12 relative overflow-hidden">
              {/* Background patterns */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
              <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-20 right-20 w-40 h-40 bg-emerald-300/20 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-teal-300/15 rounded-full blur-xl"></div>
              
              <div className="relative max-w-lg text-white z-10">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-5xl font-bold mb-4 leading-tight">
                    Benvenuto in
                    <span className="block bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent">
                      Percorso Capitale
                    </span>
                  </h1>
                  <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
                    La piattaforma italiana completa per costruire la tua libertà finanziaria
                  </p>
                </div>
                
                {/* Feature highlights */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transition-all hover:bg-white/15">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Check-up Finanziario</h3>
                      <p className="text-emerald-200 text-sm">Analisi completa in 15 minuti</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transition-all hover:bg-white/15">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Sistema Integrato</h3>
                      <p className="text-emerald-200 text-sm">6 moduli interconnessi</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transition-all hover:bg-white/15">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Crescita Guidata</h3>
                      <p className="text-emerald-200 text-sm">Piano personalizzato step-by-step</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Form Section */}
        <div className={`${
          isMobile 
            ? 'flex-1 min-h-screen' 
            : 'lg:flex-1 min-h-screen'
        } flex items-center justify-center p-6 lg:p-12`}>
          
          {/* Mobile Hero Header */}
          {isMobile && (
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 text-center z-50 shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Percorso Capitale</h1>
                  <p className="text-xs text-emerald-100">La tua libertà finanziaria</p>
                </div>
              </div>
            </div>
          )}

          <div className={`w-full max-w-md ${isMobile ? 'mt-20 mb-8' : ''}`}>
            <Card className="border-0 shadow-2xl shadow-emerald-500/10 bg-white/95 backdrop-blur-lg">
              <CardHeader className="text-center pb-2">
                {!isMobile && (
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                )}
                <CardTitle className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}>
                  {isLogin ? "Bentornato!" : "Inizia Oggi"}
                </CardTitle>
                <p className={`text-slate-600 font-medium ${isMobile ? 'text-sm' : 'text-base'} mt-2`}>
                  {isLogin 
                    ? "Accedi al tuo account per continuare il percorso"
                    : "Crea il tuo account e inizia la trasformazione finanziaria"
                  }
                </p>
              </CardHeader>
              
              <CardContent className="pt-6">
                {isLogin ? (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  type="email"
                                  placeholder="mario.rossi@email.com" 
                                  className={`pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="La tua password" 
                                  className={`pl-12 pr-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-base"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Accesso in corso...
                          </>
                        ) : (
                          <>
                            Accedi al tuo account
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-medium">Nome</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                  <Input 
                                    placeholder="Mario" 
                                    className={`pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 font-medium">Cognome</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                  <Input 
                                    placeholder="Rossi" 
                                    className={`pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  type="email"
                                  placeholder="mario.rossi@email.com" 
                                  className={`pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Crea una password sicura" 
                                  className={`pl-12 pr-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Conferma Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Ripeti la password" 
                                  className={`pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${isMobile ? 'text-base' : ''}`}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-base"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Creazione account...
                          </>
                        ) : (
                          <>
                            Crea il tuo account
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}

                <div className={`${isMobile ? 'mt-6' : 'mt-8'} text-center`}>
                  <p className="text-slate-600 text-sm mb-3">
                    {isLogin ? "Non hai ancora un account?" : "Hai già un account?"}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      loginForm.reset();
                      registerForm.reset();
                    }}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold px-6 py-2 rounded-xl transition-all duration-200"
                  >
                    {isLogin ? "Registrati gratuitamente" : "Accedi al tuo account"}
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className={`${isMobile ? 'mt-6' : 'mt-8'} text-center`}>
                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Sicuro</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
