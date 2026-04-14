import express from 'express';
import { isAuthenticated as requireAuth } from './auth.js';
import { db } from './db.js';
import { 
  fixedCosts, 
  variableCosts, 
  laborCosts,
  businessEntities,
  users,
  revenueSettings,
  manualRevenue,
  costNotes
} from '../shared/schema.js';
import { eq, and, desc, gte, lte, sum } from 'drizzle-orm';

function safeFloat(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}
import {
  calculateBreakEven,
  saveBreakEvenAnalysis
} from './routes/costAnalysis.js';
import {sql} from 'drizzle-orm';

const router = express.Router();

// GET /api/cost-analysis/dashboard - Dashboard principale
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query;

    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    // Calcola date per il mese corrente
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    // Calcola date per oggi
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Analisi mensile
    const monthlyAnalysis = await calculateBreakEven(userId, 'monthly', monthStart);

    // Analisi giornaliera
    const dailyAnalysis = await calculateBreakEven(userId, 'daily', todayStart);

    // Calcola efficienza lavoro media del mese
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

    const avgLaborCostPercentage = monthlyAnalysis.actualRevenue > 0 
      ? (safeFloat(laborCostsData[0]?.totalCost?.toString()) / monthlyAnalysis.actualRevenue) * 100 
      : 0;

    const avgRevenuePerLaborHour = safeFloat(laborCostsData[0]?.totalHours?.toString()) > 0
      ? monthlyAnalysis.actualRevenue / safeFloat(laborCostsData[0]?.totalHours?.toString())
      : 0;

    res.json({
      monthlyAnalysis,
      dailyAnalysis,
      averageLaborEfficiency: {
        avgLaborCostPercentage,
        avgRevenuePerLaborHour
      }
    });
  } catch (error) {
    console.error('Errore nel recupero dashboard:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/cost-analysis/fixed-costs - Ottieni costi fissi
router.get('/fixed-costs', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const costs = await db
      .select()
      .from(fixedCosts)
      .where(eq(fixedCosts.userId, userId))
      .orderBy(desc(fixedCosts.createdAt));

    res.json(costs);
  } catch (error) {
    console.error('Errore nel recupero costi fissi:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/cost-analysis/fixed-costs - Crea costo fisso
router.post('/fixed-costs', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, category, monthlyAmount, startDate, endDate } = req.body;

    const [newCost] = await db
      .insert(fixedCosts)
      .values({
        userId,
        name,
        description,
        category,
        monthlyAmount: monthlyAmount.toString(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      })
      .returning();

    res.json(newCost);
  } catch (error) {
    console.error('Errore nella creazione costo fisso:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/cost-analysis/fixed-costs/:id - Aggiorna costo fisso
router.put('/fixed-costs/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const costId = parseInt(req.params.id);
    const { name, description, category, monthlyAmount, startDate, endDate, isActive } = req.body;

    const [updatedCost] = await db
      .update(fixedCosts)
      .set({
        name,
        description,
        category,
        monthlyAmount: monthlyAmount.toString(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive,
        updatedAt: new Date()
      })
      .where(and(eq(fixedCosts.id, costId), eq(fixedCosts.userId, userId)))
      .returning();

    if (!updatedCost) {
      return res.status(404).json({ error: 'Costo fisso non trovato' });
    }

    res.json(updatedCost);
  } catch (error) {
    console.error('Errore nell\'aggiornamento costo fisso:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/cost-analysis/variable-costs - Ottieni costi variabili
router.get('/variable-costs', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const costs = await db
      .select({
        id: variableCosts.id,
        name: variableCosts.name,
        description: variableCosts.description,
        category: variableCosts.category,
        unitType: variableCosts.unitType,
        unitCost: variableCosts.unitCost,
        businessEntityId: variableCosts.businessEntityId,
        businessEntityName: businessEntities.name,
        isActive: variableCosts.isActive,
        createdAt: variableCosts.createdAt
      })
      .from(variableCosts)
      .leftJoin(businessEntities, eq(variableCosts.businessEntityId, businessEntities.id))
      .where(eq(variableCosts.userId, userId))
      .orderBy(desc(variableCosts.createdAt));

    res.json(costs);
  } catch (error) {
    console.error('Errore nel recupero costi variabili:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/cost-analysis/variable-costs - Crea costo variabile
router.post('/variable-costs', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, category, unitType, unitCost, businessEntityId } = req.body;

    const [newCost] = await db
      .insert(variableCosts)
      .values({
        userId,
        name,
        description,
        category,
        unitType,
        unitCost: unitCost.toString(),
        businessEntityId: businessEntityId || null
      })
      .returning();

    res.json(newCost);
  } catch (error) {
    console.error('Errore nella creazione costo variabile:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/cost-analysis/labor-costs - Ottieni costi del lavoro
router.get('/labor-costs', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    let query = db
      .select()
      .from(laborCosts)
      .where(eq(laborCosts.userId, userId));

    if (startDate && endDate) {
      query = db
        .select()
        .from(laborCosts)
        .where(
          and(
            eq(laborCosts.userId, userId),
            gte(laborCosts.date, new Date(startDate as string)),
            lte(laborCosts.date, new Date(endDate as string))
          )
        );
    }

    const costs = await query.orderBy(desc(laborCosts.date));

    res.json(costs);
  } catch (error) {
    console.error('Errore nel recupero costi del lavoro:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/cost-analysis/labor-costs - Crea costo del lavoro
router.post('/labor-costs', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { date, employeeName, role, hoursWorked, hourlyRate, shift, notes } = req.body;

    const totalCost = safeFloat(hoursWorked) * safeFloat(hourlyRate);

    const [newCost] = await db
      .insert(laborCosts)
      .values({
        userId,
        date: new Date(date),
        employeeName,
        role,
        hoursWorked: hoursWorked.toString(),
        hourlyRate: hourlyRate.toString(),
        totalCost: totalCost.toString(),
        shift,
        notes
      })
      .returning();

    res.json(newCost);
  } catch (error) {
    console.error('Errore nella creazione costo del lavoro:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/cost-analysis/break-even - Calcola break-even
router.get('/break-even', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { year, month, day, type = 'daily' } = req.query;

    console.log('Break-even richiesto per:', { userId, year, month, day, type });

    // Costruisce la data dalla selezione dell'utente
    const analysisDate = new Date(
      parseInt(year as string) || new Date().getFullYear(),
      (parseInt(month as string) - 1) || new Date().getMonth(),
      parseInt(day as string) || new Date().getDate()
    );

    console.log('Data analisi costruita:', analysisDate);

    // Usa la funzione calculateBreakEven che ora legge la configurazione salvata
    const analysis = await calculateBreakEven(
      userId,
      type as 'daily' | 'monthly' | 'annual',
      analysisDate
    );

    console.log('Analisi break-even completata:', analysis);

    res.json(analysis);
  } catch (error) {
    console.error('Errore nel calcolo break-even:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


// POST /api/cost-analysis/save-configuration - Salva configurazione completa (con supporto per mese)
router.post('/save-configuration', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { fixedCosts: fixedCostsData, laborSettings, advancedCosts, debts, salesConversionData, unitVariableCosts, month } = req.body;
    const monthKey = month || 'default';

    const fixedCostMapping: Record<string, string> = {
      rent: 'rent',
      utilities: 'utilities', 
      insurance: 'insurance',
      staffSalaries: 'staff_salaries',
      equipment: 'equipment',
      other: 'other'
    };

    const { salesConversionData: salesConversionTable, unitVariableCosts: unitVariableCostsTable } = await import('../shared/schema.js');

    await db.transaction(async (tx) => {
      // === FIXED COSTS ===
      const costsToSave = Array.isArray(fixedCostsData) ? fixedCostsData : 
                          fixedCostsData ? Object.entries(fixedCostsData).map(([name, monthlyAmount]) => ({ name, monthlyAmount })) : [];
      
      for (const cost of costsToSave) {
        const category = fixedCostMapping[cost.name] || 'other';
        const existingRecord = await tx
          .select({ id: fixedCosts.id })
          .from(fixedCosts)
          .where(and(eq(fixedCosts.userId, userId), eq(fixedCosts.name, cost.name), eq(fixedCosts.monthKey, monthKey)))
          .limit(1);

        if (existingRecord.length > 0) {
          await tx.update(fixedCosts).set({ monthlyAmount: String(cost.monthlyAmount), updatedAt: new Date(), isActive: true }).where(eq(fixedCosts.id, existingRecord[0].id));
        } else {
          await tx.insert(fixedCosts).values({ userId, name: cost.name, description: `Costo fisso: ${cost.name}`, category, monthlyAmount: String(cost.monthlyAmount), monthKey, startDate: new Date(), isActive: true });
        }
      }

      // === LABOR COSTS ===
      const today = new Date();
      const monthlyLaborCost = laborSettings.averageHourlyWage * laborSettings.hoursPerDay * laborSettings.daysPerMonth;
      const existingLaborConfig = await tx
        .select({ id: laborCosts.id })
        .from(laborCosts)
        .where(and(eq(laborCosts.userId, userId), eq(laborCosts.role, 'configurazione'), eq(laborCosts.monthKey, monthKey)))
        .limit(1);

      if (existingLaborConfig.length > 0) {
        await tx.update(laborCosts).set({
          hoursWorked: (laborSettings.hoursPerDay * laborSettings.daysPerMonth).toString(),
          hourlyRate: laborSettings.averageHourlyWage.toString(),
          totalCost: monthlyLaborCost.toString(),
          notes: `Configurazione: ${laborSettings.hoursPerDay}h/giorno x ${laborSettings.daysPerMonth} giorni`,
          monthKey, date: today
        }).where(eq(laborCosts.id, existingLaborConfig[0].id));
      } else {
        await tx.insert(laborCosts).values({
          userId, date: today, employeeName: 'Sistema Automatico', role: 'configurazione',
          hoursWorked: (laborSettings.hoursPerDay * laborSettings.daysPerMonth).toString(),
          hourlyRate: laborSettings.averageHourlyWage.toString(),
          totalCost: monthlyLaborCost.toString(),
          shift: 'mensile',
          notes: `Configurazione: ${laborSettings.hoursPerDay}h/giorno x ${laborSettings.daysPerMonth} giorni`,
          monthKey
        });
      }

      // === ADVANCED COSTS (variable costs) ===
      for (const [key, value] of Object.entries(advancedCosts)) {
        let category = 'other';
        let unitType = 'fixed';
        if (key.includes('foodCostMonthly') || key.includes('beverageCostMonthly') || key.includes('packagingCosts') || key.includes('deliveryCommissions')) { category = 'variable'; }
        else if (key.includes('Percentage') || key.includes('percentage')) { unitType = 'percentage'; category = 'variable'; }
        else if (key.includes('Cost') || key.includes('Budget') || key.includes('marketing') || key.includes('Marketing')) { category = 'operational'; }
        else if (key.includes('Equipment') || key.includes('Furniture') || key.includes('Software') || key.includes('kitchen') || key.includes('furniture') || key.includes('pos')) { category = 'depreciation'; }
        else if (key.includes('training') || key.includes('social') || key.includes('overtime') || key.includes('seasonal')) { category = 'labor'; }

        const existingRecord = await tx
          .select({ id: variableCosts.id })
          .from(variableCosts)
          .where(and(eq(variableCosts.userId, userId), eq(variableCosts.name, key), eq(variableCosts.monthKey, monthKey)))
          .limit(1);

        if (existingRecord.length > 0) {
          await tx.update(variableCosts).set({ unitCost: String(value), updatedAt: new Date(), isActive: true }).where(eq(variableCosts.id, existingRecord[0].id));
        } else {
          await tx.insert(variableCosts).values({ userId, name: key, description: `Costo avanzato: ${key}`, category, unitType, unitCost: String(value), monthKey, isActive: true });
        }
      }

      // === DEBTS ===
      if (debts && typeof debts === 'object') {
        for (const [key, value] of Object.entries(debts)) {
          const debtAmount = Number(value) || 0;
          const existingRecord = await tx
            .select({ id: variableCosts.id })
            .from(variableCosts)
            .where(and(eq(variableCosts.userId, userId), eq(variableCosts.name, key), eq(variableCosts.monthKey, monthKey), eq(variableCosts.category, 'debt')))
            .limit(1);

          if (existingRecord.length > 0) {
            await tx.update(variableCosts).set({ unitCost: debtAmount.toString(), updatedAt: new Date(), isActive: true }).where(eq(variableCosts.id, existingRecord[0].id));
          } else {
            await tx.insert(variableCosts).values({ userId, name: key, description: `Debito: ${key}`, category: 'debt', unitType: 'fixed', unitCost: debtAmount.toString(), monthKey, isActive: true });
          }
        }
      }

      // === SALES CONVERSION DATA (variable costs mirror) ===
      if (salesConversionData && typeof salesConversionData === 'object') {
        const deprecatedEnglishFields = ['totalLeads', 'newCustomersAcquired', 'customersFromFreeTrial', 'freeTrialCost', 'totalTransactions', 'averageTransactionValue'];
        for (const [key, value] of Object.entries(salesConversionData)) {
          if (deprecatedEnglishFields.includes(key)) continue;
          const salesValue = Number(value) || 0;
          const existingRecord = await tx
            .select({ id: variableCosts.id })
            .from(variableCosts)
            .where(and(eq(variableCosts.userId, userId), eq(variableCosts.name, key), eq(variableCosts.monthKey, monthKey), eq(variableCosts.category, 'sales_conversion')))
            .limit(1);

          if (existingRecord.length > 0) {
            await tx.update(variableCosts).set({ unitCost: salesValue.toString(), updatedAt: new Date(), isActive: true }).where(eq(variableCosts.id, existingRecord[0].id));
          } else {
            await tx.insert(variableCosts).values({ userId, name: key, description: `Sales conversion: ${key}`, category: 'sales_conversion', unitType: 'fixed', unitCost: salesValue.toString(), monthKey, isActive: true });
          }
        }
      }

      // === UNIT VARIABLE COSTS (variable costs mirror) ===
      if (unitVariableCosts && typeof unitVariableCosts === 'object') {
        const deprecatedEnglishFields = ['materialCostPerCustomer', 'laborHoursPerCustomer', 'hourlyLaborCost', 'commissionPerTransaction', 'otherVariableCosts'];
        for (const [key, value] of Object.entries(unitVariableCosts)) {
          if (deprecatedEnglishFields.includes(key)) continue;
          const unitValue = Number(value) || 0;
          const existingRecord = await tx
            .select({ id: variableCosts.id })
            .from(variableCosts)
            .where(and(eq(variableCosts.userId, userId), eq(variableCosts.name, key), eq(variableCosts.monthKey, monthKey), eq(variableCosts.category, 'unit_variable')))
            .limit(1);

          if (existingRecord.length > 0) {
            await tx.update(variableCosts).set({ unitCost: unitValue.toString(), updatedAt: new Date(), isActive: true }).where(eq(variableCosts.id, existingRecord[0].id));
          } else {
            await tx.insert(variableCosts).values({ userId, name: key, description: `Unit variable cost: ${key}`, category: 'unit_variable', unitType: 'fixed', unitCost: unitValue.toString(), monthKey, isActive: true });
          }
        }
      }

      // === DEDICATED TABLES (salesConversionData) ===
      if (salesConversionData && typeof salesConversionData === 'object') {
        const existingSalesData = await tx.select().from(salesConversionTable).where(and(eq(salesConversionTable.userId, userId), eq(salesConversionTable.monthKey, monthKey))).limit(1);
        if (existingSalesData.length > 0) {
          await tx.update(salesConversionTable).set({
            contattiTotali: salesConversionData.contattiTotali || 0, nuoviClienti: salesConversionData.nuoviClienti || 0,
            clientiDaProve: salesConversionData.clientiDaProve || 0, costoProveGratuite: salesConversionData.costoProveGratuite?.toString() || '0',
            spesaMarketing: salesConversionData.spesaMarketing?.toString() || '0', numeroTransazioni: salesConversionData.numeroTransazioni || 0,
            valoreMedioTransazione: salesConversionData.valoreMedioTransazione?.toString() || '0', updatedAt: new Date()
          }).where(eq(salesConversionTable.id, existingSalesData[0].id));
        } else {
          await tx.insert(salesConversionTable).values({
            userId, monthKey, contattiTotali: salesConversionData.contattiTotali || 0, nuoviClienti: salesConversionData.nuoviClienti || 0,
            clientiDaProve: salesConversionData.clientiDaProve || 0, costoProveGratuite: salesConversionData.costoProveGratuite?.toString() || '0',
            spesaMarketing: salesConversionData.spesaMarketing?.toString() || '0', numeroTransazioni: salesConversionData.numeroTransazioni || 0,
            valoreMedioTransazione: salesConversionData.valoreMedioTransazione?.toString() || '0'
          });
        }
      }

      // === DEDICATED TABLES (unitVariableCosts) ===
      if (unitVariableCosts && typeof unitVariableCosts === 'object') {
        const existingUnitCosts = await tx.select().from(unitVariableCostsTable).where(and(eq(unitVariableCostsTable.userId, userId), eq(unitVariableCostsTable.monthKey, monthKey))).limit(1);
        if (existingUnitCosts.length > 0) {
          await tx.update(unitVariableCostsTable).set({
            costoMaterialeCliente: unitVariableCosts.costoMaterialeCliente?.toString() || '0', oreLavoroCliente: unitVariableCosts.oreLavoroCliente?.toString() || '0',
            costoOrarioLavoro: unitVariableCosts.costoOrarioLavoro?.toString() || '0', commissioniTransazione: unitVariableCosts.commissioniTransazione?.toString() || '0',
            altriCostiVariabiliUnitari: unitVariableCosts.altriCostiVariabiliUnitari?.toString() || '0', updatedAt: new Date()
          }).where(eq(unitVariableCostsTable.id, existingUnitCosts[0].id));
        } else {
          await tx.insert(unitVariableCostsTable).values({
            userId, monthKey, costoMaterialeCliente: unitVariableCosts.costoMaterialeCliente?.toString() || '0',
            oreLavoroCliente: unitVariableCosts.oreLavoroCliente?.toString() || '0', costoOrarioLavoro: unitVariableCosts.costoOrarioLavoro?.toString() || '0',
            commissioniTransazione: unitVariableCosts.commissioniTransazione?.toString() || '0', altriCostiVariabiliUnitari: unitVariableCosts.altriCostiVariabiliUnitari?.toString() || '0'
          });
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Configurazione salvata con successo',
      timestamp: new Date().toISOString(),
      saved: {
        fixedCosts: fixedCostsData ? (Array.isArray(fixedCostsData) ? fixedCostsData.length : Object.keys(fixedCostsData).length) : 0,
        laborSettings: 1,
        advancedCosts: advancedCosts ? Object.keys(advancedCosts).length : 0,
        debts: debts ? Object.keys(debts).length : 0
      }
    });
  } catch (error: any) {
    console.error('Errore nel salvataggio configurazione:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/cost-analysis/load-configuration - Carica configurazione salvata
router.get('/load-configuration', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const month = req.query.month as string || 'default';
    const monthKey = month === 'default' ? 'default' : month; // Formato YYYY-MM

    console.log('Caricamento configurazione per owner:', userId, 'monthKey:', monthKey);

    // Carica costi fissi - dato il vincolo unicità, carichiamo tutti i record per questo owner
    // e filtriamo solo quelli che hanno il monthKey richiesto
    const fixedCostsData = await db
      .select()
      .from(fixedCosts)
      .where(and(
        eq(fixedCosts.userId, userId),
        eq(fixedCosts.isActive, true)
      ));

    // Filtra per monthKey richiesto
    const fixedCostsForMonth = fixedCostsData.filter((cost: any) => cost.monthKey === monthKey);
    console.log(`Costi fissi trovati: ${fixedCostsForMonth.length} per mese ${monthKey} (totali: ${fixedCostsData.length})`);

    // Carica costi variabili con la stessa logica
    const variableCostsData = await db
      .select()
      .from(variableCosts)
      .where(and(
        eq(variableCosts.userId, userId),
        eq(variableCosts.isActive, true)
      ));

    const variableCostsForMonth = variableCostsData.filter((cost: any) => cost.monthKey === monthKey);

    console.log(`Costi variabili trovati: ${variableCostsForMonth.length} per mese ${monthKey} (totali: ${variableCostsData.length})`);

    // Carica costi del lavoro per il mese specifico
    const laborCostsData = await db
      .select()
      .from(laborCosts)
      .where(and(
        eq(laborCosts.userId, userId),
        eq(laborCosts.role, 'configurazione'),
        eq(laborCosts.monthKey, monthKey)
      ))
      .orderBy(desc(laborCosts.date))
      .limit(1);

    // Carica i dati dalle tabelle dedicate invece di variable_costs
    const { salesConversionData: salesConversionTable, unitVariableCosts: unitVariableCostsTable } = await import('../shared/schema.js');

    const salesConversionDataFromDb = await db
      .select()
      .from(salesConversionTable)
      .where(and(
        eq(salesConversionTable.userId, userId),
        eq(salesConversionTable.monthKey, monthKey)
      ))
      .limit(1);

    const unitVariableCostsFromDb = await db
      .select()
      .from(unitVariableCostsTable)
      .where(and(
        eq(unitVariableCostsTable.userId, userId),
        eq(unitVariableCostsTable.monthKey, monthKey)
      ))
      .limit(1);

    // Inizializza la configurazione vuota
    const configuration = {
      fixedCosts: {
        rent: 0,
        utilities: 0,
        insurance: 0,
        staffSalaries: 0,
        equipment: 0,
        other: 0
      },
      laborSettings: {
        averageHourlyWage: 0,
        hoursPerDay: 0,
        daysPerMonth: 0
      },
      advancedCosts: {
        foodCostMonthly: 0,
        beverageCostMonthly: 0,
        packagingCosts: 0,
        deliveryCommissions: 0,
        marketingBudget: 0,
        socialMediaAds: 0,
        loyaltyProgramCosts: 0,
        maintenanceEquipment: 0,
        cleaningSupplies: 0,
        uniformsAndLaundry: 0,
        phoneTelecomm: 0,
        kitchenEquipment: 0,
        furnitureFixtures: 0,
        posSystemSoftware: 0,
        socialContributions: 0,
        training: 0,
        overtimePremium: 0,
        seasonalStaffing: 0,
        energyCostIncrease: 0,
        wasteDisposal: 0,
        targetProfitMargin: 0,
        averageCustomerValue: 0,
        customerRetentionRate: 0,
        peakHoursMultiplier: 0
      },
      debts: {
        bankLoan: 0,
        equipmentFinancing: 0,
        supplierCredit: 0,
        leasing: 0,
        otherDebts: 0
      },
      salesConversionData: salesConversionDataFromDb.length > 0 ? {
        contattiTotali: salesConversionDataFromDb[0].contattiTotali || 0,
        nuoviClienti: salesConversionDataFromDb[0].nuoviClienti || 0,
        clientiDaProve: salesConversionDataFromDb[0].clientiDaProve || 0,
        costoProveGratuite: safeFloat(salesConversionDataFromDb[0].costoProveGratuite?.toString()),
        spesaMarketing: safeFloat(salesConversionDataFromDb[0].spesaMarketing?.toString()),
        numeroTransazioni: salesConversionDataFromDb[0].numeroTransazioni || 0,
        valoreMedioTransazione: safeFloat(salesConversionDataFromDb[0].valoreMedioTransazione?.toString())
      } : {
        contattiTotali: 0,
        nuoviClienti: 0,
        clientiDaProve: 0,
        costoProveGratuite: 0,
        spesaMarketing: 0,
        numeroTransazioni: 0,
        valoreMedioTransazione: 0
      },
      unitVariableCosts: unitVariableCostsFromDb.length > 0 ? {
        costoMaterialeCliente: safeFloat(unitVariableCostsFromDb[0].costoMaterialeCliente?.toString()),
        oreLavoroCliente: safeFloat(unitVariableCostsFromDb[0].oreLavoroCliente?.toString()),
        costoOrarioLavoro: safeFloat(unitVariableCostsFromDb[0].costoOrarioLavoro?.toString()),
        commissioniTransazione: safeFloat(unitVariableCostsFromDb[0].commissioniTransazione?.toString()),
        altriCostiVariabiliUnitari: safeFloat(unitVariableCostsFromDb[0].altriCostiVariabiliUnitari?.toString())
      } : {
        costoMaterialeCliente: 0,
        oreLavoroCliente: 0,
        costoOrarioLavoro: 0,
        commissioniTransazione: 0,
        altriCostiVariabiliUnitari: 0
      }
    };

    // Mappa i costi fissi dal database (solo quelli per il mese richiesto)
    fixedCostsForMonth.forEach((cost: any) => {
      const amount = safeFloat(cost.monthlyAmount);
      if (configuration.fixedCosts.hasOwnProperty(cost.name)) {
        (configuration.fixedCosts as any)[cost.name] = amount;
        console.log(`Costo fisso caricato per ${monthKey}: ${cost.name} = ${amount}`);
      } else {
        console.warn(`⚠️ Costo fisso non riconosciuto: ${cost.name} = ${amount}`);
      }
    });
    
    console.log(`✅ Costi fissi caricati per ${monthKey}:`, configuration.fixedCosts);

    // Mappa i costi variabili dal database (solo quelli per il mese richiesto)
    variableCostsForMonth.forEach((cost: any) => {
      const amount = safeFloat(cost.unitCost);

      // Se è un debito (categoria 'debt'), mappalo nella sezione debts
      if (cost.category === 'debt' && configuration.debts.hasOwnProperty(cost.name)) {
        (configuration.debts as any)[cost.name] = amount;
        console.log(`Debito caricato per ${monthKey}: ${cost.name} = ${amount}`);
      }
      // Altrimenti mappalo nei costi avanzati (sales_conversion e unit_variable sono già caricati dalle tabelle dedicate)
      else if (configuration.advancedCosts.hasOwnProperty(cost.name)) {
        (configuration.advancedCosts as any)[cost.name] = amount;
        console.log(`Costo avanzato caricato per ${monthKey}: ${cost.name} = ${amount}`);
      }
    });

    console.log('✅ Sales Conversion Data caricato dalle tabelle dedicate:', configuration.salesConversionData);
    console.log('✅ Unit Variable Costs caricato dalle tabelle dedicate:', configuration.unitVariableCosts);

    // Carica le impostazioni lavoro dal database
    if (laborCostsData.length > 0) {
      const latestLabor = laborCostsData[0];
      const totalHours = safeFloat(latestLabor.hoursWorked);
      const hourlyRate = safeFloat(latestLabor.hourlyRate);

      configuration.laborSettings.averageHourlyWage = hourlyRate;
      // Stima giorni e ore basata sui dati salvati
      if (totalHours > 0) {
        configuration.laborSettings.hoursPerDay = Math.round(totalHours / 26); // Stima 26 giorni lavorativi
        configuration.laborSettings.daysPerMonth = 26;
      }
      console.log('Costi lavoro caricati dalla configurazione salvata');
    }

    console.log('Configurazione finale inviata al frontend:', configuration);
    res.json(configuration);
  } catch (error: any) {
    console.error('Errore nel caricamento della configurazione:', error);
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// === ROUTES PER GESTIONE FATTURATO MANUALE ===

// GET /api/cost-analysis/revenue-settings - Ottieni impostazioni fatturato per un mese
router.get('/revenue-settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const monthKey = req.query.monthKey as string || 'default';

    const settings = await db
      .select()
      .from(revenueSettings)
      .where(and(
        eq(revenueSettings.userId, userId),
        eq(revenueSettings.monthKey, monthKey)
      ))
      .limit(1);

    const result = settings.length > 0 ? settings[0] : {
      isManualMode: false,
      settings: {}
    };

    res.json(result);
  } catch (error) {
    console.error('Errore nel recupero impostazioni fatturato:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/cost-analysis/revenue-settings - Salva impostazioni fatturato
router.post('/revenue-settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { monthKey, isManualMode, settings } = req.body;

    console.log('Salvando impostazioni fatturato:', { userId, monthKey, isManualMode });

    // Cerca record esistente
    const existingSettings = await db
      .select()
      .from(revenueSettings)
      .where(and(
        eq(revenueSettings.userId, userId),
        eq(revenueSettings.monthKey, monthKey)
      ))
      .limit(1);

    let result;
    if (existingSettings.length > 0) {
      // Aggiorna esistente
      [result] = await db
        .update(revenueSettings)
        .set({
          isManualMode,
          settings,
          updatedAt: new Date()
        })
        .where(eq(revenueSettings.id, existingSettings[0].id))
        .returning();
    } else {
      // Crea nuovo
      [result] = await db
        .insert(revenueSettings)
        .values({
          userId,
          monthKey,
          isManualMode,
          settings
        })
        .returning();
    }

    res.json(result);
  } catch (error) {
    console.error('Errore nel salvataggio impostazioni fatturato:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/cost-analysis/manual-revenue - Ottieni dati fatturato manuale per un mese
router.get('/manual-revenue', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const monthKey = req.query.monthKey as string;

    if (!monthKey) {
      return res.status(400).json({ error: 'monthKey richiesto' });
    }

    const revenueData = await db
      .select()
      .from(manualRevenue)
      .where(and(
        eq(manualRevenue.userId, userId),
        eq(manualRevenue.monthKey, monthKey)
      ))
      .orderBy(manualRevenue.date);

    res.json(revenueData);
  } catch (error) {
    console.error('Errore nel recupero fatturato manuale:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/cost-analysis/manual-revenue - Salva fatturato manuale
router.post('/manual-revenue', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { monthKey, date, dailyRevenue, monthlyRevenue, notes } = req.body;

    console.log('💰 [Save Manual Revenue] === INIZIO SALVATAGGIO ===');
    console.log('💰 [Save Manual Revenue] Request body completo:', req.body);
    console.log('💰 [Save Manual Revenue] userId:', userId);
    console.log('💰 [Save Manual Revenue] monthKey:', monthKey);
    console.log('💰 [Save Manual Revenue] date:', date);
    console.log('💰 [Save Manual Revenue] monthlyRevenue:', monthlyRevenue);
    console.log('💰 [Save Manual Revenue] notes:', notes);

    // Prima controlliamo se esistono già record per questo owner
    const allRecordsForOwner = await db
      .select()
      .from(manualRevenue)
      .where(eq(manualRevenue.userId, userId));

    console.log('💰 [Save Manual Revenue] Tutti i record esistenti per owner', userId, ':', allRecordsForOwner.map((r: any) => ({ id: r.id, monthKey: r.monthKey, date: r.date })));

    // IMPORTANTE: Cerchiamo SOLO per userId e monthKey specifico
    const existingRecord = await db
      .select()
      .from(manualRevenue)
      .where(and(
        eq(manualRevenue.userId, userId),
        eq(manualRevenue.monthKey, monthKey)  // Questo deve corrispondere esattamente
      ))
      .limit(1);

    console.log('💰 [Save Manual Revenue] Record esistenti per monthKey', monthKey, ':', existingRecord.length);
    if (existingRecord.length > 0) {
      console.log('💰 [Save Manual Revenue] Record esistente trovato:', existingRecord[0]);
    }

    let result;
    if (existingRecord.length > 0) {
      // Aggiorna esistente per questo mese specifico
      console.log('💰 [Save Manual Revenue] AGGIORNAMENTO - Record esistente ID:', existingRecord[0].id);
      [result] = await db
        .update(manualRevenue)
        .set({
          date: date,
          dailyRevenue: dailyRevenue?.toString(),
          monthlyRevenue: monthlyRevenue?.toString(),
          notes: notes || `Fatturato aggiornato per ${monthKey}`,
          updatedAt: new Date()
        })
        .where(and(
          eq(manualRevenue.id, existingRecord[0].id),
          eq(manualRevenue.userId, userId),  // Sicurezza extra
          eq(manualRevenue.monthKey, monthKey)  // Sicurezza extra per il mese
        ))
        .returning();

      console.log('💰 [Save Manual Revenue] ✅ AGGIORNAMENTO completato, result:', result);
    } else {
      // Crea SEMPRE nuovo record per questo mese specifico
      console.log('💰 [Save Manual Revenue] CREAZIONE - Nuovo record per mese:', monthKey);

      const insertData = {
        userId,
        monthKey,  // CRITICO: Usa esattamente il monthKey passato dal frontend
        date: date,
        dailyRevenue: dailyRevenue?.toString(),
        monthlyRevenue: monthlyRevenue?.toString(),
        notes: notes || `Fatturato inserito per ${monthKey}`
      };

      console.log('💰 [Save Manual Revenue] Dati per INSERT:', insertData);

      [result] = await db
        .insert(manualRevenue)
        .values(insertData)
        .returning();

      console.log('💰 [Save Manual Revenue] ✅ CREAZIONE completata, result:', result);
    }

    // Verifica finale
    const verification = await db
      .select()
      .from(manualRevenue)
      .where(and(
        eq(manualRevenue.userId, userId),
        eq(manualRevenue.monthKey, monthKey)
      ));

    console.log('💰 [Save Manual Revenue] Verifica finale - Record trovati per', monthKey, ':', verification.length);
    console.log('💰 [Save Manual Revenue] === FINE SALVATAGGIO ===');

    res.json(result);
  } catch (error: any) {
    console.error('❌ [Save Manual Revenue] ERRORE COMPLETO:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    console.error('❌ [Save Manual Revenue] Stack trace:', error.stack);

    // Gestione specifica per errore di duplicato
    if (error.code === '23505') {
      console.error('❌ [Save Manual Revenue] ERRORE VINCOLO UNICITÀ - Dettagli:', error.detail);
      return res.status(400).json({ 
        error: 'Errore di duplicato: ' + error.detail,
        suggestion: 'Prova a cambiare la data o controlla se esiste già un record per questo periodo'
      });
    }

    res.status(500).json({ error: 'Errore interno del server: ' + error.message });
  }
});

// DELETE /api/cost-analysis/manual-revenue/:id - Elimina record fatturato manuale
router.delete('/manual-revenue/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const recordId = parseInt(req.params.id);

    await db
      .delete(manualRevenue)
      .where(and(
        eq(manualRevenue.id, recordId),
        eq(manualRevenue.userId, userId)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione fatturato manuale:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// === ROUTES PER GESTIONE APPUNTI COSTI ===

// GET /api/cost-analysis/cost-notes - Ottieni appunti per una sezione specifica
router.get('/cost-notes', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { sectionType, monthKey } = req.query;

    if (!sectionType || !monthKey) {
      return res.status(400).json({ error: 'sectionType e monthKey sono richiesti' });
    }

    const notes = await db
      .select()
      .from(costNotes)
      .where(
        and(
          eq(costNotes.userId, userId),
          eq(costNotes.sectionType, sectionType as string),
          eq(costNotes.monthKey, monthKey as string)
        )
      )
      .orderBy(costNotes.sectionKey);

    // Trasforma in oggetto per facilità d'uso
    const notesMap: { [key: string]: string } = {};
    notes.forEach((note: any) => {
      notesMap[note.sectionKey] = note.notes || '';
    });

    res.json(notesMap);
  } catch (error) {
    console.error('Errore nel recupero appunti costi:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/cost-analysis/cost-notes - Salva o aggiorna appunti
router.post('/cost-notes', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { sectionType, sectionKey, monthKey, notes } = req.body;

    if (!sectionType || !sectionKey || !monthKey) {
      return res.status(400).json({ error: 'sectionType, sectionKey e monthKey sono richiesti' });
    }

    console.log('💾 [Cost Notes] Salvando appunto:', { userId, sectionType, sectionKey, monthKey, notes: notes?.substring(0, 50) + '...' });

    // Cerca record esistente
    const existingNote = await db
      .select()
      .from(costNotes)
      .where(
        and(
          eq(costNotes.userId, userId),
          eq(costNotes.sectionType, sectionType),
          eq(costNotes.sectionKey, sectionKey),
          eq(costNotes.monthKey, monthKey)
        )
      )
      .limit(1);

    let result;
    if (existingNote.length > 0) {
      // Aggiorna esistente
      [result] = await db
        .update(costNotes)
        .set({
          notes: notes || '',
          updatedAt: new Date()
        })
        .where(eq(costNotes.id, existingNote[0].id))
        .returning();

      console.log('✅ [Cost Notes] Appunto aggiornato per', sectionKey);
    } else {
      // Crea nuovo
      [result] = await db
        .insert(costNotes)
        .values({
          userId,
          sectionType,
          sectionKey,
          monthKey,
          notes: notes || ''
        })
        .returning();

      console.log('✅ [Cost Notes] Nuovo appunto creato per', sectionKey);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ [Cost Notes] Errore nel salvataggio appunti:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/cost-analysis/cost-notes - Elimina appunto specifico
router.delete('/cost-notes', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { sectionType, sectionKey, monthKey } = req.query;

    if (!sectionType || !sectionKey || !monthKey) {
      return res.status(400).json({ error: 'sectionType, sectionKey e monthKey sono richiesti' });
    }

    await db
      .delete(costNotes)
      .where(
        and(
          eq(costNotes.userId, userId),
          eq(costNotes.sectionType, sectionType as string),
          eq(costNotes.sectionKey, sectionKey as string),
          eq(costNotes.monthKey, monthKey as string)
        )
      );

    console.log('🗑️ [Cost Notes] Appunto eliminato per', sectionKey);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [Cost Notes] Errore nell\'eliminazione appunto:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;