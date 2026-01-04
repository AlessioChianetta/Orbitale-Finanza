import {
  Home, Car, ShoppingCart, Coffee, Gamepad2, Heart, Briefcase,
  Shirt, Sparkles, PiggyBank, Settings, DollarSign, TrendingUp,
  MoreHorizontal, Zap, Wifi, Building, Thermometer, Wrench,
  Fuel, Bus, Shield, Receipt, Stethoscope, Pill, Dumbbell,
  Scissors, Phone, Smartphone, Monitor, Eye, Headphones,
  GraduationCap, MapPin, Plane, ShoppingBag, Footprints,
  Users, Calendar, CreditCard, Target, ParkingCircle, AlertTriangle
} from "lucide-react";

// Re-export centralized categorization system
export {
  CATEGORY_NAME_MAPPING,
  REVERSE_CATEGORY_MAPPING,
  CATEGORIZATION_RULES,
  categorizeTransaction,
  getCategoryKey,
  getFullCategoryName,
  isBudgetType,
  isValidCategoryKey,
  type CategorizationRule,
  type CategorizationResult
} from "@shared/categorization";

export interface BudgetSubcategory {
  name: string;
  iconKey: string;
  color: string;
}

export interface BudgetCategory {
  iconKey: string;
  color: string;
  budgetType: 'needs' | 'wants' | 'savings';
  subcategories: BudgetSubcategory[];
  isCustom?: boolean;
  userId?: number;
}

export type BudgetCategoriesType = Record<string, BudgetCategory>;

// Empty object for backward compatibility where DEFAULT_BUDGET_CATEGORIES is still referenced
export const DEFAULT_BUDGET_CATEGORIES: BudgetCategoriesType = {};

// Icone disponibili per le categorie personalizzate
export const AVAILABLE_ICONS = {
  // Casa e Abitazione
  'Home': Home,
  'Building': Building,
  'Zap': Zap,
  'Wifi': Wifi,
  'Thermometer': Thermometer,
  'Wrench': Wrench,

  // Trasporti
  'Car': Car,
  'Fuel': Fuel,
  'Bus': Bus,
  'Plane': Plane,
  'MapPin': MapPin,
  'ParkingCircle': ParkingCircle,

  // Shopping & Food
  'ShoppingCart': ShoppingCart,
  'ShoppingBag': ShoppingBag,
  'Coffee': Coffee,
  'Receipt': Receipt,

  // Salute & Benessere
  'Heart': Heart,
  'Stethoscope': Stethoscope,
  'Pill': Pill,
  'Dumbbell': Dumbbell,
  'Eye': Eye,
  'Shield': Shield,

  // Tech & Communication
  'Phone': Phone,
  'Smartphone': Smartphone,
  'Monitor': Monitor,
  'Headphones': Headphones,
  'Settings': Settings,

  // Entertainment
  'Gamepad2': Gamepad2,
  'Calendar': Calendar,
  'Users': Users,
  'Target': Target,

  // Fashion & Beauty
  'Shirt': Shirt,
  'Sparkles': Sparkles,
  'Scissors': Scissors,
  'Footprints': Footprints,

  // Finance
  'DollarSign': DollarSign,
  'TrendingUp': TrendingUp,
  'PiggyBank': PiggyBank,
  'CreditCard': CreditCard,

  // Work & Education
  'Briefcase': Briefcase,
  'GraduationCap': GraduationCap,

  // Other
  'MoreHorizontal': MoreHorizontal,
  'AlertTriangle': AlertTriangle // Placeholder for AlertTriangle icon
};

// Colori disponibili per le categorie
export const AVAILABLE_COLORS = [
  'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-green-600',
  'text-blue-600', 'text-indigo-600', 'text-purple-600', 'text-pink-600',
  'text-cyan-600', 'text-emerald-600', 'text-gray-600', 'text-slate-600',
  'text-red-700', 'text-orange-700', 'text-yellow-700', 'text-green-700',
  'text-blue-700', 'text-indigo-700', 'text-purple-700', 'text-pink-700'
];

// Mapping per retrocompatibilità con il sistema attuale
export const categoryColors = {
  needs: '#ef4444', // red
  wants: '#f59e0b', // amber
  savings: '#10b981' // emerald
};

// Legacy categoryIcons mapping allineato al modulo Transazioni
export const categoryIcons: Record<string, React.ComponentType<{className?: string}>> = {
  'Alimentari e Spesa': ShoppingCart,
  'Alimentazione': ShoppingCart,
  'Alimentari': ShoppingCart,
  'Casa e Abitazione': Home,
  'Casa': Home,
  'Trasporti': Car,
  'Ristorazione': Coffee,
  'Ristoranti': Coffee,
  'Intrattenimento e Svago': Gamepad2,
  'Intrattenimento': Gamepad2,
  'Salute e Benessere': Heart,
  'Salute': Heart,
  'Lavoro e Formazione': Briefcase,
  'Lavoro': Briefcase,
  'Abbigliamento e Accessori': Shirt,
  'Abbigliamento': Shirt,
  'Cura della Persona': Sparkles,
  'Bellezza': Sparkles,
  'Telefonia e Digitale': Phone,
  'Tecnologia e Comunicazione': Phone,
  'Telefonia': Phone,
  'Famiglia e Figli': Users,
  'Educazione': GraduationCap,
  'Bancario': DollarSign,
  'Risparmi e Investimenti': TrendingUp,
  'Investimenti': TrendingUp,
  'Debiti e Finanziamenti': CreditCard,
  'Debiti': CreditCard,
  'Altro': MoreHorizontal
};

// Templates per categorie personalizzate (usando stringhe per icone)
export const CATEGORY_TEMPLATES = {
  'Personal': [
    { name: 'Hobby Personali', budgetType: 'wants' as const, iconKey: 'Heart', color: 'text-pink-600' },
    { name: 'Regali e Occasioni', budgetType: 'wants' as const, iconKey: 'Heart', color: 'text-red-600' },
    { name: 'Animali Domestici', budgetType: 'needs' as const, iconKey: 'Heart', color: 'text-orange-600' }
  ],
  'Business': [
    { name: 'Spese Professionali', budgetType: 'needs' as const, iconKey: 'Briefcase', color: 'text-blue-600' },
    { name: 'Marketing e Pubblicità', budgetType: 'wants' as const, iconKey: 'TrendingUp', color: 'text-green-600' },
    { name: 'Formazione Professionale', budgetType: 'wants' as const, iconKey: 'GraduationCap', color: 'text-purple-600' }
  ],
  'Family': [
    { name: 'Bambini e Famiglia', budgetType: 'needs' as const, iconKey: 'Users', color: 'text-blue-600' },
    { name: 'Scuola e Educazione', budgetType: 'needs' as const, iconKey: 'GraduationCap', color: 'text-green-600' },
    { name: 'Babysitter e Servizi', budgetType: 'needs' as const, iconKey: 'Heart', color: 'text-pink-600' }
  ],
  'Student': [
    { name: 'Università', budgetType: 'needs' as const, iconKey: 'GraduationCap', color: 'text-blue-600' },
    { name: 'Libri e Materiali', budgetType: 'needs' as const, iconKey: 'GraduationCap', color: 'text-green-600' },
    { name: 'Vita Sociale Universitaria', budgetType: 'wants' as const, iconKey: 'Users', color: 'text-purple-600' }
  ]
} as const;

// Helper function per ottenere componente icona da stringa
export const getIconComponent = (iconKey: string) => {
  return AVAILABLE_ICONS[iconKey as keyof typeof AVAILABLE_ICONS] || MoreHorizontal;
};

// Helper per verificare se una categoria esiste (now always returns false since we use transaction-based categories)
export function validateCategoryName(categoryName: string): boolean {
  return false;
}

// Helper per ottenere il budget type di una categoria (now returns null since we use transaction-based categories)
export function getBudgetTypeForCategory(categoryName: string): 'needs' | 'wants' | 'savings' | null {
  return null;
}

// Helper type-safe per normalizzare le categorie personalizzate
export interface NormalizedCustomCategory extends BudgetCategory {
  name: string;
  isCustom: true;
  userId: number;
}

export function normalizeCustomCategories(customCategories: Record<string, any>): Record<string, NormalizedCustomCategory> {
  const normalized: Record<string, NormalizedCustomCategory> = {};

  for (const [name, category] of Object.entries(customCategories)) {
    if (category && typeof category === 'object') {
      normalized[name] = {
        name,
        iconKey: category.iconKey || 'MoreHorizontal',
        color: category.color || 'text-gray-600',
        budgetType: category.budgetType || 'wants',
        subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
        isCustom: true,
        userId: category.userId || 0
      };
    }
  }

  return normalized;
}