import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireAdmin, requireConsultant, isAdmin, isConsultant, requireMasterApiKey } from "./auth";
import { db } from "./db";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
import {
  insertAssetSchema,
  insertLiabilitySchema,
  insertIncomeSchema,
  insertExpenseSchema,
  insertGoalSchema,
  insertInvestmentSchema,
  insertTransactionSchema,
  insertRecurringTransactionSchema,
  insertAchievementSchema,
  insertUserProgressSchema,
  insertBudgetSettingsSchema,
  insertCategoryBudgetSchema,
  insertCategoryRuleSchema,
  insertEducationalContentSchema,
  insertModelPortfolioSchema,
  insertPortfolioAllocationSchema,
  insertUserEducationProgressSchema,
  insertCustomAccountSchema,
  insertBudgetNotesSchema,
  insertBudgetForecastSchema,
  insertConsultationSchema,
  insertExerciseSchema,
  insertClientExerciseSchema,
  insertConsultationCalendarSchema,
  insertClientProgressSchema,
  videoProgress,
  watchSessions,
  courseLessons,
  categoryBudgets,
  budgetNotes,
  budgetForecasts,
  consultations,
  exercises,
  consultationCalendar,
  clientExercises,
  users,
  type InsertUser
} from "@shared/schema";
import { z } from "zod";
import { finnhubService } from "./finnhub";
import { categorizeTransaction as centralizedCategorizeTransaction } from "@shared/categorization";
import costAnalysisRouter from "./costAnalysis";

// Using centralized categorization system for consistency
function automaticCategorization(description: string, merchant?: string): { category: string; budgetCategory: string } {
  const result = centralizedCategorizeTransaction(description, merchant);
  return {
    category: result.category,
    budgetCategory: result.budgetCategory
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes are defined in auth.ts

  // Register Cost Analysis router
  app.use('/api/cost-analysis', costAnalysisRouter);

  // ========================================
  // PUBLIC API ENDPOINTS (Master API Key Authentication)
  // ========================================

  // 1. PUBLIC: Dashboard - Complete financial overview
  // URL: https://conorbitale.replit.app/api/public/dashboard
  app.get('/api/public/dashboard', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      const [assets, liabilities, incomes, expenses, goals, investments, allTransactions, recentTransactions, achievements, progress, recurringTransactions] = await Promise.all([
        storage.getUserAssets(userId),
        storage.getUserLiabilities(userId),
        storage.getUserIncomes(userId),
        storage.getUserExpenses(userId),
        storage.getUserGoals(userId),
        storage.getUserInvestments(userId),
        storage.getUserTransactions(userId),
        storage.getUserTransactions(userId, 10),
        storage.getUserAchievements(userId),
        storage.getUserProgress(userId),
        storage.getUserRecurringTransactions(userId),
      ]);

      const totalAssets = assets.reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0);
      const totalLiabilities = liabilities.reduce((sum, liability) => sum + (parseFloat(liability.remainingAmount) || 0), 0);

      let transactionCashFlow = 0;
      let investmentFlow = 0;

      allTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount) || 0;
        if (transaction.type === 'income') {
          transactionCashFlow += amount;
        } else if (transaction.type === 'expense') {
          transactionCashFlow -= amount;
        } else if (transaction.type === 'investment') {
          transactionCashFlow -= amount;
          investmentFlow += amount;
        } else if (transaction.type === 'goal_contribution') {
          transactionCashFlow -= amount;
          investmentFlow += amount;
        } else if (transaction.type === 'goal_refund') {
          transactionCashFlow += amount;
          investmentFlow -= amount;
        }
      });

      const liquidityAssets = assets.filter(asset => asset.type === 'liquidity' || asset.type === 'liquidità').reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0);
      const availableLiquidity = liquidityAssets + transactionCashFlow;
      const netWorth = totalAssets - totalLiabilities;

      const budgetSettings = await storage.getUserBudgetSettings(userId);

      let monthlyIncome, monthlyExpenses, monthlyCashFlow;

      if (budgetSettings && budgetSettings.monthlyIncome) {
        monthlyIncome = parseFloat(budgetSettings.monthlyIncome) || 0;
        const needsPercentage = (parseFloat(budgetSettings.needsPercentage || '50') || 50) / 100;
        const wantsPercentage = (parseFloat(budgetSettings.wantsPercentage || '30') || 30) / 100;
        monthlyExpenses = monthlyIncome * (needsPercentage + wantsPercentage);
        monthlyCashFlow = monthlyIncome - monthlyExpenses;
      } else {
        monthlyIncome = incomes.filter(i => i.isActive).reduce((sum, income) => sum + (parseFloat(income.monthlyAmount) || 0), 0);
        monthlyExpenses = expenses.filter(e => e.isActive).reduce((sum, expense) => sum + (parseFloat(expense.monthlyAmount) || 0), 0);
        monthlyCashFlow = monthlyIncome - monthlyExpenses;
      }

      const totalIncome = monthlyIncome;
      const totalExpenses = monthlyExpenses;

      const assetsByType = assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + (parseFloat(asset.value) || 0);
        return acc;
      }, {} as Record<string, number>);

      const totalInvestments = investments.reduce((sum, inv) => sum + (parseFloat(inv.quantity || "0") * parseFloat(inv.currentPrice || "0")), 0);

      res.json({
        netWorth,
        availableLiquidity,
        cashFlow: monthlyCashFlow,
        totalAssets,
        totalLiabilities,
        totalIncome,
        totalExpenses,
        monthlyIncome,
        monthlyExpenses,
        availableMonthlyFlow: monthlyCashFlow,
        totalInvestments,
        assetsByType,
        goals,
        recentTransactions,
        achievements,
        progress,
        recurringTransactions,
      });
    } catch (error) {
      console.error("Error fetching public dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // 2. PUBLIC: Account Architecture - 6-account system structure
  app.get('/api/public/account-architecture', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const [architecture, investments] = await Promise.all([
        storage.getUserAccountArchitecture(userId),
        storage.getUserInvestments(userId)
      ]);

      if (!architecture) {
        return res.json(null);
      }

      const totalPortfolioValue = await investments.reduce(async (sumPromise, inv) => {
        const sum = await sumPromise;
        const quantity = parseFloat(inv.quantity || "0");
        let currentPrice = parseFloat(inv.averagePrice || "0");

        try {
          const symbolToUse = inv.symbol || inv.name;
          let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

          if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK|DOGE|XRP|LTC/i)) {
            instrumentType = 'crypto';
          } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
            instrumentType = 'forex';
          } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
            instrumentType = 'etf';
          }

          const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
          if (realPrice && realPrice > 0) {
            currentPrice = realPrice;
          }
        } catch (error) {
          console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
        }

        return sum + (quantity * currentPrice);
      }, Promise.resolve(0));

      const subAccounts = await storage.getSubAccounts(architecture.id);

      const response = {
        id: architecture.id,
        userId: architecture.userId,
        monthlyIncome: architecture.monthlyIncome,
        autoDistributionEnabled: architecture.autoDistributionEnabled,
        distributionDay: architecture.distributionDay,
        
        incomeAccountName: architecture.incomeAccountName,
        incomeAccountBankName: architecture.incomeAccountBankName,
        incomeAccountIban: architecture.incomeAccountIban,
        incomeAccountBalance: architecture.incomeAccountBalance,
        
        wealthAccountName: architecture.wealthAccountName,
        wealthAccountBankName: architecture.wealthAccountBankName,
        wealthAccountIban: architecture.wealthAccountIban,
        wealthAccountBalance: architecture.wealthAccountBalance,
        wealthMonthlyAllocation: architecture.wealthMonthlyAllocation,
        
        operatingAccountName: architecture.operatingAccountName,
        operatingAccountBankName: architecture.operatingAccountBankName,
        operatingAccountIban: architecture.operatingAccountIban,
        operatingAccountBalance: architecture.operatingAccountBalance,
        operatingMonthlyAllocation: architecture.operatingMonthlyAllocation,
        
        emergencyAccountName: architecture.emergencyAccountName,
        emergencyAccountBankName: architecture.emergencyAccountBankName,
        emergencyAccountIban: architecture.emergencyAccountIban,
        emergencyAccountBalance: architecture.emergencyAccountBalance,
        emergencyTargetAmount: architecture.emergencyTargetAmount,
        emergencyMonthlyAllocation: architecture.emergencyMonthlyAllocation,
        
        investmentAccountName: architecture.investmentAccountName,
        investmentAccountBankName: architecture.investmentAccountBankName,
        investmentAccountIban: architecture.investmentAccountIban,
        investmentAccountBalance: totalPortfolioValue.toString(),
        investmentMonthlyAllocation: architecture.investmentMonthlyAllocation,
        
        savingsAccountName: architecture.savingsAccountName,
        savingsAccountBankName: architecture.savingsAccountBankName,
        savingsAccountIban: architecture.savingsAccountIban,
        savingsAccountBalance: architecture.savingsAccountBalance,
        savingsMonthlyAllocation: architecture.savingsMonthlyAllocation,
        
        subAccounts: subAccounts || [],
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching public account architecture:", error);
      res.status(500).json({ message: "Failed to fetch account architecture" });
    }
  });

  // 3. PUBLIC: Transactions - Complete transaction history
  app.get('/api/public/transactions', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching public transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // 4. PUBLIC: Budget Settings - 50/30/20 budget configuration
  app.get('/api/public/budget-settings', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const settings = await storage.getUserBudgetSettings(userId);
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching public budget settings:", error);
      res.status(500).json({ message: "Failed to fetch budget settings" });
    }
  });

  // 5. PUBLIC: Category Budgets - Detailed budget per category
  app.get('/api/public/category-budgets', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const budgets = await db.select()
        .from(categoryBudgets)
        .where(and(eq(categoryBudgets.userId, userId), eq(categoryBudgets.isActive, true)))
        .orderBy(categoryBudgets.category, categoryBudgets.subcategory);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching public category budgets:", error);
      res.status(500).json({ message: "Failed to fetch category budgets" });
    }
  });

  // 6. PUBLIC: Goals - Financial goals with real-time values
  app.get('/api/public/goals', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const [goals, investments] = await Promise.all([
        storage.getUserGoals(userId),
        storage.getUserInvestments(userId),
      ]);

      const goalsWithRealTimeValues = await Promise.all(
        goals.map(async (goal) => {
          const linkedInvestments = investments.filter(
            (inv) => inv.goalId === goal.id
          );

          if (linkedInvestments.length === 0) {
            return goal;
          }

          let totalCurrentValue = 0;

          for (const inv of linkedInvestments) {
            const quantity = parseFloat(inv.quantity || "0");
            let currentPrice = parseFloat(inv.averagePrice || "0");

            try {
              const symbolToUse = inv.symbol || inv.name;
              let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

              if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK|DOGE|XRP|LTC/i)) {
                instrumentType = 'crypto';
              } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
                instrumentType = 'forex';
              } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
                instrumentType = 'etf';
              }

              const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
              if (realPrice && realPrice > 0) {
                currentPrice = realPrice;

                await storage.updateInvestment(inv.id, {
                  currentPrice: realPrice.toString(),
                });
              }
            } catch (error) {
              console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
            }

            totalCurrentValue += quantity * currentPrice;
          }

          return {
            ...goal,
            currentAmount: totalCurrentValue.toFixed(2),
          };
        })
      );

      res.json(goalsWithRealTimeValues);
    } catch (error) {
      console.error("Error fetching public goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // 7. PUBLIC: Investments - Investment portfolio with real-time prices
  app.get('/api/public/investments', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const investments = await storage.getUserInvestments(userId);

      const investmentsWithRealTimePrices = await Promise.all(
        investments.map(async (inv) => {
          const quantity = parseFloat(inv.quantity || "0");
          let currentPrice = parseFloat(inv.currentPrice || inv.averagePrice || "0");

          try {
            const symbolToUse = inv.symbol || inv.name;
            let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

            if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK|DOGE|XRP|LTC/i)) {
              instrumentType = 'crypto';
            } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
              instrumentType = 'forex';
            } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
              instrumentType = 'etf';
            }

            const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
            if (realPrice && realPrice > 0) {
              currentPrice = realPrice;
            }
          } catch (error) {
            console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
          }

          const totalValue = quantity * currentPrice;

          return {
            ...inv,
            currentPrice: currentPrice.toString(),
            totalValue: totalValue.toFixed(2),
          };
        })
      );

      res.json(investmentsWithRealTimePrices);
    } catch (error) {
      console.error("Error fetching public investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  // 8. PUBLIC: Cost Analysis Dashboard - Business cost analysis KPIs
  app.get('/api/public/cost-analysis/dashboard', requireMasterApiKey, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;

      const currentYear = year;
      const currentMonth = month;

      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0);

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const { calculateBreakEven } = await import('./routes/costAnalysis');

      const monthlyAnalysis = await calculateBreakEven(userId, 'monthly', monthStart);
      const dailyAnalysis = await calculateBreakEven(userId, 'daily', todayStart);

      res.json({
        monthly: monthlyAnalysis,
        daily: dailyAnalysis,
      });
    } catch (error) {
      console.error("Error fetching public cost analysis dashboard:", error);
      res.status(500).json({ message: "Failed to fetch cost analysis dashboard" });
    }
  });

  // ========================================
  // END OF PUBLIC API ENDPOINTS
  // ========================================

  // Dashboard data endpoint
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      const [assets, liabilities, incomes, expenses, goals, investments, allTransactions, recentTransactions, achievements, progress, recurringTransactions] = await Promise.all([
        storage.getUserAssets(userId),
        storage.getUserLiabilities(userId),
        storage.getUserIncomes(userId),
        storage.getUserExpenses(userId),
        storage.getUserGoals(userId),
        storage.getUserInvestments(userId),
        storage.getUserTransactions(userId), // All transactions for balance calculation
        storage.getUserTransactions(userId, 15), // Recent transactions for display
        storage.getUserAchievements(userId),
        storage.getUserProgress(userId),
        storage.getUserRecurringTransactions(userId),
      ]);

      // Calculate financial metrics including transaction flows
      const totalAssets = assets.reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0);
      const totalLiabilities = liabilities.reduce((sum, liability) => sum + (parseFloat(liability.remainingAmount) || 0), 0);

      let transactionCashFlow = 0;
      let investmentFlow = 0;

      allTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount) || 0;
        if (transaction.type === 'income') {
          transactionCashFlow += amount;
        } else if (transaction.type === 'expense') {
          transactionCashFlow -= amount;
        } else if (transaction.type === 'investment') {
          // Investments don't reduce net worth, they move money from cash to investments
          transactionCashFlow -= amount;
          investmentFlow += amount;
        } else if (transaction.type === 'goal_contribution') {
          // Goal contributions are savings, not expenses
          transactionCashFlow -= amount;
          investmentFlow += amount;
        } else if (transaction.type === 'goal_refund') {
          // Goal refunds return money to liquidity
          transactionCashFlow += amount;
          investmentFlow -= amount;
        }
      });

      // Available liquidity = cash assets from checkup + transaction cash flow
      const liquidityAssets = assets.filter(asset => asset.type === 'liquidity' || asset.type === 'liquidità').reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0);
      const availableLiquidity = liquidityAssets + transactionCashFlow;

      const netWorth = totalAssets - totalLiabilities;

      const budgetSettings = await storage.getUserBudgetSettings(userId);

      let monthlyIncome, monthlyExpenses, monthlyCashFlow;

      if (budgetSettings && budgetSettings.monthlyIncome) {
        monthlyIncome = parseFloat(budgetSettings.monthlyIncome) || 0;
        const needsPercentage = (parseFloat(budgetSettings.needsPercentage || '50') || 50) / 100;
        const wantsPercentage = (parseFloat(budgetSettings.wantsPercentage || '30') || 30) / 100;
        monthlyExpenses = monthlyIncome * (needsPercentage + wantsPercentage);
        monthlyCashFlow = monthlyIncome - monthlyExpenses;
      } else {
        monthlyIncome = incomes.filter(i => i.isActive).reduce((sum, income) => sum + (parseFloat(income.monthlyAmount) || 0), 0);
        monthlyExpenses = expenses.filter(e => e.isActive).reduce((sum, expense) => sum + (parseFloat(expense.monthlyAmount) || 0), 0);
        monthlyCashFlow = monthlyIncome - monthlyExpenses;
      }

      const totalIncome = monthlyIncome;
      const totalExpenses = monthlyExpenses;

      const assetsByType = assets.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + (parseFloat(asset.value) || 0);
        return acc;
      }, {} as Record<string, number>);

      const checkupTransactions = [
        ...assets.map(asset => ({
          id: `asset-${asset.id}`,
          type: 'asset' as const,
          category: asset.type,
          amount: parseFloat(asset.value) || 0,
          description: `${asset.name} (Check-up)`,
          date: asset.createdAt?.toISOString().split('T')[0] || getLocalDateString(),
          createdAt: asset.createdAt?.toISOString() || new Date().toISOString(),
          source: 'checkup'
        })),
        // Liabilities as negative entries
        ...liabilities.map(liability => ({
          id: `liability-${liability.id}`,
          type: 'liability' as const,
          category: liability.type,
          amount: -(parseFloat(liability.remainingAmount) || 0),
          description: `${liability.name} (Check-up)`,
          date: liability.createdAt?.toISOString().split('T')[0] || getLocalDateString(),
          createdAt: liability.createdAt?.toISOString() || new Date().toISOString(),
          source: 'checkup'
        })),
        ...incomes.filter(income => income.isActive).map(income => ({
          id: `income-${income.id}`,
          type: 'income' as const,
          category: income.type,
          amount: parseFloat(income.monthlyAmount) || 0,
          description: `${income.name} (Check-up - Mensile)`,
          date: income.createdAt?.toISOString().split('T')[0] || getLocalDateString(),
          createdAt: income.createdAt?.toISOString() || new Date().toISOString(),
          source: 'checkup'
        })),
        ...expenses.filter(expense => expense.isActive).map(expense => ({
          id: `expense-${expense.id}`,
          type: 'expense' as const,
          category: expense.category,
          amount: -(parseFloat(expense.monthlyAmount) || 0),
          description: `${expense.name} (Check-up - Mensile)`,
          date: expense.createdAt?.toISOString().split('T')[0] || getLocalDateString(),
          createdAt: expense.createdAt?.toISOString() || new Date().toISOString(),
          source: 'checkup'
        }))
      ];

      // Combine and sort recent transactions (manual + checkup data)
      const combinedTransactions = [
        ...recentTransactions.map(t => ({...t, source: 'manual'})),
        ...checkupTransactions
      ].sort((a, b) => {
        const dateA = new Date(b.createdAt || new Date()).getTime();
        const dateB = new Date(a.createdAt || new Date()).getTime();
        return dateA - dateB;
      }).slice(0, 10);

      res.json({
        financialSummary: {
          netWorth,
          availableLiquidity,
          cashFlow: monthlyCashFlow,
          totalAssets,
          totalLiabilities,
          totalIncome,
          totalExpenses,
          monthlyIncome: monthlyIncome,
          monthlyExpenses: monthlyExpenses,
          monthlyRecurringExpenses: monthlyExpenses,
          availableMonthlyFlow: monthlyCashFlow,
          totalInvestments: investmentFlow,
        },
        assetsByType,
        goals,
        recentTransactions: combinedTransactions,
        achievements,
        progress,
        recurringTransactions: recurringTransactions.map(rt => ({
          ...rt,
          amount: parseFloat(rt.amount)
        }))
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Goals endpoints
  app.get('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      console.log(`=== FETCHING GOALS FOR USER ${userId} ===`);

      const [goals, investments] = await Promise.all([
        storage.getUserGoals(userId),
        storage.getUserInvestments(userId)
      ]);
      console.log(`Found ${goals.length} goals and ${investments.length} investments`);

      // Update investment goals with real-time values
      const updatedGoals = await Promise.all(goals.map(async (goal) => {
        console.log(`Processing goal: ${goal.id} - ${goal.name} - Type: ${goal.type}`);
        if (goal.type === 'investment') {
          // Find investments linked to this goal
          console.log(`Looking for investments linked to goal ${goal.id}`);
          console.log(`Available investments:`, investments.map(inv => ({ id: inv.id, name: inv.name, goalId: inv.goalId })));
          const linkedInvestments = investments.filter(inv => inv.goalId === goal.id);
          console.log(`Found ${linkedInvestments.length} linked investments`);

          if (linkedInvestments.length > 0) {
            // Calculate real-time total value of linked investments
            const realTimeValue = await linkedInvestments.reduce(async (sumPromise, inv) => {
              const sum = await sumPromise;
              const quantity = parseFloat(inv.quantity || "0");
              let currentPrice = parseFloat(inv.averagePrice || "0");

              try {
                const symbolToUse = inv.symbol || inv.name;
                let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

                if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK|DOGE|XRP|LTC/i)) {
                  instrumentType = 'crypto';
                } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
                  instrumentType = 'forex';
                } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
                  instrumentType = 'etf';
                }

                const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
                if (realPrice && realPrice > 0) {
                  currentPrice = realPrice;

                  // Convert USD to EUR for US stocks/ETFs if investment is stored in EUR
                  if (inv.currency === 'EUR' && instrumentType === 'stock' && !symbolToUse.match(/\.L|\.PA|\.MI|\.DE/)) {
                    currentPrice = realPrice * 0.92; // Approximate USD to EUR conversion
                    console.log(`Goals API: Converting USD price ${realPrice} to EUR ${currentPrice} for ${symbolToUse}`);
                  }
                }
              } catch (error) {
                console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
              }

              const value = quantity * currentPrice;
              console.log(`Investment ${inv.name}: ${quantity} x ${currentPrice} = ${value}`);
              return sum + value;
            }, Promise.resolve(0));

            // Update goal current_amount with real-time value
            console.log(`Updating goal ${goal.id} from ${goal.currentAmount} to ${realTimeValue}`);
            await storage.updateGoal(goal.id, { currentAmount: realTimeValue.toString() });
            goal.currentAmount = realTimeValue.toString();
          }
        }
        return goal;
      }));

      console.log(`=== RETURNING ${updatedGoals.length} GOALS ===\n`);
      // Disable cache for goals to ensure real-time updates
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(updatedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  });

  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const goalData = { ...req.body, userId };
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ message: 'Failed to create goal' });
    }
  });

  app.put('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.updateGoal(goalId, req.body);
      res.json(goal);
    } catch (error) {
      console.error('Error updating goal:', error);
      res.status(500).json({ message: 'Failed to update goal' });
    }
  });



  // Checkup summary endpoint
  app.get('/api/checkup/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      // Get all user's financial data
      const [assets, liabilities, incomes, expenses, user] = await Promise.all([
        storage.getUserAssets(userId),
        storage.getUserLiabilities(userId),
        storage.getUserIncomes(userId),
        storage.getUserExpenses(userId),
        storage.getUser(userId)
      ]);

      const checkupSummary = {
        personalInfo: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || 'Utente',
          email: user?.email
        },
        assets: assets.map(asset => ({
          name: asset.name,
          type: asset.type,
          value: asset.value,
          description: asset.description
        })),
        liabilities: liabilities.map(liability => ({
          name: liability.name,
          type: liability.type,
          amount: parseFloat(liability.remainingAmount) || 0,
          interestRate: liability.interestRate,
          description: liability.description
        })),
        incomes: incomes.map(income => ({
          name: income.name,
          type: income.type,
          amount: parseFloat(income.monthlyAmount) || 0,
          frequency: 'monthly',
          description: income.name
        })),
        expenses: expenses.map(expense => ({
          name: expense.name,
          category: expense.category,
          amount: parseFloat(expense.monthlyAmount) || 0,
          frequency: 'monthly',
          description: expense.name
        })),
        summary: {
          totalAssets: assets.reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0),
          totalLiabilities: liabilities.reduce((sum, liability) => sum + (parseFloat(liability.remainingAmount) || 0), 0),
          totalIncome: incomes.reduce((sum, income) => sum + (parseFloat(income.monthlyAmount) || 0), 0),
          totalExpenses: expenses.reduce((sum, expense) => sum + (parseFloat(expense.monthlyAmount) || 0), 0)
        }
      };

      res.json(checkupSummary);
    } catch (error) {
      console.error('Error fetching checkup summary:', error);
      res.status(500).json({ message: 'Failed to fetch checkup summary' });
    }
  });

  // Asset endpoints
  app.get('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const assets = await storage.getUserAssets(userId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const assetData = insertAssetSchema.parse({ ...req.body, userId });
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(400).json({ message: "Failed to create asset" });
    }
  });

  app.put('/api/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const assetData = insertAssetSchema.partial().parse(req.body);
      const asset = await storage.updateAsset(id, assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(400).json({ message: "Failed to update asset" });
    }
  });

  app.delete('/api/assets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAsset(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(400).json({ message: "Failed to delete asset" });
    }
  });

  // Liability endpoints
  app.get('/api/liabilities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const liabilities = await storage.getUserLiabilities(userId);
      res.json(liabilities);
    } catch (error) {
      console.error("Error fetching liabilities:", error);
      res.status(500).json({ message: "Failed to fetch liabilities" });
    }
  });

  app.post('/api/liabilities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const liabilityData = insertLiabilitySchema.parse({ ...req.body, userId });
      const liability = await storage.createLiability(liabilityData);
      res.json(liability);
    } catch (error) {
      console.error("Error creating liability:", error);
      res.status(400).json({ message: "Failed to create liability" });
    }
  });

  // Income endpoints
  app.get('/api/incomes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const incomes = await storage.getUserIncomes(userId);
      res.json(incomes);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      res.status(500).json({ message: "Failed to fetch incomes" });
    }
  });

  app.post('/api/incomes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const incomeData = insertIncomeSchema.parse({ ...req.body, userId });
      const income = await storage.createIncome(incomeData);
      res.json(income);
    } catch (error) {
      console.error("Error creating income:", error);
      res.status(400).json({ message: "Failed to create income" });
    }
  });

  // Expense endpoints
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const expenses = await storage.getUserExpenses(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const expenseData = insertExpenseSchema.parse({ ...req.body, userId });
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Failed to create expense" });
    }
  });

  // Goal endpoints
  app.get('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      console.log(`\n=== GETTING GOALS FOR USER ${userId} ===`);
      const [goals, investments] = await Promise.all([
        storage.getUserGoals(userId),
        storage.getUserInvestments(userId)
      ]);
      console.log(`Found ${goals.length} goals and ${investments.length} investments`);

      // Update investment goals with real-time values
      const updatedGoals = await Promise.all(goals.map(async (goal) => {
        console.log(`Processing goal: ${goal.id} - ${goal.name} - Type: ${goal.type}`);
        if (goal.type === 'investment') {
          // Find investments linked to this goal
          console.log(`Looking for investments linked to goal ${goal.id}`);
          console.log(`Available investments:`, investments.map(inv => ({ id: inv.id, name: inv.name, goalId: inv.goalId })));
          const linkedInvestments = investments.filter(inv => inv.goalId === goal.id);
          console.log(`Found ${linkedInvestments.length} linked investments`);

          if (linkedInvestments.length > 0) {
            // Calculate real-time total value of linked investments
            const realTimeValue = await linkedInvestments.reduce(async (sumPromise, inv) => {
              const sum = await sumPromise;
              const quantity = parseFloat(inv.quantity || "0");
              let currentPrice = parseFloat(inv.averagePrice || "0");

              try {
                const symbolToUse = inv.symbol || inv.name;
                let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

                if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK|DOGE|XRP|LTC/i)) {
                  instrumentType = 'crypto';
                } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
                  instrumentType = 'forex';
                } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
                  instrumentType = 'etf';
                }

                const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
                if (realPrice && realPrice > 0) {
                  currentPrice = realPrice;

                  // Convert USD to EUR for US stocks/ETFs if investment is stored in EUR
                  if (inv.currency === 'EUR' && instrumentType === 'stock' && !symbolToUse.match(/\.L|\.PA\.MI\.DE/)) {
                    currentPrice = realPrice * 0.92; // Approximate USD to EUR conversion
                    console.log(`Goals API: Converting USD price ${realPrice} to EUR ${currentPrice} for ${symbolToUse}`);
                  }
                }
              } catch (error) {
                console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
              }

              const value = quantity * currentPrice;
              console.log(`Investment ${inv.name}: ${quantity} x ${currentPrice} = ${value}`);
              return sum + value;
            }, Promise.resolve(0));

            // Update goal current_amount with real-time value
            console.log(`Updating goal ${goal.id} from ${goal.currentAmount} to ${realTimeValue}`);
            await storage.updateGoal(goal.id, { currentAmount: realTimeValue.toString() });
            goal.currentAmount = realTimeValue.toString();
          }
        }
        return goal;
      }));

      console.log(`=== RETURNING ${updatedGoals.length} GOALS ===\n`);
      // Disable cache for goals to ensure real-time updates
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(updatedGoals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      console.log('=== GOAL CREATION START ===');
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('userId:', userId);

      const { linkedInvestments, ...goalRequestData } = req.body;
      const goalData = insertGoalSchema.parse({ ...goalRequestData, userId });
      console.log('Parsed goal data:', JSON.stringify(goalData, null, 2));
      const goal = await storage.createGoal(goalData);
      console.log('Goal created with ID:', goal.id);

      // Link investments to goal if provided
      if (linkedInvestments && linkedInvestments.length > 0) {
        console.log('Linking investments to goal:', linkedInvestments);
        for (const investmentId of linkedInvestments) {
          try {
            await storage.updateInvestment(investmentId, { goalId: goal.id });
            console.log(`Investment ${investmentId} linked to goal ${goal.id}`);
          } catch (linkError) {
            console.error(`Failed to link investment ${investmentId} to goal:`, linkError);
          }
        }
      }

      // Check if goal has initial amount and create transaction
      const currentAmount = goalData.currentAmount;
      const currentAmountNum = parseFloat(currentAmount?.toString() || '0');

      console.log('=== TRANSACTION CREATION CHECK ===');
      console.log('currentAmount from goalData:', currentAmount);
      console.log('currentAmountNum parsed:', currentAmountNum);
      console.log('Should create transaction:', currentAmountNum > 0);

      if (currentAmountNum > 0) {
        console.log('Creating transaction for goal contribution...');
        try {
          const transactionData = {
            userId,
            type: 'goal_contribution' as const,
            amount: currentAmountNum.toString(),
            category: 'Obiettivi',
            description: `Investimento iniziale per obiettivo: ${goalData.name}`,
            date: getLocalDateString(),
            goalId: goal.id
          };
          console.log('Transaction data to create:', JSON.stringify(transactionData, null, 2));

          const transaction = await storage.createTransaction(transactionData);
          console.log('*** TRANSACTION SUCCESSFULLY CREATED ***');
          console.log('Transaction ID:', transaction.id);
          console.log('Amount deducted from liquidity:', currentAmountNum);
        } catch (transactionError) {
          console.error('*** TRANSACTION CREATION FAILED ***');
          console.error('Error details:', transactionError);
          console.error('Stack trace:', transactionError instanceof Error ? transactionError.stack : '');
        }
      } else {
        console.log('No transaction created - current amount is 0 or invalid');
      }

      // Award achievement for first goal
      const userGoals = await storage.getUserGoals(userId);
      if (userGoals.length === 1) {
        await storage.createAchievement({
          userId,
          type: 'first_goal',
          name: 'Primo Obiettivo',
          description: 'Hai creato il tuo primo obiettivo finanziario!',
        });
      }

      console.log('=== GOAL CREATION COMPLETE ===');
      res.status(201).json(goal);
    } catch (error) {
      console.error("=== GOAL CREATION ERROR ===");
      console.error("Error creating goal:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : '');
      res.status(400).json({ message: "Failed to create goal" });
    }
  });

  app.put('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const goalData = insertGoalSchema.partial().parse(req.body);

      // Ensure expectedReturn is stored as decimal (e.g., 0.10 for 10%)
      if (goalData.expectedReturn) {
        goalData.expectedReturn = goalData.expectedReturn.toString();
      }

      const goal = await storage.updateGoal(id, goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(400).json({ message: "Failed to update goal" });
    }
  });

  // Save growth rate preference
  app.post('/api/user/growth-rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { growthRate } = req.body;

      // Store in user preferences or budget settings
      const budgetSettings = await storage.getUserBudgetSettings(userId);
      if (budgetSettings) {
        await storage.upsertBudgetSettings({
          userId,
          needsPercentage: budgetSettings.needsPercentage,
          wantsPercentage: budgetSettings.wantsPercentage,
          savingsPercentage: budgetSettings.savingsPercentage,
          monthlyIncome: budgetSettings.monthlyIncome,
          customCategories: budgetSettings.customCategories as any
        });
      } else {
        await storage.upsertBudgetSettings({
          userId,
          needsPercentage: '50',
          wantsPercentage: '30', 
          savingsPercentage: '20'
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving growth rate:", error);
      res.status(500).json({ message: "Failed to save growth rate" });
    }
  });

  app.delete('/api/goals/:id', isAuthenticated, async (req: any, res) => {
    console.log('DELETE /api/goals/:id endpoint hit');
    try {
      const goalId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);
      const action = req.query.action; // 'transfer', 'return', 'convert'
      const targetGoalId = req.query.targetGoalId ? parseInt(req.query.targetGoalId) : null;
      const targetAccountId = req.query.targetAccountId;



      // Verify goal belongs to user
      const goals = await storage.getUserGoals(userId);
      const existingGoal = goals.find(g => g.id === goalId);
      if (!existingGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      const currentAmount = parseFloat(existingGoal.currentAmount || '0');


      // If goal has money, require action parameter
      if (currentAmount > 0 && !action) {
        return res.status(400).json({ 
          message: "Goal contains funds", 
          currentAmount,
          requiresAction: true,
          options: {
            transfer: "Trasferisci ad altro obiettivo",
            return: "Ritorna alla liquidità disponibile", 
            convert: "Converti in investimento generico"
          }
        });
      }

      // Handle the money based on chosen action
      if (currentAmount > 0) {
        switch (action) {
          case 'transfer':
            if (!targetGoalId) {
              return res.status(400).json({ message: "Target goal ID required for transfer" });
            }
            const targetGoal = goals.find(g => g.id === targetGoalId);
            if (!targetGoal) {
              return res.status(404).json({ message: "Target goal not found" });
            }
            // Update target goal
            const newAmount = parseFloat(targetGoal.currentAmount || '0') + currentAmount;
            await storage.updateGoal(targetGoalId, {
              currentAmount: newAmount.toString()
            });
            // Create transfer transaction
            await storage.createTransaction({
              userId,
              type: 'goal_transfer',
              amount: currentAmount.toString(),
              description: `Trasferimento da "${existingGoal.name}" a "${targetGoal.name}"`,
              date: getLocalDateString(),
              category: 'trasferimento-obiettivo',
              goalId: targetGoalId
            });
            break;

          case 'return':
            if (!targetAccountId) {
              return res.status(400).json({ message: "Target account ID is required for return action" });
            }

            // Create transaction to return money to specific account
            const transactionData = {
              userId,
              type: 'income',
              amount: currentAmount.toString(),
              description: `Rimborso da obiettivo "${existingGoal.name}"`,
              date: getLocalDateString(),
              category: 'rimborso-obiettivo',
              goalId: goalId,
              accountType: targetAccountId
            };

            await storage.createTransaction(transactionData);

            // If it's a custom account, update its balance
            if (targetAccountId.startsWith('custom_')) {
              const customAccountId = parseInt(targetAccountId.replace('custom_', ''));
              const customAccounts = await storage.getCustomAccounts(userId);
              const customAccount = customAccounts.find(acc => acc.id === customAccountId);

              if (customAccount) {
                const currentBalance = parseFloat(customAccount.balance || "0");
                const newBalance = currentBalance + currentAmount;

                await storage.updateCustomAccount(customAccountId, {
                  balance: newBalance.toString()
                });
              }
            } else {
              // Update architecture
              const architecture = await storage.getUserAccountArchitecture(userId);
              if (architecture) {
                const updates: any = {};

                switch (targetAccountId) {
                  case 'income':
                    updates.incomeAccountBalance = (parseFloat(architecture.incomeAccountBalance || "0") + currentAmount).toString();
                    break;
                  case 'wealth':
                    updates.wealthAccountBalance = (parseFloat(architecture.wealthAccountBalance || "0") + currentAmount).toString();
                    break;
                  case 'operating':
                    updates.operatingAccountBalance = (parseFloat(architecture.operatingAccountBalance || "0") + currentAmount).toString();
                    break;
                  case 'emergency':
                    updates.emergencyAccountBalance = (parseFloat(architecture.emergencyAccountBalance || "0") + currentAmount).toString();
                    break;
                  case 'investment':
                    updates.investmentAccountBalance = (parseFloat(architecture.investmentAccountBalance || "0") + currentAmount).toString();
                    break;
                  case 'savings':
                    updates.savingsAccountBalance = (parseFloat(architecture.savingsAccountBalance || "0") + currentAmount).toString();
                    break;
                }

                if (Object.keys(updates).length > 0) {
                  await storage.updateAccountArchitecture(architecture.id, updates);
                }
              }
            }

            break;

          case 'convert':
            // Create generic investment transaction
            await storage.createTransaction({
              userId,
              type: 'investment',
              amount: currentAmount.toString(),
              description: `Conversione da obiettivo "${existingGoal.name}" a investimento generico`,
              date: getLocalDateString(),
              category: 'portfolio-diversificato'
            });
            break;

          case 'delete':
            // Simply delete without transferring funds anywhere
            // No transaction is created, funds are permanently removed
            break;

          default:
            return res.status(400).json({ message: "Invalid action specified" });
        }
      }

      await storage.deleteGoal(goalId);
      res.status(204).send(); // No content response
    } catch (error) {
      console.error("Error deleting goal:", error);
      res.status(400).json({ message: "Failed to delete goal" });
    }
  });

  // Transaction endpoints
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10000;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const transactions = await storage.getUserTransactions(userId, limit, startDate, endDate);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Generate PDF report for transactions
  app.post('/api/transactions/generate-pdf-report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { period, startDate, endDate, transactions, summary, accountArchitecture, generatedAt } = req.body;

      // Import PDFKit
      const { default: PDFDocument } = await import('pdfkit');

      // Create PDF content with A4 size
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: 'Report Transazioni Finanziarie',
          Author: 'Sistema Finanziario',
          Subject: 'Analisi finanziaria completa',
          Keywords: 'finanze, transazioni, report, analisi'
        }
      });

      // Collect PDF data in buffer
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);

        // Set correct headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="analisi-finanziaria-completa.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send the PDF buffer
        res.send(pdfBuffer);
      });

      // Helper functions for better formatting
      const drawHeader = (title: string, subtitle?: string) => {
        const startY = doc.y;
        doc.rect(40, startY, 515, 60).fill('#2563EB');
        doc.fill('#FFFFFF').fontSize(18).font('Helvetica-Bold')
           .text(title, 50, startY + 15);
        if (subtitle) {
          doc.fontSize(12).font('Helvetica')
             .text(subtitle, 50, startY + 40);
        }
        doc.fill('#000000'); // Always reset to black
        doc.y = startY + 60;
        doc.moveDown(2);
      };

      const drawTable = (headers: string[], rows: string[][], startY: number) => {
        const tableWidth = 515;
        const colWidth = tableWidth / headers.length;
        const rowHeight = 25;
        let currentY = startY;

        // Draw header
        doc.rect(40, currentY, tableWidth, rowHeight).fill('#F3F4F6').stroke();
        doc.fill('#374151').fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, 45 + i * colWidth, currentY + 8, { width: colWidth - 10, align: 'left' });
        });
        currentY += rowHeight;

        // Draw rows
        doc.fill('#000000').fontSize(10).font('Helvetica'); // Ensure black text and consistent font size
        rows.forEach((row, rowIndex) => {
          const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          doc.rect(40, currentY, tableWidth, rowHeight).fill(bgColor).stroke('#E5E7EB');

          row.forEach((cell, i) => {
            doc.fill('#000000'); // Ensure each cell is black
            doc.text(cell, 45 + i * colWidth, currentY + 8, { width: colWidth - 10, align: 'left' });
          });
          currentY += rowHeight;
        });

        return currentY;
      };

      const drawSummaryBox = (title: string, items: Array<{label: string, value: string, color?: string}>) => {
        const boxHeight = 20 + items.length * 18;
        const startY = doc.y;
        doc.rect(40, startY, 515, boxHeight).fill('#F8FAFC').stroke('#E2E8F0');

        doc.fill('#1E293B').fontSize(14).font('Helvetica-Bold')
           .text(title, 50, startY + 10);

        let itemY = startY + 30;
        items.forEach(item => {
          doc.fill(item.color || '#374151').fontSize(11).font('Helvetica')
             .text(`${item.label}: ${item.value}`, 50, itemY);
          itemY += 18;
        });

        doc.fill('#000000'); // Reset to black
        doc.y = startY + boxHeight + 15;
      };

      // Page 1: Executive Summary
      drawHeader('ANALISI FINANZIARIA COMPLETA', `Generato il ${new Date(generatedAt).toLocaleDateString('it-IT')}`);

      // Period info box
      let periodText = '';
      switch(period) {
        case 'today': periodText = 'Oggi'; break;
        case 'week': periodText = 'Questa settimana'; break;
        case 'month': periodText = 'Questo mese'; break;
        case 'year': periodText = 'Quest\'anno'; break;
        case 'custom': periodText = `Dal ${startDate} al ${endDate}`; break;
        default: periodText = 'Periodo selezionato';
      }

      doc.rect(40, doc.y, 515, 40).fill('#EBF8FF').stroke('#3B82F6');
      doc.fill('#1E40AF').fontSize(12).font('Helvetica-Bold')
         .text(`PERIODO ANALIZZATO: ${periodText}`, 50, doc.y + 15);
      doc.fill('#000000'); // Reset to black
      doc.moveDown(3);

      // Financial summary with colored boxes
      const netBalance = summary.totalIncome - summary.totalExpenses;
      const balanceColor = netBalance >= 0 ? '#059669' : '#DC2626';

      drawSummaryBox('RIEPILOGO FINANZIARIO', [
        { label: 'Entrate totali', value: `€${summary.totalIncome.toFixed(2)}`, color: '#059669' },
        { label: 'Spese totali', value: `€${summary.totalExpenses.toFixed(2)}`, color: '#DC2626' },
        { label: 'Investimenti', value: `€${summary.totalInvestments.toFixed(2)}`, color: '#7C3AED' },
        { label: 'Saldo netto', value: `€${netBalance.toFixed(2)}`, color: balanceColor },
        { label: 'Numero transazioni', value: summary.transactionCount.toString(), color: '#374151' }
      ]);

      // Savings rate analysis
      if (summary.totalIncome > 0) {
        const savingsRate = ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100;
        let ratingText = '';
        let ratingColor = '';

        if (savingsRate > 20) {
          ratingText = '✓ ECCELLENTE - Ottima gestione finanziaria';
          ratingColor = '#059669';
        } else if (savingsRate > 10) {
          ratingText = '• BUONO - Margini di miglioramento';
          ratingColor = '#F59E0B';
        } else {
          ratingText = '⚠ CRITICO - Necessario rivedere il budget';
          ratingColor = '#DC2626';
        }

        drawSummaryBox('ANALISI TASSO DI RISPARMIO', [
          { label: 'Tasso di risparmio', value: `${savingsRate.toFixed(1)}%`, color: '#374151' },
          { label: 'Valutazione', value: ratingText, color: ratingColor }
        ]);
      }

      // Page 2: Detailed transaction analysis
      doc.addPage();
      drawHeader('ANALISI DETTAGLIATA TRANSAZIONI');

      // Group transactions by category
      const transactionsByCategory = transactions.reduce((acc: any, transaction: any) => {
        const category = transaction.category || 'Altro';
        if (!acc[category]) {
          acc[category] = { transactions: [], total: 0, count: 0 };
        }
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
        acc[category].transactions.push(transaction);
        acc[category].total += Math.abs(amount);
        acc[category].count += 1;
        return acc;
      }, {});

      // Category summary table
      doc.fill('#000000').fontSize(14).font('Helvetica-Bold').text('Riepilogo per Categoria', 40);
      doc.moveDown(0.5);

      const categoryHeaders = ['Categoria', 'Transazioni', 'Importo Totale', '% del Totale'];
      const categoryRows = Object.entries(transactionsByCategory).map(([category, data]: [string, any]) => {
        const percentage = summary.totalExpenses > 0 ? (data.total / summary.totalExpenses) * 100 : 0;
        return [
          category,
          data.count.toString(),
          `€${data.total.toFixed(2)}`,
          `${percentage.toFixed(1)}%`
        ];
      });

      const tableEndY = drawTable(categoryHeaders, categoryRows, doc.y + 10);
      doc.y = tableEndY + 20;

      // Top 5 expenses table
      doc.fill('#000000').fontSize(14).font('Helvetica-Bold').text('Top 10 Transazioni per Importo', 40);
      doc.moveDown(0.5);

      const topTransactions = transactions
        .filter((t: any) => t.type === 'expense')
        .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 10);

      const transactionHeaders = ['Data', 'Descrizione', 'Categoria', 'Importo'];
      const transactionRows = topTransactions.map((t: any) => [
        new Date(t.date).toLocaleDateString('it-IT'),
        (t.description || t.category || 'N/A').substring(0, 25) + (t.description?.length > 25 ? '...' : ''),
        t.category || 'Altro',
        `€${parseFloat(t.amount).toFixed(2)}`
      ]);

      if (transactionRows.length > 0) {
        const transTableEndY = drawTable(transactionHeaders, transactionRows, doc.y + 10);
        doc.y = transTableEndY + 20;
      }

      // Page 3: Account Analysis
      if (accountArchitecture && accountArchitecture.accounts) {
        doc.addPage();
        drawHeader('ANALISI ARCHITETTURA CONTI');

        const accounts = accountArchitecture.accounts;
        const accountsData = Object.entries(accounts)
          .filter(([, account]: [string, any]) => account && account.name)
          .map(([type, account]: [string, any]) => ({
            type,
            name: account.name,
            balance: account.balance || 0,
            bankName: account.bankName || 'N/A',
            allocation: account.monthlyAllocation || 0
          }));

        // Accounts summary table
        const accountHeaders = ['Conto', 'Banca', 'Saldo Attuale', 'Allocazione Mensile'];
        const accountRows = accountsData.map(account => [
          account.name,
          account.bankName,
          `€${account.balance.toFixed(2)}`,
          account.allocation > 0 ? `€${account.allocation.toFixed(2)}` : '-'
        ]);

        if (accountRows.length > 0) {
          const accountTableEndY = drawTable(accountHeaders, accountRows, doc.y + 10);
          doc.y = accountTableEndY + 20;
        }

        // Distribution analysis
        const totalAllocated = accountsData.reduce((sum, acc) => sum + acc.allocation, 0);
        const totalBalance = accountsData.reduce((sum, acc) => sum + acc.balance, 0);

        drawSummaryBox('DISTRIBUZIONE PATRIMONIALE', [
          { label: 'Patrimonio liquido totale', value: `€${totalBalance.toFixed(2)}`, color: '#059669' },
          { label: 'Allocazione mensile totale', value: `€${totalAllocated.toFixed(2)}`, color: '#3B82F6' },
          { label: 'Numero conti attivi', value: accountsData.length.toString(), color: '#374151' }
        ]);
      }

      // Page 4: Recommendations and insights
      doc.addPage();
      drawHeader('RACCOMANDAZIONI E INSIGHTS');

      // Generate insights based on data
      const insights: Array<{title: string, text: string, type: 'success' | 'warning' | 'error' | 'info'}> = [];

      // Cash flow analysis
      if (summary.totalExpenses > summary.totalIncome) {
        insights.push({
          title: '⚠ FLUSSO DI CASSA NEGATIVO',
          text: 'Le spese superano le entrate. È necessario rivedere il budget e identificare aree di riduzione dei costi o incrementare le entrate.',
          type: 'error'
        });
      } else if (summary.totalIncome > 0) {
        const surplus = summary.totalIncome - summary.totalExpenses;
        insights.push({
          title: '✓ FLUSSO DI CASSA POSITIVO',
          text: `Hai un surplus di €${surplus.toFixed(2)}. Considera di destinare una parte agli investimenti per far crescere il patrimonio.`,
          type: 'success'
        });
      }

      // Investment analysis
      if (summary.totalInvestments === 0 && summary.totalIncome > summary.totalExpenses) {
        insights.push({
          title: '💡 OPPORTUNITÀ DI INVESTIMENTO',
          text: 'Non sono stati rilevati investimenti nel periodo analizzato. Valuta di destinare parte del surplus agli investimenti per la crescita del patrimonio.',
          type: 'info'
        });
      } else if (summary.totalInvestments > 0) {
        const investmentRate = (summary.totalInvestments / summary.totalIncome) * 100;
        insights.push({
          title: '📈 ATTIVITÀ DI INVESTIMENTO',
          text: `Stai investendo il ${investmentRate.toFixed(1)}% delle tue entrate. ${investmentRate > 10 ? 'Ottimo approccio!' : 'Potresti considerare di aumentare la percentuale se possibile.'}`,
          type: investmentRate > 10 ? 'success' : 'info'
        });
      }

      // Category analysis
      const topCategory = Object.entries(transactionsByCategory)
        .filter(([, data]: [string, any]) => data.total > 0)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b.total - a.total)[0];

      if (topCategory) {
        const [category, data] = topCategory;
        const percentage = (data.total / summary.totalExpenses) * 100;
        insights.push({
          title: '📊 CATEGORIA DI SPESA PRINCIPALE',
          text: `La categoria "${category}" rappresenta il ${percentage.toFixed(1)}% delle tue spese totali (€${data.total.toFixed(2)}). ${percentage > 40 ? 'Valuta se è possibile ottimizzare questa voce di spesa.' : 'Distribuzione equilibrata delle spese.'}`,
          type: percentage > 40 ? 'warning' : 'info'
        });
      }

      // Draw insights
      insights.forEach(insight => {
        let bgColor = '#F8FAFC';
        let borderColor = '#E2E8F0';
        let titleColor = '#374151';

        switch (insight.type) {
          case 'success':
            bgColor = '#F0FDF4';
            borderColor = '#16A34A';
            titleColor = '#15803D';
            break;
          case 'warning':
            bgColor = '#FFFBEB';
            borderColor = '#D97706';
            titleColor = '#C2410C';
            break;
          case 'error':
            bgColor = '#FEF2F2';
            borderColor = '#DC2626';
            titleColor = '#B91C1C';
            break;
          case 'info':
            bgColor = '#EFF6FF';
            borderColor = '#3B82F6';
            titleColor = '#1D4ED8';
            break;
        }

        const textLines = doc.widthOfString(insight.text) > 450 ? 
          insight.text.match(/.{1,70}(\s|$)/g) || [insight.text] : [insight.text];
        const boxHeight = 40 + textLines.length * 15;

        doc.rect(40, doc.y, 515, boxHeight).fill(bgColor).stroke(borderColor);
        doc.fill(titleColor).fontSize(12).font('Helvetica-Bold')
           .text(insight.title, 50, doc.y + 12);

        doc.fill('#374151').fontSize(10).font('Helvetica');
        textLines.forEach((line, i) => {
          doc.text(line.trim(), 50, doc.y + 30 + i * 15);
        });

        doc.y += boxHeight + 15;
      });

      // Final recommendations
      doc.moveDown(1);
      doc.fill('#000000').fontSize(12).font('Helvetica-Bold').text('PROSSIMI PASSI CONSIGLIATI:', 40);
      doc.moveDown(0.5);

      const recommendations = [
        '• Monitora regolarmente le tue transazioni per mantenere il controllo delle finanze',
        '• Utilizza i filtri per analizzare periodi specifici e identificare trend di spesa',
        '• Imposta budget mensili per le categorie di spesa principali',
        '• Rivedi questo report mensilmente per tracciare i progressi',
        '• Considera di automatizzare risparmi e investimenti per raggiungere i tuoi obiettivi'
      ];

      doc.fill('#000000').fontSize(10).font('Helvetica');
      recommendations.forEach(rec => {
        doc.text(rec, 50, doc.y + 5);
        doc.moveDown(0.3);
      });

      // Footer with generation info
      doc.fontSize(8).fill('#6B7280').text(
        `Report generato automaticamente il ${new Date().toLocaleString('it-IT')} - Sistema di Gestione Finanziaria`,
        40, doc.page.height - 30, { align: 'center' }
      );

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating enhanced PDF report:', error);
      res.status(500).json({ message: 'Failed to generate PDF report: ' + error.message });
    }
  });

  // Account Architecture management endpoints
  app.patch('/api/account-architecture/:id', isAuthenticated, async (req: any, res) => {
    try {
      const architectureId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Get current active architecture for this user
      const existing = await storage.getUserAccountArchitecture(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Architecture not found' });
      }

      // Use the existing architecture's ID, not the one from params if they don't match
      const actualId = existing.id;

      // Parse the request body to extract settings or account updates
      const updateData: any = {};

      // Handle settings updates
      if (req.body.monthlyIncome !== undefined) {
        updateData.monthlyIncome = req.body.monthlyIncome.toString();
      }
      if (req.body.distributionDay !== undefined) {
        updateData.distributionDay = parseInt(req.body.distributionDay);
      }
      if (req.body.autoDistributionEnabled !== undefined) {
        updateData.autoDistributionEnabled = req.body.autoDistributionEnabled;
      }

      // Handle accounts updates if they exist
      if (req.body.accounts) {
        const accounts = req.body.accounts;

        // Update account balances and allocations
        if (accounts.income) {
          if (accounts.income.iban !== undefined) updateData.incomeAccountIban = accounts.income.iban;
          if (accounts.income.balance !== undefined) updateData.incomeAccountBalance = accounts.income.balance.toString();
          if (accounts.income.bankName !== undefined) updateData.incomeAccountBankName = accounts.income.bankName;
        }
        if (accounts.wealth) {
          if (accounts.wealth.iban !== undefined) updateData.wealthAccountIban = accounts.wealth.iban;
          if (accounts.wealth.balance !== undefined) updateData.wealthAccountBalance = accounts.wealth.balance.toString();
          if (accounts.wealth.monthlyAllocation !== undefined) updateData.wealthMonthlyAllocation = accounts.wealth.monthlyAllocation.toString();
          if (accounts.wealth.bankName !== undefined) updateData.wealthAccountBankName = accounts.wealth.bankName;
        }
        if (accounts.operating) {
          if (accounts.operating.iban !== undefined) updateData.operatingAccountIban = accounts.operating.iban;
          if (accounts.operating.balance !== undefined) updateData.operatingAccountBalance = accounts.operating.balance.toString();
          if (accounts.operating.monthlyAllocation !== undefined) updateData.operatingMonthlyAllocation = accounts.operating.monthlyAllocation.toString();
          if (accounts.operating.bankName !== undefined) updateData.operatingAccountBankName = accounts.operating.bankName;
        }
        if (accounts.emergency) {
          if (accounts.emergency.iban !== undefined) updateData.emergencyAccountIban = accounts.emergency.iban;
          if (accounts.emergency.balance !== undefined) updateData.emergencyAccountBalance = accounts.emergency.balance.toString();
          if (accounts.emergency.targetAmount !== undefined) updateData.emergencyTargetAmount = accounts.emergency.targetAmount.toString();
          if (accounts.emergency.monthlyAllocation !== undefined) updateData.emergencyMonthlyAllocation = accounts.emergency.monthlyAllocation.toString();
          if (accounts.emergency.bankName !== undefined) updateData.emergencyAccountBankName = accounts.emergency.bankName;
        }
        if (accounts.investment) {
          if (accounts.investment.iban !== undefined) updateData.investmentAccountIban = accounts.investment.iban;
          if (accounts.investment.balance !== undefined) updateData.investmentAccountBalance = accounts.investment.balance.toString();
          if (accounts.investment.monthlyAllocation !== undefined) updateData.investmentMonthlyAllocation = accounts.investment.monthlyAllocation.toString();
          if (accounts.investment.bankName !== undefined) updateData.investmentAccountBankName = accounts.investment.bankName;
        }
        if (accounts.savings) {
          if (accounts.savings.iban !== undefined) updateData.savingsAccountIban = accounts.savings.iban;
          if (accounts.savings.balance !== undefined) updateData.savingsAccountBalance = accounts.savings.balance.toString();
          if (accounts.savings.monthlyAllocation !== undefined) updateData.savingsMonthlyAllocation = accounts.savings.monthlyAllocation.toString();
          if (accounts.savings.bankName !== undefined) updateData.savingsAccountBankName = accounts.savings.bankName;
        }
      }

      // Handle direct field updates (for balance updates from distribution and account names/bank names)
      const directFields = [
        'incomeAccountBalance', 'wealthAccountBalance', 'operatingAccountBalance',
        'emergencyAccountBalance', 'investmentAccountBalance', 'savingsAccountBalance',
        'incomeAccountName', 'wealthAccountName', 'operatingAccountName',
        'emergencyAccountName', 'investmentAccountName', 'savingsAccountName',
        'incomeAccountIban', 'wealthAccountIban', 'operatingAccountIban',
        'emergencyAccountIban', 'investmentAccountIban', 'savingsAccountIban',
        'incomeAccountBankName', 'wealthAccountBankName', 'operatingAccountBankName',
        'emergencyAccountBankName', 'investmentAccountBankName', 'savingsAccountBankName'
      ];
      for (const field of directFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field].toString();
        }
      }

      const updatedArchitecture = await storage.updateAccountArchitecture(actualId, updateData);
      res.json(updatedArchitecture);
    } catch (error) {
      console.error('Error updating account architecture:', error);
      res.status(500).json({ error: 'Failed to update account architecture' });
    }
  });

  app.delete('/api/account-architecture/:id', isAuthenticated, async (req: any, res) => {
    try {
      const architectureId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Verify ownership
      const existing = await storage.getUserAccountArchitecture(userId);
      if (!existing || existing.id !== architectureId) {
        return res.status(404).json({ error: 'Architecture not found' });
      }

      // Delete the architecture (this will trigger recreation on next access)
      await storage.deleteAccountArchitecture(architectureId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting account architecture:', error);
      res.status(500).json({ error: 'Failed to delete account architecture' });
    }
  });

  app.post('/api/execute-distribution', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const architecture = await storage.getUserAccountArchitecture(userId);

      if (!architecture) {
        return res.status(404).json({ error: 'Architecture not found' });
      }

      // Calculate distribution amounts
      const monthlyIncome = parseFloat(architecture.monthlyIncome || "0");
      const distributions = {
        wealth: parseFloat(architecture.wealthMonthlyAllocation || "0"),
        operating: parseFloat(architecture.operatingMonthlyAllocation || "0"),
        emergency: parseFloat(architecture.emergencyMonthlyAllocation || "0"),
        investment: parseFloat(architecture.investmentMonthlyAllocation || "0"),
        savings: parseFloat(architecture.savingsMonthlyAllocation || "0")
      };

      // Simulate distribution by updating account balances
      const updatedData = {
        incomeAccountBalance: (parseFloat(architecture.incomeAccountBalance || "0") - Object.values(distributions).reduce((sum, amount) => sum + amount, 0)).toString(),
        wealthAccountBalance: (parseFloat(architecture.wealthAccountBalance || "0") + distributions.wealth).toString(),
        operatingAccountBalance: (parseFloat(architecture.operatingAccountBalance || "0") + distributions.operating).toString(),
        emergencyAccountBalance: (parseFloat(architecture.emergencyAccountBalance || "0") + distributions.emergency).toString(),
        investmentAccountBalance: (parseFloat(architecture.investmentAccountBalance || "0") + distributions.investment).toString(),
        savingsAccountBalance: (parseFloat(architecture.savingsAccountBalance || "0") + distributions.savings).toString()
      };

      const updatedArchitecture = await storage.updateAccountArchitecture(architecture.id!, updatedData);
      res.json(updatedArchitecture);
    } catch (error) {
      console.error('Error executing distribution:', error);
      res.status(500).json({ error: 'Failed to execute distribution' });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      // Auto-categorize transaction if category not provided
      let category = req.body.category;
      let budgetCategory = req.body.budgetCategory;

      // Force categorization for investment types
      if (req.body.type === 'investment' || req.body.type === 'goal_contribution') {
        category = 'investimenti';
        budgetCategory = 'savings';
      } else if (!category || !budgetCategory) {
        const autoCategory = automaticCategorization(req.body.description || '', req.body.merchant || '');
        if (!category) category = autoCategory.category;
        if (!budgetCategory) budgetCategory = autoCategory.budgetCategory;
      }

      const transactionData = insertTransactionSchema.parse({ 
        ...req.body,
        category,
        budgetCategory,
        userId,
        amount: String(req.body.amount),
        accountType: req.body.account_type || req.body.accountType // Handle both field names
      });

      // Validate investment amounts against specific account balance
      if (transactionData.type === 'investment') {
        const requestedAmount = parseFloat(transactionData.amount);
        const accountType = transactionData.accountType;

        if (!accountType) {
          return res.status(400).json({ message: "Devi specificare il conto da cui investire" });
        }

        // Get current account balance
        const architecture = await storage.getUserAccountArchitecture(userId);
        if (!architecture) {
          return res.status(400).json({ message: "Architettura dei conti non configurata" });
        }

        const fieldMap = {
          'income': 'incomeAccountBalance',
          'wealth': 'wealthAccountBalance', 
          'operating': 'operatingAccountBalance',
          'emergency': 'emergencyAccountBalance',
          'investment': 'investmentAccountBalance',
          'savings': 'savingsAccountBalance'
        };

        const balanceField = fieldMap[accountType as keyof typeof fieldMap];
        if (!balanceField) {
          return res.status(400).json({ message: "Tipo di conto non valido" });
        }

        const accountBalance = parseFloat((architecture as any)[balanceField] || "0");

        // STRICT VALIDATION: Check if the selected account has enough LIQUID balance
        if (requestedAmount > accountBalance) {
          return res.status(400).json({ 
            message: `❌ SALDO INSUFFICIENTE: Hai solo €${accountBalance.toFixed(2)} di liquidità disponibile nel conto selezionato, ma stai cercando di investire €${requestedAmount.toFixed(2)}. Trasferisci prima i fondi necessari al conto o riduci l'importo dell'investimento.` 
          });
        }
      }

      const transaction = await storage.createTransaction(transactionData);

      // Update account balances based on transaction
      if (transactionData.accountType) {
        // Check if it's a custom account (starts with "custom_")
        if (transactionData.accountType.startsWith('custom_')) {
          const customAccountId = parseInt(transactionData.accountType.replace('custom_', ''));
          const customAccounts = await storage.getCustomAccounts(userId);
          const customAccount = customAccounts.find(acc => acc.id === customAccountId);

          if (customAccount) {
            const amount = parseFloat(transactionData.amount);
            const currentBalance = parseFloat(customAccount.balance || "0");
            let newBalance = currentBalance;

            // Income increases balance, expenses/investments decrease balance
            if (transactionData.type === 'income') {
              newBalance = currentBalance + amount;
            } else if (transactionData.type === 'expense' || transactionData.type === 'investment' || transactionData.type === 'goal_contribution') {
              newBalance = currentBalance - amount;
            }

            // Update custom account balance
            await storage.updateCustomAccount(customAccountId, {
              balance: newBalance.toString()
            });
          }
        } else {
          // Handle standard accounts
          const architecture = await storage.getUserAccountArchitecture(userId);
          if (architecture) {
            const amount = parseFloat(transactionData.amount);
            const fieldMap = {
              'income': 'incomeAccountBalance',
              'wealth': 'wealthAccountBalance', 
              'operating': 'operatingAccountBalance',
              'emergency': 'emergencyAccountBalance',
              'investment': 'investmentAccountBalance',
              'savings': 'savingsAccountBalance'
            };

            const balanceField = fieldMap[transactionData.accountType as keyof typeof fieldMap];
            if (balanceField) {
              const currentBalance = parseFloat((architecture as any)[balanceField] || "0");
              let newBalance = currentBalance;

              // Income increases balance, expenses/investments decrease balance
              if (transactionData.type === 'income') {
                newBalance = currentBalance + amount;
              } else if (transactionData.type === 'expense' || transactionData.type === 'investment' || transactionData.type === 'goal_contribution') {
                newBalance = currentBalance - amount;
              }

              // Update architecture with new balance
              const updateData = {
                [balanceField]: newBalance.toString()
              };
              await storage.updateAccountArchitecture(architecture.id, updateData);
            }
          }
        }
      }

      // If this is a goal contribution, update the goal's current amount
      if (transactionData.type === 'goal_contribution' && transactionData.goalId) {
        const goalId = parseInt(String(transactionData.goalId) || '0');
        const goal = await storage.getUserGoals(userId);
        const targetGoal = goal.find(g => g.id === goalId);

        if (targetGoal) {
          const contributionAmount = parseFloat(transactionData.amount);
          const newCurrentAmount = parseFloat(targetGoal.currentAmount || '0') + contributionAmount;

          await storage.updateGoal(goalId, {
            currentAmount: newCurrentAmount.toString()
          });
        }
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  // Profile completion endpoint
  app.post('/api/profile/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const profileData = req.body;

      // Update user with additional profile information
      const updatedUser = await storage.updateUser(userId, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error completing profile:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // User settings endpoint
  app.put('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { firstName, lastName, websiteUrl } = req.body;

      const updates: Partial<InsertUser> = {};

      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (websiteUrl !== undefined) {
        updates.websiteUrl = websiteUrl;
      }

      const updatedUser = await storage.updateUserSettings(userId, updates);

      req.session.regenerate((err) => {
        if (err) {
          return res.json({ success: true, user: updatedUser });
        }

        req.login(updatedUser, (loginErr) => {
          if (loginErr) {
            return res.json({ success: true, user: updatedUser });
          }

          res.json({ success: true, user: updatedUser });
        });
      });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // GET user settings - recupera dati utente per pagina Settings
  app.get('/api/user/settings', isAuthenticated, async (req: any, res) => {
    console.log('[SETTINGS GET] ===== RECUPERO DATI UTENTE PER SETTINGS =====');

    // Set JSON headers immediately
    res.setHeader('Content-Type', 'application/json');

    try {
      const userId = parseInt(req.user.id);

      console.log('[SETTINGS GET] User ID:', userId);
      console.log('[SETTINGS GET] Request path:', req.path);
      console.log('[SETTINGS GET] Request method:', req.method);

      const user = await storage.getUser(userId);

      if (!user) {
        console.log('[SETTINGS GET] Utente non trovato');
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('[SETTINGS GET] Dati utente dal DB:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        websiteUrl: user.websiteUrl,
        role: user.role
      });

      const responseData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        websiteUrl: user.websiteUrl || '',
        role: user.role
      };

      console.log('[SETTINGS GET] Sending response:', responseData);
      console.log('[SETTINGS GET] ===== FINE RECUPERO =====');

      return res.json(responseData);
    } catch (error) {
      console.error('[SETTINGS GET] Errore nel recupero:', error);
      return res.status(500).json({ message: 'Failed to fetch user settings' });
    }
  });

  // User progress endpoints
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const progressData = insertUserProgressSchema.parse({ ...req.body, userId });
      const progress = await storage.upsertUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(400).json({ message: "Failed to update user progress" });
    }
  });

  // Transaction endpoints
  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Get transaction details before deleting to reverse account balance changes
      const allTransactions = await storage.getUserTransactions(userId, 1000);
      const transactionToDelete = allTransactions.find(t => t.id === id);

      if (transactionToDelete && transactionToDelete.accountType) {
        const accountType = transactionToDelete.accountType;
        const amount = parseFloat(transactionToDelete.amount);

        // Check if it's a custom account
        if (accountType.startsWith('custom_')) {
          const customAccountId = parseInt(accountType.replace('custom_', ''));
          const customAccounts = await storage.getCustomAccounts(userId);
          const customAccount = customAccounts.find(acc => acc.id === customAccountId);

          if (customAccount) {
            const currentBalance = parseFloat(customAccount.balance || "0");
            let newBalance = currentBalance;

            // Reverse the original operation: income decreased balance back, expenses/investments increase balance back
            if (transactionToDelete.type === 'income') {
              newBalance = currentBalance - amount;
            } else if (transactionToDelete.type === 'expense' || transactionToDelete.type === 'investment' || transactionToDelete.type === 'goal_contribution') {
              newBalance = currentBalance + amount;
            }

            // Update custom account balance
            await storage.updateCustomAccount(customAccountId, {
              balance: newBalance.toString()
            });
          }
        } else {
          // Handle standard accounts
          const architecture = await storage.getUserAccountArchitecture(userId);
          if (architecture) {
            const fieldMap = {
              'income': 'incomeAccountBalance',
              'wealth': 'wealthAccountBalance', 
              'operating': 'operatingAccountBalance',
              'emergency': 'emergencyAccountBalance',
              'investment': 'investmentAccountBalance',
              'savings': 'savingsAccountBalance'
            };

            const balanceField = fieldMap[accountType as keyof typeof fieldMap];
            if (balanceField) {
              const currentBalance = parseFloat((architecture as any)[balanceField] || "0");
              let newBalance = currentBalance;

              // Reverse the original operation: income decreased balance back, expenses/investments increase balance back
              if (transactionToDelete.type === 'income') {
                newBalance = currentBalance - amount;
              } else if (transactionToDelete.type === 'expense' || transactionToDelete.type === 'investment' || transactionToDelete.type === 'goal_contribution') {
                newBalance = currentBalance + amount;
              }

              // Update architecture with reversed balance
              const updateData = {
                [balanceField]: newBalance.toString()
              };
              await storage.updateAccountArchitecture(architecture.id, updateData);
            }
          }
        }
      }

      // If this was a goal contribution, also update the goal's current amount
      if (transactionToDelete && transactionToDelete.type === 'goal_contribution' && transactionToDelete.goalId) {
        const goalId = parseInt(String(transactionToDelete.goalId) || '0');
        const goals = await storage.getUserGoals(userId);
        const targetGoal = goals.find(g => g.id === goalId);

        if (targetGoal) {
          const contributionAmount = parseFloat(transactionToDelete.amount);
          const newCurrentAmount = parseFloat(targetGoal.currentAmount || '0') - contributionAmount;

          await storage.updateGoal(goalId, {
            currentAmount: Math.max(0, newCurrentAmount).toString() // Don't go below 0
          });
        }
      }

      await storage.deleteTransaction(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.patch('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Get the existing transaction to verify ownership
      const allTransactions = await storage.getUserTransactions(userId, 10000);
      const existingTransaction = allTransactions.find(t => t.id === id);

      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Verify ownership
      if (existingTransaction.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Update the transaction with the provided fields
      const updatedTransaction = await storage.updateTransaction(id, req.body);
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Recurring transaction endpoints
  app.get('/api/recurring-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const recurringTransactions = await storage.getUserRecurringTransactions(userId);
      res.json(recurringTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ message: "Failed to fetch recurring transactions" });
    }
  });

  app.post('/api/recurring-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      // Auto-categorize subscription
      let category = req.body.category;
      let budgetCategory = req.body.budgetCategory;

      if (!category || !budgetCategory) {
        const autoCategory = automaticCategorization(req.body.description || '', req.body.merchant || '');
        if (!category) category = autoCategory.category;
        if (!budgetCategory) budgetCategory = autoCategory.budgetCategory;
      }

      // Calculate next execution date
      const startDate = new Date(req.body.date || new Date());
      let nextExecutionDate = new Date(startDate);

      if (req.body.frequency === 'monthly' && req.body.dayOfMonth) {
        nextExecutionDate.setDate(req.body.dayOfMonth);
        if (nextExecutionDate <= startDate) {
          nextExecutionDate.setMonth(nextExecutionDate.getMonth() + 1);
        }
      }

      const recurringData = {
        userId,
        type: req.body.type,
        category,
        amount: String(req.body.amount),
        description: req.body.description,
        budgetCategory,
        frequency: req.body.frequency,
        dayOfMonth: req.body.dayOfMonth,
        nextExecutionDate: nextExecutionDate.toISOString().split('T')[0],
        startDate: startDate.toISOString().split('T')[0],
        endDate: req.body.endDate || null,
        isActive: true
      };

      // Create recurring transaction
      const recurringTransaction = await storage.createRecurringTransaction(recurringData);

      // Create the first immediate transaction
      const transactionData = {
        userId,
        type: req.body.type,
        category,
        amount: String(req.body.amount),
        description: req.body.description,
        date: startDate.toISOString().split('T')[0],
        budgetCategory,
        isRecurring: true,
        recurringId: recurringTransaction.id
      };

      const transaction = await storage.createTransaction(transactionData);

      res.json({ recurringTransaction, transaction });
    } catch (error) {
      console.error("Error creating recurring transaction:", error);
      res.status(400).json({ message: "Failed to create recurring transaction" });
    }
  });

  app.put('/api/recurring-transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTransaction = await storage.updateRecurringTransaction(id, req.body);
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      res.status(500).json({ message: "Failed to update recurring transaction" });
    }
  });

  app.delete('/api/recurring-transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRecurringTransaction(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      res.status(500).json({ message: "Failed to delete recurring transaction" });
    }
  });

  // Financial calculation endpoints
  app.post('/api/calculate/goal', isAuthenticated, async (req: any, res) => {
    try {
      const { targetAmount, currentAmount, targetDate, expectedReturn } = req.body;

      const target = parseFloat(targetAmount);
      const current = parseFloat(currentAmount) || 0;
      const returnRate = parseFloat(expectedReturn) / 100 / 12; // Monthly rate
      const months = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));

      const remainingAmount = target - current;

      // Future value of current amount
      const futureValueCurrent = current * Math.pow(1 + returnRate, months);

      // Required monthly contribution
      let monthlyContribution = 0;
      if (remainingAmount > futureValueCurrent) {
        const stillNeeded = remainingAmount - futureValueCurrent;
        if (returnRate > 0) {
          monthlyContribution = stillNeeded / (((Math.pow(1 + returnRate, months) - 1) / returnRate));
        } else {
          monthlyContribution = stillNeeded / months;
        }
      }

      res.json({
        monthlyContribution: Math.max(0, monthlyContribution),
        totalMonths: months,
        futureValueCurrent,
      });
    } catch (error) {
      console.error("Error calculating goal:", error);
      res.status(400).json({ message: "Failed to calculate goal requirements" });
    }
  });

  // Budget endpoints
  app.get('/api/budget/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const settings = await storage.getUserBudgetSettings(userId);
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching budget settings:", error);
      res.status(500).json({ message: "Failed to fetch budget settings" });
    }
  });

  app.post('/api/budget/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const settingsData = { ...req.body, userId };
      const settings = await storage.upsertBudgetSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating budget settings:", error);
      res.status(500).json({ message: "Failed to update budget settings" });
    }
  });

  app.put('/api/budget/settings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const settingsId = parseInt(req.params.id);
      const settingsData = { ...req.body, userId, id: settingsId };
      const settings = await storage.upsertBudgetSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating budget settings:", error);
      res.status(500).json({ message: "Failed to update budget settings" });
    }
  });

  // Category budgets endpoints
  app.get('/api/category-budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const budgets = await db.select()
        .from(categoryBudgets)
        .where(and(eq(categoryBudgets.userId, userId), eq(categoryBudgets.isActive, true)))
        .orderBy(categoryBudgets.category, categoryBudgets.subcategory);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching category budgets:", error);
      res.status(500).json({ message: "Failed to fetch category budgets" });
    }
  });

  app.post('/api/category-budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const budgetData = insertCategoryBudgetSchema.parse({
        ...req.body,
        userId
      });

      const result = await db.insert(categoryBudgets)
        .values(budgetData)
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error creating category budget:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category budget" });
    }
  });

  app.put('/api/category-budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Verify budget belongs to user
      const existingBudget = await db.select()
        .from(categoryBudgets)
        .where(and(eq(categoryBudgets.id, budgetId), eq(categoryBudgets.userId, userId)))
        .limit(1);

      if (existingBudget.length === 0) {
        return res.status(404).json({ message: "Budget not found" });
      }

      const updateData = insertCategoryBudgetSchema.partial().parse(req.body);

      const result = await db.update(categoryBudgets)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(categoryBudgets.id, budgetId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error("Error updating category budget:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category budget" });
    }
  });

  app.delete('/api/category-budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Verify budget belongs to user
      const existingBudget = await db.select()
        .from(categoryBudgets)
        .where(and(eq(categoryBudgets.id, budgetId), eq(categoryBudgets.userId, userId)))
        .limit(1);

      if (existingBudget.length === 0) {
        return res.status(404).json({ message: "Budget not found" });
      }

      await db.delete(categoryBudgets)
        .where(eq(categoryBudgets.id, budgetId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category budget:", error);
      res.status(500).json({ message: "Failed to delete category budget" });
    }
  });

  app.get('/api/budget/category-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const rules = await storage.getCategoryRules(userId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching category rules:", error);
      res.status(500).json({ message: "Failed to fetch category rules" });
    }
  });

  app.post('/api/budget/category-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const ruleData = { ...req.body, userId };
      const rule = await storage.createCategoryRule(ruleData);
      res.json(rule);
    } catch (error) {
      console.error("Error creating category rule:", error);
      res.status(500).json({ message: "Failed to create category rule" });
    }
  });

  // Investment endpoints
  app.get('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const investments = await storage.getUserInvestments(userId);

      // Get real current prices from Finnhub API
      const enrichedInvestments = await Promise.all(investments.map(async (inv) => {
        const purchasePrice = parseFloat(inv.averagePrice || '0'); // Using averagePrice as purchase price
        const shares = parseFloat(inv.quantity || '0'); // Using quantity as shares
        const symbol = inv.name; // Symbol stored in name field

        // Determine instrument type based on symbol patterns
        let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';
        if (symbol.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK/i)) {
          instrumentType = 'crypto';
        } else if (symbol.match(/EUR|GBP|JPY|CHF/i)) {
          instrumentType = 'forex';
        } else if (symbol.match(/ETF|VWCE|VTI|SPY|QQQ/i)) {
          instrumentType = 'etf';
        }

        // Get current price from Finnhub using symbol field first, then name
        let currentPrice = purchasePrice; // Fallback to purchase price
        try {
          const symbolToUse = inv.symbol || symbol;
          const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
          if (realPrice && realPrice > 0) {
            // For EUR investments, convert USD price to EUR using fixed rate
            if (inv.currency === 'EUR' && instrumentType === 'stock' && !symbolToUse.match(/\.L|\.PA\.MI\.DE/)) {
              const EUR_USD_RATE = 1.087; // Current approximate rate
              currentPrice = realPrice / EUR_USD_RATE; // Convert USD to EUR
              console.log(`Investments API 2: Using USD price ${realPrice}, converted to EUR ${currentPrice} for ${symbolToUse}`);
            } else {
              currentPrice = realPrice;
            }
          }
        } catch (error) {
          console.error(`Failed to get price for ${inv.symbol || symbol}:`, error);
        }

        const totalValue = shares * currentPrice;
        const totalCost = shares * purchasePrice;
        const totalReturn = totalValue - totalCost;
        const returnPercentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

        return {
          id: inv.id,
          name: inv.name,
          type: inv.type,
          symbol: symbol,
          shares: shares,
          purchasePrice: purchasePrice,
          currentPrice: currentPrice,
          totalValue: totalValue,
          totalReturn: totalReturn,
          returnPercentage: returnPercentage,
          purchaseDate: inv.createdAt?.toISOString().split('T')[0] || getLocalDateString(),
          instrumentType: instrumentType,
          goalId: inv.goalId
        };
      }));

      res.json(enrichedInvestments);
    } catch (error) {
      console.error('Error fetching investments:', error);
      res.status(500).json({ message: 'Failed to fetch investments' });
    }
  });

  app.post('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { name, symbol, shares, purchasePrice, currentPrice, type, instrumentType, goalId, purchaseDate, sourceAccount } = req.body;

      // Calculate total investment amount
      const totalAmount = parseFloat(shares) * parseFloat(purchasePrice);

      // Get account architecture to validate and handle transfers
      const architecture = await storage.getUserAccountArchitecture(userId);
      if (!architecture) {
        return res.status(400).json({ message: 'Account architecture not found' });
      }

      // Store investment data using the correct schema structure
      const investmentData = {
        userId,
        name: name || symbol,
        symbol: symbol,
        type: type || 'stock',
        quantity: shares?.toString() || '0',
        averagePrice: purchasePrice?.toString() || '0',
        currentPrice: currentPrice?.toString() || purchasePrice?.toString() || '0',
        goalId: goalId || null
      };

      const investment = await storage.createInvestment(investmentData);

      if (sourceAccount) {
        // Get source account balance and validate funds
        let sourceBalance = 0;
        let sourceAccountName = '';
        let sourceAccountBalanceField = '';

        switch (sourceAccount) {
          case 'income':
            sourceBalance = parseFloat(architecture.incomeAccountBalance || '0');
            sourceAccountName = architecture.incomeAccountName || 'Conto Entrate';
            sourceAccountBalanceField = 'incomeAccountBalance';
            break;
          case 'wealth':
            sourceBalance = parseFloat(architecture.wealthAccountBalance || '0');
            sourceAccountName = architecture.wealthAccountName || 'Conto Ricchezza';
            sourceAccountBalanceField = 'wealthAccountBalance';
            break;
          case 'operating':
            sourceBalance = parseFloat(architecture.operatingAccountBalance || '0');
            sourceAccountName = architecture.operatingAccountName || 'Conto Operativo';
            sourceAccountBalanceField = 'operatingAccountBalance';
            break;
          case 'emergency':
            sourceBalance = parseFloat(architecture.emergencyAccountBalance || '0');
            sourceAccountName = architecture.emergencyAccountName || 'Fondo Emergenze';
            sourceAccountBalanceField = 'emergencyAccountBalance';
            break;
          case 'savings':
            sourceBalance = parseFloat(architecture.savingsAccountBalance || '0');
            sourceAccountName = architecture.savingsAccountName || 'Conto Risparmi';
            sourceAccountBalanceField = 'savingsAccountBalance';
            break;
          default:
            return res.status(400).json({ message: 'Invalid source account' });
        }

        // Check if sufficient balance
        if (sourceBalance < totalAmount) {
          return res.status(400).json({ message: 'Saldo insufficiente nel conto selezionato' });
        }

        // Update source account balance (debit)
        const newSourceBalance = sourceBalance - totalAmount;
        const sourceUpdateData: any = {};
        sourceUpdateData[sourceAccountBalanceField] = newSourceBalance.toString();

        // Update investment account balance (credit)
        const currentInvestmentBalance = parseFloat(architecture.investmentAccountBalance || '0');
        const newInvestmentBalance = currentInvestmentBalance + totalAmount;

        await storage.updateAccountArchitecture(architecture.id, {
          ...sourceUpdateData,
          investmentAccountBalance: newInvestmentBalance.toString()
        });

        // Create investment transaction for budget tracking (shows in savings category)
        await storage.createTransaction({
          userId,
          type: 'investment',
          description: `Investimento in ${name}`,
          amount: totalAmount.toString(),
          date: purchaseDate || getLocalDateString(),
          category: 'Investimenti',
          accountType: sourceAccount,
          goalId: goalId || null,
          investmentId: investment.id,
          isRecurring: false,
          merchant: symbol || name,
          budgetCategory: 'savings'
        });
      }

      // Create investment transaction to track the money flow
      const transactionData = {
        userId,
        type: 'investment' as const,
        description: `Acquisto ${shares} ${instrumentType === 'crypto' ? 'unità' : 'azioni'} di ${name}`,
        amount: totalAmount.toString(),
        date: purchaseDate || getLocalDateString(),
        category: 'investimenti',
        goalId: goalId || null,
        investmentId: investment.id,
        accountType: 'investment' as const,
        isRecurring: false,
        merchant: sourceAccount ? `Da ${getSourceAccountName(sourceAccount, architecture)}` : name,
        budgetCategory: 'investimenti'
      };

      // Create the transaction
      await storage.createTransaction(transactionData);

      // If no source account specified, just update investment account balance
      if (!sourceAccount) {
        const currentBalance = parseFloat(architecture.investmentAccountBalance || '0');
        const newBalance = currentBalance + totalAmount;

        await storage.updateAccountArchitecture(architecture.id, {
          investmentAccountBalance: newBalance.toString()
        });
      }

      // Update connected goal progress if goalId is provided
      if (goalId) {
        const goals = await storage.getUserGoals(userId);
        const targetGoal = goals.find(g => g.id === goalId);

        if (targetGoal) {
          const newCurrentAmount = parseFloat(targetGoal.currentAmount || '0') + totalAmount;

          await storage.updateGoal(goalId, {
            currentAmount: newCurrentAmount.toString()
          });
        }
      }

      // Return in the frontend expected format
      const enrichedInvestment = {
        id: investment.id,
        name: investment.name,
        type: investment.type,
        symbol: investment.symbol || symbol,
        shares: parseFloat(investment.quantity || '0'),
        purchasePrice: parseFloat(investment.averagePrice || '0'),
        currentPrice: parseFloat(investment.currentPrice || investment.averagePrice || '0'),
        totalValue: parseFloat(investment.quantity || '0') * parseFloat(investment.currentPrice || investment.averagePrice || '0'),
        totalReturn: (parseFloat(investment.quantity || '0') * parseFloat(investment.currentPrice || investment.averagePrice || '0')) - (parseFloat(investment.quantity || '0') * parseFloat(investment.averagePrice || '0')),
        returnPercentage: parseFloat(investment.averagePrice || '0') > 0 ? 
          (((parseFloat(investment.currentPrice || '0') - parseFloat(investment.averagePrice || '0')) / parseFloat(investment.averagePrice || '0')) * 100) : 0,
        purchaseDate: investment.createdAt?.toISOString().split('T')[0] || getLocalDateString(),
        instrumentType: instrumentType || 'stock',
        goalId: investment.goalId
      };

      res.status(201).json(enrichedInvestment);
    } catch (error) {
      console.error('Error creating investment:', error);
      res.status(500).json({ message: 'Failed to create investment' });
    }
  });

  // Helper function to get source account name  
  function getSourceAccountName(sourceAccount: string, architecture: any): string {
    switch (sourceAccount) {
      case 'income': return architecture.incomeAccountName || 'Conto Entrate';
      case 'wealth': return architecture.wealthAccountName || 'Conto Ricchezza';
      case 'operating': return architecture.operatingAccountName || 'Conto Operativo';
      case 'emergency': return architecture.emergencyAccountName || 'Fondo Emergenze';
      case 'savings': return architecture.savingsAccountName || 'Conto Risparmi';
      default: return 'Account Sconosciuto';
    }
  }

  app.put('/api/investments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const investmentId = parseInt(req.params.id);
      const investment = await storage.updateInvestment(investmentId, req.body);
      res.json(investment);
    } catch (error) {
      console.error('Error updating investment:', error);
      res.status(500).json({ message: 'Failed to update investment' });
    }
  });

  app.delete('/api/investments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const investmentId = parseInt(req.params.id);
      const targetAccount = req.query.targetAccount as string;

      if (!targetAccount) {
        return res.status(400).json({ message: 'Target account is required' });
      }

      // Get the investment details before deleting
      const investments = await storage.getUserInvestments(userId);
      const investment = investments.find(inv => inv.id === investmentId);

      if (!investment) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      // Calculate the current value of the investment and gains/losses
      const shares = parseFloat(investment.quantity || '1');
      const purchasePrice = parseFloat(investment.averagePrice || '0');

      // Get current market price from Finnhub if available, otherwise use average price
      let currentPrice = purchasePrice;
      if (investment.symbol) {
        try {
          const quote = await finnhubService.getQuote(investment.symbol);
          if (quote && quote.c > 0) {
            currentPrice = quote.c;
          }
        } catch (error) {
          console.log('Could not fetch current price, using purchase price');
        }
      }

      const totalValue = shares * currentPrice;
      const totalCost = shares * purchasePrice;
      const totalGainLoss = totalValue - totalCost;
      const gainLossPercentage = totalCost > 0 ? Number(((totalGainLoss / totalCost) * 100).toFixed(2)) : 0;

      console.log(`Investment sale calculation:
        Shares: ${shares}
        Purchase Price: ${purchasePrice}
        Current Price: ${currentPrice}
        Total Value: ${totalValue}
        Total Cost: ${totalCost}
        Gain/Loss: ${totalGainLoss}
        Percentage: ${gainLossPercentage}%`);


      // Update the linked goal if present - only reduce the goal amount, don't add money to it
      if (investment.goalId) {
        const goal = await storage.getUserGoals(userId).then(goals => 
          goals.find(g => g.id === investment.goalId)
        );

        if (goal) {
          // Reduce the goal's current amount by the original investment cost, not the current value
          const originalCost = shares * purchasePrice;
          const currentAmount = parseFloat(goal.currentAmount || '0');
          const newCurrentAmount = Math.max(0, currentAmount - originalCost);

          await storage.updateGoal(investment.goalId, {
            currentAmount: newCurrentAmount.toString()
          });
        }
      }

      // Delete the investment
      await storage.deleteInvestment(investmentId);

      // Return the money to the selected account
      const architecture = await storage.getUserAccountArchitecture(userId);
      if (architecture && totalValue > 0) {
        const fieldMap = {
          'income': 'incomeAccountBalance',
          'wealth': 'wealthAccountBalance', 
          'operating': 'operatingAccountBalance',
          'emergency': 'emergencyAccountBalance',
          'investment': 'investmentAccountBalance',
          'savings': 'savingsAccountBalance'
        };

        const accountNames = {
          'income': 'Conto di Ingresso/Smistamento',
          'wealth': 'Conto Pila (Wealth Account)', 
          'operating': 'Conto Circolante',
          'emergency': 'Conto Emergenze/Sicurezza',
          'investment': 'Conto Investimenti/Libertà',
          'savings': 'Conto Accantonamenti/Tasse Annuali'
        };

        const balanceField = fieldMap[targetAccount as keyof typeof fieldMap];
        const accountName = accountNames[targetAccount as keyof typeof accountNames];

        if (balanceField) {
          const currentBalance = parseFloat((architecture as any)[balanceField] || '0');
          const newBalance = currentBalance + totalValue;

          console.log(`Updating account balance:
            Target Account: ${targetAccount}
            Balance Field: ${balanceField}
            Current Balance: ${currentBalance}
            Sale Amount: ${totalValue}
            New Balance: ${newBalance}`);

          await storage.updateAccountArchitecture(architecture.id, {
            [balanceField]: newBalance.toString()
          });

          // Create a transaction record for the sale
          await storage.createTransaction({
            userId,
            type: 'income',
            amount: totalValue.toString(),
            description: `Vendita investimento: ${investment.name}`,
            date: getLocalDateString(),
            category: 'Investimenti',
            accountType: targetAccount
          });
        }
      }

      res.json({ 
        message: 'Investment deleted successfully', 
        returnedAmount: totalValue,
        targetAccount: targetAccount,
        gainLoss: totalGainLoss,
        gainLossPercentage: gainLossPercentage,
        investmentName: investment.name,
        shares: shares,
        purchasePrice: purchasePrice,
        sellPrice: currentPrice
      });
    } catch (error) {
      console.error('Error deleting investment:', error);
      res.status(500).json({ message: 'Failed to delete investment' });
    }
  });

  // Financial data search endpoints
  app.get('/api/financial/search', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const results = await finnhubService.searchSymbols(query);

      // Format results for frontend consumption
      const formattedResults = results.slice(0, 20).map((result: any) => ({
        symbol: result.symbol,
        name: result.description,
        type: result.type,
        displaySymbol: result.displaySymbol
      }));

      res.json(formattedResults);
    } catch (error) {
      console.error('Error searching financial instruments:', error);
      res.status(500).json({ message: 'Failed to search financial instruments' });
    }
  });

  app.get('/api/financial/quote/:symbol', isAuthenticated, async (req: any, res) => {
    try {
      const symbol = req.params.symbol;
      const type = req.query.type as 'stock' | 'crypto' | 'forex' | 'etf' || 'stock';

      const quote = await finnhubService.getPrice(symbol, type);

      if (quote === null) {
        return res.status(404).json({ message: 'Quote not found' });
      }

      res.json({ 
        symbol,
        price: quote,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Error getting quote for ${req.params.symbol}:`, error);
      res.status(500).json({ message: 'Failed to get quote' });
    }
  });

  app.get('/api/financial/company/:symbol', isAuthenticated, async (req: any, res) => {
    try {
      const symbol = req.params.symbol;
      const profile = await finnhubService.getCompanyProfile(symbol);

      if (!profile) {
        return res.status(404).json({ message: 'Company profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error(`Error getting company profile for ${req.params.symbol}:`, error);
      res.status(500).json({ message: 'Failed to get company profile' });
    }
  });

  // Account Architecture endpoints
  app.get('/api/account-architecture', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const [architecture, investments] = await Promise.all([
        storage.getUserAccountArchitecture(userId),
        storage.getUserInvestments(userId)
      ]);

      if (!architecture) {
        return res.json(null);
      }

      // Calculate real-time total portfolio value for investment account
      const totalPortfolioValue = await investments.reduce(async (sumPromise, inv) => {
        const sum = await sumPromise;
        const quantity = parseFloat(inv.quantity || "0");
        let currentPrice = parseFloat(inv.averagePrice || "0");

        try {
          const symbolToUse = inv.symbol || inv.name;
          let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

          if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK|DOGE|XRP|LTC/i)) {
            instrumentType = 'crypto';
          } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
            instrumentType = 'forex';
          } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
            instrumentType = 'etf';
          }

          const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
          if (realPrice && realPrice > 0) {
            currentPrice = realPrice;

            // Convert USD to EUR for US stocks/ETFs if investment is stored in EUR
            if (inv.currency === 'EUR' && instrumentType === 'stock' && !symbolToUse.match(/\.L|\.PA\.MI\.DE/)) {
              const EUR_USD_RATE = 1.087; // Approximate USD to EUR conversion
            }
          }
        } catch (error) {
          console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
        }

        return sum + (quantity * currentPrice);
      }, Promise.resolve(0));

      // Get sub accounts
      const subAccounts = await storage.getSubAccounts(architecture.id);

      // Transform to expected format with 6 accounts
      const response = {
        id: architecture.id,
        userId: architecture.userId,
        monthlyIncome: parseFloat(architecture.monthlyIncome || "0"),
        autoDistributionEnabled: architecture.autoDistributionEnabled,
        distributionDay: architecture.distributionDay,
        accounts: {
          income: {
            name: architecture.incomeAccountName,
            bankName: architecture.incomeAccountBankName,
            iban: architecture.incomeAccountIban,
            balance: parseFloat(architecture.incomeAccountBalance || "0"),
            type: "income",
            description: "Hub centrale dove entrano tutti i soldi"
          },
          wealth: {
            name: architecture.wealthAccountName,
            bankName: architecture.wealthAccountBankName,
            iban: architecture.wealthAccountIban,
            balance: parseFloat(architecture.wealthAccountBalance || "0"),
            monthlyAllocation: parseFloat(architecture.wealthMonthlyAllocation || "0"),
            type: "wealth",
            description: "Liquidità per futuri investimenti"
          },
          operating: {
            name: architecture.operatingAccountName,
            bankName: architecture.operatingAccountBankName,
            iban: architecture.operatingAccountIban,
            balance: parseFloat(architecture.operatingAccountBalance || "0"),
            monthlyAllocation: parseFloat(architecture.operatingMonthlyAllocation || "0"),
            type: "operating",
            description: "Spese quotidiane e variabili"
          },
          emergency: {
            name: architecture.emergencyAccountName,
            bankName: architecture.emergencyAccountBankName,
            iban: architecture.emergencyAccountIban,
            balance: parseFloat(architecture.emergencyAccountBalance || "0"),
            targetAmount: parseFloat(architecture.emergencyTargetAmount || "0"),
            monthlyAllocation: parseFloat(architecture.emergencyMonthlyAllocation || "0"),
            type: "emergency",
            description: "Fondo emergenze (3-6 mesi di spese)"
          },
          investment: {
            name: architecture.investmentAccountName,
            bankName: architecture.investmentAccountBankName,
            iban: architecture.investmentAccountIban,
            balance: totalPortfolioValue, // Valore totale del portafoglio investimenti
            monthlyAllocation: parseFloat(architecture.investmentMonthlyAllocation || "0"),
            type: "investment",
            description: "Valore totale del portafoglio investimenti (es. Degiro)",
            totalPortfolioValue: totalPortfolioValue // Stesso valore - il conto rappresenta il portafoglio
          },
          savings: {
            name: architecture.savingsAccountName,
            bankName: architecture.savingsAccountBankName,
            iban: architecture.savingsAccountIban,
            balance: parseFloat(architecture.savingsAccountBalance || "0"),
            monthlyAllocation: parseFloat(architecture.savingsMonthlyAllocation || "0"),
            type: "savings",
            description: "Accantonamenti per spese annuali",
            subAccounts: subAccounts.map(sub => ({
              id: sub.id,
              name: sub.name,
              targetAmount: parseFloat(sub.targetAmount || "0"),
              currentAmount: parseFloat(sub.currentAmount || "0"),
              monthlyAllocation: parseFloat(sub.monthlyAllocation || "0")
            }))
          }
        },
        isActive: architecture.isActive,
        createdAt: architecture.createdAt,
        updatedAt: architecture.updatedAt
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching account architecture:', error);
      res.status(500).json({ message: 'Failed to fetch account architecture' });
    }
  });

  app.post('/api/account-architecture', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const data = req.body;

      console.log('=== ARCHITECTURE CREATION ===');
      console.log('User ID:', userId);
      console.log('Data received:', JSON.stringify(data, null, 2));
      console.log('Investment config:', JSON.stringify(data.investmentConfig, null, 2));

      // Get user's monthly income for auto-calculation
      const incomes = await storage.getUserIncomes(userId);
      const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.monthlyAmount || "0"), 0);

      // Create architecture with 6 standard accounts
      const architectureData = {
        userId,
        monthlyIncome: data.monthlyIncome?.toString() || "0",
        autoDistributionEnabled: data.autoDistributionEnabled || true,
        distributionDay: data.distributionDay || 1,
        // Fixed account names that cannot be modified
        incomeAccountName: "Conto di Ingresso/Smistamento",
        incomeAccountBankName: data.accounts?.income?.bankName || "",
        incomeAccountIban: data.accounts?.income?.iban || "",
        incomeAccountBalance: data.accounts?.income?.balance?.toString() || "0",
        wealthAccountName: "Conto Pila", 
        wealthAccountBankName: data.accounts?.wealth?.bankName || "",
        wealthAccountIban: data.accounts?.wealth?.iban || "",
        wealthAccountBalance: data.accounts?.wealth?.balance?.toString() || "0",
        wealthMonthlyAllocation: data.accounts?.wealth?.monthlyAllocation?.toString() || "0",
        operatingAccountName: "Conto Circolante",
        operatingAccountBankName: data.accounts?.operating?.bankName || "",
        operatingAccountIban: data.accounts?.operating?.iban || "",
        operatingAccountBalance: data.accounts?.operating?.balance?.toString() || "0",
        operatingMonthlyAllocation: data.accounts?.operating?.monthlyAllocation?.toString() || "0",
        emergencyAccountName: "Conto Emergenze",
        emergencyAccountBankName: data.accounts?.emergency?.bankName || "",
        emergencyAccountIban: data.accounts?.emergency?.iban || "",
        emergencyAccountBalance: data.accounts?.emergency?.balance?.toString() || "0",
        emergencyTargetAmount: data.accounts?.emergency?.targetAmount?.toString() || "0",
        emergencyMonthlyAllocation: data.accounts?.emergency?.monthlyAllocation?.toString() || "0",
        investmentAccountName: "Conto Investimenti",
        investmentAccountBankName: data.accounts?.investment?.bankName || "",
        investmentAccountIban: data.accounts?.investment?.iban || "",
        investmentAccountBalance: data.accounts?.investment?.balance?.toString() || "0",
        investmentMonthlyAllocation: data.accounts?.investment?.monthlyAllocation?.toString() || "0",
        savingsAccountName: "Conto Accantonamenti",
        savingsAccountBankName: data.accounts?.savings?.bankName || "",
        savingsAccountIban: data.accounts?.savings?.iban || "",
        savingsAccountBalance: data.accounts?.savings?.balance?.toString() || "0",
        savingsMonthlyAllocation: data.accounts?.savings?.monthlyAllocation?.toString() || "0",
        isActive: true
      };

      const architecture = await storage.createAccountArchitecture(architectureData);

      // Process investment configuration if provided
      const investmentConfig = data.investmentConfig;
      console.log('Processing investment config:', investmentConfig);

      if (investmentConfig && investmentConfig.existingInvestments && investmentConfig.existingInvestments.length > 0) {
        console.log(`Creating ${investmentConfig.existingInvestments.length} investments`);

        // Create investments in the portfolio
        for (const investment of investmentConfig.existingInvestments) {
          console.log('Processing investment:', investment);
          if (investment.name && (investment.totalValue > 0 || investment.currentValue > 0)) {
            try {
              // Check for duplicates before creating
              const existingInvestment = await storage.getUserInvestments(userId);
              const isDuplicate = existingInvestment.some(inv => 
                inv.name === investment.name && inv.symbol === (investment.symbol || investment.name)
              );

              if (isDuplicate) {
                console.log(`Skipping duplicate investment: ${investment.name}`);
                continue;
              }

              // Use totalValue if available, otherwise currentValue
              const totalValue = investment.totalValue || investment.currentValue;
              const quantity = investment.quantity || 1;
              const purchasePrice = investment.purchasePrice || (totalValue / quantity);

              const investmentData = {
                userId,
                name: investment.name,
                symbol: investment.symbol || investment.name,
                type: investment.type || 'stocks',
                quantity: quantity.toString(),
                averagePrice: purchasePrice.toString(),
                currentPrice: purchasePrice.toString()
              };
              console.log('Creating investment with data:', investmentData);

              const createdInvestment = await storage.createInvestment(investmentData);
              console.log('Successfully created investment:', createdInvestment);
            } catch (error) {
              console.error(`Error creating investment ${investment.name}:`, error);
            }
          } else {
            console.log('Skipping investment due to missing name or value:', investment);
          }
        }

        // Create portfolio investment goal if provided
        if (investmentConfig.portfolioGoal && investmentConfig.portfolioGoal.targetAmount > 0) {
          try {
            const currentAmount = investmentConfig.existingInvestments.reduce((sum: number, inv: any) => sum + (inv.totalValue || inv.currentValue || 0), 0);
            const goalData = {
              userId,
              name: 'Obiettivo Portafoglio Investimenti',
              type: 'investment',
              targetAmount: investmentConfig.portfolioGoal.targetAmount.toString(),
              currentAmount: currentAmount.toString(),
              targetDate: investmentConfig.portfolioGoal.targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              category: 'investimenti',
              monthlyContribution: investmentConfig.portfolioGoal.monthlyContribution?.toString() || '0',
              expectedReturn: '10.00',
              description: 'Obiettivo automaticamente creato durante la configurazione dell\'architettura dei conti'
            };
            console.log('Creating portfolio goal with data:', goalData);

            const createdGoal = await storage.createGoal(goalData);
            console.log('Successfully created portfolio goal:', createdGoal);
          } catch (error) {
            console.error('Error creating portfolio goal:', error);
          }
        } else {
          console.log('No portfolio goal to create:', investmentConfig?.portfolioGoal);
        }
      } else {
        console.log('No investment config or existing investments found');
      }

      // Create sub accounts for savings
      if (data.accounts?.savings?.subAccounts && data.accounts.savings.subAccounts.length > 0) {
        for (const subAccount of data.accounts.savings.subAccounts) {
          if (subAccount.name) {
            await storage.createSubAccount({
              architectureId: architecture.id,
              name: subAccount.name,
              targetAmount: subAccount.targetAmount?.toString() || "0",
              currentAmount: subAccount.currentAmount?.toString() || "0",
              monthlyAllocation: subAccount.monthlyAllocation?.toString() || "0"
            });
          }
        }
      }

      res.json({ success: true, id: architecture.id });
    } catch (error) {
      console.error('Error creating account architecture:', error);
      res.status(500).json({ message: 'Failed to create account architecture' });
    }
  });

  app.put('/api/account-architecture', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const data = req.body;

      // Get existing architecture
      const existing = await storage.getUserAccountArchitecture(userId);
      if (!existing) {
        return res.status(404).json({ message: 'Architecture not found' });
      }

      // Update architecture - can only modify allocations and balances, not names
      const architectureData = {
        wealthMonthlyAllocation: data.accounts?.wealth?.monthlyAllocation?.toString() || existing.wealthMonthlyAllocation,
        wealthAccountBalance: data.accounts?.wealth?.balance?.toString() || existing.wealthAccountBalance,
        operatingMonthlyAllocation: data.accounts?.operating?.monthlyAllocation?.toString() || existing.operatingMonthlyAllocation,
        operatingAccountBalance: data.accounts?.operating?.balance?.toString() || existing.operatingAccountBalance,
        investmentMonthlyAllocation: data.accounts?.investment?.monthlyAllocation?.toString() || existing.investmentMonthlyAllocation,
        investmentAccountBalance: data.accounts?.investment?.balance?.toString() || existing.investmentAccountBalance,
        emergencyTargetAmount: data.accounts?.emergency?.targetAmount?.toString() || existing.emergencyTargetAmount,
        emergencyAccountBalance: data.accounts?.emergency?.balance?.toString() || existing.emergencyAccountBalance,
        emergencyMonthlyAllocation: data.accounts?.emergency?.monthlyAllocation?.toString() || existing.emergencyMonthlyAllocation,
        savingsMonthlyAllocation: data.accounts?.savings?.monthlyAllocation?.toString() || existing.savingsMonthlyAllocation,
        savingsAccountBalance: data.accounts?.savings?.balance?.toString() || existing.savingsAccountBalance,
        autoDistributionEnabled: data.autoDistributionEnabled ?? existing.autoDistributionEnabled,
        distributionDay: data.distributionDay || existing.distributionDay
      };

      await storage.updateAccountArchitecture(existing.id, architectureData);

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating account architecture:', error);
      res.status(500).json({ message: 'Failed to update account architecture' });
    }
  });

  // Distribution plan endpoint with automatic calculation
  app.get('/api/distribution-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      // Get user's architecture
      const architecture = await storage.getUserAccountArchitecture(userId);
      if (!architecture) {
        return res.json({ message: 'No architecture configured' });
      }

      // Get user's total monthly income
      const incomes = await storage.getUserIncomes(userId);
      const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.monthlyAmount || "0"), 0);

      // Update architecture with current monthly income if different
      if (totalIncome !== parseFloat(architecture.monthlyIncome || "0")) {
        await storage.updateAccountArchitecture(architecture.id, {
          monthlyIncome: totalIncome.toString()
        });
      }

      // Calculate smart distributions
      const emergencyTarget = parseFloat(architecture.emergencyTargetAmount || "0");
      const emergencyCurrent = parseFloat(architecture.emergencyAccountBalance || "0");
      const emergencyNeeded = Math.max(0, emergencyTarget - emergencyCurrent);

      // Emergency gets priority if not full (10% or remaining needed)
      const emergencyAllocation = emergencyNeeded > 0 
        ? Math.min(totalIncome * 0.1, emergencyNeeded)
        : 0;

      const distributions = {
        income: totalIncome, // What comes in
        wealth: parseFloat(architecture.wealthMonthlyAllocation || "0"),
        operating: parseFloat(architecture.operatingMonthlyAllocation || "0"),
        emergency: emergencyAllocation,
        investment: parseFloat(architecture.investmentMonthlyAllocation || "0"),
        savings: parseFloat(architecture.savingsMonthlyAllocation || "0")
      };

      // Get sub-accounts for savings breakdown
      const subAccounts = await storage.getSubAccounts(architecture.id);
      const savingsBreakdown = subAccounts.map(sub => ({
        name: sub.name,
        monthlyAmount: parseFloat(sub.monthlyAllocation || "0"),
        targetAmount: parseFloat(sub.targetAmount || "0"),
        currentAmount: parseFloat(sub.currentAmount || "0"),
        progress: parseFloat(sub.targetAmount || "0") > 0 
          ? (parseFloat(sub.currentAmount || "0") / parseFloat(sub.targetAmount || "0")) * 100 
          : 0
      }));

      const totalAllocated = distributions.wealth + distributions.operating + 
                           distributions.emergency + distributions.investment + 
                           distributions.savings;

      const response = {
        totalIncome,
        totalAllocated,
        remainingUnallocated: totalIncome - totalAllocated,
        distributions,
        savingsBreakdown,
        transferInstructions: [
          { 
            from: "Conto di Ingresso", 
            to: architecture.wealthAccountName,
            amount: distributions.wealth,
            iban: architecture.wealthAccountIban,
            description: "Liquidità pre-investimento"
          },
          { 
            from: "Conto di Ingresso", 
            to: architecture.operatingAccountName,
            amount: distributions.operating,
            iban: architecture.operatingAccountIban,
            description: "Spese mensili"
          },
          { 
            from: "Conto di Ingresso", 
            to: architecture.emergencyAccountName,
            amount: distributions.emergency,
            iban: architecture.emergencyAccountIban,
            description: "Fondo emergenze"
          },
          { 
            from: "Conto di Ingresso", 
            to: architecture.investmentAccountName,
            amount: distributions.investment,
            iban: architecture.investmentAccountIban,
            description: "Investimenti mensili"
          },
          { 
            from: "Conto di Ingresso", 
            to: architecture.savingsAccountName,
            amount: distributions.savings,
            iban: architecture.savingsAccountIban,
            description: "Accantonamenti vari"
          }
        ].filter(instruction => instruction.amount > 0),
        nextDistributionDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, architecture.distributionDay || 2).toISOString().split('T')[0]
      };

      res.json(response);
    } catch (error) {
      console.error('Error calculating distribution plan:', error);
      res.status(500).json({ message: 'Failed to calculate distribution plan' });
    }
  });

  // Update distribution allocations
  app.put('/api/distribution-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { distributions } = req.body;

      // Get existing architecture
      const architecture = await storage.getUserAccountArchitecture(userId);

      if (!architecture) {
        return res.status(404).json({ message: 'Account architecture not found' });
      }

      // Update the architecture with new distribution amounts
      const updates = {
        wealthMonthlyAllocation: distributions.wealth?.toString() || architecture.wealthMonthlyAllocation,
        operatingMonthlyAllocation: distributions.operating?.toString() || architecture.operatingMonthlyAllocation,
        emergencyMonthlyAllocation: distributions.emergency?.toString() || architecture.emergencyMonthlyAllocation,
        investmentMonthlyAllocation: distributions.investment?.toString() || architecture.investmentMonthlyAllocation,
        savingsMonthlyAllocation: distributions.savings?.toString() || architecture.savingsMonthlyAllocation
      };

      await storage.updateAccountArchitecture(architecture.id, updates);

      res.json({ success: true, distributions });
    } catch (error) {
      console.error('Error saving distribution plan:', error);
      res.status(500).json({ message: 'Failed to save distribution plan' });
    }
  });

  // Transfer between accounts endpoint
  app.post('/api/accounts/transfer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { fromAccount, toAccount, amount, description } = req.body;

      if (!fromAccount || !toAccount || !amount) {
        return res.status(400).json({ message: "Parametri mancanti per il trasferimento" });
      }

      if (fromAccount === toAccount) {
        return res.status(400).json({ message: "Non puoi trasferire su lo stesso conto" });
      }

      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        return res.status(400).json({ message: "L'importo deve essere maggiore di zero" });
      }

      const architecture = await storage.getUserAccountArchitecture(userId);
      if (!architecture) {
        return res.status(404).json({ message: "Architettura dei conti non trovata" });
      }

      // Handle custom accounts
      if (fromAccount.startsWith('custom_') || toAccount.startsWith('custom_')) {
        const customAccounts = await storage.getCustomAccounts(userId);

        let fromBalance = 0;
        let toBalance = 0;

        // Get balances for custom or standard accounts
        if (fromAccount.startsWith('custom_')) {
          const customAccountId = parseInt(fromAccount.replace('custom_', ''));
          const customAccount = customAccounts.find(acc => acc.id === customAccountId);
          if (!customAccount) return res.status(400).json({ message: "Conto personalizzato di origine non trovato" });
          fromBalance = parseFloat(customAccount.balance || "0");
        } else {
          const fieldMap = {
            'income': 'incomeAccountBalance',
            'wealth': 'wealthAccountBalance', 
            'operating': 'operatingAccountBalance',
            'emergency': 'emergencyAccountBalance',
            'investment': 'investmentAccountBalance',
            'savings': 'savingsAccountBalance'
          };
          const fromField = fieldMap[fromAccount as keyof typeof fieldMap];
          if (!fromField) return res.status(400).json({ message: "Tipo di conto di origine non valido" });
          fromBalance = parseFloat((architecture as any)[fromField] || "0");
        }

        if (toAccount.startsWith('custom_')) {
          const customAccountId = parseInt(toAccount.replace('custom_', ''));
          const customAccount = customAccounts.find(acc => acc.id === customAccountId);
          if (!customAccount) return res.status(400).json({ message: "Conto personalizzato di destinazione non trovato" });
          toBalance = parseFloat(customAccount.balance || "0");
        } else {
          const fieldMap = {
            'income': 'incomeAccountBalance',
            'wealth': 'wealthAccountBalance', 
            'operating': 'operatingAccountBalance',
            'emergency': 'emergencyAccountBalance',
            'investment': 'investmentAccountBalance',
            'savings': 'savingsAccountBalance'
          };
          const toField = fieldMap[toAccount as keyof typeof fieldMap];
          if (!toField) return res.status(400).json({ message: "Tipo di conto di destinazione non valido" });
          toBalance = parseFloat((architecture as any)[toField] || "0");
        }

        // Check sufficient balance
        if (fromBalance < transferAmount) {
          return res.status(400).json({ 
            message: `Saldo insufficiente. Disponibile: €${fromBalance.toFixed(2)}, richiesto: €${transferAmount.toFixed(2)}` 
          });
        }

        // Update balances
        if (fromAccount.startsWith('custom_')) {
          const customAccountId = parseInt(fromAccount.replace('custom_', ''));
          await storage.updateCustomAccount(customAccountId, { balance: (fromBalance - transferAmount).toString() });
        } else {
          const fieldMap = {
            'income': 'incomeAccountBalance',
            'wealth': 'wealthAccountBalance', 
            'operating': 'operatingAccountBalance',
            'emergency': 'emergencyAccountBalance',
            'investment': 'investmentAccountBalance',
            'savings': 'savingsAccountBalance'
          };
          const fromField = fieldMap[fromAccount as keyof typeof fieldMap];
          await storage.updateAccountArchitecture(architecture.id, {
            [fromField]: (fromBalance - transferAmount).toString()
          });
        }

        if (toAccount.startsWith('custom_')) {
          const customAccountId = parseInt(toAccount.replace('custom_', ''));
          await storage.updateCustomAccount(customAccountId, { balance: (toBalance + transferAmount).toString() });
        } else {
          const fieldMap = {
            'income': 'incomeAccountBalance',
            'wealth': 'wealthAccountBalance', 
            'operating': 'operatingAccountBalance',
            'emergency': 'emergencyAccountBalance',
            'investment': 'investmentAccountBalance',
            'savings': 'savingsAccountBalance'
          };
          const toField = fieldMap[toAccount as keyof typeof fieldMap];
          await storage.updateAccountArchitecture(architecture.id, {
            [toField]: (toBalance + transferAmount).toString()
          });
        }

        // Create transfer transactions
        await storage.createTransaction({
          userId,
          type: 'transfer',
          amount: transferAmount.toString(),
          category: 'Trasferimenti',
          budgetCategory: 'needs',
          description: description || `Trasferimento da ${fromAccount} a ${toAccount}`,
          date: getLocalDateString(),
          accountType: fromAccount
        });

        await storage.createTransaction({
          userId,
          type: 'transfer',
          amount: transferAmount.toString(),
          category: 'Trasferimenti', 
          budgetCategory: 'needs',
          description: description || `Ricevuto da ${fromAccount}`,
          date: getLocalDateString(),
          accountType: toAccount
        });

        res.json({ 
          success: true, 
          message: `Trasferimento di €${transferAmount.toFixed(2)} completato`,
          fromBalance: fromBalance - transferAmount,
          toBalance: toBalance + transferAmount
        });
        return;
      }

      const fieldMap = {
        'income': 'incomeAccountBalance',
        'wealth': 'wealthAccountBalance', 
        'operating': 'operatingAccountBalance',
        'emergency': 'emergencyAccountBalance',
        'investment': 'investmentAccountBalance',
        'savings': 'savingsAccountBalance'
      };

      const fromField = fieldMap[fromAccount as keyof typeof fieldMap];
      const toField = fieldMap[toAccount as keyof typeof fieldMap];

      if (!fromField || !toField) {
        return res.status(400).json({ message: "Tipo di conto non valido" });
      }

      const fromBalance = parseFloat((architecture as any)[fromField] || "0");
      const toBalance = parseFloat((architecture as any)[toField] || "0");

      // Check if from account has enough balance
      if (fromBalance < transferAmount) {
        return res.status(400).json({ 
          message: `Saldo insufficiente. Disponibile: €${fromBalance.toFixed(2)}, richiesto: €${transferAmount.toFixed(2)}` 
        });
      }

      // Update balances
      const updateData = {
        [fromField]: (fromBalance - transferAmount).toString(),
        [toField]: (toBalance + transferAmount).toString()
      };

      await storage.updateAccountArchitecture(architecture.id, updateData);

      // Create transfer transactions for tracking
      await storage.createTransaction({
        userId,
        type: 'transfer',
        amount: transferAmount.toString(),
        category: 'Trasferimenti',
        budgetCategory: 'needs',
        description: description || `Trasferimento da ${fromAccount} a ${toAccount}`,
        date: getLocalDateString(),
        accountType: fromAccount
      });

      await storage.createTransaction({
        userId,
        type: 'transfer',
        amount: transferAmount.toString(),
        category: 'Trasferimenti', 
        budgetCategory: 'needs',
        description: description || `Ricevuto da ${fromAccount}`,
        date: getLocalDateString(),
        accountType: toAccount
      });

      res.json({ 
        success: true, 
        message: `Trasferimento di €${transferAmount.toFixed(2)} completato`,
        fromBalance: fromBalance - transferAmount,
        toBalance: toBalance + transferAmount
      });
    } catch (error) {
      console.error('Error transferring between accounts:', error);
      res.status(500).json({ message: 'Errore durante il trasferimento' });
    }
  });

  // Unified Dashboard endpoint with proper data integration
  app.get('/api/dashboard-unified', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      // Get all financial data including custom accounts
      const [
        assets, 
        liabilities, 
        incomes, 
        expenses, 
        goals, 
        transactions, 
        investments, 
        architecture,
        customAccounts
      ] = await Promise.all([
        storage.getUserAssets(userId),
        storage.getUserLiabilities(userId),
        storage.getUserIncomes(userId),
        storage.getUserExpenses(userId),
        storage.getUserGoals(userId),
        storage.getUserTransactions(userId, 10),
        storage.getUserInvestments(userId),
        storage.getUserAccountArchitecture(userId),
        storage.getCustomAccounts(userId)
      ]);

      // Calculate investments total with real-time prices from Finnhub FIRST
      const totalPortfolioValue = await investments.reduce(async (sumPromise, inv) => {
        const sum = await sumPromise;
        const quantity = parseFloat(inv.quantity || "0");
        let currentPrice = parseFloat(inv.averagePrice || "0"); // Fallback to purchase price

        try {
          // Get real-time price from Finnhub for ALL investments
          const symbolToUse = inv.symbol || inv.name;
          let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

          // Determine instrument type based on symbol patterns
          if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK/i)) {
            instrumentType = 'crypto';
          } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
            instrumentType = 'forex';
          } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
            instrumentType = 'etf';
          }

          const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
          if (realPrice && realPrice > 0) {
            currentPrice = realPrice;

            // Convert USD to EUR for US stocks/ETFs if investment is stored in EUR
            if (inv.currency === 'EUR' && instrumentType === 'stock' && !symbolToUse.match(/\.L|\.PA\.MI\.DE/)) {
              // Use fixed EUR/USD rate since Forex API is not available
              const EUR_USD_RATE = 1.087; // Current approximate rate
              currentPrice = realPrice / EUR_USD_RATE; // Convert USD to EUR
              console.log(`Investments API 2: Using USD price ${realPrice}, converted to EUR ${currentPrice} for ${symbolToUse}`);
            }
          }
        } catch (error) {
          console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
        }

        return sum + (quantity * currentPrice);
      }, Promise.resolve(0));

      // Calculate custom accounts total
      const customAccountsTotal = customAccounts.reduce((sum, account) => {
        return sum + parseFloat(account.balance || "0");
      }, 0);

      // Calculate real patrimony from account architecture
      let liquidityTotal = 0;
      const accounts = {
        income: { balance: 0, name: 'Conto di Ingresso/Smistamento' },
        wealth: { balance: 0, name: 'Conto Pila' },
        operating: { balance: 0, name: 'Conto Circolante' },
        emergency: { balance: 0, name: 'Conto Emergenze' },
        investment: { balance: 0, name: 'Conto Investimenti' },
        savings: { balance: 0, name: 'Conto Accantonamenti' }
      };

      if (architecture) {
        accounts.income.balance = parseFloat(architecture.incomeAccountBalance || "0");
        accounts.wealth.balance = parseFloat(architecture.wealthAccountBalance || "0");
        accounts.operating.balance = parseFloat(architecture.operatingAccountBalance || "0");
        accounts.emergency.balance = parseFloat(architecture.emergencyAccountBalance || "0");

        // Investment account balance shows the TOTAL portfolio value (not separate cash)
        // This represents the value of all holdings in the investment account (e.g., Degiro)
        accounts.investment.balance = totalPortfolioValue;

        accounts.savings.balance = parseFloat(architecture.savingsAccountBalance || "0");

        // Liquidity total includes all accounts EXCEPT investment account (since it's not liquid cash)
        liquidityTotal = accounts.income.balance + accounts.wealth.balance + accounts.operating.balance + 
                        accounts.emergency.balance + accounts.savings.balance + customAccountsTotal;
      }

      const investmentsTotal = totalPortfolioValue; // Total value of investment portfolio

      // Calculate other assets (from assets module)
      const otherAssets = assets.reduce((sum, asset) => sum + parseFloat(asset.value || "0"), 0);

      // Calculate liabilities
      const liabilitiesTotal = liabilities.reduce((sum, lib) => sum + parseFloat(lib.totalAmount || "0"), 0);

      // Net worth calculation - liquidityTotal + investment portfolio + other assets - liabilities
      const netWorth = liquidityTotal + totalPortfolioValue + otherAssets - liabilitiesTotal;

      // Cash flow from architecture
      const monthlyIncome = parseFloat(architecture?.monthlyIncome || "0");
      const monthlyExpenses = expenses
        .filter(exp => exp.isActive)
        .reduce((sum, exp) => sum + parseFloat(exp.monthlyAmount || "0"), 0);
      const netCashFlow = monthlyIncome - monthlyExpenses;

      // Goals analysis with safe parsing
      const goalsAnalysis = {
        total: goals.length,
        completed: goals.filter(g => {
          const current = parseFloat(g.currentAmount || '0');
          const target = parseFloat(g.targetAmount || '0');
          return current >= target && target > 0;
        }).length,
        totalTarget: goals.reduce((sum, g) => {
          const target = parseFloat(g.targetAmount || '0');
          return sum + (isNaN(target) ? 0 : target);
        }, 0),
        totalSaved: goals.reduce((sum, g) => {
          const current = parseFloat(g.currentAmount || '0');
          return sum + (isNaN(current) ? 0 : current);
        }, 0),
        avgProgress: goals.length > 0 ? 
          goals.reduce((sum, g) => {
            const current = parseFloat(g.currentAmount || '0');
            const target = parseFloat(g.targetAmount || '0');
            if (target > 0 && !isNaN(current) && !isNaN(target)) {
              return sum + (current / target);
            }
            return sum;
          }, 0) / goals.length * 100 : 0
      };

      // Distribution plan from architecture including custom accounts
      const distributionPlan: Record<string, number> = {};
      if (architecture) {
        if (architecture.wealthMonthlyAllocation) distributionPlan['wealth'] = parseFloat(architecture.wealthMonthlyAllocation);
        if (architecture.operatingMonthlyAllocation) distributionPlan['operating'] = parseFloat(architecture.operatingMonthlyAllocation);
        if (architecture.emergencyMonthlyAllocation) distributionPlan['emergency'] = parseFloat(architecture.emergencyMonthlyAllocation);
        if (architecture.investmentMonthlyAllocation) distributionPlan['investment'] = parseFloat(architecture.investmentMonthlyAllocation);
        if (architecture.savingsMonthlyAllocation) distributionPlan['savings'] = parseFloat(architecture.savingsMonthlyAllocation);
      }

      // Add custom accounts to distribution plan
      customAccounts.forEach(account => {
        if (account.monthlyAllocation && parseFloat(account.monthlyAllocation) > 0) {
          distributionPlan[`custom_${account.id}`] = parseFloat(account.monthlyAllocation);
        }
      });

      // Recent activity (transactions only)
      const recentActivity = transactions.slice(0, 6).map(t => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: parseFloat(t.amount),
        date: t.date,
        category: t.category
      }));

      // Smart alerts
      const alerts = [];

      if (accounts.emergency.balance < monthlyExpenses * 3 && monthlyExpenses > 0) {
        alerts.push({
          type: 'warning' as const,
          title: 'Fondo Emergenze Insufficiente',
          message: `Hai solo €${accounts.emergency.balance.toLocaleString()} nel fondo emergenze. Dovresti avere almeno €${(monthlyExpenses * 3).toLocaleString()}.`,
          action: 'Incrementa il fondo emergenze'
        });
      }

      if (netCashFlow < 0) {
        alerts.push({
          type: 'error' as const,
          title: 'Spese Superiori alle Entrate',
          message: `Stai spendendo €${Math.abs(netCashFlow).toLocaleString()} in più di quanto guadagni ogni mese.`,
          action: 'Rivedi il budget'
        });
      }

      if (goalsAnalysis.avgProgress > 80 && goals.length > 0) {
        alerts.push({
          type: 'success' as const,
          title: 'Obiettivi Quasi Raggiunti!',
          message: 'Sei molto vicino al completamento dei tuoi obiettivi finanziari.',
          action: 'Pianifica nuovi obiettivi'
        });
      }

      if (liquidityTotal > monthlyIncome * 6 && monthlyIncome > 0) {
        alerts.push({
          type: 'info' as const,
          title: 'Liquidità Elevata',
          message: 'Hai molta liquidità ferma. Considera di investire una parte.',
          action: 'Esplora investimenti'
        });
      }

      // Calculate available liquidity (all liquid accounts)
      // Investment account is not included in liquidity as it represents the portfolio value
      const availableLiquidity = liquidityTotal;

      // Budget analysis based on current month transactions
      const budgetSettings = await storage.getUserBudgetSettings(userId);
      let budgetData = null;

      if (budgetSettings) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        // Get all transactions for budget calculation (not just from the limited transactions array)
        const allTransactions = await storage.getUserTransactions(userId, 1000);
        const monthlyTransactions = allTransactions.filter(t => 
          t.date && t.date.startsWith(currentMonth) && 
          (t.type === 'expense' || t.type === 'investment')
        );

        // Calculate spending by budget category
        const needsSpent = monthlyTransactions
          .filter(t => t.budgetCategory === 'needs')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const wantsSpent = monthlyTransactions
          .filter(t => t.budgetCategory === 'wants')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const savingsSpent = monthlyTransactions
          .filter(t => t.budgetCategory === 'savings')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const monthlyIncomeBudget = parseFloat(budgetSettings.monthlyIncome || '0');
        const needsBudget = monthlyIncomeBudget * (parseFloat(budgetSettings.needsPercentage || '0') / 100);
        const wantsBudget = monthlyIncomeBudget * (parseFloat(budgetSettings.wantsPercentage || '0') / 100);
        const savingsBudget = monthlyIncomeBudget * (parseFloat(budgetSettings.savingsPercentage || '0') / 100);

        budgetData = {
          needs: {
            spent: needsSpent,
            budget: needsBudget,
            percentage: parseFloat(budgetSettings.needsPercentage || '0')
          },
          wants: {
            spent: wantsSpent,
            budget: wantsBudget,
            percentage: parseFloat(budgetSettings.wantsPercentage || '0')
          },
          savings: {
            spent: savingsSpent,
            budget: savingsBudget,
            percentage: parseFloat(budgetSettings.savingsPercentage || '0')
          },
          monthlyIncome: monthlyIncomeBudget
        };


      }



      const response = {
        summary: {
          netWorth,
          liquidityTotal,
          availableLiquidity,
          investmentsTotal,
          customAccountsTotal,
          monthlyIncome,
          monthlyExpenses,
          netCashFlow
        },
        accounts,
        investments: {
          total: investmentsTotal,
          totalPortfolioValue: totalPortfolioValue,
          count: investments.length,
          performance: investments.length > 0 ? 
            investments.reduce((sum, inv) => {
              const shares = parseFloat(inv.quantity || '0');
              const purchasePrice = parseFloat(inv.averagePrice || '0');
              const currentPrice = parseFloat(inv.currentPrice || inv.averagePrice || '0');
              const totalReturn = (shares * currentPrice) - (shares * purchasePrice);
              const returnPercentage = purchasePrice > 0 ? (totalReturn / (shares * purchasePrice)) * 100 : 0;
              return sum + returnPercentage;
            }, 0) / investments.length : 0,
          breakdown: [
            ...(await Promise.all(investments.map(async (inv) => {
              const quantity = parseFloat(inv.quantity || "0");
              let currentPrice = parseFloat(inv.averagePrice || "0");

              try {
                const symbolToUse = inv.symbol || inv.name;
                let instrumentType: 'stock' | 'crypto' | 'forex' | 'etf' = 'stock';

                if (symbolToUse.match(/BTC|ETH|ADA|DOT|SOL|MATIC|LINK/i)) {
                  instrumentType = 'crypto';
                } else if (symbolToUse.match(/EUR|GBP|JPY|CHF|USD/i)) {
                  instrumentType = 'forex';
                } else if (symbolToUse.match(/ETF|VWCE|VTI|SPY|QQQ|VEA|VWO/i)) {
                  instrumentType = 'etf';
                }

                const realPrice = await finnhubService.getPrice(symbolToUse, instrumentType);
                if (realPrice && realPrice > 0) {
                  currentPrice = realPrice;

                  // Convert USD to EUR for US stocks/ETFs if investment is stored in EUR
                  if (inv.currency === 'EUR' && instrumentType === 'stock' && !symbolToUse.match(/\.L|\.PA\.MI\.DE/)) {
                    currentPrice = realPrice * 0.92; // Approximate USD to EUR conversion
                  }
                }
              } catch (error) {
                console.error(`Failed to get real-time price for ${inv.symbol || inv.name}:`, error);
              }

              return {
                name: inv.name,
                value: quantity * currentPrice,
                performance: parseFloat(inv.averagePrice || "0") > 0 ?
                  ((currentPrice - parseFloat(inv.averagePrice || "0")) / parseFloat(inv.averagePrice || "0")) * 100 : 0,
                type: inv.type || 'Unknown'
              };
            }))),

          ]
        },
        goals: goalsAnalysis,
        distributionPlan,
        recentActivity,
        alerts,
        budget: budgetData
      };

      // Disable caching for dashboard-unified to ensure budget data is fresh
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(response);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // Exercises endpoints for consultation system
  app.get('/admin/consultation/exercises', requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const exercisesResult = await db.select()
        .from(exercises)
        .leftJoin(users, eq(exercises.createdBy, users.id))
        .where(eq(exercises.createdBy, userId))
        .orderBy(desc(exercises.createdAt));

      res.json(exercisesResult.map(row => ({
        ...row.exercises,
        createdByName: `${row.users?.firstName || ''} ${row.users?.lastName || ''}`.trim()
      })));
    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ message: 'Failed to fetch exercises' });
    }
  });

  app.post('/admin/consultation/exercises', requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const exerciseData = insertExerciseSchema.parse({
        ...req.body,
        createdBy: userId
      });

      const result = await db.insert(exercises)
        .values(exerciseData)
        .returning();

      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating exercise:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid exercise data", errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create exercise' });
    }
  });

  app.get('/admin/consultation/exercises/public', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const publicExercises = await storage.getPublicExercises(consultantId);
      res.json(publicExercises);
    } catch (error) {
      console.error('Error fetching public exercises:', error);
      res.status(500).json({ message: 'Failed to fetch public exercises' });
    }
  });

  app.put('/admin/consultation/exercises/:id', requireAdmin, async (req: any, res) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Verify ownership
      const existingExercise = await db.select()
        .from(exercises)
        .where(and(eq(exercises.id, exerciseId), eq(exercises.createdBy, userId)))
        .limit(1);

      if (existingExercise.length === 0) {
        return res.status(404).json({ message: "Exercise not found or not owned by user" });
      }

      const updateData = insertExerciseSchema.partial().parse(req.body);

      const result = await db.update(exercises)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(exercises.id, exerciseId))
        .returning();

      res.json(result[0]);
    } catch (error) {
      console.error('Error updating exercise:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid exercise data", errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update exercise' });
    }
  });

  app.delete('/admin/consultation/exercises/:id', requireAdmin, async (req: any, res) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Verify ownership
      const existingExercise = await db.select()
        .from(exercises)
        .where(and(eq(exercises.id, exerciseId), eq(exercises.createdBy, userId)))
        .limit(1);

      if (existingExercise.length === 0) {
        return res.status(404).json({ message: "Exercise not found or not owned by user" });
      }

      await db.delete(exercises)
        .where(eq(exercises.id, exerciseId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      res.status(500).json({ message: 'Failed to delete exercise' });
    }
  });

  // Community endpoints
  app.get('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const posts = await storage.getCommunityPosts();
      res.json(posts);
    } catch (error) {
      console.error('Error fetching community posts:', error);
      res.status(500).json({ message: 'Failed to fetch community posts' });
    }
  });

  app.post('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { title, content, category } = req.body;

      const post = await storage.createCommunityPost({
        userId,
        title,
        content,
        category: category || 'Community'
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating community post:', error);
      res.status(500).json({ message: 'Failed to create community post' });
    }
  });

  app.post('/api/community/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      await storage.likeCommunityPost(postId);
      res.json({ message: 'Post liked successfully' });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ message: 'Failed to like post' });
    }
  });

  app.get('/api/community/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommunityComments(postId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  app.post('/api/community/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      const comment = await storage.createCommunityComment({
        postId,
        userId,
        content
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  app.put('/api/community/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const postId = parseInt(req.params.postId);
      const { title, content } = req.body;
      const userEmail = req.user.email;

      // Get the post to check ownership
      const post = await storage.getCommunityPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user can edit (admin or owner within 30 minutes)
      const isAdmin = userEmail === 'alessio@gmail.com';
      const isOwner = post.userId === userId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Not authorized to edit this post' });
      }

      // If not admin, check 30-minute rule
      if (!isAdmin && isOwner) {
        const createdAt = new Date(post.createdAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (diffMinutes > 30) {
          return res.status(403).json({ message: 'Post can only be edited within 30 minutes of creation' });
        }
      }

      const updatedPost = await storage.updateCommunityPost(postId, { title, content });
      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Failed to update post' });
    }
  });

  app.delete('/api/community/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const postId = parseInt(req.params.postId);
      const userEmail = req.user.email;

      // Get the post to check ownership
      const post = await storage.getCommunityPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user can delete (admin or owner within 30 minutes)
      const isAdmin = userEmail === 'alessio@gmail.com';
      const isOwner = post.userId === userId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }

      // If not admin, check 30-minute rule
      if (!isAdmin && isOwner) {
        const createdAt = new Date(post.createdAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (diffMinutes > 30) {
          return res.status(403).json({ message: 'Post can only be deleted within 30 minutes of creation' });
        }
      }

      await storage.deleteCommunityPost(postId);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });

  // Admin endpoints
  app.get('/api/admin/courses', isAuthenticated, async (req: any, res) => {
    try {
      const courses = await storage.getCourses();

      // Get lessons count for each course
      const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
          const lessons = await storage.getCourseLessons(course.id);
          return {
            ...course,
            lessonsCount: lessons.length
          };
        })
      );

      res.json(coursesWithLessons);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  });

  app.post('/api/admin/courses', isAuthenticated, async (req: any, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: 'Failed to create course' });
    }
  });

  app.put('/api/admin/courses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.updateCourse(courseId, req.body);
      res.json(course);
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ message: 'Failed to update course' });
    }
  });

  app.delete('/api/admin/courses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      await storage.deleteCourse(courseId);
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({ message: 'Failed to delete course' });
    }
  });

  app.get('/api/admin/tutors', isAuthenticated, async (req: any, res) => {
    try {
      const tutors = await storage.getTutors();
      res.json(tutors);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      res.status(500).json({ message: 'Failed to fetch tutors' });
    }
  });

  app.post('/api/admin/tutors', isAuthenticated, async (req: any, res) => {
    try {
      const tutor = await storage.createTutor(req.body);
      res.status(201).json(tutor);
    } catch (error) {
      console.error('Error creating tutor:', error);
      res.status(500).json({ message: 'Failed to create tutor' });
    }
  });

  app.put('/api/admin/tutors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const tutorId = parseInt(req.params.id);
      const tutor = await storage.updateTutor(tutorId, req.body);
      res.json(tutor);
    } catch (error) {
      console.error('Error updating tutor:', error);
      res.status(500).json({ message: 'Failed to update tutor' });
    }
  });

  app.get('/api/admin/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const courses = await storage.getCourses();
      const tutors = await storage.getTutors();

      const analytics = {
        totalUsers: 0, // Will be implemented with user analytics
        newUsersThisMonth: 0,
        averageCompletion: 0,
        totalCourses: courses.length,
        activeTutors: tutors.filter(t => t.isActive).length
      };
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Course categories endpoints
  app.get('/api/admin/course-categories', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getCourseCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching course categories:', error);
      res.status(500).json({ message: 'Failed to fetch course categories' });
    }
  });

  app.post('/api/admin/course-categories', isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = {
        ...req.body,
        courseId: parseInt(req.body.courseId) // Ensure courseId is provided
      };
      const category = await storage.createCourseCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating course category:', error);
      res.status(500).json({ message: 'Failed to create course category' });
    }
  });

  app.put('/api/admin/course-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.updateCourseCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error updating course category:', error);
      res.status(500).json({ message: 'Failed to update course category' });
    }
  });

  app.delete('/api/admin/course-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourseCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting course category:', error);
      res.status(500).json({ message: 'Failed to delete course category' });
    }
  });

  // Public course endpoints (no admin auth required)
  app.get('/api/courses', async (req: any, res) => {
    try {
      const courses = await storage.getCourses();

      // Get lessons count for each course and filter only published courses
      const coursesWithLessons = await Promise.all(
        courses
          .filter(course => course.isPublished)
          .map(async (course) => {
            const lessons = await storage.getCourseLessons(course.id);
            const publishedLessons = lessons.filter(lesson => lesson.isPublished);
            return {
              ...course,
              lessonsCount: publishedLessons.length
            };
          })
      );

      res.json(coursesWithLessons);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Failed to fetch courses' });
    }
  });

  app.get('/api/course-categories', async (req: any, res) => {
    try {
      const { courseId } = req.query;
      const categories = await storage.getCourseCategories();

      // Filter by course if specified
      if (courseId) {
        const filteredCategories = categories.filter((cat: any) => 
          cat.courseId === parseInt(courseId as string)
        );
        return res.json(filteredCategories);
      }

      res.json(categories);
    } catch (error) {
      console.error('Error fetching course categories:', error);
      res.status(500).json({ message: 'Failed to fetch course categories' });
    }
  });

  // Course lesson endpoints
  app.get('/api/courses/:courseId/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getCourseLessons(courseId);
      // Filter only published lessons for regular users
      const publishedLessons = lessons.filter(lesson => lesson.isPublished);
      res.json(publishedLessons);
    } catch (error) {
      console.error('Error fetching course lessons:', error);
      res.status(500).json({ message: 'Failed to fetch course lessons' });
    }
  });

  // Get all academy lessons (published only) - optionally filtered by course
  app.get('/api/academy/lessons', async (req: any, res) => {
    try {
      const { courseId } = req.query;
      const allLessons = await storage.getAllPublishedLessons();

      if (courseId) {
        const filteredLessons = allLessons.filter((lesson: any) => 
          lesson.courseId === parseInt(courseId as string)
        );
        return res.json(filteredLessons);
      }

      res.json(allLessons);
    } catch (error) {
      console.error('Error fetching academy lessons:', error);
      res.status(500).json({ message: 'Failed to fetch academy lessons' });
    }
  });

  // Admin lesson endpoints - get all lessons for a course (including unpublished)
  app.get('/api/admin/courses/:courseId/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getCourseLessons(courseId);
      // Return all lessons for admin (including unpublished)
      res.json(lessons);
    } catch (error) {
      console.error('Error fetching admin course lessons:', error);
      res.status(500).json({ message: 'Failed to fetch course lessons' });
    }
  });

  app.post('/api/admin/courses/:courseId/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lesson = await storage.createCourseLesson({
        ...req.body,
        courseId
      });
      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error creating course lesson:', error);
      res.status(500).json({ message: 'Failed to create course lesson' });
    }
  });

  app.put('/api/admin/lessons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.updateCourseLesson(id, req.body);
      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      res.json(lesson);
    } catch (error) {
      console.error('Error updating lesson:', error);
      res.status(500).json({ message: 'Failed to update lesson' });
    }
  });

  app.delete('/api/admin/lessons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourseLesson(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).json({ message: 'Failed to delete lesson' });
    }
  });

  // User progress tracking
  app.get('/api/courses/:courseId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const courseId = parseInt(req.params.courseId);
      const progress = await storage.getUserCourseProgress(userId);
      const courseProgress = progress.find(p => p.courseId === courseId);
      res.json(courseProgress || { completionPercentage: 0, completedLessons: [] });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ message: 'Failed to fetch user progress' });
    }
  });

  app.post('/api/courses/:courseId/lessons/:lessonId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const courseId = parseInt(req.params.courseId);
      const lessonId = parseInt(req.params.lessonId);

      const progress = await storage.updateUserCourseProgress(userId, courseId, {
        lastAccessedAt: new Date(),
        ...req.body
      });

      res.json(progress);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      res.status(500).json({ message: 'Failed to update lesson progress' });
    }
  });

  // Custom Accounts API
  app.get('/api/custom-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const accounts = await storage.getCustomAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching custom accounts:', error);
      res.status(500).json({ message: 'Failed to fetch custom accounts' });
    }
  });

  app.post('/api/custom-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const validatedData = insertCustomAccountSchema.parse({ 
        ...req.body, 
        userId 
      });

      const account = await storage.createCustomAccount(validatedData);
      res.status(201).json(account[0]);
    } catch (error) {
      console.error('Error creating custom account:', error);
      res.status(500).json({ message: 'Failed to create custom account' });
    }
  });

  app.put('/api/custom-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      console.log('PUT /api/custom-accounts/:id - Request body:', req.body);
      console.log('Account ID:', accountId, 'User ID:', userId);

      // Verify ownership
      const existingAccount = await storage.getCustomAccountById(accountId);
      if (!existingAccount || existingAccount.userId !== userId) {
        console.log('Account not found or unauthorized:', existingAccount);
        return res.status(404).json({ message: 'Account not found' });
      }

      // Remove id, userId and timestamps from the update body to avoid conflicts
      const { id, userId: bodyUserId, createdAt, updatedAt, ...updateData } = req.body;

      // Convert string numbers to actual numbers
      if (updateData.balance) {
        updateData.balance = parseFloat(updateData.balance);
      }
      if (updateData.monthlyAllocation) {
        updateData.monthlyAllocation = parseFloat(updateData.monthlyAllocation);
      }

      console.log('Update data after cleaning:', updateData);

      const result = await storage.updateCustomAccount(accountId, updateData);
      console.log('Update result:', result);

      if (!result || result.length === 0) {
        return res.status(500).json({ message: 'Failed to update account - no result returned' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Error updating custom account:', error);
      res.status(500).json({ message: 'Failed to update custom account' });
    }
  });

  app.delete('/api/custom-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      // Verify ownership
      const existingAccount = await storage.getCustomAccountById(accountId);
      if (!existingAccount || existingAccount.userId !== userId) {
        return res.status(404).json({ message: 'Account not found' });
      }

      await storage.deleteCustomAccount(accountId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting custom account:', error);
      res.status(500).json({ message: 'Failed to delete custom account' });
    }
  });

  const httpServer = createServer(app);
  // Community API routes
  app.get('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const posts = await storage.getCommunityPosts();
      res.json(posts);
    } catch (error) {
      console.error('Error fetching community posts:', error);
      res.status(500).json({ message: 'Errore nel caricamento dei post' });
    }
  });

  app.post('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { title, content, category } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Il contenuto è obbligatorio' });
      }

      const post = await storage.createCommunityPost({
        userId,
        title: title || null,
        content,
        category: category || 'Community'
      });

      res.json(post);
    } catch (error) {
      console.error('Error creating community post:', error);
      res.status(500).json({ message: 'Errore nella creazione del post' });
    }
  });

  app.get('/api/community/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommunityComments(postId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Errore nel caricamento dei commenti' });
    }
  });

  app.post('/api/community/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Il contenuto è obbligatorio' });
      }

      const comment = await storage.createCommunityComment({
        postId,
        userId,
        content
      });

      res.json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Errore nella creazione del commento' });
    }
  });

  app.post('/api/community/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.postId);
      await storage.likeCommunityPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ message: 'Errore nel mettere mi piace' });
    }
  });

  // Video Progress API
  app.get('/api/video-progress/:lessonId', isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const userId = req.user!.id;

      const progress = await storage.getVideoProgress(userId, lessonId);

      // Return default data if no progress exists
      if (!progress) {
        return res.json({
          currentPosition: 0,
          totalDuration: 0,
          watchedSeconds: 0,
          completionPercentage: 0,
          watchCount: 0,
          isCompleted: false,
          lastWatchedAt: null
        });
      }

      res.json(progress);
    } catch (error) {
      console.error('Error fetching video progress:', error);
      res.status(500).json({ error: 'Failed to fetch video progress' });
    }
  });

  app.post('/api/video-progress', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { lessonId, currentPosition, totalDuration, watchedSeconds, completionPercentage } = req.body;

      await storage.updateVideoProgress(userId, lessonId, {
        currentPosition: currentPosition || 0,
        totalDuration: totalDuration || 0,
        watchedSeconds: watchedSeconds || 0,
        completionPercentage: completionPercentage || 0,
        watchCount: 1, // Will be properly managed in storage
        isCompleted: (completionPercentage || 0) >= 90,
        lastWatchedAt: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating video progress:', error);
      res.status(500).json({ error: 'Failed to update video progress' });
    }
  });

  // Lesson Notes API
  app.get('/api/lesson-notes/:lessonId', isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const userId = req.user!.id;

      const notes = await storage.getLessonNotes(userId, lessonId);
      res.json(notes || { notes: '', viewCount: 1, lastViewed: new Date() });
    } catch (error) {
      console.error('Error fetching lesson notes:', error);
      res.status(500).json({ error: 'Failed to fetch lesson notes' });
    }
  });

  app.post('/api/lesson-notes/:lessonId', isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const userId = req.user!.id;
      const { notes } = req.body;

      await storage.saveLessonNotes(userId, lessonId, notes);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving lesson notes:', error);
      res.status(500).json({ error: 'Failed to save lesson notes' });
    }
  });

  // Budget Notes API - Enhanced note system for budget categories
  app.get('/api/budget-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { category, monthKey } = req.query;

      let notes;
      if (category && monthKey) {
        // Get specific notes for category and month
        notes = await db
          .select()
          .from(budgetNotes)
          .where(
            and(
              eq(budgetNotes.userId, userId),
              eq(budgetNotes.category, category as string),
              eq(budgetNotes.monthKey, monthKey as string)
            )
          );
      } else if (monthKey) {
        // Get all notes for a specific month
        notes = await db
          .select()
          .from(budgetNotes)
          .where(
            and(
              eq(budgetNotes.userId, userId),
              eq(budgetNotes.monthKey, monthKey as string)
            )
          );
      } else {
        // Get all notes for user
        notes = await db
          .select()
          .from(budgetNotes)
          .where(eq(budgetNotes.userId, userId))
          .orderBy(budgetNotes.monthKey, budgetNotes.category);
      }

      res.json(notes);
    } catch (error) {
      console.error('Error fetching budget notes:', error);
      res.status(500).json({ error: 'Failed to fetch budget notes' });
    }
  });

  app.post('/api/budget-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const noteData = insertBudgetNotesSchema.parse({ ...req.body, userId });

      // Check if note already exists
      const existing = await db
        .select()
        .from(budgetNotes)
        .where(
          and(
            eq(budgetNotes.userId, userId),
            eq(budgetNotes.category, noteData.category),
            eq(budgetNotes.monthKey, noteData.monthKey),
            noteData.subcategory ? eq(budgetNotes.subcategory, noteData.subcategory) : isNull(budgetNotes.subcategory)
          )
        )
        .limit(1);

      let result;
      if (existing.length > 0) {
        // Update existing note
        [result] = await db
          .update(budgetNotes)
          .set({ ...noteData, updatedAt: new Date() })
          .where(eq(budgetNotes.id, existing[0].id))
          .returning();
      } else {
        // Create new note
        [result] = await db
          .insert(budgetNotes)
          .values(noteData)
          .returning();
      }

      res.json(result);
    } catch (error) {
      console.error('Error saving budget note:', error);
      res.status(500).json({ error: 'Failed to save budget note' });
    }
  });

  app.put('/api/budget-notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);
      const updateData = insertBudgetNotesSchema.partial().parse(req.body);

      const [result] = await db
        .update(budgetNotes)
        .set({ ...updateData, updatedAt: new Date() })
        .where(
          and(
            eq(budgetNotes.id, noteId),
            eq(budgetNotes.userId, userId)
          )
        )
        .returning();

      if (!result) {
        return res.status(404).json({ error: 'Budget note not found' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error updating budget note:', error);
      res.status(500).json({ error: 'Failed to update budget note' });
    }
  });

  app.delete('/api/budget-notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      await db
        .delete(budgetNotes)
        .where(
          and(
            eq(budgetNotes.id, noteId),
            eq(budgetNotes.userId, userId)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting budget note:', error);
      res.status(500).json({ error: 'Failed to delete budget note' });
    }
  });

  // Budget Forecasts API - Predictive analysis for budget planning
  app.get('/api/budget-forecasts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { category, monthKey, futureMonths = 3 } = req.query;

      let forecasts;
      if (category && monthKey) {
        // Get specific forecast
        forecasts = await db
          .select()
          .from(budgetForecasts)
          .where(
            and(
              eq(budgetForecasts.userId, userId),
              eq(budgetForecasts.category, category as string),
              eq(budgetForecasts.monthKey, monthKey as string)
            )
          );
      } else {
        // Get forecasts for future months
        const currentDate = new Date();
        const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format

        forecasts = await db
          .select()
          .from(budgetForecasts)
          .where(
            and(
              eq(budgetForecasts.userId, userId),
              // Get forecasts from current month onwards
            )
          )
          .orderBy(budgetForecasts.monthKey, budgetForecasts.category);
      }

      res.json(forecasts);
    } catch (error) {
      console.error('Error fetching budget forecasts:', error);
      res.status(500).json({ error: 'Failed to fetch budget forecasts' });
    }
  });

  app.post('/api/budget-forecasts/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { categories, monthsAhead = 3 } = req.body;

      // Get historical transaction data for forecast generation
      const transactions = await storage.getUserTransactions(userId, 1000);

      // Simple trend-based forecasting algorithm
      const forecasts = [];
      const currentDate = new Date();

      for (const category of categories) {
        // Filter transactions for this category
        const categoryTransactions = transactions.filter(t => 
          t.category === category && t.type === 'expense'
        );

        if (categoryTransactions.length === 0) continue;

        // Calculate monthly averages for the last 6 months
        const monthlyTotals: Record<string, number> = {};
        categoryTransactions.forEach(transaction => {
          const monthKey = transaction.date.toString().slice(0, 7);
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + parseFloat(transaction.amount);
        });

        const amounts = Object.values(monthlyTotals);
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;

        // Generate forecasts for future months
        for (let i = 1; i <= monthsAhead; i++) {
          const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
          const monthKey = futureDate.toISOString().slice(0, 7);

          // Simple seasonal adjustment (could be enhanced with ML)
          const seasonalMultiplier = 1 + (Math.sin(futureDate.getMonth() * Math.PI / 6) * 0.1);
          const forecastedAmount = avgAmount * seasonalMultiplier;

          const forecastData = {
            userId,
            category,
            monthKey,
            forecastedAmount: forecastedAmount.toString(),
            confidence: "75.00", // Based on data quality
            methodology: "trend_analysis",
            basedOnMonths: Math.min(amounts.length, 6)
          };

          // Insert or update forecast
          const existing = await db
            .select()
            .from(budgetForecasts)
            .where(
              and(
                eq(budgetForecasts.userId, userId),
                eq(budgetForecasts.category, category),
                eq(budgetForecasts.monthKey, monthKey)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(budgetForecasts)
              .set(forecastData)
              .where(eq(budgetForecasts.id, existing[0].id));
          } else {
            await db
              .insert(budgetForecasts)
              .values(forecastData);
          }

          forecasts.push({ ...forecastData, monthKey });
        }
      }

      res.json({ 
        success: true, 
        forecasts,
        message: `Generated forecasts for ${categories.length} categories for ${monthsAhead} months ahead`
      });
    } catch (error) {
      console.error('Error generating budget forecasts:', error);
      res.status(500).json({ error: 'Failed to generate budget forecasts' });
    }
  });

  // Budget insights and analytics
  app.get('/api/budget-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const { monthKey } = req.query;

      // Get transactions, notes, and forecasts for analysis
      const [transactions, notes, forecasts] = await Promise.all([
        storage.getUserTransactions(userId, 500),
        db.select().from(budgetNotes).where(eq(budgetNotes.userId, userId)),
        db.select().from(budgetForecasts).where(eq(budgetForecasts.userId, userId))
      ]);

      // Calculate spending trends and insights
      const insights: {
        spendingTrends: Record<string, any>;
        categoryPerformance: Record<string, any>;
        alerts: any[];
        recommendations: any[];
      } = {
        spendingTrends: {},
        categoryPerformance: {},
        alerts: [],
        recommendations: []
      };

      // Group transactions by category and month
      const categorySpending: Record<string, Record<string, number>> = {};
      transactions.filter(t => t.type === 'expense').forEach(transaction => {
        const category = transaction.category;
        const month = transaction.date.toString().slice(0, 7);

        if (!categorySpending[category]) categorySpending[category] = {};
        categorySpending[category][month] = (categorySpending[category][month] || 0) + parseFloat(transaction.amount);
      });

      // Generate trend analysis
      Object.entries(categorySpending).forEach(([category, monthlyData]) => {
        const months = Object.keys(monthlyData).sort();
        const amounts = months.map(month => monthlyData[month]);

        // Calculate trend
        if (amounts.length >= 2) {
          const trend = amounts[amounts.length - 1] - amounts[amounts.length - 2];
          const trendPercentage = ((trend / amounts[amounts.length - 2]) * 100).toFixed(1);

          insights.spendingTrends[category] = {
            trend: trend > 0 ? 'increasing' : 'decreasing',
            percentage: trendPercentage,
            lastAmount: amounts[amounts.length - 1],
            previousAmount: amounts[amounts.length - 2]
          };

          // Generate alerts for significant increases
          if (Math.abs(parseFloat(trendPercentage)) > 20) {
            insights.alerts.push({
              type: trend > 0 ? 'warning' : 'info',
              category,
              message: `${category}: ${trend > 0 ? 'Aumento' : 'Diminuzione'} del ${Math.abs(parseFloat(trendPercentage))}% rispetto al mese scorso`,
              severity: Math.abs(parseFloat(trendPercentage)) > 50 ? 'high' : 'medium'
            });
          }
        }
      });

      res.json(insights);
    } catch (error) {
      console.error('Error generating budget insights:', error);
      res.status(500).json({ error: 'Failed to generate budget insights' });
    }
  });

  // Update transaction budget categories
  app.post('/api/transactions/update-budget-categories', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Get all user transactions
      const transactions = await storage.getUserTransactions(userId, 1000);

      let updated = 0;
      for (const transaction of transactions) {
        // Skip if already has budget category
        if (transaction.budgetCategory) continue;

        // Auto-categorize based on description and merchant
        const { category, budgetCategory } = automaticCategorization(
          transaction.description || '', 
          transaction.merchant || undefined
        );

        // Update the transaction with category and budget category
        await storage.updateTransaction(transaction.id, {
          category: transaction.category || category,
          budgetCategory: budgetCategory
        });

        updated++;
      }

      res.json({ 
        success: true, 
        message: `Aggiornate ${updated} transazioni con categorie budget`,
        updated: updated 
      });
    } catch (error) {
      console.error('Error updating budget categories:', error);
      res.status(500).json({ error: 'Errore nell\'aggiornamento delle categorie budget' });
    }
  });

  // ============================
  // ADMIN CONSULTATION API ENDPOINTS
  // ============================

  // Admin dashboard statistics
  app.get('/admin/consultation/dashboard/stats', requireAdmin, async (req: any, res) => {
    try {
      const [totalClients, totalConsultations, todayConsultations, monthlyRevenue] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(users).where(sql`${users.email} != 'alessio@gmail.com'`),
        db.select({ count: sql`count(*)` }).from(consultations),
        db.select({ count: sql`count(*)` }).from(consultations)
          .where(sql`DATE(${consultations.consultationDate}) = CURRENT_DATE`),
        db.select({ 
          revenue: sql`COALESCE(COUNT(*) * 100, 0)` 
        }).from(consultations)
          .where(sql`DATE_TRUNC('month', ${consultations.consultationDate}) = DATE_TRUNC('month', CURRENT_DATE)`)
      ]);

      res.json({
        totalClients: totalClients[0]?.count || 0,
        totalConsultations: totalConsultations[0]?.count || 0,
        todayConsultations: todayConsultations[0]?.count || 0,
        monthlyRevenue: monthlyRevenue[0]?.revenue || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Admin - today's consultations
  app.get('/admin/consultation/dashboard/consultations-today', requireAdmin, async (req: any, res) => {
    try {
      const todayConsultations = await db
        .select({
          // Consultation fields
          id: consultationCalendar.id,
          clientId: consultationCalendar.userId, // userId now serves as clientId
          consultantId: consultationCalendar.consultantId,
          consultationDate: consultationCalendar.startTime,
          startTime: consultationCalendar.startTime,
          endTime: consultationCalendar.endTime,
          type: consultationCalendar.type,
          status: consultationCalendar.status,
          notes: consultationCalendar.description,
          createdAt: consultationCalendar.createdAt,
          // Client fields (users as clients, no password here)
          clientFirstName: users.firstName,
          clientLastName: users.lastName,
          clientEmail: users.email,
          clientPhone: sql<string>`null`.as('clientPhone'),
          clientStatus: sql<string>`'active'`.as('clientStatus'),
          // Consultant fields (for context, not directly needed for display)
          consultantEmail: users.email,
          consultantFirstName: users.firstName,
          consultantLastName: users.lastName,
        })
        .from(consultationCalendar)
        .leftJoin(users, eq(consultationCalendar.userId, users.id))
        .where(sql`DATE(${consultationCalendar.startTime}) = CURRENT_DATE`)
        .orderBy(consultationCalendar.startTime);

      // Create DTO with proper clientName and Date objects
      const consultationsDTO = todayConsultations.map(consultation => ({
        id: consultation.id,
        clientId: consultation.clientId,
        clientName: `${consultation.clientFirstName || ''} ${consultation.clientLastName || ''}`.trim() || 'N/A',
        startTime: new Date(consultation.startTime || consultation.consultationDate),
        endTime: new Date(consultation.endTime || consultation.consultationDate),
        type: consultation.type || 'consultation',
        status: consultation.status || 'scheduled'
      }));

      res.json(consultationsDTO);
    } catch (error) {
      console.error('Error fetching today consultations:', error);
      res.status(500).json({ error: 'Failed to fetch today consultations' });
    }
  });

  // Admin - recent activity
  app.get('/admin/consultation/dashboard/recent-activity', requireAdmin, async (req: any, res) => {
    try {
      const recentConsultations = await db
        .select({
          // Consultation fields
          id: consultationCalendar.id,
          clientId: consultationCalendar.userId, // userId now serves as clientId
          consultantId: consultationCalendar.consultantId,
          consultationDate: consultationCalendar.startTime,
          type: consultationCalendar.type,
          status: consultationCalendar.status,
          notes: consultationCalendar.description,
          createdAt: consultationCalendar.createdAt,
          // Client fields (safe, no password here)
          clientFirstName: users.firstName,
          clientLastName: users.lastName,
          clientEmail: users.email,
          clientStatus: sql<string>`'active'`.as('clientStatus'),
        })
        .from(consultationCalendar)
        .leftJoin(users, eq(consultationCalendar.userId, users.id))
        .orderBy(desc(consultationCalendar.createdAt))
        .limit(10);

      // Create DTO with proper clientName and Date objects
      const recentActivityDTO = recentConsultations.map(consultation => ({
        id: consultation.id,
        type: 'consultation',
        clientName: `${consultation.clientFirstName || ''} ${consultation.clientLastName || ''}`.trim() || 'N/A',
        description: `Consulenza ${consultation.type || 'generica'} - ${consultation.status || 'programmata'}`,
        timestamp: new Date(consultation.createdAt || consultation.consultationDate)
      }));

      res.json(recentActivityDTO);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  });

  // Admin - manage all clients (global view) - Users as clients
  app.get('/admin/consultation/clients', requireAdmin, async (req: any, res) => {
    try {
      // Fetch all users as clients - exclude admin users (alessio@gmail.com)
      const allClients = await db
        .select({
          // User fields (users are now clients)
          id: users.id,
          userId: users.id, // For backwards compatibility
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          // Client specific fields (mocked for now)
          phone: sql<string>`null`.as('phone'), // No phone in users table yet
          dateOfBirth: sql<string>`null`.as('dateOfBirth'), // No DOB in users table yet
          avatar: sql<string>`null`.as('avatar'), // No avatar in users table yet
          status: sql<string>`'active'`.as('status'), // Default status
          financialGoals: sql<string>`null`.as('financialGoals'),
          riskProfile: sql<string>`null`.as('riskProfile'),
          currentSituation: sql<string>`null`.as('currentSituation'),
          notes: sql<string>`null`.as('notes'),
          tags: sql<string[]>`ARRAY[]::text[]`.as('tags'),
          onboardingCompleted: sql<boolean>`false`.as('onboardingCompleted'),
          // Consultant info (admin who manages them)
          consultantId: sql<number>`(SELECT id FROM users WHERE email = 'alessio@gmail.com')`.as('consultantId'),
          consultantEmail: sql<string>`'alessio@gmail.com'`.as('consultantEmail'),
          consultantFirstName: sql<string>`'Alessio'`.as('consultantFirstName'),
          consultantLastName: sql<string>`'Admin'`.as('consultantLastName'),
          consultantCreatedAt: sql<string>`NOW()`.as('consultantCreatedAt'),
          consultantUpdatedAt: sql<string>`NOW()`.as('consultantUpdatedAt'),
        })
        .from(users)
        .where(sql`${users.email} != 'alessio@gmail.com'`) // Exclude admin
        .orderBy(desc(users.createdAt));

      res.json(allClients);
    } catch (error) {
      console.error('Error fetching all clients for admin:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  });

  // Admin - manage all exercises (global view)
  app.get('/admin/consultation/exercises', requireAdmin, async (req: any, res) => {
    try {
      const allExercises = await db
        .select({
          // Exercise fields
          id: exercises.id,
          createdBy: exercises.createdBy,
          title: exercises.title,
          description: exercises.description,
          instructions: exercises.instructions,
          category: exercises.category,
          difficulty: exercises.difficulty,
          estimatedTime: exercises.estimatedTime,
          type: exercises.type,
          template: exercises.template,
          isPublic: exercises.isPublic,
          isActive: exercises.isActive,
          successCriteria: exercises.successCriteria,
          resources: exercises.resources,
          tags: exercises.tags,
          createdAt: exercises.createdAt,
          updatedAt: exercises.updatedAt,
          // Creator fields (EXCLUDING password for security)
          creatorId: users.id,
          creatorEmail: users.email,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorCreatedAt: users.createdAt,
          creatorUpdatedAt: users.updatedAt,
        })
        .from(exercises)
        .leftJoin(users, eq(exercises.createdBy, users.id))
        .orderBy(desc(exercises.createdAt));

      res.json(allExercises);
    } catch (error) {
      console.error('Error fetching all exercises for admin:', error);
      res.status(500).json({ error: 'Failed to fetch exercises' });
    }
  });

  // Admin - manage all calendar events (global view)
  app.get('/admin/consultation/calendar', requireAdmin, async (req: any, res) => {
    try {
      const allCalendarEvents = await db
        .select({
          // Calendar event fields
          id: consultationCalendar.id,
          consultantId: consultationCalendar.consultantId,
          clientId: consultationCalendar.userId, // userId now serves as clientId
          title: consultationCalendar.title,
          description: consultationCalendar.description,
          startTime: consultationCalendar.startTime,
          endTime: consultationCalendar.endTime,
          type: consultationCalendar.type,
          status: consultationCalendar.status,
          location: consultationCalendar.location,
          meetingLink: consultationCalendar.meetingLink,
          isRecurring: consultationCalendar.isRecurring,
          recurringPattern: consultationCalendar.recurringPattern,
          preparation: consultationCalendar.preparation,
          agenda: consultationCalendar.agenda,
          createdAt: consultationCalendar.createdAt,
          updatedAt: consultationCalendar.updatedAt,
          // Client fields (users as clients, no password here)
          clientEmail: users.email,
          clientFirstName: users.firstName,
          clientLastName: users.lastName,
          clientPhone: sql<string>`null`.as('clientPhone'),
          clientStatus: sql<string>`'active'`.as('clientStatus'),
          // Consultant fields (EXCLUDING password for security)
          consultantEmail: users.email,
          consultantFirstName: users.firstName,
          consultantLastName: users.lastName,
        })
        .from(consultationCalendar)
        .leftJoin(users, eq(consultationCalendar.userId, users.id))
        .leftJoin(users, eq(consultationCalendar.consultantId, users.id))
        .orderBy(desc(consultationCalendar.startTime));

      res.json(allCalendarEvents);
    } catch (error) {
      console.error('Error fetching all calendar events for admin:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });

  // ============================
  // CONSULTATION SYSTEM API ENDPOINTS
  // ============================

  // Helper function for validating IDs and returning 400 on invalid input
  function validateId(idString: string): number {
    const id = parseInt(idString);
    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid ID parameter');
    }
    return id;
  }

  // Helper function to check if error is instance of Error with message
  function isErrorWithMessage(error: unknown): error is Error {
    return error instanceof Error && typeof error.message === 'string';
  }

  // Helper function for ownership verification
  async function verifyClientOwnership(clientId: number, consultantId: number): Promise<boolean> {
    const client = await storage.getClientById(clientId);
    return client?.id === consultantId;
  }

  async function verifyConsultationOwnership(consultationId: number, consultantId: number): Promise<boolean> {
    const consultation = await storage.getConsultationById(consultationId);
    return consultation?.consultantId === consultantId;
  }

  async function verifyExerciseOwnership(exerciseId: number, consultantId: number): Promise<boolean> {
    const exercise = await storage.getExerciseById(exerciseId);
    return exercise?.createdBy === consultantId;
  }

  async function verifyClientExerciseOwnership(clientExerciseId: number, consultantId: number): Promise<boolean> {
    const clientExercise = await storage.getClientExerciseById(clientExerciseId);
    return clientExercise?.assignedBy === consultantId;
  }

  async function verifyCalendarEventOwnership(eventId: number, consultantId: number): Promise<boolean> {
    const event = await storage.getCalendarEventById(eventId);
    return event?.consultantId === consultantId;
  }

  async function verifyProgressOwnership(progressId: number, consultantId: number): Promise<boolean> {
    const progress = await storage.getProgressById(progressId);
    if (!progress) return false;
    // Check if the client belongs to this consultant
    return await verifyClientOwnership(progress.userId, consultantId);
  }

  // Helper for exercise readability (owned or public)
  async function isExerciseReadable(exerciseId: number, consultantId: number): Promise<boolean> {
    const exercise = await storage.getExerciseById(exerciseId);
    if (!exercise) return false;
    return exercise.createdBy === consultantId || exercise.isPublic === true;
  }

  // Middleware for consultant role check
  function requireConsultant(req: any, res: any, next: any) {
    // For now, we'll assume all authenticated users can be consultants
    // In a real system, you'd check user roles from database
    next();
  }

  // Client management endpoints
  app.get('/api/consultation/clients', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId =parseInt(req.user.id);

      // Get all users as potential clients (excluding admin users)
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(sql`${users.email} != 'alessio@gmail.com'`) // Exclude admin users
        .orderBy(users.firstName, users.lastName);

      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  });

  app.get('/api/consultation/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.id);

      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Verify ownership
      if (client.id !== consultantId) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(client);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error fetching client:', error);
      res.status(500).json({ error: 'Failed to fetch client' });
    }
  });

  app.post('/api/consultation/clients', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      // For now, clients are just users, so we'll handle client creation differently
      // This endpoint might need to be updated based on your client management strategy

      res.status(501).json({ error: 'Client creation not yet implemented - clients are managed as users' });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(400).json({ error: 'Failed to create client' });
    }
  });

  app.put('/api/consultation/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.id);

      // Verify ownership before update
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Client updates would need to be handled through user updates since clients are users
      const updateData = req.body; // Temporary - needs proper validation
      const client = await storage.updateClient(clientId, updateData);
      res.json(client);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error updating client:', error);
      res.status(400).json({ error: 'Failed to update client' });
    }
  });

  app.delete('/api/consultation/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.id);

      // Verify ownership before delete
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      await storage.deleteClient(clientId);
      res.json({ success: true });
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error deleting client:', error);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  });

  app.get('/api/consultation/clients/search/:query', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const query = req.params.query;
      const clients = await storage.searchClients(consultantId, query);
      res.json(clients);
    } catch (error) {
      console.error('Error searching clients:', error);
      res.status(500).json({ error: 'Failed to search clients' });
    }
  });

  // Consultation management endpoints
  app.get('/api/consultation/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const consultations = await storage.getConsultantConsultations(consultantId, limit);
      res.json(consultations);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      res.status(500).json({ error: 'Failed to fetch consultations' });
    }
  });

  app.get('/api/consultation/consultations/client/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.clientId);

      // Verify client ownership
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const consultations = await storage.getClientConsultations(clientId);
      res.json(consultations);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error fetching client consultations:', error);
      res.status(500).json({ error: 'Failed to fetch client consultations' });
    }
  });

  app.get('/api/consultation/consultations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const consultationId = validateId(req.params.id);

      const consultation = await storage.getConsultationById(consultationId);
      if (!consultation) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      // Verify ownership
      if (consultation.consultantId !== consultantId) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(consultation);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid consultation ID' });
      }
      console.error('Error fetching consultation:', error);
      res.status(500).json({ error: 'Failed to fetch consultation' });
    }
  });

  app.post('/api/consultation/consultations', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const consultationData = insertConsultationSchema.parse({ ...req.body, consultantId });

      const consultation = await storage.createConsultation(consultationData);
      res.json(consultation);
    } catch (error) {
      console.error('Error creating consultation:', error);
      res.status(400).json({ error: 'Failed to create consultation' });
    }
  });

  app.put('/api/consultation/consultations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const consultationId = validateId(req.params.id);

      // Verify ownership before update
      if (!(await verifyConsultationOwnership(consultationId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const updateData = insertConsultationSchema.partial().parse(req.body);
      const consultation = await storage.updateConsultation(consultationId, updateData);
      res.json(consultation);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid consultation ID' });
      }
      console.error('Error updating consultation:', error);
      res.status(400).json({ error: 'Failed to update consultation' });
    }
  });

  app.delete('/api/consultation/consultations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const consultationId = validateId(req.params.id);

      // Verify ownership before delete
      if (!(await verifyConsultationOwnership(consultationId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      await storage.deleteConsultation(consultationId);
      res.json({ success: true });
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid consultation ID' });
      }
      console.error('Error deleting consultation:', error);
      res.status(500).json({ error: 'Failed to delete consultation' });
    }
  });

  app.get('/api/consultation/consultations/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const consultations = await storage.getUpcomingConsultations(consultantId);
      res.json(consultations);
    } catch (error) {
      console.error('Error fetching upcoming consultations:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming consultations' });
    }
  });

  // Exercise management endpoints
  app.get('/api/consultation/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const category = req.query.category as string;
      const difficulty = req.query.difficulty as string;

      let exercises;
      if (category || difficulty) {
        exercises = await storage.searchExercises(consultantId, category, difficulty);
      } else {
        exercises = await storage.getConsultantExercises(consultantId);
      }

      res.json(exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ error: 'Failed to fetch exercises' });
    }
  });

  app.get('/api/consultation/exercises/public', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const exercises = await storage.getPublicExercises(consultantId);
      res.json(exercises);
    } catch (error) {
      console.error('Error fetching public exercises:', error);
      res.status(500).json({ error: 'Failed to fetch public exercises' });
    }
  });

  app.get('/api/consultation/exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const exerciseId = validateId(req.params.id);

      const exercise = await storage.getExerciseById(exerciseId);
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      // Verify readability (owned or public)
      if (!(await isExerciseReadable(exerciseId, consultantId))) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json(exercise);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid exercise ID' });
      }
      console.error('Error fetching exercise:', error);
      res.status(500).json({ error: 'Failed to fetch exercise' });
    }
  });

  app.post('/api/consultation/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const exerciseData = insertExerciseSchema.parse({ ...req.body, createdBy: consultantId });

      const exercise = await storage.createExercise(exerciseData);
      res.json(exercise);
    } catch (error) {
      console.error('Error creating exercise:', error);
      res.status(400).json({ error: 'Failed to create exercise' });
    }
  });

  app.put('/api/consultation/exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const exerciseId = validateId(req.params.id);

      // Verify ownership before update
      if (!(await verifyExerciseOwnership(exerciseId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const updateData = insertExerciseSchema.partial().parse(req.body);
      const exercise = await storage.updateExercise(exerciseId, updateData);
      res.json(exercise);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid exercise ID' });
      }
      console.error('Error updating exercise:', error);
      res.status(400).json({ error: 'Failed to update exercise' });
    }
  });

  app.delete('/api/consultation/exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const exerciseId = validateId(req.params.id);

      // Verify ownership before delete
      if (!(await verifyExerciseOwnership(exerciseId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      await storage.deleteExercise(exerciseId);
      res.json({ success: true });
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid exercise ID' });
      }
      console.error('Error deleting exercise:', error);
      res.status(500).json({ error: 'Failed to delete exercise' });
    }
  });

  // Client Exercise assignment endpoints
  app.get('/api/consultation/client-exercises/client/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.clientId);

      // Verify client ownership
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const clientExercises = await storage.getClientExercises(clientId);
      res.json(clientExercises);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error fetching client exercises:', error);
      res.status(500).json({ error: 'Failed to fetch client exercises' });
    }
  });

  // Endpoint duplicato rimosso - mantenuto quello sotto nella sezione CLIENT ENDPOINTS

  // Add endpoint for clients to get their own appointments
  app.get('/api/my-appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const appointments = await db
        .select()
        .from(consultationCalendar)
        .where(eq(consultationCalendar.userId, userId))
        .orderBy(consultationCalendar.startTime);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  // Add endpoint for client progress
  app.get('/api/my-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      // Mock progress data for now - this can be enhanced later
      const progressData = [
        {
          id: 1,
          category: "Financial Planning",
          currentLevel: "Beginner",
          nextLevel: "Intermediate", 
          progressPercentage: 25,
          totalExercises: 8,
          completedExercises: 2,
          averageScore: 85,
          lastUpdated: new Date().toISOString()
        }
      ];
      res.json(progressData);
    } catch (error) {
      console.error('Error fetching my progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  });

  app.get('/api/consultation/client-exercises/assigned', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const assignedExercises = await storage.getConsultantAssignedExercises(consultantId);
      res.json(assignedExercises);
    } catch (error) {
      console.error('Error fetching assigned exercises:', error);
      res.status(500).json({ error: 'Failed to fetch assigned exercises' });
    }
  });

  app.get('/api/consultation/client-exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientExerciseId = validateId(req.params.id);

      const clientExercise = await storage.getClientExerciseById(clientExerciseId);
      if (!clientExercise) {
        return res.status(404).json({ error: 'Client exercise not found' });
      }

      // Verify ownership
      if (clientExercise.assignedBy !== consultantId) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(clientExercise);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client exercise ID' });
      }
      console.error('Error fetching client exercise:', error);
      res.status(500).json({ error: 'Failed to fetch client exercise' });
    }
  });

  app.post('/api/consultation/client-exercises', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      // Map clientId to userId for the database schema
      const { clientId, ...restData } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      const assignmentData = insertClientExerciseSchema.parse({ 
        clientId: parseInt(clientId), // Use clientId instead of userId as per schema
        exerciseId: parseInt(restData.exerciseId),
        assignedBy: consultantId,
        priority: restData.priority || 'medium',
        consultantNotes: restData.consultantNotes || ''
      });

      const assignment = await storage.assignExerciseToClient(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error('Error assigning exercise to client:', error);
      res.status(400).json({ error: 'Failed to assign exercise to client' });
    }
  });

  app.get('/api/consultation/client-exercises/all', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);

      // Validate consultant ID
      if (!consultantId || isNaN(consultantId) || consultantId <= 0) {
        return res.status(400).json({ error: 'Invalid consultant ID' });
      }

      const assignments = await storage.getAllClientExercisesByConsultant(consultantId);
      res.json(assignments);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid consultant ID' });
      }
      console.error('Error fetching client exercises:', error);
      res.status(500).json({ error: 'Failed to fetch client exercises' });
    }
  });

  app.put('/api/consultation/client-exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientExerciseId = validateId(req.params.id);

      // Verify ownership before update
      if (!(await verifyClientExerciseOwnership(clientExerciseId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const updateData = insertClientExerciseSchema.partial().parse(req.body);
      const clientExercise = await storage.updateClientExercise(clientExerciseId, updateData);
      res.json(clientExercise);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client exercise ID' });
      }
      console.error('Error updating client exercise:', error);
      res.status(400).json({ error: 'Failed to update client exercise' });
    }
  });

  app.delete('/api/consultation/client-exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientExerciseId = validateId(req.params.id);

      // Verify ownership before delete
      if (!(await verifyClientExerciseOwnership(clientExerciseId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      await storage.deleteClientExercise(clientExerciseId);
      res.json({ success: true });
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client exercise ID' });
      }
      console.error('Error deleting client exercise:', error);
      res.status(500).json({ error: 'Failed to delete client exercise' });
    }
  });

  app.get('/api/consultation/client-exercises/overdue', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const overdueExercises = await storage.getOverdueExercises(consultantId);
      res.json(overdueExercises);
    } catch (error) {
      console.error('Error fetching overdue exercises:', error);
      res.status(500).json({ error: 'Failed to fetch overdue exercises' });
    }
  });

  // Calendar management endpoints
  app.get('/api/consultation/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const calendar = await storage.getConsultantCalendar(consultantId, startDate, endDate);
      res.json(calendar);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ error: 'Failed to fetch calendar' });
    }
  });

  app.get('/api/consultation/calendar/client/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.clientId);

      // Verify client ownership
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const calendar = await storage.getClientCalendar(clientId);
      res.json(calendar);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error fetching client calendar:', error);
      res.status(500).json({ error: 'Failed to fetch client calendar' });
    }
  });

  app.get('/api/consultation/calendar/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const eventId = validateId(req.params.id);

      const event = await storage.getCalendarEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Calendar event not found' });
      }

      // Verify ownership
      if (event.consultantId !== consultantId) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(event);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid calendar event ID' });
      }
      console.error('Error fetching calendar event:', error);
      res.status(500).json({ error: 'Failed to fetch calendar event' });
    }
  });

  app.post('/api/consultation/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const eventData = insertConsultationCalendarSchema.parse({ ...req.body, consultantId });

      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      res.status(400).json({ error: 'Failed to create calendar event' });
    }
  });

  app.put('/api/consultation/calendar/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const eventId = validateId(req.params.id);

      // Verify ownership before update
      if (!(await verifyCalendarEventOwnership(eventId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const updateData = insertConsultationCalendarSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(eventId, updateData);
      res.json(event);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid calendar event ID' });
      }
      console.error('Error updating calendar event:', error);
      res.status(400).json({ error: 'Failed to update calendar event' });
    }
  });

  app.delete('/api/consultation/calendar/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const eventId = validateId(req.params.id);

      // Verify ownership before delete
      if (!(await verifyCalendarEventOwnership(eventId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      await storage.deleteCalendarEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid calendar event ID' });
      }
      console.error('Error deleting calendar event:', error);
      res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  });

  app.get('/api/consultation/calendar/available/:date', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const date = new Date(req.params.date);
      const availableSlots = await storage.getAvailableSlots(consultantId, date);
      res.json(availableSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      res.status(500).json({ error: 'Failed to fetch available slots' });
    }
  });

  app.get('/api/consultation/calendar/today', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const todayConsultations = await storage.getTodayConsultations(consultantId);
      res.json(todayConsultations);
    } catch (error) {
      console.error('Error fetching today consultations:', error);
      res.status(500).json({ error: 'Failed to fetch today consultations' });
    }
  });

  // Client Progress tracking endpoints
  app.get('/api/consultation/progress/client/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.clientId);

      // Verify client ownership
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const category = req.query.category as string;
      let progress;
      if (category) {
        progress = await storage.getClientProgressByCategory(clientId, category);
      } else {
        progress = await storage.getClientProgress(clientId);
      }

      res.json(progress);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error fetching client progress:', error);
      res.status(500).json({ error: 'Failed to fetch client progress' });
    }
  });

  app.get('/api/consultation/progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const progressId = validateId(req.params.id);

      const progress = await storage.getProgressById(progressId);
      if (!progress) {
        return res.status(404).json({ error: 'Progress record not found' });
      }

      // Verify ownership (check if client belongs to consultant)
      if (!(await verifyClientOwnership(progress.userId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json(progress);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid progress ID' });
      }
      console.error('Error fetching progress record:', error);
      res.status(500).json({ error: 'Failed to fetch progress record' });
    }
  });

  app.post('/api/consultation/progress', isAuthenticated, async (req: any, res) => {
    try {
      const progressData = insertClientProgressSchema.parse(req.body);
      const progress = await storage.createProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error('Error creating progress record:', error);
      res.status(400).json({ error: 'Failed to create progress record' });
    }
  });

  app.put('/api/consultation/progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const progressId = validateId(req.params.id);

      // Verify ownership before update
      if (!(await verifyProgressOwnership(progressId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const updateData = insertClientProgressSchema.partial().parse(req.body);
      const progress = await storage.updateProgress(progressId, updateData);
      res.json(progress);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid progress ID' });
      }
      console.error('Error updating progress record:', error);
      res.status(400).json({ error: 'Failed to update progress record' });
    }
  });

  app.delete('/api/consultation/progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const progressId = validateId(req.params.id);

      // Verify ownership before delete
      if (!(await verifyProgressOwnership(progressId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      await storage.deleteProgress(progressId);
      res.json({ success: true });
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid progress ID' });
      }
      console.error('Error deleting progress record:', error);
      res.status(500).json({ error: 'Failed to delete progress record' });
    }
  });

  app.get('/api/consultation/progress/report/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const clientId = validateId(req.params.clientId);

      // Verify client ownership
      if (!(await verifyClientOwnership(clientId, consultantId))) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const report = await storage.getProgressReport(clientId, startDate, endDate);
      res.json(report);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      console.error('Error generating progress report:', error);
      res.status(500).json({ error: 'Failed to generate progress report' });
    }
  });

  // ============================
  // CLIENT ENDPOINTS - Per i clienti finali
  // ============================

  // Endpoint per i clienti per vedere i propri esercizi assegnati  
  app.get('/api/my-exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const exercises = await storage.getClientExercises(userId);
      res.json(exercises);
    } catch (error) {
      console.error('Error fetching user exercises:', error);
      res.status(500).json({ error: 'Failed to fetch your exercises' });
    }
  });

  // Endpoint per i clienti per vedere i propri appuntamenti
  app.get('/api/my-appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const appointments = await storage.getClientCalendar(userId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      res.status(500).json({ error: 'Failed to fetch your appointments' });
    }
  });

  // Endpoint per i clienti per aggiornare lo stato di un esercizio assegnato
  app.put('/api/my-exercises/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      const exerciseId = validateId(req.params.id);

      // Verifica che l'esercizio appartenga al cliente
      const exercise = await storage.getClientExerciseById(exerciseId);
      if (!exercise || exercise.userId !== userId) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      // Permetti solo aggiornamenti di alcuni campi da parte del cliente
      const allowedFields = ['status', 'progress', 'clientNotes', 'rating', 'timeSpent', 'attachments'];
      const updateData = Object.keys(req.body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      // Se status diventa 'completed', imposta la data di completamento
      if (updateData.status === 'completed') {
        updateData.completedDate = new Date();
      }

      const updatedExercise = await storage.updateClientExercise(exerciseId, updateData);
      res.json(updatedExercise);
    } catch (error) {
      if (isErrorWithMessage(error) && error.message === 'Invalid ID parameter') {
        return res.status(400).json({ error: 'Invalid exercise ID' });
      }
      console.error('Error updating exercise:', error);
      res.status(500).json({ error: 'Failed to update exercise' });
    }
  });

  // Endpoint per i clienti per vedere il proprio progresso di consulenza
  app.get('/api/my-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);
      // Mock progress data for now - this can be enhanced later
      const progressData = [
        {
          id: 1,
          category: 'Financial Planning',
          currentLevel: 'Intermediate',
          nextLevel: 'Advanced',
          progressPercentage: 65,
          totalExercises: 10,
          completedExercises: 6,
          averageScore: 8.2,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          category: 'Budget Management',
          currentLevel: 'Beginner',
          nextLevel: 'Intermediate',
          progressPercentage: 40,
          totalExercises: 8,
          completedExercises: 3,
          averageScore: 7.5,
          lastUpdated: new Date().toISOString()
        }
      ];

      res.json(progressData);
    } catch (error) {
      console.error('Error fetching client progress:', error);
      res.status(500).json({ error: 'Failed to fetch your progress' });
    }
  });

  // ============================
  // NUOVI ENDPOINT BIBLIOTECA ESERCIZI - Puliti e semplici
  // ============================

  // Endpoint per consulenti: visualizzare esercizi pubblici per assegnazione
  app.get('/api/exercises-library/consultant', requireConsultant, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);

      if (!consultantId || isNaN(consultantId) || consultantId <= 0) {
        return res.status(400).json({ error: 'Invalid consultant ID' });
      }

      // Ottieni tutti gli esercizi pubblici
      const exercises = await storage.getPublicExercises(consultantId);
      res.json(exercises);
    } catch (error) {
      console.error('Error fetching exercises for consultant:', error);
      res.status(500).json({ error: 'Failed to fetch exercises' });
    }
  });

  // Endpoint per clienti: visualizzare i propri esercizi assegnati  
  app.get('/api/exercises-library/client', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.user.id);

      if (!userId || isNaN(userId) || userId <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Ottieni esercizi assegnati al cliente
      const exercises = await storage.getClientExercises(userId);
      res.json(exercises);
    } catch (error) {
      console.error('Error fetching exercises for client:', error);
      res.status(500).json({ error: 'Failed to fetch exercises' });
    }
  });

  // Endpoint per assegnare esercizi (riusa la logica esistente ma semplificato)
  app.post('/api/exercises-library/assign', requireConsultant, async (req: any, res) => {
    try {
      const consultantId = parseInt(req.user.id);
      const { clientId, exerciseId, priority = 'medium', consultantNotes = '' } = req.body;

      if (!clientId || !exerciseId) {
        return res.status(400).json({ error: 'Client ID and Exercise ID are required' });
      }

      // Verifica che il cliente esista (simple check)
      const clientExists = await db.select().from(users).where(eq(users.id, parseInt(clientId))).limit(1);
      if (clientExists.length === 0) {
        return res.status(400).json({ error: 'Client not found' });
      }

      const assignmentData = insertClientExerciseSchema.parse({ 
        clientId: parseInt(clientId),
        exerciseId: parseInt(exerciseId),
        assignedBy: consultantId,
        priority,
        consultantNotes
      });

      const assignment = await storage.assignExerciseToClient(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error('Error assigning exercise:', error);
      res.status(400).json({ error: 'Failed to assign exercise' });
    }
  });

  return httpServer;
}