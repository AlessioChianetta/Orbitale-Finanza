import {
  users,
  assets,
  liabilities,
  incomes,
  expenses,
  goals,
  investments,
  transactions,
  recurringTransactions,
  achievements,
  userProgress,
  budgetSettings,
  categoryRules,
  accountArchitecture,
  savingsSubAccounts,
  customAccounts,
  educationalContent,
  modelPortfolios,
  portfolioAllocations,
  userEducationProgress,
  communityPosts,
  communityComments,
  courses,
  courseCategories,
  courseLessons,
  tutors,
  userCourseProgress,
  // Consultation System imports
  clients,
  clientMetadata,
  consultations,
  exercises,
  clientExercises,
  consultationCalendar,
  clientProgress,
  type User,
  type UpsertUser,
  type Asset,
  type InsertAsset,
  type Liability,
  type InsertLiability,
  type Income,
  type InsertIncome,
  type Expense,
  type InsertExpense,
  type Goal,
  type InsertGoal,
  type Investment,
  type InsertInvestment,
  type Transaction,
  type InsertTransaction,
  type RecurringTransaction,
  type InsertRecurringTransaction,
  type Achievement,
  type InsertAchievement,
  type UserProgress,
  type InsertUserProgress,
  type BudgetSettings,
  type InsertBudgetSettings,
  type CategoryRule,
  type InsertCategoryRule,
  type AccountArchitecture,
  type InsertAccountArchitecture,
  type SavingsSubAccount,
  type InsertSavingsSubAccount,
  type EducationalContent,
  type InsertEducationalContent,
  type ModelPortfolio,
  type InsertModelPortfolio,
  type PortfolioAllocation,
  type InsertPortfolioAllocation,
  type UserEducationProgress,
  type InsertUserEducationProgress,
  type InsertCommunityPost,
  type SelectCommunityPost,
  type InsertCommunityComment,
  type SelectCommunityComment,
  type InsertCourse,
  type SelectCourse,
  type InsertCourseCategory,
  type SelectCourseCategory,
  type InsertCourseLesson,
  type SelectCourseLesson,
  type InsertTutor,
  type SelectTutor,
  type InsertUserCourseProgress,
  type SelectUserCourseProgress,
  // Consultation System types
  type Client,
  type InsertClient,
  type Consultation,
  type InsertConsultation,
  type Exercise,
  type InsertExercise,
  type ClientExercise,
  type InsertClientExercise,
  type ConsultationCalendar,
  type InsertConsultationCalendar,
  type ClientProgress,
  type InsertClientProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, isNull, lte, gte, asc, sql } from "drizzle-orm";

// Create alias for consistency with existing code
const accountArchitectures = accountArchitecture;

export interface IStorage {
  // User operations for local auth
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUser(id: number, user: Partial<UpsertUser>): Promise<User>;

  // Asset operations
  getUserAssets(userId: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: number): Promise<void>;

  // Liability operations
  getUserLiabilities(userId: number): Promise<Liability[]>;
  createLiability(liability: InsertLiability): Promise<Liability>;
  updateLiability(id: number, liability: Partial<InsertLiability>): Promise<Liability>;
  deleteLiability(id: number): Promise<void>;

  // Income operations
  getUserIncomes(userId: number): Promise<Income[]>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income>;
  deleteIncome(id: number): Promise<void>;

  // Expense operations
  getUserExpenses(userId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Goal operations
  getUserGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;

  // Investment operations
  getUserInvestments(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment>;
  deleteInvestment(id: number): Promise<void>;

  // Transaction operations
  getUserTransactions(userId: number, limit?: number, startDate?: string, endDate?: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Recurring transaction operations
  getUserRecurringTransactions(userId: number): Promise<RecurringTransaction[]>;
  createRecurringTransaction(transaction: InsertRecurringTransaction): Promise<RecurringTransaction>;
  updateRecurringTransaction(id: number, transaction: Partial<InsertRecurringTransaction>): Promise<RecurringTransaction>;
  deleteRecurringTransaction(id: number): Promise<void>;
  getRecurringTransactionsDue(): Promise<RecurringTransaction[]>;

  // Achievement operations
  getUserAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  // User progress operations
  getUserProgress(userId: number): Promise<UserProgress[]>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // Budget operations
  getUserBudgetSettings(userId: number): Promise<BudgetSettings | undefined>;
  upsertBudgetSettings(settings: InsertBudgetSettings): Promise<BudgetSettings>;
  getCategoryRules(userId?: number): Promise<CategoryRule[]>;
  createCategoryRule(rule: InsertCategoryRule): Promise<CategoryRule>;

  // Account Architecture operations
  getUserAccountArchitecture(userId: number): Promise<AccountArchitecture | undefined>;
  createAccountArchitecture(architecture: InsertAccountArchitecture): Promise<AccountArchitecture>;
  updateAccountArchitecture(id: number, architecture: Partial<InsertAccountArchitecture>): Promise<AccountArchitecture>;
  deleteAccountArchitecture(id: number): Promise<void>;
  getSubAccounts(architectureId: number): Promise<SavingsSubAccount[]>;
  createSubAccount(subAccount: InsertSavingsSubAccount): Promise<SavingsSubAccount>;
  updateSubAccount(id: number, subAccount: Partial<InsertSavingsSubAccount>): Promise<SavingsSubAccount>;
  deleteSubAccount(id: number): Promise<void>;

  // Community operations
  getCommunityPosts(): Promise<SelectCommunityPost[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<SelectCommunityPost>;
  updateCommunityPost(postId: number, updateData: any): Promise<SelectCommunityPost>;
  deleteCommunityPost(postId: number): Promise<void>;
  getCommunityComments(postId: number): Promise<SelectCommunityComment[]>;
  createCommunityComment(comment: InsertCommunityComment): Promise<SelectCommunityComment>;
  likeCommunityPost(postId: number): Promise<void>;

  // Course operations
  getCourses(): Promise<SelectCourse[]>;
  createCourse(course: InsertCourse): Promise<SelectCourse>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<SelectCourse>;
  deleteCourse(id: number): Promise<void>;
  getCourseLessons(courseId: number): Promise<SelectCourseLesson[]>;
  createCourseLesson(lesson: InsertCourseLesson): Promise<SelectCourseLesson>;
  updateCourseLesson(id: number, lesson: Partial<InsertCourseLesson>): Promise<SelectCourseLesson>;
  deleteCourseLesson(id: number): Promise<void>;
  getAllPublishedLessons(): Promise<SelectCourseLesson[]>;

  // Tutor operations
  getTutors(): Promise<SelectTutor[]>;
  createTutor(tutor: InsertTutor): Promise<SelectTutor>;
  updateTutor(id: number, tutor: Partial<InsertTutor>): Promise<SelectTutor>;
  deleteTutor(id: number): Promise<void>;

  // User progress operations
  getUserCourseProgress(userId: number): Promise<SelectUserCourseProgress[]>;
  updateUserCourseProgress(userId: number, courseId: number, progress: Partial<InsertUserCourseProgress>): Promise<SelectUserCourseProgress>;

  // Video progress tracking
  getVideoProgress(userId: number, lessonId: number): Promise<any>;
  updateVideoProgress(userId: number, lessonId: number, progressData: any): Promise<void>;

  // Lesson notes
  getLessonNotes(userId: number, lessonId: number): Promise<any>;
  saveLessonNotes(userId: number, lessonId: number, notes: string): Promise<void>;

  // ============================
  // CONSULTATION SYSTEM OPERATIONS
  // ============================

  // Client operations - gestione clienti consulente (users as clients)
  getConsultantClients(consultantId: number): Promise<Client[]>;
  getClientById(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  searchClients(consultantId: number, query: string): Promise<Client[]>;

  // Consultation operations - appunti e storico consulenze
  getConsultantConsultations(consultantId: number, limit?: number): Promise<Consultation[]>;
  getClientConsultations(userId: number): Promise<Consultation[]>;
  getConsultationById(id: number): Promise<Consultation | undefined>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation>;
  deleteConsultation(id: number): Promise<void>;
  getUpcomingConsultations(consultantId: number): Promise<Consultation[]>;

  // Exercise operations - biblioteca esercizi
  getConsultantExercises(consultantId: number): Promise<Exercise[]>;
  getPublicExercises(consultantId?: number): Promise<any[]>;
  getExerciseById(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;
  searchExercises(consultantId: number, category?: string, difficulty?: string): Promise<Exercise[]>;

  // Client Exercise operations - esercizi assegnati ai clienti (users)
  getClientExercises(userId: number): Promise<ClientExercise[]>;
  getConsultantAssignedExercises(consultantId: number): Promise<ClientExercise[]>;
  getClientExerciseById(id: number): Promise<ClientExercise | undefined>;
  assignExerciseToClient(clientExercise: InsertClientExercise): Promise<ClientExercise>;
  updateClientExercise(id: number, clientExercise: Partial<InsertClientExercise>): Promise<ClientExercise>;
  deleteClientExercise(id: number): Promise<void>;
  getOverdueExercises(consultantId: number): Promise<ClientExercise[]>;
  getAllClientExercisesByConsultant(consultantId: number): Promise<ClientExercise[]>;

  // Consultation Calendar operations - calendario consulenze  
  getConsultantCalendar(consultantId: number, startDate?: Date, endDate?: Date): Promise<ConsultationCalendar[]>;
  getClientCalendar(userId: number): Promise<ConsultationCalendar[]>;
  getCalendarEventById(id: number): Promise<ConsultationCalendar | undefined>;
  createCalendarEvent(event: InsertConsultationCalendar): Promise<ConsultationCalendar>;
  updateCalendarEvent(id: number, event: Partial<InsertConsultationCalendar>): Promise<ConsultationCalendar>;
  deleteCalendarEvent(id: number): Promise<void>;
  getAvailableSlots(consultantId: number, date: Date): Promise<ConsultationCalendar[]>;
  getTodayConsultations(consultantId: number): Promise<ConsultationCalendar[]>;

  // Client Progress operations - tracking progressi clienti (users)
  getClientProgress(userId: number): Promise<ClientProgress[]>;
  getClientProgressByCategory(userId: number, category: string): Promise<ClientProgress[]>;
  getProgressById(id: number): Promise<ClientProgress | undefined>;
  createProgress(progress: InsertClientProgress): Promise<ClientProgress>;
  updateProgress(id: number, progress: Partial<InsertClientProgress>): Promise<ClientProgress>;
  deleteProgress(id: number): Promise<void>;
  getProgressReport(userId: number, startDate?: Date, endDate?: Date): Promise<ClientProgress[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      password: users.password,
      role: users.role,
      websiteUrl: users.websiteUrl, // Explicitly select websiteUrl
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      password: users.password,
      role: users.role,
      websiteUrl: users.websiteUrl, // Explicitly select websiteUrl
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(userId: number, userData: Partial<UpsertUser>): Promise<User> {
    if (userData.website_url !== undefined) {
      userData.websiteUrl = userData.website_url;
      delete userData.website_url;
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with id ${userId} not found`);
    }

    return updatedUser;
  }

  // Asset operations
  async getUserAssets(userId: number): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.userId, userId));
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    if (!updatedAsset) {
      throw new Error(`Asset with id ${id} not found`);
    }
    return updatedAsset;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Liability operations
  async getUserLiabilities(userId: number): Promise<Liability[]> {
    return await db.select().from(liabilities).where(eq(liabilities.userId, userId));
  }

  async createLiability(liability: InsertLiability): Promise<Liability> {
    const [newLiability] = await db.insert(liabilities).values(liability).returning();
    return newLiability;
  }

  async updateLiability(id: number, liability: Partial<InsertLiability>): Promise<Liability> {
    const [updatedLiability] = await db
      .update(liabilities)
      .set({ ...liability, updatedAt: new Date() })
      .where(eq(liabilities.id, id))
      .returning();
    return updatedLiability;
  }

  async deleteLiability(id: number): Promise<void> {
    await db.delete(liabilities).where(eq(liabilities.id, id));
  }

  // Income operations
  async getUserIncomes(userId: number): Promise<Income[]> {
    return await db.select().from(incomes).where(eq(incomes.userId, userId));
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const [newIncome] = await db.insert(incomes).values(income).returning();
    return newIncome;
  }

  async updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income> {
    const [updatedIncome] = await db
      .update(incomes)
      .set({ ...income, updatedAt: new Date() })
      .where(eq(incomes.id, id))
      .returning();
    return updatedIncome;
  }

  async deleteIncome(id: number): Promise<void> {
    await db.delete(incomes).where(eq(incomes.id, id));
  }

  // Expense operations
  async getUserExpenses(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Goal operations
  async getUserGoals(userId: number): Promise<Goal[]> {
    return await db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.isActive, true)));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal> {
    const [updatedGoal] = await db
      .update(goals)
      .set({ ...goal, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(goals).set({ isActive: false }).where(eq(goals.id, id));
      await tx.update(investments).set({ goalId: null }).where(eq(investments.goalId, id));
      await tx.update(transactions).set({ goalId: null }).where(eq(transactions.goalId, id));
    });
  }

  // Investment operations
  async getUserInvestments(userId: number): Promise<Investment[]> {
    return await db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment> {
    const [updatedInvestment] = await db
      .update(investments)
      .set({ ...investment, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return updatedInvestment;
  }

  async deleteInvestment(id: number): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }

  // Transaction operations
  async getUserTransactions(userId: number, limit = 10000, startDate?: string, endDate?: string): Promise<Transaction[]> {
    const conditions = [eq(transactions.userId, userId)];

    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }

    console.log('[DB QUERY] getUserTransactions:', { userId, limit, startDate, endDate, conditionsCount: conditions.length });

    const results = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit);

    if (results.length > 0) {
      console.log('[DB QUERY] Esempio prima riga date type:', typeof results[0].date, '| valore:', results[0].date);
    }

    return results;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Achievement operations
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  // User progress operations
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, progress.userId), eq(userProgress.module, progress.module)));

    if (existingProgress) {
      const [updatedProgress] = await db
        .update(userProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      const [newProgress] = await db.insert(userProgress).values(progress).returning();
      return newProgress;
    }
  }
  async getUserBudgetSettings(userId: number): Promise<BudgetSettings | undefined> {
    const [result] = await db.select().from(budgetSettings).where(eq(budgetSettings.userId, userId));
    return result;
  }

  async upsertBudgetSettings(settings: InsertBudgetSettings): Promise<BudgetSettings> {
    // Check if budget settings already exist for this user
    const existing = await db.select().from(budgetSettings).where(eq(budgetSettings.userId, settings.userId));

    if (existing.length > 0) {
      // Update existing record
      const [result] = await db.update(budgetSettings)
        .set({
          needsPercentage: settings.needsPercentage,
          wantsPercentage: settings.wantsPercentage,
          savingsPercentage: settings.savingsPercentage,
          monthlyIncome: settings.monthlyIncome,
          customCategories: settings.customCategories,
          updatedAt: new Date()
        })
        .where(eq(budgetSettings.userId, settings.userId))
        .returning();
      return result;
    } else {
      // Insert new record
      const [result] = await db.insert(budgetSettings).values(settings).returning();
      return result;
    }
  }

  // Educational Content methods
  async getEducationalContent(): Promise<EducationalContent[]> {
    return await db.select().from(educationalContent).where(eq(educationalContent.isPublished, true));
  }

  async getUserEducationProgress(userId: number): Promise<UserEducationProgress[]> {
    return await db.select().from(userEducationProgress).where(eq(userEducationProgress.userId, userId));
  }

  async upsertEducationProgress(progress: InsertUserEducationProgress): Promise<UserEducationProgress> {
    const existing = await db.select()
      .from(userEducationProgress)
      .where(and(
        eq(userEducationProgress.userId, progress.userId),
        eq(userEducationProgress.contentId, progress.contentId)
      ));

    if (existing.length > 0) {
      const [result] = await db.update(userEducationProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(userEducationProgress.id, existing[0].id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(userEducationProgress).values(progress).returning();
      return result;
    }
  }

  // Model Portfolio methods
  async getModelPortfolios(): Promise<ModelPortfolio[]> {
    return await db.select().from(modelPortfolios).where(eq(modelPortfolios.isActive, true));
  }

  async getPortfolioAllocations(portfolioId: number): Promise<PortfolioAllocation[]> {
    return await db.select().from(portfolioAllocations).where(eq(portfolioAllocations.portfolioId, portfolioId));
  }

  async getCategoryRules(userId?: number): Promise<CategoryRule[]> {
    if (userId) {
      return await db.select().from(categoryRules)
        .where(or(eq(categoryRules.userId, userId), isNull(categoryRules.userId)))
        .orderBy(desc(categoryRules.confidence));
    } else {
      return await db.select().from(categoryRules)
        .where(isNull(categoryRules.userId))
        .orderBy(desc(categoryRules.confidence));
    }
  }

  async createCategoryRule(rule: InsertCategoryRule): Promise<CategoryRule> {
    const [result] = await db.insert(categoryRules).values(rule).returning();
    return result;
  }

  // Recurring transaction operations
  async getUserRecurringTransactions(userId: number): Promise<RecurringTransaction[]> {
    return db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId));
  }

  async createRecurringTransaction(transaction: InsertRecurringTransaction): Promise<RecurringTransaction> {
    const [newTransaction] = await db.insert(recurringTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateRecurringTransaction(id: number, transaction: Partial<InsertRecurringTransaction>): Promise<RecurringTransaction> {
    const [updatedTransaction] = await db.update(recurringTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(recurringTransactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteRecurringTransaction(id: number): Promise<void> {
    await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
  }

  async getRecurringTransactionsDue(): Promise<RecurringTransaction[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(recurringTransactions)
      .where(and(
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextExecutionDate, today)
      ));
  }

  // Account Architecture operations
  async getUserAccountArchitecture(userId: number): Promise<AccountArchitecture | undefined> {
    const result = await db.select().from(accountArchitecture)
      .where(eq(accountArchitecture.userId, userId))
      .orderBy(desc(accountArchitecture.updatedAt))
      .limit(1);
    return result[0];
  }

  async createAccountArchitecture(architecture: InsertAccountArchitecture): Promise<AccountArchitecture> {
    const [result] = await db.insert(accountArchitecture)
      .values(architecture)
      .returning();
    return result;
  }

  async updateAccountArchitecture(id: number, architecture: Partial<InsertAccountArchitecture>): Promise<AccountArchitecture> {
    // Filter out any nested objects and only keep valid fields
    const updateData: any = {};

    // Copy only valid architecture fields, excluding nested objects
    const validFields = [
      'monthlyIncome', 'distributionDay', 'autoDistributionEnabled',
      'incomeAccountName', 'incomeAccountBankName', 'incomeAccountIban', 'incomeAccountBalance',
      'wealthAccountName', 'wealthAccountBankName', 'wealthAccountIban', 'wealthAccountBalance', 'wealthMonthlyAllocation',
      'operatingAccountName', 'operatingAccountBankName', 'operatingAccountIban', 'operatingAccountBalance', 'operatingMonthlyAllocation',
      'emergencyAccountName', 'emergencyAccountBankName', 'emergencyAccountIban', 'emergencyAccountBalance', 'emergencyTargetAmount', 'emergencyMonthlyAllocation',
      'investmentAccountName', 'investmentAccountBankName', 'investmentAccountIban', 'investmentAccountBalance', 'investmentMonthlyAllocation',
      'savingsAccountName', 'savingsAccountBankName', 'savingsAccountIban', 'savingsAccountBalance', 'savingsMonthlyAllocation'
    ];

    for (const field of validFields) {
      if (architecture[field as keyof typeof architecture] !== undefined) {
        updateData[field] = architecture[field as keyof typeof architecture];
      }
    }

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const [result] = await db.update(accountArchitecture)
      .set(updateData)
      .where(eq(accountArchitecture.id, id))
      .returning();
    return result;
  }

  async getSubAccounts(architectureId: number): Promise<SavingsSubAccount[]> {
    return db.select().from(savingsSubAccounts)
      .where(eq(savingsSubAccounts.architectureId, architectureId));
  }

  async createSubAccount(subAccount: InsertSavingsSubAccount): Promise<SavingsSubAccount> {
    const [result] = await db.insert(savingsSubAccounts)
      .values(subAccount)
      .returning();
    return result;
  }

  async updateSubAccount(id: number, subAccount: Partial<InsertSavingsSubAccount>): Promise<SavingsSubAccount> {
    const [result] = await db.update(savingsSubAccounts)
      .set(subAccount)
      .where(eq(savingsSubAccounts.id, id))
      .returning();
    return result;
  }

  async deleteSubAccount(id: number): Promise<void> {
    await db.delete(savingsSubAccounts)
      .where(eq(savingsSubAccounts.id, id));
  }

  async deleteAccountArchitecture(id: number): Promise<void> {
    await db.delete(accountArchitecture)
      .where(eq(accountArchitecture.id, id));
  }

  // Community operations
  async getCommunityPosts(): Promise<SelectCommunityPost[]> {
    const posts = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        likes: communityPosts.likes,
        commentsCount: communityPosts.commentsCount,
        isActive: communityPosts.isActive,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        authorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        authorEmail: users.email
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.isActive, true))
      .orderBy(desc(communityPosts.createdAt));

    return posts as any;
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<SelectCommunityPost> {
    const [newPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async getCommunityPost(postId: number) {
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));
    return post;
  }

  async updateCommunityPost(postId: number, updateData: any) {
    const [post] = await db
      .update(communityPosts)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, postId))
      .returning();
    return post;
  }

  async deleteCommunityPost(postId: number) {
    // First delete all comments for this post
    await db
      .delete(communityComments)
      .where(eq(communityComments.postId, postId));

    // Then delete the post
    await db
      .delete(communityPosts)
      .where(eq(communityPosts.id, postId));
  }

  async getCommunityComments(postId: number): Promise<SelectCommunityComment[]> {
    const comments = await db
      .select({
        id: communityComments.id,
        postId: communityComments.postId,
        userId: communityComments.userId,
        content: communityComments.content,
        isActive: communityComments.isActive,
        createdAt: communityComments.createdAt,
        updatedAt: communityComments.updatedAt,
        authorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        authorEmail: users.email
      })
      .from(communityComments)
      .leftJoin(users, eq(communityComments.userId, users.id))
      .where(and(eq(communityComments.postId, postId), eq(communityComments.isActive, true)))
      .orderBy(communityComments.createdAt);

    return comments as any;
  }

  async createCommunityComment(comment: InsertCommunityComment): Promise<SelectCommunityComment> {
    const [newComment] = await db
      .insert(communityComments)
      .values(comment)
      .returning();

    // Update comments count
    await db
      .update(communityPosts)
      .set({
        commentsCount: sql`${communityPosts.commentsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, comment.postId));

    return newComment;
  }

  async likeCommunityPost(postId: number): Promise<void> {
    await db
      .update(communityPosts)
      .set({
        likes: sql`${communityPosts.likes} + 1`,
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, postId));
  }

  // Course operations
  async getCourses(): Promise<SelectCourse[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async createCourse(course: InsertCourse): Promise<SelectCourse> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<SelectCourse> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Course categories management
  async getCourseCategories(): Promise<SelectCourseCategory[]> {
    return await db.select().from(courseCategories).orderBy(courseCategories.name);
  }

  async createCourseCategory(category: InsertCourseCategory): Promise<SelectCourseCategory> {
    const [newCategory] = await db.insert(courseCategories).values(category).returning();
    return newCategory;
  }

  async updateCourseCategory(id: number, category: Partial<InsertCourseCategory>): Promise<SelectCourseCategory> {
    const [updatedCategory] = await db
      .update(courseCategories)
      .set(category)
      .where(eq(courseCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCourseCategory(id: number): Promise<void> {
    await db.delete(courseCategories).where(eq(courseCategories.id, id));
  }

  async getCourseLessons(courseId: number): Promise<SelectCourseLesson[]> {
    return await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.sortOrder);
  }

  async createCourseLesson(lesson: InsertCourseLesson): Promise<SelectCourseLesson> {
    const [newLesson] = await db.insert(courseLessons).values(lesson).returning();
    return newLesson;
  }

  async updateCourseLesson(id: number, lesson: Partial<InsertCourseLesson>): Promise<SelectCourseLesson> {
    const [updatedLesson] = await db
      .update(courseLessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(courseLessons.id, id))
      .returning();
    return updatedLesson;
  }

  async deleteCourseLesson(id: number): Promise<void> {
    await db.delete(courseLessons).where(eq(courseLessons.id, id));
  }

  // Tutor operations
  async getTutors(): Promise<SelectTutor[]> {
    return await db.select().from(tutors).orderBy(tutors.name);
  }

  async createTutor(tutor: InsertTutor): Promise<SelectTutor> {
    const tutorData = {
      ...tutor,
      assignedEmails: tutor.assignedEmails || []
    };
    const [newTutor] = await db.insert(tutors).values(tutorData).returning();
    return newTutor;
  }

  async updateTutor(id: number, tutor: Partial<InsertTutor>): Promise<SelectTutor> {
    const updateData = {
      ...tutor,
      updatedAt: new Date()
    };
    if (tutor.assignedEmails !== undefined) {
      updateData.assignedEmails = tutor.assignedEmails;
    }
    const [updatedTutor] = await db
      .update(tutors)
      .set(updateData)
      .where(eq(tutors.id, id))
      .returning();
    return updatedTutor;
  }

  async deleteTutor(id: number): Promise<void> {
    await db.delete(tutors).where(eq(tutors.id, id));
  }

  // User progress operations
  async getUserCourseProgress(userId: number): Promise<SelectUserCourseProgress[]> {
    return await db
      .select()
      .from(userCourseProgress)
      .where(eq(userCourseProgress.userId, userId));
  }

  async updateUserCourseProgress(userId: number, courseId: number, progress: Partial<InsertUserCourseProgress>): Promise<SelectUserCourseProgress> {
    const existing = await db
      .select()
      .from(userCourseProgress)
      .where(and(
        eq(userCourseProgress.userId, userId),
        eq(userCourseProgress.courseId, courseId)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(userCourseProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(and(
          eq(userCourseProgress.userId, userId),
          eq(userCourseProgress.courseId, courseId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userCourseProgress)
        .values({ userId, courseId, ...progress })
        .returning();
      return created;
    }
  }

  async getAllPublishedLessons(): Promise<SelectCourseLesson[]> {
    return await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.isPublished, true))
      .orderBy(courseLessons.sortOrder);
  }

  // Custom Accounts Management
  async getCustomAccounts(userId: number) {
    return await db
      .select()
      .from(customAccounts)
      .where(and(eq(customAccounts.userId, userId), eq(customAccounts.isActive, true)))
      .orderBy(customAccounts.createdAt);
  }

  async createCustomAccount(account: any) {
    return await db.insert(customAccounts).values(account).returning();
  }

  async updateCustomAccount(accountId: number, updates: any) {
    return await db
      .update(customAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customAccounts.id, accountId))
      .returning();
  }

  async deleteCustomAccount(accountId: number) {
    return await db
      .update(customAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customAccounts.id, accountId))
      .returning();
  }

  async getCustomAccountById(accountId: number) {
    const result = await db
      .select()
      .from(customAccounts)
      .where(and(eq(customAccounts.id, accountId), eq(customAccounts.isActive, true)))
      .limit(1);
    return result[0] || null;
  }

  // Video progress methods
  private videoProgressMap = new Map<string, any>();
  private lessonNotesMap = new Map<string, any>();

  async updateVideoProgress(userId: number, lessonId: number, progressData: any): Promise<void> {
    const key = `${userId}-${lessonId}`;
    const existing = this.videoProgressMap.get(key) || {};

    // Increment watch count only on first view or if starting from beginning
    const shouldIncrementWatchCount = !existing.watchCount || (progressData.currentPosition || 0) < 10;

    this.videoProgressMap.set(key, {
      ...existing,
      ...progressData,
      userId,
      lessonId,
      watchCount: shouldIncrementWatchCount ? (existing.watchCount || 0) + 1 : existing.watchCount || 1,
      lastWatchedAt: new Date()
    });
  }

  async getVideoProgress(userId: number, lessonId: number): Promise<any> {
    const key = `${userId}-${lessonId}`;
    return this.videoProgressMap.get(key) || null;
  }

  // Lesson notes methods
  async getLessonNotes(userId: number, lessonId: number): Promise<any> {
    const key = `${userId}-${lessonId}`;
    return this.lessonNotesMap.get(key) || null;
  }

  async saveLessonNotes(userId: number, lessonId: number, notes: string): Promise<void> {
    const key = `${userId}-${lessonId}`;
    const existing = this.lessonNotesMap.get(key) || { viewCount: 0 };

    this.lessonNotesMap.set(key, {
      notes,
      viewCount: existing.viewCount + 1,
      lastViewed: new Date(),
      userId,
      lessonId
    });
  }

  // ============================
  // CONSULTATION SYSTEM IMPLEMENTATIONS
  // ============================

  // Client operations - gestione clienti consulente (users as clients)
  async getConsultantClients(consultantId: number): Promise<Client[]> {
    // Return clients from the clients table with user information
    return await db
      .select({
        id: clients.id, // Use clients.id instead of users.id
        email: clients.email,
        firstName: clients.firstName,
        lastName: clients.lastName,
        phone: clients.phone,
        status: clients.status,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        userId: clients.userId // Keep userId for reference
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(sql`${clients.userId} != ${consultantId}`);
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(users).where(eq(users.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    // Create a new user (which is a client)
    const [newClient] = await db.insert(users).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(users)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<void> {
    // In this architecture, we don't delete users but could set them inactive
    // For now, we'll keep the delete functionality
    await db.delete(users).where(eq(users.id, id));
  }

  async searchClients(consultantId: number, query: string): Promise<Client[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        sql`${users.id} != ${consultantId}`,
        or(
          sql`${users.firstName} ILIKE ${`%${query}%`}`,
          sql`${users.lastName} ILIKE ${`%${query}%`}`,
          sql`${users.email} ILIKE ${`%${query}%`}`
        )
      ));
  }

  // Consultation operations - appunti e storico consulenze
  async getConsultantConsultations(consultantId: number, limit?: number): Promise<Consultation[]> {
    if (limit) {
      return await db
        .select()
        .from(consultations)
        .where(eq(consultations.consultantId, consultantId))
        .orderBy(desc(consultations.consultationDate))
        .limit(limit);
    }

    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.consultantId, consultantId))
      .orderBy(desc(consultations.consultationDate));
  }

  async getClientConsultations(userId: number): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(eq(consultations.userId, userId))
      .orderBy(desc(consultations.consultationDate));
  }

  async getConsultationById(id: number): Promise<Consultation | undefined> {
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
    return consultation;
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [newConsultation] = await db.insert(consultations).values(consultation).returning();
    return newConsultation;
  }

  async updateConsultation(id: number, consultation: Partial<InsertConsultation>): Promise<Consultation> {
    const [updatedConsultation] = await db
      .update(consultations)
      .set({ ...consultation, updatedAt: new Date() })
      .where(eq(consultations.id, id))
      .returning();
    return updatedConsultation;
  }

  async deleteConsultation(id: number): Promise<void> {
    await db.delete(consultations).where(eq(consultations.id, id));
  }

  async getUpcomingConsultations(consultantId: number): Promise<Consultation[]> {
    return await db
      .select()
      .from(consultations)
      .where(and(
        eq(consultations.consultantId, consultantId),
        sql`${consultations.consultationDate} >= NOW()`,
        eq(consultations.isCompleted, false)
      ))
      .orderBy(asc(consultations.consultationDate));
  }

  // Exercise operations - biblioteca esercizi
  async getConsultantExercises(consultantId: number): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(and(
        eq(exercises.createdBy, consultantId),
        eq(exercises.isActive, true)
      ))
      .orderBy(desc(exercises.createdAt));
  }

  async getPublicExercises(consultantId?: number): Promise<any[]> {
    // Sempre restituisce una struttura dati consistente, indipendentemente da consultantId
    const result = await db
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
        usageCount: exercises.usageCount,
        averageCompletion: exercises.averageCompletion,
        averageRating: exercises.averageRating,
        createdAt: exercises.createdAt,
        updatedAt: exercises.updatedAt,
        // Creator info
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        // Assignment count for this consultant (0 if no consultantId)
        assignmentCount: consultantId
          ? sql<number>`CAST(COALESCE((
              SELECT COUNT(*)
              FROM client_exercises
              WHERE client_exercises.exercise_id = exercises.id
              AND client_exercises.assigned_by = ${consultantId}
            ), 0) AS INTEGER)`
          : sql<number>`0`
      })
      .from(exercises)
      .leftJoin(users, eq(exercises.createdBy, users.id))
      .where(and(
        eq(exercises.isPublic, true),
        eq(exercises.isActive, true)
      ))
      .orderBy(desc(exercises.createdAt));

    return result.map(row => ({
      ...row,
      createdByName: `${row.creatorFirstName || ''} ${row.creatorLastName || ''}`.trim(),
      // Informazioni di assegnazione
      isAssigned: row.assignmentCount > 0,
      assignmentCount: row.assignmentCount
    }));
  }

  async getExerciseById(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  async updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise> {
    const [updatedExercise] = await db
      .update(exercises)
      .set({ ...exercise, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .returning();
    return updatedExercise;
  }

  async deleteExercise(id: number): Promise<void> {
    await db
      .update(exercises)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(exercises.id, id));
  }

  async searchExercises(consultantId: number, category?: string, difficulty?: string): Promise<Exercise[]> {
    let conditions = [
      eq(exercises.createdBy, consultantId),
      eq(exercises.isActive, true)
    ];

    if (category) {
      conditions.push(eq(exercises.category, category));
    }

    if (difficulty) {
      conditions.push(eq(exercises.difficulty, difficulty));
    }

    return await db
      .select()
      .from(exercises)
      .where(and(...conditions))
      .orderBy(desc(exercises.createdAt));
  }

  // Client Exercise operations - esercizi assegnati ai clienti
  async getClientExercises(userId: number): Promise<ClientExercise[]> {
    const results = await db
      .select({
        id: clientExercises.id,
        clientId: clientExercises.clientId,
        exerciseId: clientExercises.exerciseId,
        assignedBy: clientExercises.assignedBy,
        assignedDate: clientExercises.assignedDate,
        dueDate: clientExercises.dueDate,
        status: clientExercises.status,
        priority: clientExercises.priority,
        progress: clientExercises.progress,
        clientNotes: clientExercises.clientNotes,
        consultantFeedback: clientExercises.consultantFeedback,
        consultantNotes: clientExercises.consultantNotes,
        customInstructions: clientExercises.customInstructions,
        completedDate: clientExercises.completedDate,
        rating: clientExercises.rating,
        timeSpent: clientExercises.timeSpent,
        attachments: clientExercises.attachments,
        isStarred: clientExercises.isStarred,
        remindersSent: clientExercises.remindersSent,
        lastReminderDate: clientExercises.lastReminderDate,
        createdAt: clientExercises.createdAt,
        updatedAt: clientExercises.updatedAt,
        // Exercise details
        exerciseTitle: exercises.title,
        exerciseDescription: exercises.description,
        exerciseCategory: exercises.category,
        exerciseDifficulty: exercises.difficulty,
        exerciseEstimatedTime: exercises.estimatedTime,
        exerciseType: exercises.type,
        exerciseInstructions: exercises.instructions,
        exerciseSuccessCriteria: exercises.successCriteria,
        exerciseResources: exercises.resources
      })
      .from(clientExercises)
      .leftJoin(exercises, eq(clientExercises.exerciseId, exercises.id))
      .where(eq(clientExercises.clientId, userId))
      .orderBy(desc(clientExercises.assignedDate));

    return results;
  }

  async getConsultantAssignedExercises(consultantId: number): Promise<ClientExercise[]> {
    return await db
      .select()
      .from(clientExercises)
      .where(eq(clientExercises.assignedBy, consultantId))
      .orderBy(desc(clientExercises.assignedDate));
  }

  async getClientExerciseById(id: number): Promise<ClientExercise | undefined> {
    const [clientExercise] = await db.select().from(clientExercises).where(eq(clientExercises.id, id));
    return clientExercise;
  }

  async validateClientAccess(clientId: number, consultantId: number): Promise<boolean> {
    // Verify that the client exists in users table and is not the consultant
    const [client] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.id, clientId),
        sql`${users.id} != ${consultantId}` // Client shouldn't be the consultant
      ));

    return !!client;
  }

  async assignExerciseToClient(clientExercise: InsertClientExercise): Promise<ClientExercise> {
    // Validate that the client exists and is accessible by the consultant
    const clientExists = await this.validateClientAccess(clientExercise.clientId, clientExercise.assignedBy);

    if (!clientExists) {
      throw new Error(`Client with ID ${clientExercise.clientId} not found or not accessible`);
    }

    const [newAssignment] = await db.insert(clientExercises).values(clientExercise).returning();
    return newAssignment;
  }

  async updateClientExercise(id: number, clientExercise: Partial<InsertClientExercise>): Promise<ClientExercise> {
    const [updatedExercise] = await db
      .update(clientExercises)
      .set({ ...clientExercise, updatedAt: new Date() })
      .where(eq(clientExercises.id, id))
      .returning();
    return updatedExercise;
  }

  async deleteClientExercise(id: number): Promise<void> {
    await db.delete(clientExercises).where(eq(clientExercises.id, id));
  }

  async getOverdueExercises(consultantId: number): Promise<ClientExercise[]> {
    return await db
      .select()
      .from(clientExercises)
      .where(and(
        eq(clientExercises.assignedBy, consultantId),
        sql`${clientExercises.dueDate} < NOW()`,
        sql`${clientExercises.status} NOT IN ('completed', 'cancelled')`
      ))
      .orderBy(asc(clientExercises.dueDate));
  }

  async getAllClientExercisesByConsultant(consultantId: number): Promise<ClientExercise[]> {
    const assignments = await db
      .select({
        id: clientExercises.id,
        clientId: clientExercises.clientId,
        exerciseId: clientExercises.exerciseId,
        assignedBy: clientExercises.assignedBy,
        assignedDate: clientExercises.assignedDate,
        dueDate: clientExercises.dueDate,
        status: clientExercises.status,
        progress: clientExercises.progress,
        priority: clientExercises.priority,
        consultantNotes: clientExercises.consultantNotes,
        customInstructions: clientExercises.customInstructions,
        exerciseTitle: exercises.title,
        exerciseDescription: exercises.description,
        exerciseCategory: exercises.category,
        exerciseDifficulty: exercises.difficulty,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(clientExercises)
      .leftJoin(exercises, eq(clientExercises.exerciseId, exercises.id))
      .leftJoin(users, eq(clientExercises.clientId, users.id))
      .where(eq(clientExercises.assignedBy, consultantId))
      .orderBy(desc(clientExercises.assignedDate));

    return assignments;
  }

  // Consultation Calendar operations - calendario consulenze
  async getConsultantCalendar(consultantId: number, startDate?: Date, endDate?: Date): Promise<ConsultationCalendar[]> {
    let conditions = [eq(consultationCalendar.consultantId, consultantId)];

    if (startDate) {
      conditions.push(sql`${consultationCalendar.startTime} >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`${consultationCalendar.endTime} <= ${endDate}`);
    }

    return await db
      .select()
      .from(consultationCalendar)
      .where(and(...conditions))
      .orderBy(asc(consultationCalendar.startTime));
  }

  async getClientCalendar(userId: number): Promise<ConsultationCalendar[]> {
    return await db
      .select()
      .from(consultationCalendar)
      .where(eq(consultationCalendar.clientId, userId))
      .orderBy(asc(consultationCalendar.startTime));
  }

  async getCalendarEventById(id: number): Promise<ConsultationCalendar | undefined> {
    const [event] = await db.select().from(consultationCalendar).where(eq(consultationCalendar.id, id));
    return event;
  }

  async createCalendarEvent(event: InsertConsultationCalendar): Promise<ConsultationCalendar> {
    const [newEvent] = await db.insert(consultationCalendar).values(event).returning();
    return newEvent;
  }

  async updateCalendarEvent(id: number, event: Partial<InsertConsultationCalendar>): Promise<ConsultationCalendar> {
    const [updatedEvent] = await db
      .update(consultationCalendar)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(consultationCalendar.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    await db.delete(consultationCalendar).where(eq(consultationCalendar.id, id));
  }

  async getAvailableSlots(consultantId: number, date: Date): Promise<ConsultationCalendar[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(consultationCalendar)
      .where(and(
        eq(consultationCalendar.consultantId, consultantId),
        eq(consultationCalendar.type, 'available'),
        sql`${consultationCalendar.startTime} >= ${startOfDay}`,
        sql`${consultationCalendar.endTime} <= ${endOfDay}`,
        isNull(consultationCalendar.clientId)
      ))
      .orderBy(asc(consultationCalendar.startTime));
  }

  async getTodayConsultations(consultantId: number): Promise<ConsultationCalendar[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(consultationCalendar)
      .where(and(
        eq(consultationCalendar.consultantId, consultantId),
        eq(consultationCalendar.type, 'consultation'),
        sql`${consultationCalendar.startTime} >= ${startOfDay}`,
        sql`${consultationCalendar.startTime} <= ${endOfDay}`
      ))
      .orderBy(asc(consultationCalendar.startTime));
  }

  // Client Progress operations - tracking progressi clienti
  async getClientProgress(userId: number): Promise<ClientProgress[]> {
    return await db
      .select()
      .from(clientProgress)
      .where(eq(clientProgress.userId, userId))
      .orderBy(desc(clientProgress.measurementDate));
  }

  async getClientProgressByCategory(userId: number, category: string): Promise<ClientProgress[]> {
    return await db
      .select()
      .from(clientProgress)
      .where(and(
        eq(clientProgress.userId, userId),
        eq(clientProgress.category, category)
      ))
      .orderBy(desc(clientProgress.measurementDate));
  }

  async getProgressById(id: number): Promise<ClientProgress | undefined> {
    const [progress] = await db.select().from(clientProgress).where(eq(clientProgress.id, id));
    return progress;
  }

  async createProgress(progress: InsertClientProgress): Promise<ClientProgress> {
    const [newProgress] = await db.insert(clientProgress).values(progress).returning();
    return newProgress;
  }

  async updateProgress(id: number, progress: Partial<InsertClientProgress>): Promise<ClientProgress> {
    const [updatedProgress] = await db
      .update(clientProgress)
      .set({ ...progress, updatedAt: new Date() })
      .where(eq(clientProgress.id, id))
      .returning();
    return updatedProgress;
  }

  async deleteProgress(id: number): Promise<void> {
    await db.delete(clientProgress).where(eq(clientProgress.id, id));
  }

  async getProgressReport(userId: number, startDate?: Date, endDate?: Date): Promise<ClientProgress[]> {
    let conditions = [eq(clientProgress.userId, userId)];

    if (startDate) {
      conditions.push(sql`${clientProgress.measurementDate} >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`${clientProgress.measurementDate} <= ${endDate}`);
    }

    return await db
      .select()
      .from(clientProgress)
      .where(and(...conditions))
      .orderBy(desc(clientProgress.measurementDate));
  }
}

export const storage = new DatabaseStorage();