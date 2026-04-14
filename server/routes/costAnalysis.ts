import { db } from '../db.js';
import {
  fixedCosts,
  variableCosts,
  laborCosts,
  breakEvenAnalysis,
  businessEntities,
  users,
  revenueSettings,
  manualRevenue,
  salesConversionData as salesConversionTable,
  unitVariableCosts as unitVariableCostsTable
} from '@shared/schema';
import { eq, and, gte, lte, sql, sum, avg, count, desc } from 'drizzle-orm';

function safeFloat(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

function toLocalMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Interfacce per i risultati delle analisi
export interface DailyCostBreakdown {
  date: string;
  fixedCosts: number;
  variableCosts: number;
  laborCosts: number;
  totalCosts: number;
  revenue: number;
  profit: number;
  breakEvenRevenue: number;
  marginOfSafety: number;
}

export interface BreakEvenCalculation {
  period: 'daily' | 'monthly' | 'annual';
  totalFixedCosts: number;
  averageVariableCostPercentage: number;
  totalVariableCosts: number;
  breakEvenRevenue: number;
  breakEvenUnits: number;
  actualRevenue?: number;
  profitLoss?: number;
  marginOfSafety?: number;
}

// Calcolo costi fissi per periodo
export async function getFixedCostsForPeriod(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Carica la configurazione salvata dal database
    const monthKey = toLocalMonthKey(startDate); // Format YYYY-MM

    const savedFixedCosts = await db
      .select()
      .from(fixedCosts)
      .where(
        and(
          eq(fixedCosts.userId, userId),
          eq(fixedCosts.isActive, true),
          eq(fixedCosts.monthKey, monthKey)
        )
      );

    // Calcola il totale dei costi fissi mensili dalla configurazione salvata
    let monthlyFixedCosts = 0;
    if (savedFixedCosts.length > 0) {
      monthlyFixedCosts = savedFixedCosts.reduce((total, cost) => {
        const amount = safeFloat(cost.monthlyAmount);
        return total + amount;
      }, 0);
    } else {
      // Nessuna configurazione trovata per questo mese specifico
      return 0; // Restituisce 0 per mesi senza configurazione
    }

    // Calcola proporzione in base al periodo
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();

    if (daysDiff <= 1) {
      return monthlyFixedCosts / daysInMonth;
    } else if (daysDiff >= 28 && daysDiff <= 31) {
      return monthlyFixedCosts;
    } else if (daysDiff < 28) {
      return monthlyFixedCosts * (daysDiff / daysInMonth);
    } else {
      return monthlyFixedCosts;
    }
  } catch (error) {
    console.error('Errore calcolo costi fissi:', error);
    return 1500; // Fallback sicuro
  }
}

// Calcolo costi del lavoro per periodo
export async function getLaborCostsForPeriod(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await db
    .select({
      totalLaborCosts: sum(laborCosts.totalCost)
    })
    .from(laborCosts)
    .where(
      and(
        eq(laborCosts.userId, userId),
        gte(laborCosts.date, startDate),
        lte(laborCosts.date, endDate)
      )
    );

  return Number(result[0]?.totalLaborCosts || 0);
}

// Calcolo costi variabili fissi mensili
export async function getVariableCostsForOrders(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Carica la configurazione salvata dal database
    const monthKey = toLocalMonthKey(startDate); // Format YYYY-MM

    const savedVariableCosts = await db
      .select()
      .from(variableCosts)
      .where(
        and(
          eq(variableCosts.userId, userId),
          eq(variableCosts.isActive, true),
          eq(variableCosts.monthKey, monthKey)
        )
      );

    // Calcola totale costi variabili fissi dalla configurazione
    let totalVariableCosts = 0;

    if (savedVariableCosts.length > 0) {
      // Lista dei parametri che NON sono costi effettivi ma parametri di configurazione
      const nonCostParameters = [
        'averageCustomerValue',
        'customerRetentionRate',
        'targetProfitMargin',
        'peakHoursMultiplier',
        'foodCostPercentage',
        'beverageCostPercentage'
      ];

      // Somma solo i costi variabili effettivi in euro
      totalVariableCosts = savedVariableCosts.reduce((total, cost) => {
        // Esclude parametri che non sono costi reali
        if (nonCostParameters.includes(cost.name)) {
          return total;
        }

        const amount = safeFloat(cost.unitCost);
        return total + amount;
      }, 0);
    } else {
      // Nessuna configurazione trovata per questo mese specifico
      return 0; // Restituisce 0 per mesi senza configurazione
    }

    // Calcola proporzione in base al periodo
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();

    if (daysDiff <= 1) {
      return totalVariableCosts / daysInMonth;
    } else if (daysDiff >= 28 && daysDiff <= 31) {
      return totalVariableCosts;
    } else if (daysDiff < 28) {
      return totalVariableCosts * (daysDiff / daysInMonth);
    } else {
      return totalVariableCosts;
    }
  } catch (error) {
    console.error('Errore calcolo costi variabili:', error);
    return 500; // Fallback sicuro
  }
}

// Funzione helper per recuperare fatturato manuale per un periodo
export async function getManualRevenueForPeriod(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const monthKey = toLocalMonthKey(startDate); // Format YYYY-MM

    // Verifica se è configurato fatturato manuale per questo mese
    const revenueConfigData = await db
      .select()
      .from(revenueSettings)
      .where(
        and(
          eq(revenueSettings.userId, userId),
          eq(revenueSettings.monthKey, monthKey)
        )
      );

    const isManualMode = revenueConfigData[0]?.isManualMode || false;

    if (!isManualMode) {
      return 0;
    }

    // Se è in modalità manuale, prendi il fatturato dal database
    const manualRevenueData = await db
      .select()
      .from(manualRevenue)
      .where(
        and(
          eq(manualRevenue.userId, userId),
          eq(manualRevenue.monthKey, monthKey)
        )
      );

    if (manualRevenueData.length === 0) {
      return 0;
    }

    // Calcola il totale dal fatturato manuale
    const total = manualRevenueData.reduce((sum, record) => {
      const monthlyRev = record.monthlyRevenue ? safeFloat(record.monthlyRevenue) : 0;
      const dailyRev = record.dailyRevenue ? safeFloat(record.dailyRevenue) : 0;
      const recordTotal = monthlyRev || dailyRev;
      return sum + recordTotal;
    }, 0);

    return total;
  } catch (error) {
    console.error('❌ [Manual Revenue] Errore recupero fatturato manuale:', error);
    return 0;
  }
}

// Calcolo Break-Even Point
export async function calculateBreakEven(
  userId: number,
  period: 'daily' | 'monthly' | 'annual',
  specificDate?: Date
): Promise<BreakEvenCalculation> {
  const now = specificDate || new Date();
  let startDate: Date, endDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'annual':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 0); // Fine anno completo
      break;
  }

  // Calcola costi fissi per il periodo
  let totalFixedCosts: number;

  if (period === 'annual') {
    // Per l'analisi annuale, somma i costi di tutti i mesi
    totalFixedCosts = 0;
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1);
      const monthEnd = new Date(now.getFullYear(), month + 1, 0);
      try {
        const monthlyFixedCosts = await getFixedCostsForPeriod(userId, monthStart, monthEnd);
        // Se il mese non ha dati configurati, getFixedCostsForPeriod restituisce 0
        totalFixedCosts += monthlyFixedCosts || 0;
        console.log(`Mese ${month + 1}: costi fissi = €${monthlyFixedCosts || 0}`);
      } catch (error) {
        console.log(`Mese ${month + 1}: errore nel calcolo, sommo 0`);
        // In caso di errore, somma 0 per questo mese
        totalFixedCosts += 0;
      }
    }
    console.log(`Totale costi fissi annuali: €${totalFixedCosts}`);
  } else {
    totalFixedCosts = await getFixedCostsForPeriod(userId, startDate, endDate);
  }

  // Calcola ricavi del periodo - usa solo fatturato manuale
  let actualRevenue: number;

  if (period === 'annual') {
    // Per l'analisi annuale, somma i ricavi di tutti i mesi
    let totalActualRevenue = 0;

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1);
      const monthEnd = new Date(now.getFullYear(), month + 1, 0);

      try {
        // Fatturato manuale per questo mese
        const monthlyManualRevenue = await getManualRevenueForPeriod(userId, monthStart, monthEnd);

        totalActualRevenue += monthlyManualRevenue || 0;

        console.log(`Mese ${month + 1}: ricavi = €${monthlyManualRevenue || 0}`);
      } catch (error) {
        console.log(`Mese ${month + 1}: errore nel calcolo ricavi, sommo 0`);
      }
    }

    actualRevenue = isNaN(totalActualRevenue) ? 0 : totalActualRevenue;
    console.log(`Totale ricavi annuali: €${actualRevenue}`);
  } else {
    // Per analisi giornaliera e mensile
    const manualRevenueTotal = await getManualRevenueForPeriod(userId, startDate, endDate);
    actualRevenue = manualRevenueTotal || 0;
  }



  // Calcola costi variabili totali
  let totalVariableCosts: number;
  let totalLaborCosts: number;

  if (period === 'annual') {
    // Per l'analisi annuale, somma i costi variabili di tutti i mesi
    totalVariableCosts = 0;
    totalLaborCosts = 0;

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1);
      const monthEnd = new Date(now.getFullYear(), month + 1, 0);

      try {
        const monthlyVariableCosts = await getVariableCostsForOrders(userId, monthStart, monthEnd);
        const monthlyLaborCosts = await getLaborCostsForPeriod(userId, monthStart, monthEnd);

        // Se il mese non ha dati configurati, le funzioni restituiscono 0
        totalVariableCosts += monthlyVariableCosts || 0;
        totalLaborCosts += monthlyLaborCosts || 0;

        console.log(`Mese ${month + 1}: costi variabili = €${monthlyVariableCosts || 0}, costi lavoro = €${monthlyLaborCosts || 0}`);
      } catch (error) {
        console.log(`Mese ${month + 1}: errore nel calcolo costi variabili/lavoro, sommo 0`);
        // In caso di errore, somma 0 per questo mese
        totalVariableCosts += 0;
        totalLaborCosts += 0;
      }
    }
    console.log(`Totale costi variabili annuali: €${totalVariableCosts}`);
    console.log(`Totale costi lavoro annuali: €${totalLaborCosts}`);
  } else {
    totalVariableCosts = await getVariableCostsForOrders(userId, startDate, endDate);
    totalLaborCosts = await getLaborCostsForPeriod(userId, startDate, endDate);
  }

  // Calcola costi totali fissi (fissi + variabili + lavoro)
  const totalCostsFixed = totalFixedCosts + totalVariableCosts + totalLaborCosts;

  // Mantieni i costi variabili come valore assoluto invece di percentuale
  const totalVariableCostsAbsolute = totalVariableCosts + totalLaborCosts;

  // Formula Break-Even semplificata: Costi Totali = Break-Even (assumendo margine di contribuzione pari ai costi)
  // Per un ristorante, il break-even è quando i ricavi coprono tutti i costi
  const breakEvenRevenue = totalCostsFixed;

  // Break-even in unità (stima generica basata su fatturato medio)
  const avgTransactionValue = actualRevenue > 0 ? actualRevenue / 30 : 100; // Stima: fatturato medio giornaliero o €100 default
  const breakEvenUnits = avgTransactionValue > 0 ? Math.ceil(breakEvenRevenue / avgTransactionValue) : 0;

  // Calcola profitto/perdita
  const totalCosts = totalFixedCosts + totalVariableCosts + totalLaborCosts;
  const profitLoss = actualRevenue - totalCosts;

  // Margine di sicurezza
  const marginOfSafety = breakEvenRevenue > 0 && actualRevenue > 0 ?
    Math.max(-100, Math.min(100, ((actualRevenue - breakEvenRevenue) / actualRevenue) * 100)) : 0;

  return {
    period,
    totalFixedCosts: Number(Math.max(0, totalFixedCosts).toFixed(2)),
    averageVariableCostPercentage: Number((0).toFixed(1)), // Mostra 0.0% dato che usiamo costi fissi
    totalVariableCosts: Number(Math.max(0, totalVariableCostsAbsolute).toFixed(2)),
    breakEvenRevenue: Number(Math.max(0, Math.min(999999999, breakEvenRevenue)).toFixed(2)),
    breakEvenUnits: Math.max(0, Math.min(999999, breakEvenUnits)),
    actualRevenue: Number(Math.max(0, actualRevenue).toFixed(2)),
    profitLoss: Number(Math.max(-999999999, Math.min(999999999, profitLoss)).toFixed(2)),
    marginOfSafety: Number(Math.max(-100, Math.min(100, marginOfSafety)).toFixed(2))
  };
}


// Funzione helper per validare valori numerici e prevenire overflow
function sanitizeNumericValue(value: number): string {
  if (!isFinite(value) || isNaN(value)) {
    return "0";
  }
  // Limita i valori molto grandi per evitare overflow nel database
  const maxValue = 999999999.99;
  const minValue = -999999999.99;

  if (value > maxValue) return maxValue.toString();
  if (value < minValue) return minValue.toString();

  return value.toString();
}

// Salva analisi break-even nel database
export async function saveBreakEvenAnalysis(
  userId: number,
  analysis: BreakEvenCalculation
): Promise<void> {
  await db.insert(breakEvenAnalysis).values({
    userId,
    analysisDate: new Date(),
    period: analysis.period,
    totalFixedCosts: sanitizeNumericValue(analysis.totalFixedCosts),
    averageVariableCostPercentage: sanitizeNumericValue(analysis.averageVariableCostPercentage),
    breakEvenRevenue: sanitizeNumericValue(analysis.breakEvenRevenue),
    breakEvenUnits: Math.max(0, Math.min(999999, analysis.breakEvenUnits || 0)),
    actualRevenue: analysis.actualRevenue ? sanitizeNumericValue(analysis.actualRevenue) : "0",
    profitLoss: analysis.profitLoss ? sanitizeNumericValue(analysis.profitLoss) : "0",
    marginOfSafety: analysis.marginOfSafety ? sanitizeNumericValue(analysis.marginOfSafety) : "0"
  });
}

// Rimuovi le seguenti importazioni che non sono più necessarie:
// businessEntities, users, desc
// E anche le importazioni da drizzle-orm: avg, count, desc

// Endpoint API per la gestione dell'analisi dei costi
import express from 'express';
const router = express.Router();

import { isAuthenticated as requireAuth } from '../auth.js';

// POST /api/cost-analysis/save-configuration - Salva configurazione completa (con supporto per mese)
router.post('/save-configuration', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { fixedCosts: fixedCostsData, laborSettings, advancedCosts, debts, salesConversionData, unitVariableCosts, month } = req.body;
    const monthKey = month || 'default'; // Usa il mese dal body o default

    console.log('💾 [BACKEND SAVE] === INIZIO SALVATAGGIO ===');
    console.log('💾 [BACKEND SAVE] Owner ID:', userId);
    console.log('💾 [BACKEND SAVE] Month Key:', monthKey);
    console.log('💾 [BACKEND SAVE] Fixed Costs ricevuti:', JSON.stringify(fixedCostsData, null, 2));
    console.log('💾 [BACKEND SAVE] Labor Settings ricevuti:', JSON.stringify(laborSettings, null, 2));
    console.log('💾 [BACKEND SAVE] Advanced Costs ricevuti:', JSON.stringify(advancedCosts, null, 2));
    console.log('💾 [BACKEND SAVE] Debts ricevuti:', JSON.stringify(debts, null, 2));
    console.log('💾 [BACKEND SAVE] Sales Conversion Data ricevuti:', JSON.stringify(salesConversionData, null, 2));
    console.log('💾 [BACKEND SAVE] Unit Variable Costs ricevuti:', JSON.stringify(unitVariableCosts, null, 2));

    // Salva Costi Fissi
    if (fixedCostsData && fixedCostsData.length > 0) {
      await db.transaction(async (tx) => {
        // Disattiva i costi fissi esistenti per questo mese/utente prima di inserirne di nuovi
        console.log('💾 [DB WRITE] 🔄 Disattivazione costi fissi esistenti per userId:', userId, 'monthKey:', monthKey);
        const updateResult = await tx.update(fixedCosts)
          .set({ isActive: false })
          .where(and(eq(fixedCosts.userId, userId), eq(fixedCosts.monthKey, monthKey)));
        console.log('💾 [DB WRITE] ✅ Costi fissi disattivati:', updateResult);

        for (const cost of fixedCostsData) {
          console.log('💾 [DB WRITE] 📝 Inserimento costo fisso:', { userId, monthKey, name: cost.name, monthlyAmount: cost.monthlyAmount });
          const insertResult = await tx.insert(fixedCosts).values({
            userId,
            monthKey,
            name: cost.name,
            monthlyAmount: cost.monthlyAmount.toString(),
            isActive: true,
          });
          console.log('💾 [DB WRITE] ✅ Costo fisso inserito nel DB:', insertResult);
        }
      });
      console.log('💾 [BACKEND SAVE] Costi fissi salvati con successo.');
    }

    // Salva Costi Variabili (Parametri)
    if (advancedCosts && advancedCosts.variable.length > 0) {
      await db.transaction(async (tx) => {
        // Disattiva i costi variabili esistenti
        console.log('💾 [DB WRITE] 🔄 Disattivazione costi variabili esistenti per userId:', userId, 'monthKey:', monthKey);
        const updateResult = await tx.update(variableCosts)
          .set({ isActive: false })
          .where(and(eq(variableCosts.userId, userId), eq(variableCosts.monthKey, monthKey)));
        console.log('💾 [DB WRITE] ✅ Costi variabili disattivati:', updateResult);

        for (const cost of advancedCosts.variable) {
          console.log('💾 [DB WRITE] 📝 Inserimento costo variabile:', { userId, monthKey, name: cost.name, unitCost: cost.unitCost });
          const insertResult = await tx.insert(variableCosts).values({
            userId,
            monthKey,
            name: cost.name,
            unitCost: cost.unitCost.toString(),
            isActive: true,
          });
          console.log('💾 [DB WRITE] ✅ Costo variabile inserito nel DB:', insertResult);
        }
      });
      console.log('💾 [BACKEND SAVE] Costi variabili (parametri) salvati con successo.');
    }

    // Salva Debiti (Costi Fissi)
    if (debts && debts.length > 0) {
      await db.transaction(async (tx) => {
        // Disattiva i debiti esistenti
        console.log('💾 [DB WRITE] 🔄 Disattivazione debiti esistenti per userId:', userId, 'monthKey:', monthKey);
        const updateResult = await tx.update(fixedCosts)
          .set({ isActive: false })
          .where(and(eq(fixedCosts.userId, userId), eq(fixedCosts.monthKey, monthKey), eq(fixedCosts.category, 'debt')));
        console.log('💾 [DB WRITE] ✅ Debiti disattivati:', updateResult);

        for (const debt of debts) {
          console.log('💾 [DB WRITE] 📝 Inserimento debito:', { userId, monthKey, name: debt.name, amount: debt.amount });
          const insertResult = await tx.insert(fixedCosts).values({
            userId,
            monthKey,
            name: debt.name,
            description: 'Debito',
            category: 'debt',
            monthlyAmount: debt.amount.toString(),
            startDate: new Date(),
            isActive: true,
          });
          console.log('💾 [DB WRITE] ✅ Debito inserito nel DB:', insertResult);
        }
      });
      console.log('💾 [BACKEND SAVE] Debiti salvati con successo.');
    }

    // Salva Impostazioni Lavoro (Costi Variabili)
    if (laborSettings) {
      await db.transaction(async (tx) => {
        // Disattiva le impostazioni lavoro esistenti
        console.log('💾 [DB WRITE] 🔄 Disattivazione labor settings esistenti per userId:', userId, 'monthKey:', monthKey);
        const updateResult = await tx.update(variableCosts)
          .set({ isActive: false })
          .where(and(eq(variableCosts.userId, userId), eq(variableCosts.monthKey, monthKey), eq(variableCosts.category, 'labor')));
        console.log('💾 [DB WRITE] ✅ Labor settings disattivati:', updateResult);

        // Salva le nuove impostazioni lavoro
        console.log('💾 [DB WRITE] 📝 Inserimento hourlyWage:', laborSettings.hourlyWage);
        const insert1 = await tx.insert(variableCosts).values({
          userId,
          monthKey,
          name: 'hourlyWage',
          description: 'Salario orario',
          category: 'labor',
          unitType: 'hourly',
          unitCost: laborSettings.hourlyWage.toString(),
          isActive: true,
        });
        console.log('💾 [DB WRITE] ✅ hourlyWage inserito nel DB:', insert1);

        console.log('💾 [DB WRITE] 📝 Inserimento hoursPerWeek:', laborSettings.hoursPerWeek);
        const insert2 = await tx.insert(variableCosts).values({
          userId,
          monthKey,
          name: 'hoursPerWeek',
          description: 'Ore settimanali',
          category: 'labor',
          unitType: 'hours',
          unitCost: laborSettings.hoursPerWeek.toString(),
          isActive: true,
        });
        console.log('💾 [DB WRITE] ✅ hoursPerWeek inserito nel DB:', insert2);

        console.log('💾 [DB WRITE] 📝 Inserimento weeksPerMonth:', laborSettings.weeksPerMonth);
        const insert3 = await tx.insert(variableCosts).values({
          userId,
          monthKey,
          name: 'weeksPerMonth',
          description: 'Settimane per mese',
          category: 'labor',
          unitType: 'weeks',
          unitCost: laborSettings.weeksPerMonth.toString(),
          isActive: true,
        });
        console.log('💾 [DB WRITE] ✅ weeksPerMonth inserito nel DB:', insert3);
      });
      console.log('💾 [BACKEND SAVE] Impostazioni lavoro salvate con successo.');
    }

    console.log('💾 [STEP 1 - BACKEND] === SALVATAGGIO SALES CONVERSION DATA ===');
    // Salva salesConversionData nella tabella dedicata
    if (salesConversionData && typeof salesConversionData === 'object') {
      try {
        const existingSalesData = await db
          .select()
          .from(salesConversionTable)
          .where(and(
            eq(salesConversionTable.userId, userId),
            eq(salesConversionTable.monthKey, monthKey)
          ))
          .limit(1);

        const salesDataToSave = {
          contattiTotali: salesConversionData.contattiTotali || 0,
          nuoviClienti: salesConversionData.nuoviClienti || 0,
          clientiDaProve: salesConversionData.clientiDaProve || 0,
          costoProveGratuite: (salesConversionData.costoProveGratuite || 0).toString(),
          spesaMarketing: (salesConversionData.spesaMarketing || 0).toString(),
          numeroTransazioni: salesConversionData.numeroTransazioni || 0,
          valoreMedioTransazione: (salesConversionData.valoreMedioTransazione || 0).toString(),
          updatedAt: new Date()
        };

        if (existingSalesData.length > 0) {
          console.log(`💾 [DB WRITE] 🔄 Aggiornamento sales conversion data per userId: ${userId}, monthKey: ${monthKey}`);
          await db
            .update(salesConversionTable)
            .set(salesDataToSave)
            .where(and(
              eq(salesConversionTable.userId, userId),
              eq(salesConversionTable.monthKey, monthKey)
            ));
          console.log(`💾 [DB WRITE] ✅ Sales conversion data aggiornato per mese ${monthKey}`);
        } else {
          console.log(`💾 [DB WRITE] 📝 Inserimento sales conversion data per userId: ${userId}, monthKey: ${monthKey}`);
          await db
            .insert(salesConversionTable)
            .values({
              userId,
              monthKey,
              ...salesDataToSave
            });
          console.log(`💾 [DB WRITE] ✅ Sales conversion data creato per ${monthKey}`);
        }
      } catch (error: any) {
        console.error(`❌ ERRORE salvando sales conversion data:`, error);
      }
    }
    console.log('💾 [STEP 2 - BACKEND] === FINE SALVATAGGIO SALES CONVERSION DATA ===');

    console.log('💾 [STEP 3 - BACKEND] === SALVATAGGIO UNIT VARIABLE COSTS ===');
    // Salva unitVariableCosts nella tabella dedicata
    if (unitVariableCosts && typeof unitVariableCosts === 'object') {
      try {
        const existingUnitCosts = await db
          .select()
          .from(unitVariableCostsTable)
          .where(and(
            eq(unitVariableCostsTable.userId, userId),
            eq(unitVariableCostsTable.monthKey, monthKey)
          ))
          .limit(1);

        const unitCostsToSave = {
          costoMaterialeCliente: (unitVariableCosts.costoMaterialeCliente || 0).toString(),
          oreLavoroCliente: (unitVariableCosts.oreLavoroCliente || 0).toString(),
          costoOrarioLavoro: (unitVariableCosts.costoOrarioLavoro || 0).toString(),
          commissioniTransazione: (unitVariableCosts.commissioniTransazione || 0).toString(),
          altriCostiVariabiliUnitari: (unitVariableCosts.altriCostiVariabiliUnitari || 0).toString(),
          updatedAt: new Date()
        };

        if (existingUnitCosts.length > 0) {
          console.log(`💾 [DB WRITE] 🔄 Aggiornamento unit variable costs per userId: ${userId}, monthKey: ${monthKey}`);
          await db
            .update(unitVariableCostsTable)
            .set(unitCostsToSave)
            .where(and(
              eq(unitVariableCostsTable.userId, userId),
              eq(unitVariableCostsTable.monthKey, monthKey)
            ));
          console.log(`💾 [DB WRITE] ✅ Unit variable costs aggiornato per mese ${monthKey}`);
        } else {
          console.log(`💾 [DB WRITE] 📝 Inserimento unit variable costs per userId: ${userId}, monthKey: ${monthKey}`);
          await db
            .insert(unitVariableCostsTable)
            .values({
              userId,
              monthKey,
              ...unitCostsToSave
            });
          console.log(`💾 [DB WRITE] ✅ Unit variable costs creato per ${monthKey}`);
        }
      } catch (error: any) {
        console.error(`❌ ERRORE salvando unit variable costs:`, error);
      }
    }
    console.log('💾 [STEP 4 - BACKEND] === FINE SALVATAGGIO UNIT VARIABLE COSTS ===');

    console.log('📥 [STEP 5 - BACKEND] === PREPARAZIONE RISPOSTA ===');
    const responseData = {
      success: true,
      message: 'Configurazione salvata con successo',
      timestamp: new Date().toISOString(),
      saved: {
        fixedCosts: Object.keys(fixedCostsData || {}).length,
        laborSettings: 1, // Assumendo che laborSettings sia sempre presente se non nullo
        advancedCosts: Object.keys(advancedCosts?.variable || {}).length, // Controlla specificamente la variabile
        debts: debts ? Object.keys(debts).length : 0,
        salesConversionData: salesConversionData ? 'SAVED' : 'NOT_PROVIDED',
        unitVariableCosts: unitVariableCosts ? 'SAVED' : 'NOT_PROVIDED'
      }
    };
    console.log('📥 [STEP 6 - BACKEND] Risposta da inviare:', JSON.stringify(responseData, null, 2));
    console.log('📥 [STEP 7 - BACKEND] === SALVATAGGIO COMPLETATO - INVIO RISPOSTA ===');

    res.json(responseData);
  } catch (error) {
    console.error('❌ [BACKEND SAVE] ERRORE nel salvataggio configurazione:', error);
    console.error('❌ [BACKEND SAVE] Stack trace:', error.stack);
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// GET /api/cost-analysis/dashboard - Dashboard principale
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query;

    console.log('📊 [BACKEND DASHBOARD] === INIZIO ELABORAZIONE DASHBOARD ===');
    console.log('📊 [BACKEND DASHBOARD] userId:', userId);
    console.log('📊 [BACKEND DASHBOARD] year param:', year);
    console.log('📊 [BACKEND DASHBOARD] month param:', month);

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    console.log('📊 [BACKEND DASHBOARD] currentYear:', currentYear);
    console.log('📊 [BACKEND DASHBOARD] currentMonth:', currentMonth);

    // Calcola date per il mese corrente
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    console.log('📊 [BACKEND DASHBOARD] monthStart:', monthStart);
    console.log('📊 [BACKEND DASHBOARD] monthEnd:', monthEnd);

    // Calcola date per oggi
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    console.log('📊 [BACKEND DASHBOARD] Calling calculateBreakEven per analisi mensile...');
    // Analisi mensile
    const monthlyAnalysis = await calculateBreakEven(userId, 'monthly', monthStart);
    console.log('📊 [BACKEND DASHBOARD] monthlyAnalysis:', JSON.stringify(monthlyAnalysis, null, 2));

    console.log('📊 [BACKEND DASHBOARD] Calling calculateBreakEven per analisi giornaliera...');
    // Analisi giornaliera
    const dailyAnalysis = await calculateBreakEven(userId, 'daily', todayStart);
    console.log('📊 [BACKEND DASHBOARD] dailyAnalysis:', JSON.stringify(dailyAnalysis, null, 2));

    // Calcola efficienza lavoro media del mese
    console.log('📊 [BACKEND DASHBOARD] Recupero dati costi lavoro...');
    const laborCostsData = await db
      .select({
        totalHours: sum(laborCosts.hoursWorked),
        totalCost: sum(laborCosts.totalCost)
      })
      .from(laborCosts)
      .where(
        and(
          eq(laborCosts.userId, userId),
          gte(laborCosts.date, monthStart),
          lte(laborCosts.date, monthEnd)
        )
      );

    console.log('📊 [BACKEND DASHBOARD] laborCostsData:', laborCostsData);

    const avgLaborCostPercentage = monthlyAnalysis.actualRevenue > 0
      ? (safeFloat(laborCostsData[0]?.totalCost?.toString()) / monthlyAnalysis.actualRevenue) * 100
      : 0;

    const avgRevenuePerLaborHour = safeFloat(laborCostsData[0]?.totalHours?.toString()) > 0
      ? monthlyAnalysis.actualRevenue / safeFloat(laborCostsData[0]?.totalHours?.toString())
      : 0;

    const responseData = {
      monthlyAnalysis,
      dailyAnalysis,
      averageLaborEfficiency: {
        avgLaborCostPercentage,
        avgRevenuePerLaborHour
      }
    };

    console.log('📊 [BACKEND DASHBOARD] Response finale:', JSON.stringify(responseData, null, 2));
    console.log('📊 [BACKEND DASHBOARD] === FINE ELABORAZIONE DASHBOARD ===');

    res.json(responseData);
  } catch (error) {
    console.error('❌ [BACKEND DASHBOARD] ERRORE nel recupero dashboard:', error);
    console.error('❌ [BACKEND DASHBOARD] Stack trace:', error.stack);
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// GET /api/cost-analysis/load-configuration - Carica configurazione salvata per un mese
router.get('/load-configuration', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { month } = req.query;
    const monthKey = month || 'default';

    console.log('📥 [BACKEND LOAD] === INIZIO CARICAMENTO CONFIGURAZIONE ===');
    console.log('📥 [BACKEND LOAD] userId:', userId);
    console.log('📥 [BACKEND LOAD] monthKey:', monthKey);

    // Carica Costi Fissi (inclusi debiti salvati come type='debt')
    const loadedFixedCosts = await db
      .select()
      .from(fixedCosts)
      .where(
        and(
          eq(fixedCosts.userId, userId),
          eq(fixedCosts.monthKey, monthKey),
          eq(fixedCosts.isActive, true)
        )
      );

    console.log('📥 [BACKEND LOAD] Costi fissi trovati:', loadedFixedCosts.length);

    // Carica Costi Variabili
    const loadedVariableCosts = await db
      .select()
      .from(variableCosts)
      .where(
        and(
          eq(variableCosts.userId, userId),
          eq(variableCosts.monthKey, monthKey),
          eq(variableCosts.isActive, true)
        )
      );

    console.log('📥 [BACKEND LOAD] Costi variabili trovati:', loadedVariableCosts.length);

    // Converti array in oggetti per il frontend
    const fixedCostsObj: any = {};
    loadedFixedCosts.forEach(cost => {
      // Tutti i fixedCosts vengono caricati (debiti inclusi nella categoria)
      if (!cost.name.includes('debt_') && cost.category !== 'debt') {
        fixedCostsObj[cost.name] = safeFloat(cost.monthlyAmount);
      }
    });

    const advancedCostsObj: any = {};
    const laborSettingsObj: any = {};
    loadedVariableCosts.forEach(cost => {
      // Separa labor settings (hourlywage, hoursperweek, weekspermonth) dagli altri costi variabili
      if (['hourlyWage', 'hoursPerWeek', 'weeksPerMonth'].includes(cost.name)) {
        laborSettingsObj[cost.name] = safeFloat(cost.unitCost);
      } else {
        advancedCostsObj[cost.name] = safeFloat(cost.unitCost);
      }
    });

    const debtsObj: any = {};
    loadedFixedCosts.forEach(cost => {
      // I debiti sono identificati dalla categoria o dal prefisso nel nome
      if (cost.name.includes('debt_') || cost.category === 'debt') {
        debtsObj[cost.name] = safeFloat(cost.monthlyAmount);
      }
    });

    // Carica Dati Vendita e Conversione dalle tabelle dedicate
    const salesData = await db
      .select()
      .from(salesConversionTable)
      .where(
        and(
          eq(salesConversionTable.userId, userId),
          eq(salesConversionTable.monthKey, monthKey)
        )
      )
      .limit(1);

    console.log('📥 [LOAD CONFIG] Sales data query result:', salesData);

    const salesConversionObj: any = salesData.length > 0 ? {
      contattiTotali: salesData[0].contattiTotali || 0,
      nuoviClienti: salesData[0].nuoviClienti || 0,
      clientiDaProve: salesData[0].clientiDaProve || 0,
      costoProveGratuite: safeFloat(salesData[0].costoProveGratuite?.toString()),
      spesaMarketing: safeFloat(salesData[0].spesaMarketing?.toString()),
      numeroTransazioni: salesData[0].numeroTransazioni || 0,
      valoreMedioTransazione: safeFloat(salesData[0].valoreMedioTransazione?.toString())
    } : {
      contattiTotali: 0,
      nuoviClienti: 0,
      clientiDaProve: 0,
      costoProveGratuite: 0,
      spesaMarketing: 0,
      numeroTransazioni: 0,
      valoreMedioTransazione: 0
    };

    console.log('📥 [LOAD CONFIG] Sales conversion object created:', salesConversionObj);

    // Carica Costi Variabili Unitari dalle tabelle dedicate
    const unitCosts = await db
      .select()
      .from(unitVariableCostsTable)
      .where(
        and(
          eq(unitVariableCostsTable.userId, userId),
          eq(unitVariableCostsTable.monthKey, monthKey)
        )
      )
      .limit(1);

    console.log('📥 [LOAD CONFIG] Unit costs query result:', unitCosts);

    const unitVariableCostsObj: any = unitCosts.length > 0 ? {
      costoMaterialeCliente: safeFloat(unitCosts[0].costoMaterialeCliente?.toString()),
      oreLavoroCliente: safeFloat(unitCosts[0].oreLavoroCliente?.toString()),
      costoOrarioLavoro: safeFloat(unitCosts[0].costoOrarioLavoro?.toString()),
      commissioniTransazione: safeFloat(unitCosts[0].commissioniTransazione?.toString()),
      altriCostiVariabiliUnitari: safeFloat(unitCosts[0].altriCostiVariabiliUnitari?.toString())
    } : {
      costoMaterialeCliente: 0,
      oreLavoroCliente: 0,
      costoOrarioLavoro: 0,
      commissioniTransazione: 0,
      altriCostiVariabiliUnitari: 0
    };

    console.log('📥 [LOAD CONFIG] Unit variable costs object created:', unitVariableCostsObj);

    const response = {
      fixedCosts: fixedCostsObj,
      advancedCosts: advancedCostsObj,
      debts: debtsObj,
      laborSettings: laborSettingsObj,
      salesConversionData: salesConversionObj,
      unitVariableCosts: unitVariableCostsObj
    };

    console.log('📥 [BACKEND LOAD] Response:', JSON.stringify(response, null, 2));
    console.log('📥 [BACKEND LOAD] salesConversionData in response:', response.salesConversionData);
    console.log('📥 [BACKEND LOAD] unitVariableCosts in response:', response.unitVariableCosts);
    console.log('📥 [BACKEND LOAD] === FINE CARICAMENTO CONFIGURAZIONE ===');

    res.json(response);
  } catch (error) {
    console.error('❌ [BACKEND LOAD] Errore caricamento configurazione:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Esporta il router per essere utilizzato nell'applicazione principale
export default router;