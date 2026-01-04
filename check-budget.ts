
import { db } from './server/db';
import { budgetSettings, categoryBudgets, transactions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function checkBudgetData() {
  const userId = 16; // ID dell'utente loggato
  
  console.log('=== VERIFICA DATI BUDGET ===\n');
  
  // 1. Controlla budget settings
  console.log('1. BUDGET SETTINGS:');
  const settings = await db.select()
    .from(budgetSettings)
    .where(eq(budgetSettings.userId, userId));
  
  if (settings.length > 0) {
    console.log('✅ Settings trovati:', {
      id: settings[0].id,
      monthlyIncome: settings[0].monthlyIncome,
      needsPercentage: settings[0].needsPercentage,
      wantsPercentage: settings[0].wantsPercentage,
      savingsPercentage: settings[0].savingsPercentage,
      customCategories: settings[0].customCategories
    });
  } else {
    console.log('❌ Nessun budget setting trovato');
  }
  
  console.log('\n2. CATEGORY BUDGETS:');
  const catBudgets = await db.select()
    .from(categoryBudgets)
    .where(and(
      eq(categoryBudgets.userId, userId),
      eq(categoryBudgets.isActive, true)
    ));
  
  if (catBudgets.length > 0) {
    console.log(`✅ ${catBudgets.length} category budgets trovati:`);
    catBudgets.forEach(cb => {
      console.log(`  - ${cb.category}${cb.subcategory ? ` > ${cb.subcategory}` : ''}: €${cb.monthlyBudget} (${cb.budgetType})`);
    });
  } else {
    console.log('❌ Nessun category budget trovato');
  }
  
  console.log('\n3. TRANSAZIONI:');
  const txs = await db.select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .limit(5);
  
  if (txs.length > 0) {
    console.log(`✅ ${txs.length} transazioni trovate (prime 5):`);
    txs.forEach(tx => {
      console.log(`  - ${tx.category || 'N/A'}: €${tx.amount} (${tx.type}) - ${tx.budgetCategory || 'N/A'}`);
    });
  } else {
    console.log('❌ Nessuna transazione trovata');
  }
  
  console.log('\n=== FINE VERIFICA ===');
  process.exit(0);
}

checkBudgetData().catch(console.error);
