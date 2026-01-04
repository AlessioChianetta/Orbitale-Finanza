// SISTEMA DI CATEGORIZZAZIONE CENTRALIZZATO
// Shared between client and server for consistency

// Mapping dai nomi brevi usati nell'API ai nomi completi delle categorie
export const CATEGORY_NAME_MAPPING: Record<string, string> = {
  'alimentari': 'Alimentari e Spesa',
  'alimentazione': 'Alimentazione', // Alias per compatibilità
  'casa': 'Casa e Abitazione', 
  'trasporti': 'Trasporti',
  'salute': 'Salute e Benessere',
  'telefonia': 'Telefonia e Digitale',
  'tecnologia': 'Tecnologia e Comunicazione', // Alias per compatibilità
  'ristorazione': 'Ristorazione',
  'ristoranti': 'Ristoranti', // Alias per compatibilità
  'intrattenimento': 'Intrattenimento e Svago',
  'abbigliamento': 'Abbigliamento e Accessori',
  'bellezza': 'Cura della Persona',
  'educazione': 'Educazione',
  'formazione': 'Lavoro e Formazione',
  'lavoro': 'Lavoro',
  'famiglia': 'Famiglia e Figli',
  'bancario': 'Bancario',
  'investimenti': 'Risparmi e Investimenti',
  'debiti': 'Debiti e Finanziamenti',
  'altro': 'Altro' // Categoria fallback
};

// Reverse mapping per ottenere la chiave da nome completo
export const REVERSE_CATEGORY_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_NAME_MAPPING).map(([key, value]) => [value, key])
);

// Interfacce TypeScript per il sistema di categorizzazione
export interface CategorizationRule {
  pattern: RegExp;
  categoryKey: string; // Chiave nel mapping
  budgetType: 'needs' | 'wants' | 'savings';
}

export interface CategorizationResult {
  category: string; // Nome completo della categoria
  budgetCategory: 'needs' | 'wants' | 'savings';
  categoryKey: string; // Chiave breve per il mapping
}

// Sistema di regole di categorizzazione unificato e type-safe
export const CATEGORIZATION_RULES: CategorizationRule[] = [
  // Alimentari e Spesa (Bisogni)
  { 
    pattern: /esselunga|coop|carrefour|lidl|eurospin|iper|supermercato|alimentari|spesa|food|cibo|fresco|verdura|frutta|carne|pesce|pane|latte/i, 
    categoryKey: 'alimentari', 
    budgetType: 'needs' 
  },

  // Casa e Abitazione (Bisogni)
  { 
    pattern: /affitto|mutuo|bolletta|gas|luce|acqua|condominio|tari|imu|assicurazione casa|ikea|leroy merlin|brico|elettrodomestici|casa|immobiliare|manutenzione casa/i, 
    categoryKey: 'casa', 
    budgetType: 'needs' 
  },

  // Trasporti (Bisogni)
  { 
    pattern: /benzina|diesel|carburante|autostrade|telepass|assicurazione auto|bollo|meccanico|uber|taxi|treno|bus|metro|trasporti|atm|trenord|biglietto|abbonamento trasporti/i, 
    categoryKey: 'trasporti', 
    budgetType: 'needs' 
  },

  // Salute e Benessere (Bisogni)
  { 
    pattern: /farmacia|medico|dentista|ospedale|clinica|analisi|fisioterapia|farmaco|medicina|visita|specialista|oculista|ginecologo/i, 
    categoryKey: 'salute', 
    budgetType: 'needs' 
  },

  // Telefonia e Digitale (Bisogni)
  { 
    pattern: /tim|vodafone|wind|tre|iliad|fastweb|telefono|cellulare|internet|fibra|abbonamento telefono|ricarica|smartphone|tablet/i, 
    categoryKey: 'telefonia', 
    budgetType: 'needs' 
  },

  // Ristorazione (Desideri)
  { 
    pattern: /ristorante|pizzeria|bar|mcdonald|burger king|deliveroo|glovo|just eat|uber eats|aperitivo|caffè|coffee|trattoria|osteria|pub/i, 
    categoryKey: 'ristorazione', 
    budgetType: 'wants' 
  },

  // Intrattenimento e Svago (Desideri)
  { 
    pattern: /cinema|netflix|spotify|amazon prime|disney|teatro|concerto|palestra|steam|playstation|xbox|intrattenimento|giochi|hobby|sport|piscina|tennis/i, 
    categoryKey: 'intrattenimento', 
    budgetType: 'wants' 
  },

  // Abbigliamento e Accessori (Desideri)
  { 
    pattern: /zara|h&m|uniqlo|nike|adidas|abbigliamento|vestiti|scarpe|moda|clothing|calzature|borse|accessori/i, 
    categoryKey: 'abbigliamento', 
    budgetType: 'wants' 
  },

  // Cura della Persona (Desideri)
  { 
    pattern: /sephora|douglas|profumeria|parrucchiere|barbiere|bellezza|beauty|cosmetici|profumo|trucco|estetica|spa|benessere/i, 
    categoryKey: 'bellezza', 
    budgetType: 'wants' 
  },

  // Educazione (Desideri)
  { 
    pattern: /università|corso|libro|educazione|formazione|scuola|master|lezioni|studente|libri|materiale scolastico/i, 
    categoryKey: 'educazione', 
    budgetType: 'wants' 
  },

  // Famiglia e Figli (Bisogni/Desideri)
  { 
    pattern: /bambini|figli|famiglia|asilo|scuola elementare|babysitter|pannolini|giocattoli|pediatra|abbigliamento bambini/i, 
    categoryKey: 'famiglia', 
    budgetType: 'needs' 
  },

  // Bancario (Altro)
  { 
    pattern: /commissione|banca|prelievo|bonifico|conto corrente|carta credito|bancomat|interessi|spese bancarie/i, 
    categoryKey: 'bancario', 
    budgetType: 'wants' 
  },

  // Lavoro e Formazione (Bisogni)
  { 
    pattern: /lavoro|ufficio|business|professionale|coworking|materiale ufficio|viaggio lavoro|formazione lavoro|formazione professionale/i, 
    categoryKey: 'formazione', 
    budgetType: 'needs' 
  },

  // Lavoro base (Bisogni)
  { 
    pattern: /stipendio|salario|lavoro dipendente|contratto lavoro/i, 
    categoryKey: 'lavoro', 
    budgetType: 'needs' 
  },

  // Risparmi e Investimenti (Risparmi)
  { 
    pattern: /investimento|etf|azioni|fondo|risparmio|deposito|obiettivo|goal|saving|pensione|previdenza|consulente finanziario/i, 
    categoryKey: 'investimenti', 
    budgetType: 'savings' 
  },

  // Debiti e Finanziamenti (Bisogni)
  { 
    pattern: /debito|prestito|finanziamento|mutuo|rata|carta credito|scoperto|interessi passivi|rimborso|credito al consumo|cessione quinto|leasing|rateizzazione/i, 
    categoryKey: 'debiti', 
    budgetType: 'needs' 
  }
];

// Funzione di categorizzazione unificata e type-safe
export function categorizeTransaction(description: string, merchant?: string): CategorizationResult {
  const text = `${description} ${merchant || ''}`.toLowerCase();

  for (const rule of CATEGORIZATION_RULES) {
    if (rule.pattern.test(text)) {
      const categoryName = CATEGORY_NAME_MAPPING[rule.categoryKey] || rule.categoryKey;
      return { 
        category: categoryName, 
        budgetCategory: rule.budgetType,
        categoryKey: rule.categoryKey
      };
    }
  }

  // Fallback per transazioni non categorizzate
  return { 
    category: CATEGORY_NAME_MAPPING['altro'] || 'Altro', 
    budgetCategory: 'wants',
    categoryKey: 'altro'
  };
}

// Helper per ottenere la chiave breve da un nome completo di categoria
export function getCategoryKey(fullCategoryName: string): string {
  return REVERSE_CATEGORY_MAPPING[fullCategoryName] || 'altro';
}

// Helper per ottenere il nome completo da una chiave breve
export function getFullCategoryName(categoryKey: string): string {
  return CATEGORY_NAME_MAPPING[categoryKey] || categoryKey;
}

// Type guards per verificare i tipi
export function isBudgetType(value: string): value is 'needs' | 'wants' | 'savings' {
  return ['needs', 'wants', 'savings'].includes(value);
}

export function isValidCategoryKey(key: string): boolean {
  return key in CATEGORY_NAME_MAPPING;
}