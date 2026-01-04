import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for local authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role").default("client").notNull(), // 'admin', 'consultant', 'client'
  websiteUrl: varchar("website_url"), // Sito web personale dell'utente
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Log schema for debugging
console.log('[SCHEMA] Users table websiteUrl field:', users.websiteUrl);

// Financial assets (liquidity, investments, properties, etc.)
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'liquidity', 'investment', 'property', 'vehicle', 'other'
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("EUR"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial liabilities (debts, mortgages, loans, etc.)
export const liabilities = pgTable("liabilities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'mortgage', 'loan', 'credit_card', 'other'
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  monthlyPayment: decimal("monthly_payment", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  currency: varchar("currency").default("EUR"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Income sources
export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'salary', 'freelance', 'business', 'investment', 'other'
  monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("EUR"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fixed expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // 'housing', 'utilities', 'transport', 'food', 'insurance', 'subscriptions', 'other'
  monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("EUR"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'emergency_fund', 'home_purchase', 'financial_freedom', 'education', 'car', 'travel', 'custom'
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0"),
  monthlyContribution: decimal("monthly_contribution", { precision: 12, scale: 2 }),
  targetDate: date("target_date"),
  priority: integer("priority").default(1), // 1-5, 1 being highest priority
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }).default("10.00"), // Annual percentage
  currency: varchar("currency").default("EUR"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment portfolio
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'etf', 'stock', 'bond', 'fund', 'crypto', 'other'
  symbol: varchar("symbol"),
  quantity: decimal("quantity", { precision: 12, scale: 8 }),
  averagePrice: decimal("average_price", { precision: 12, scale: 4 }),
  currentPrice: decimal("current_price", { precision: 12, scale: 4 }),
  currency: varchar("currency").default("EUR"),
  goalId: integer("goal_id").references(() => goals.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions for tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'income', 'expense', 'investment', 'goal_contribution', 'transfer'
  category: varchar("category").notNull(),
  subcategory: varchar("subcategory"), // For detailed categorization
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  merchant: varchar("merchant"), // Store merchant name for auto-categorization
  accountType: varchar("account_type"), // 'income', 'operating', 'emergency', 'investment', 'savings'
  date: date("date").notNull(),
  goalId: integer("goal_id").references(() => goals.id),
  investmentId: integer("investment_id").references(() => investments.id),
  currency: varchar("currency").default("EUR"),
  isRecurring: boolean("is_recurring").default(false),
  recurringId: integer("recurring_id"), // Link to original recurring rule
  budgetCategory: varchar("budget_category"), // 'needs', 'wants', 'savings'
  createdAt: timestamp("created_at").defaultNow(),
});

export const recurringTransactions = pgTable("recurring_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'income', 'expense', 'investment', 'goal_contribution'
  category: varchar("category"),
  subcategory: varchar("subcategory"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  merchant: varchar("merchant"),
  budgetCategory: varchar("budget_category"),
  frequency: varchar("frequency").notNull(), // 'monthly', 'weekly', 'yearly'
  dayOfMonth: integer("day_of_month"), // For monthly: 1-31, null for other frequencies
  dayOfWeek: integer("day_of_week"), // For weekly: 0-6 (Sunday-Saturday)
  monthOfYear: integer("month_of_year"), // For yearly: 1-12
  nextExecutionDate: date("next_execution_date").notNull(),
  isActive: boolean("is_active").default(true),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // Optional end date
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User achievements/badges
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'first_checkup', 'first_goal', 'goal_milestone', 'course_completed', etc.
  name: varchar("name").notNull(),
  description: text("description"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// User progress through modules
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  module: varchar("module").notNull(), // 'checkup', 'goals', 'money_management', 'investments', 'academy', 'accounts'
  step: varchar("step"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  data: jsonb("data"), // Store module-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget settings and preferences
export const budgetSettings = pgTable("budget_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  needsPercentage: decimal("needs_percentage", { precision: 5, scale: 2 }).default("50.00"), // Default 50%
  wantsPercentage: decimal("wants_percentage", { precision: 5, scale: 2 }).default("30.00"), // Default 30%
  savingsPercentage: decimal("savings_percentage", { precision: 5, scale: 2 }).default("20.00"), // Default 20%
  monthlyIncome: decimal("monthly_income", { precision: 10, scale: 2 }),
  customCategories: jsonb("custom_categories"), // JSON array of user-defined categories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Category budgets for detailed expense planning
export const categoryBudgets = pgTable("category_budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(), // Main category (e.g., "Casa e Abitazione")
  subcategory: varchar("subcategory"), // Optional subcategory (e.g., "Affitto/Mutuo")
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }).notNull(), // Monthly budget amount
  budgetType: varchar("budget_type").notNull().default("expense"), // 'expense', 'income'
  isActive: boolean("is_active").default(true),
  notes: text("notes"), // Optional notes/description
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Category budgets schemas
export const insertCategoryBudgetSchema = createInsertSchema(categoryBudgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertCategoryBudget = z.infer<typeof insertCategoryBudgetSchema>;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;

// Category rules for auto-categorization
export const categoryRules = pgTable("category_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null for global rules
  merchantPattern: varchar("merchant_pattern").notNull(), // RegEx pattern
  category: varchar("category").notNull(),
  subcategory: varchar("subcategory"),
  budgetCategory: varchar("budget_category").notNull(), // 'needs', 'wants', 'savings'
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"), // ML confidence score
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Account Architecture for Modulo 6 - 6 Standard Accounts
export const accountArchitecture = pgTable("account_architecture", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),

  // 1. Conto di Ingresso/Smistamento (Income Account) - Fixed name
  incomeAccountName: varchar("income_account_name").notNull().default("Conto di Ingresso"),
  incomeAccountBankName: varchar("income_account_bank_name"),
  incomeAccountIban: varchar("income_account_iban"),
  incomeAccountBalance: decimal("income_account_balance", { precision: 12, scale: 2 }).default("0"),

  // 2. Conto Pila (Wealth Account) - NEW - Fixed name  
  wealthAccountName: varchar("wealth_account_name").notNull().default("Conto Pila"),
  wealthAccountBankName: varchar("wealth_account_bank_name"),
  wealthAccountIban: varchar("wealth_account_iban"),
  wealthAccountBalance: decimal("wealth_account_balance", { precision: 12, scale: 2 }).default("0"),
  wealthMonthlyAllocation: decimal("wealth_monthly_allocation", { precision: 12, scale: 2 }).default("0"),

  // 3. Conto Circolante (Operating Account) - Fixed name
  operatingAccountName: varchar("operating_account_name").notNull().default("Conto Circolante"),
  operatingAccountBankName: varchar("operating_account_bank_name"),
  operatingAccountIban: varchar("operating_account_iban"),
  operatingAccountBalance: decimal("operating_account_balance", { precision: 12, scale: 2 }).default("0"),
  operatingMonthlyAllocation: decimal("operating_monthly_allocation", { precision: 12, scale: 2 }).default("0"),

  // 4. Conto Emergenze/Sicurezza (Emergency Account) - Fixed name
  emergencyAccountName: varchar("emergency_account_name").notNull().default("Conto Emergenze"),
  emergencyAccountBankName: varchar("emergency_account_bank_name"),
  emergencyAccountIban: varchar("emergency_account_iban"),
  emergencyAccountBalance: decimal("emergency_account_balance", { precision: 12, scale: 2 }).default("0"),
  emergencyTargetAmount: decimal("emergency_target_amount", { precision: 12, scale: 2 }).default("0"),
  emergencyMonthlyAllocation: decimal("emergency_monthly_allocation", { precision: 12, scale: 2 }).default("0"),

  // 5. Conto Investimenti/Libertà (Investment Account) - Fixed name
  investmentAccountName: varchar("investment_account_name").notNull().default("Conto Investimenti"),
  investmentAccountBankName: varchar("investment_account_bank_name"),
  investmentAccountIban: varchar("investment_account_iban"),
  investmentAccountBalance: decimal("investment_account_balance", { precision: 12, scale: 2 }).default("0"),
  investmentMonthlyAllocation: decimal("investment_monthly_allocation", { precision: 12, scale: 2 }).default("0"),

  // 6. Conto Accantonamenti/Tasse Annuali (Savings Account) - Fixed name
  savingsAccountName: varchar("savings_account_name").notNull().default("Conto Accantonamenti"),
  savingsAccountBankName: varchar("savings_account_bank_name"),
  savingsAccountIban: varchar("savings_account_iban"),
  savingsAccountBalance: decimal("savings_account_balance", { precision: 12, scale: 2 }).default("0"),
  savingsMonthlyAllocation: decimal("savings_monthly_allocation", { precision: 12, scale: 2 }).default("0"),

  // Monthly income for distribution calculation
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }).default("0"),

  // Auto-distribution settings
  autoDistributionEnabled: boolean("auto_distribution_enabled").default(false),
  distributionDay: integer("distribution_day").default(2), // Day of month to execute

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savingsSubAccounts = pgTable("savings_sub_accounts", {
  id: serial("id").primaryKey(),
  architectureId: integer("architecture_id").references(() => accountArchitecture.id).notNull(),
  name: varchar("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).default("0"),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0"),
  monthlyAllocation: decimal("monthly_allocation", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Educational Content for Investment Academy
export const educationalContent = pgTable("educational_content", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'video', 'document', 'course', 'webinar'
  difficulty: varchar("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  duration: integer("duration"), // in minutes for videos
  contentUrl: text("content_url"), // URL to video/document
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags").array(), // Array of tags like 'ETF', 'Stocks', 'Bonds'
  isPublished: boolean("is_published").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses structure
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  level: varchar("level").notNull(), // 'beginner', 'intermediate', 'advanced'
  tags: text("tags").array(), // 'Onboarding', 'Avanzato', 'Novità', 'Vendite', 'Marketing'
  estimatedDuration: integer("estimated_duration"), // total course duration in minutes
  isPublished: boolean("is_published").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course categories table
export const courseCategories = pgTable("course_categories", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course modules/lessons
export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  categoryId: integer("category_id").references(() => courseCategories.id),
  title: varchar("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"), // YouTube/Vimeo link
  videoType: varchar("video_type", { length: 20 }).default("youtube"), // youtube, vimeo, direct
  audioUrl: text("audio_url"),
  textContent: text("text_content"),
  duration: integer("duration"), // in seconds (changed from minutes)
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video progress tracking
export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id, { onDelete: "cascade" }).notNull(),
  currentPosition: integer("current_position").default(0), // in seconds
  totalDuration: integer("total_duration").default(0), // in seconds
  watchedSeconds: integer("watched_seconds").default(0), // total seconds watched across all sessions
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"), // 0-100
  watchCount: integer("watch_count").default(0), // number of times started watching
  isCompleted: boolean("is_completed").default(false),
  lastWatchedAt: timestamp("last_watched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Detailed watch sessions for analytics
export const watchSessions = pgTable("watch_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id, { onDelete: "cascade" }).notNull(),
  startPosition: integer("start_position").default(0), // where they started watching
  endPosition: integer("end_position").default(0), // where they stopped
  duration: integer("duration").default(0), // how long this session lasted
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Downloadable materials for lessons
export const lessonMaterials = pgTable("lesson_materials", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type").notNull(), // 'pdf', 'doc', 'checklist', 'template', 'script'
  fileSize: integer("file_size"), // in bytes
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz questions for lessons
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // Array of possible answers
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option
  explanation: text("explanation"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User course progress
export const userCourseProgress = pgTable("user_course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  completedLessons: integer("completed_lessons").array().default([]),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
  certificateIssued: boolean("certificate_issued").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User lesson progress  
export const userLessonProgress = pgTable("user_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  watchedDuration: integer("watched_duration").default(0), // in seconds
  isCompleted: boolean("is_completed").default(false),
  quizScore: decimal("quiz_score", { precision: 5, scale: 2 }),
  quizAttempts: integer("quiz_attempts").default(0),
  notes: text("notes"),
  lastWatchedAt: timestamp("last_watched_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tutors/Mentors
export const tutors = pgTable("tutors", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").unique(),
  role: varchar("role").notNull(), // 'Senior Investment Advisor', 'Financial Coach', etc.
  specialization: text("specialization"),
  experience: varchar("experience"), // '8 anni'
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  availableHours: text("available_hours"), // JSON string for availability
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  assignedEmails: text("assigned_emails").array().default([]), // Array of client emails who can see this tutor
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course FAQ/Comments
export const courseFaqs = pgTable("course_faqs", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => courseLessons.id),
  courseId: integer("course_id").references(() => courses.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  isPublic: boolean("is_public").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course badges/achievements for courses
export const courseBadges = pgTable("course_badges", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  requirements: text("requirements"), // JSON string describing requirements
  badgeType: varchar("badge_type").notNull(), // 'completion', 'streak', 'quiz_master', etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User earned badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  badgeId: integer("badge_id").references(() => courseBadges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Course analytics/tracking
export const courseAnalytics = pgTable("course_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id),
  event: varchar("event").notNull(), // 'start', 'pause', 'complete', 'quiz_attempt', 'download'
  eventData: text("event_data"), // JSON string for additional data
  sessionId: varchar("session_id"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Model Portfolios
export const modelPortfolios = pgTable("model_portfolios", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  riskLevel: varchar("risk_level").notNull(), // 'conservative', 'moderate', 'aggressive'
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }), // Annual expected return %
  volatility: decimal("volatility", { precision: 5, scale: 2 }), // Expected volatility %
  minInvestment: decimal("min_investment", { precision: 12, scale: 2 }).default("100"),
  targetAudience: text("target_audience"), // Description of ideal investor
  rebalanceFrequency: varchar("rebalance_frequency").default("quarterly"), // 'monthly', 'quarterly', 'annually'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio allocations for model portfolios
export const portfolioAllocations = pgTable("portfolio_allocations", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => modelPortfolios.id).notNull(),
  assetClass: varchar("asset_class").notNull(), // 'stocks', 'bonds', 'real_estate', 'commodities', 'cash'
  region: varchar("region"), // 'global', 'usa', 'europe', 'emerging_markets'
  sector: varchar("sector"), // 'technology', 'healthcare', 'finance', etc.
  ticker: varchar("ticker"), // ETF/stock ticker symbol
  allocation: decimal("allocation", { precision: 5, scale: 2 }).notNull(), // Percentage allocation
  description: text("description"),
});

// Community Posts
export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title'),
  content: text('content').notNull(),
  category: text('category').default('Community'),
  likes: integer('likes').default(0),
  commentsCount: integer('comments_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Community Comments
export const communityComments = pgTable('community_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => communityPosts.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User progress in educational content
export const userEducationProgress = pgTable("user_education_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentId: integer("content_id").references(() => educationalContent.id).notNull(),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  completedAt: timestamp("completed_at"),
  rating: integer("rating"), // 1-5 star rating
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assets: many(assets),
  liabilities: many(liabilities),
  incomes: many(incomes),
  expenses: many(expenses),
  goals: many(goals),
  investments: many(investments),
  transactions: many(transactions),
  achievements: many(achievements),
  progress: many(userProgress),
  budgetSettings: many(budgetSettings),
  categoryRules: many(categoryRules),
  accountArchitecture: many(accountArchitecture),
  educationProgress: many(userEducationProgress),
}));

export const budgetSettingsRelations = relations(budgetSettings, ({ one }) => ({
  user: one(users, { fields: [budgetSettings.userId], references: [users.id] }),
}));

export const categoryRulesRelations = relations(categoryRules, ({ one }) => ({
  user: one(users, { fields: [categoryRules.userId], references: [users.id] }),
}));

export const accountArchitectureRelations = relations(accountArchitecture, ({ one, many }) => ({
  user: one(users, {
    fields: [accountArchitecture.userId],
    references: [users.id],
  }),
  subAccounts: many(savingsSubAccounts),
}));

export const savingsSubAccountsRelations = relations(savingsSubAccounts, ({ one }) => ({
  architecture: one(accountArchitecture, {
    fields: [savingsSubAccounts.architectureId],
    references: [accountArchitecture.id],
  }),
}));

export const modelPortfoliosRelations = relations(modelPortfolios, ({ many }) => ({
  allocations: many(portfolioAllocations),
}));

export const portfolioAllocationsRelations = relations(portfolioAllocations, ({ one }) => ({
  portfolio: one(modelPortfolios, {
    fields: [portfolioAllocations.portfolioId],
    references: [modelPortfolios.id],
  }),
}));

export const educationalContentRelations = relations(educationalContent, ({ many }) => ({
  userProgress: many(userEducationProgress),
}));

export const userEducationProgressRelations = relations(userEducationProgress, ({ one }) => ({
  user: one(users, {
    fields: [userEducationProgress.userId],
    references: [users.id],
  }),
  content: one(educationalContent, {
    fields: [userEducationProgress.contentId],
    references: [educationalContent.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
}));

export const liabilitiesRelations = relations(liabilities, ({ one }) => ({
  user: one(users, { fields: [liabilities.userId], references: [users.id] }),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, { fields: [incomes.userId], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  investments: many(investments),
  transactions: many(transactions),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  user: one(users, { fields: [investments.userId], references: [users.id] }),
  goal: one(goals, { fields: [investments.goalId], references: [goals.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  goal: one(goals, { fields: [transactions.goalId], references: [goals.id] }),
  investment: one(investments, { fields: [transactions.investmentId], references: [investments.id] }),
}));

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one }) => ({
  user: one(users, { fields: [recurringTransactions.userId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
}));

// Zod schemas for validation
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLiabilitySchema = createInsertSchema(liabilities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIncomeSchema = createInsertSchema(incomes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertRecurringTransactionSchema = createInsertSchema(recurringTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBudgetSettingsSchema = createInsertSchema(budgetSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategoryRuleSchema = createInsertSchema(categoryRules).omit({ id: true, createdAt: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, unlockedAt: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  completedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// Custom Accounts - Additional accounts beyond the 6 standard ones
export const customAccounts = pgTable("custom_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'savings', 'checking', 'investment', 'business', etc.
  iban: varchar("iban", { length: 34 }),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  monthlyAllocation: decimal("monthly_allocation", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color for UI
  icon: varchar("icon", { length: 50 }).default("Wallet"), // Lucide icon name
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAccountArchitectureSchema = createInsertSchema(accountArchitecture).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomAccountSchema = createInsertSchema(customAccounts).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  balance: z.union([z.string(), z.number()]).transform(val => val.toString()),
  monthlyAllocation: z.union([z.string(), z.number()]).transform(val => val.toString()),
});
export const insertSavingsSubAccountSchema = createInsertSchema(savingsSubAccounts).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertLiability = z.infer<typeof insertLiabilitySchema>;
export type Liability = typeof liabilities.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof incomes.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertRecurringTransaction = z.infer<typeof insertRecurringTransactionSchema>;
export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertBudgetSettings = z.infer<typeof insertBudgetSettingsSchema>;
export type BudgetSettings = typeof budgetSettings.$inferSelect;
export type InsertCategoryRule = z.infer<typeof insertCategoryRuleSchema>;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type InsertAccountArchitecture = z.infer<typeof insertAccountArchitectureSchema>;
export type AccountArchitecture = typeof accountArchitecture.$inferSelect;
export type InsertSavingsSubAccount = z.infer<typeof insertSavingsSubAccountSchema>;
export type SavingsSubAccount = typeof savingsSubAccounts.$inferSelect;

// Educational content and model portfolio schemas and types
export const insertEducationalContentSchema = createInsertSchema(educationalContent).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModelPortfolioSchema = createInsertSchema(modelPortfolios).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPortfolioAllocationSchema = createInsertSchema(portfolioAllocations).omit({ id: true });
export const insertUserEducationProgressSchema = createInsertSchema(userEducationProgress).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;
export type EducationalContent = typeof educationalContent.$inferSelect;
export type InsertModelPortfolio = z.infer<typeof insertModelPortfolioSchema>;
export type ModelPortfolio = typeof modelPortfolios.$inferSelect;
export type InsertPortfolioAllocation = z.infer<typeof insertPortfolioAllocationSchema>;
export type PortfolioAllocation = typeof portfolioAllocations.$inferSelect;
export type InsertUserEducationProgress = z.infer<typeof insertUserEducationProgressSchema>;
export type UserEducationProgress = typeof userEducationProgress.$inferSelect;

// Course and lesson schemas and types
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseCategorySchema = createInsertSchema(courseCategories).omit({ id: true, createdAt: true });
export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTutorSchema = createInsertSchema(tutors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserCourseProgressSchema = createInsertSchema(userCourseProgress).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type SelectCourse = typeof courses.$inferSelect;
export type InsertCourseCategory = z.infer<typeof insertCourseCategorySchema>;
export type SelectCourseCategory = typeof courseCategories.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type SelectCourseLesson = typeof courseLessons.$inferSelect;
export type InsertTutor = z.infer<typeof insertTutorSchema>;
export type SelectTutor = typeof tutors.$inferSelect;
export type InsertUserCourseProgress = z.infer<typeof insertUserCourseProgressSchema>;
export type SelectUserCourseProgress = typeof userCourseProgress.$inferSelect;

// Community schemas and types
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type SelectCommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type SelectCommunityComment = typeof communityComments.$inferSelect;

// Budget Notes - For enhanced budget tracking and forecasting
export const budgetNotes = pgTable("budget_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(), // Main budget category
  subcategory: varchar("subcategory"), // Optional subcategory
  monthKey: varchar("month_key", { length: 7 }).notNull(), // Format: YYYY-MM
  notes: text("notes"),
  budgetGoal: decimal("budget_goal", { precision: 10, scale: 2 }), // Optional budget goal for period
  actualSpent: decimal("actual_spent", { precision: 10, scale: 2 }), // Actual amount spent
  variance: decimal("variance", { precision: 10, scale: 2 }), // Goal vs Actual variance
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }), // Alert when % threshold reached
  isAlertEnabled: boolean("is_alert_enabled").default(false),
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high'
  tags: text("tags").array().default([]), // Array of custom tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget forecasts - For predictive analysis
export const budgetForecasts = pgTable("budget_forecasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  forecastedAmount: decimal("forecasted_amount", { precision: 10, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("75.00"), // ML confidence %
  methodology: varchar("methodology").default("trend_analysis"), // 'trend_analysis', 'seasonal', 'regression'
  basedOnMonths: integer("based_on_months").default(6), // How many past months used
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================
// CONSULENSE ED ESERCIZI SYSTEM
// ============================

// NOTE: Users table serves as clients - no separate clients table needed
// Consultants (alessio@gmail.com) can manage all other users as clients

// Clients table - Actual clients with additional metadata
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: varchar("email").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone"),
  dateOfBirth: date("date_of_birth"),
  avatar: text("avatar"),
  status: varchar("status").default("active"),
  financialGoals: text("financial_goals"),
  riskProfile: varchar("risk_profile"),
  currentSituation: text("current_situation"),
  notes: text("notes"),
  tags: text("tags").array().default([]),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  lastContactDate: timestamp("last_contact_date"),
  nextReviewDate: date("next_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client metadata - Additional info for users when they act as clients
export const clientMetadata = pgTable("client_metadata", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // The user acting as client
  consultantId: integer("consultant_id").notNull().references(() => users.id), // The consultant managing this client
  phone: varchar("phone"),
  dateOfBirth: date("date_of_birth"),
  avatar: text("avatar"), // URL immagine profilo
  status: varchar("status").default("active"), // 'active', 'inactive', 'pending'
  financialGoals: text("financial_goals"), // Obiettivi finanziari (JSON)
  riskProfile: varchar("risk_profile"), // 'conservative', 'moderate', 'aggressive'
  currentSituation: text("current_situation"), // Situazione finanziaria attuale
  notes: text("notes"), // Note private del consulente
  tags: text("tags").array().default([]), // Tag personalizzati
  onboardingCompleted: boolean("onboarding_completed").default(false),
  lastContactDate: timestamp("last_contact_date"),
  nextReviewDate: date("next_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultations - Appunti e storico consulenze
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultant_id").notNull().references(() => users.id), // Il consulente
  userId: integer("user_id").notNull().references(() => users.id), // Il cliente (user)
  title: varchar("title").notNull(),
  content: text("content"), // Contenuto degli appunti
  consultationType: varchar("consultation_type").notNull(), // 'initial', 'follow_up', 'review', 'emergency'
  category: varchar("category"), // 'budget', 'investments', 'debt', 'planning'
  duration: integer("duration"), // Durata in minuti
  consultationDate: timestamp("consultation_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  actionItems: text("action_items"), // JSON array di action items
  attachments: text("attachments").array().default([]), // URLs allegati
  confidentialNotes: text("confidential_notes"), // Note private del consulente
  clientSatisfaction: integer("client_satisfaction"), // Rating 1-5
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: date("follow_up_date"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercises - Biblioteca esercizi per clienti
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull().references(() => users.id), // Consulente che ha creato l'esercizio
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"), // Istruzioni dettagliate
  category: varchar("category").notNull(), // 'budget', 'investments', 'debt', 'planning', 'education'
  difficulty: varchar("difficulty").default("beginner"), // 'beginner', 'intermediate', 'advanced'
  estimatedTime: integer("estimated_time"), // Tempo stimato in minuti
  type: varchar("type").notNull(), // 'calculation', 'planning', 'analysis', 'quiz', 'worksheet'
  template: text("template"), // Template dell'esercizio (JSON)
  isPublic: boolean("is_public").default(false), // Pubblico o privato
  isActive: boolean("is_active").default(true),
  successCriteria: text("success_criteria"), // Criteri di successo
  resources: text("resources").array().default([]), // Risorse aggiuntive
  tags: text("tags").array().default([]),
  usageCount: integer("usage_count").default(0), // Quante volte è stato assegnato
  averageCompletion: decimal("average_completion", { precision: 5, scale: 2 }), // % media di completamento
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }), // Rating medio
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Exercises - Esercizi assegnati ai clienti
export const clientExercises = pgTable("client_exercises", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // Il cliente (user)
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  assignedBy: integer("assigned_by").notNull().references(() => users.id), // Consulente che ha assegnato
  assignedDate: timestamp("assigned_date").defaultNow(),
  dueDate: date("due_date"),
  status: varchar("status").default("assigned"), // 'assigned', 'in_progress', 'completed', 'overdue', 'cancelled'
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high'
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"), // % di completamento
  clientNotes: text("client_notes"), // Note del cliente
  consultantFeedback: text("consultant_feedback"), // Feedback del consulente
  consultantNotes: text("consultant_notes"), // Note del consulente per l'assegnazione
  customInstructions: text("custom_instructions"), // Istruzioni personalizzate per questo cliente
  completedDate: timestamp("completed_date"),
  rating: integer("rating"), // Rating del cliente 1-5
  timeSpent: integer("time_spent"), // Tempo speso in minuti
  attachments: text("attachments").array().default([]), // Allegati del cliente
  isStarred: boolean("is_starred").default(false), // Segnato come importante
  remindersSent: integer("reminders_sent").default(0),
  lastReminderDate: timestamp("last_reminder_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultation Calendar - Calendario consulenze
export const consultationCalendar = pgTable("consultation_calendar", {
  id: serial("id").primaryKey(),
  consultantId: integer("consultant_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => users.id), // Null per slot disponibili - Il cliente (user)
  title: varchar("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: varchar("type").default("consultation"), // 'consultation', 'available', 'break', 'meeting'
  status: varchar("status").default("scheduled"), // 'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'
  location: varchar("location"), // 'online', 'office', 'client_home', etc.
  meetingLink: text("meeting_link"), // Link per videocall
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // JSON per pattern ricorrenza
  preparation: text("preparation"), // Note di preparazione
  agenda: text("agenda"), // Agenda della consulenza
  outcome: text("outcome"), // Risultato della consulenza
  attendees: text("attendees").array().default([]), // Altri partecipanti
  reminders: text("reminders").array().default([]), // Promemoria (JSON)
  isConfirmed: boolean("is_confirmed").default(false),
  confirmationToken: varchar("confirmation_token"), // Token per conferma
  cancellationReason: text("cancellation_reason"),
  rescheduledFrom: integer("rescheduled_from"), // ID appuntamento originale
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Progress - Tracking progressi clienti
export const clientProgress = pgTable("client_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Il cliente (user)
  consultantId: integer("consultant_id").notNull().references(() => users.id),
  category: varchar("category").notNull(), // 'budget', 'investments', 'debt', 'overall'
  metricName: varchar("metric_name").notNull(), // Nome della metrica
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  targetValue: decimal("target_value", { precision: 12, scale: 2 }),
  previousValue: decimal("previous_value", { precision: 12, scale: 2 }),
  unit: varchar("unit"), // 'EUR', '%', 'months', 'score'
  measurementDate: date("measurement_date").notNull(),
  notes: text("notes"),
  isGoalMet: boolean("is_goal_met").default(false),
  improvementPercentage: decimal("improvement_percentage", { precision: 5, scale: 2 }),
  benchmarkComparison: text("benchmark_comparison"), // Confronto con benchmark
  nextMilestone: text("next_milestone"),
  badges: text("badges").array().default([]), // Badge ottenuti
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget insights schemas  
export const insertBudgetNotesSchema = createInsertSchema(budgetNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBudgetForecastSchema = createInsertSchema(budgetForecasts).omit({
  id: true,
  createdAt: true
});

export type InsertBudgetNotes = z.infer<typeof insertBudgetNotesSchema>;
export type BudgetNotes = typeof budgetNotes.$inferSelect;
export type InsertBudgetForecast = z.infer<typeof insertBudgetForecastSchema>;
export type BudgetForecast = typeof budgetForecasts.$inferSelect;

// ============================
// CONSULENSE ED ESERCIZI SCHEMAS AND TYPES
// ============================

// Client metadata schemas and types (for additional client-specific info)
export const insertClientMetadataSchema = createInsertSchema(clientMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertClientMetadata = z.infer<typeof insertClientMetadataSchema>;
export type ClientMetadata = typeof clientMetadata.$inferSelect;

// Clients table schemas and types
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Legacy compatibility - User serves as Client fallback
export type LegacyClient = User; // For backwards compatibility

// Consultations schemas and types
export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

// Exercises schemas and types
export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Client Exercises schemas and types
export const insertClientExerciseSchema = createInsertSchema(clientExercises).extend({
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  consultantNotes: z.string().optional(),
  customInstructions: z.string().optional(),
});

export type InsertClientExercise = z.infer<typeof insertClientExerciseSchema>;
export type ClientExercise = typeof clientExercises.$inferSelect;

// Consultation Calendar schemas and types
export const insertConsultationCalendarSchema = createInsertSchema(consultationCalendar).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertConsultationCalendar = z.infer<typeof insertConsultationCalendarSchema>;
export type ConsultationCalendar = typeof consultationCalendar.$inferSelect;

// Client Progress schemas and types
export const insertClientProgressSchema = createInsertSchema(clientProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertClientProgress = z.infer<typeof insertClientProgressSchema>;
export type ClientProgress = typeof clientProgress.$inferSelect;

// ============================
// BUSINESS ANALYSIS MODULE - Cost Analysis, Break-Even, Revenue Management
// ============================

// Business entities - Generic products/services for any business type (replaces menuItems)
export const businessEntities = pgTable("business_entities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'product', 'service', 'package', 'other'
  category: varchar("category", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // Cost to produce/acquire
  sku: varchar("sku", { length: 100 }), // SKU or code
  unit: varchar("unit", { length: 50 }), // 'piece', 'hour', 'kg', etc.
  customFields: jsonb("custom_fields"), // Flexible custom data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom attributes definitions - Reusable custom field definitions
export const customAttributes = pgTable("custom_attributes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'fixed_cost', 'variable_cost', 'business_entity', etc.
  attributeName: varchar("attribute_name", { length: 100 }).notNull(),
  attributeType: varchar("attribute_type", { length: 50 }).notNull(), // 'text', 'number', 'date', 'boolean', 'select'
  options: jsonb("options"), // For select type: array of options
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  validationRules: jsonb("validation_rules"), // JSON validation rules
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fixed costs - Recurring monthly costs
export const fixedCosts = pgTable("fixed_costs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  monthKey: varchar("month_key", { length: 7 }).default("default").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  customFields: jsonb("custom_fields"), // Flexible custom data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Variable costs - Costs that vary with production/sales
export const variableCosts = pgTable("variable_costs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  unitType: varchar("unit_type", { length: 50 }).notNull(), // 'per_unit', 'per_hour', 'percentage', etc.
  unitCost: decimal("unit_cost", { precision: 10, scale: 4 }).notNull(),
  monthKey: varchar("month_key", { length: 7 }).default("default").notNull(),
  businessEntityId: integer("business_entity_id").references(() => businessEntities.id), // Optional link to business entity
  customFields: jsonb("custom_fields"), // Flexible custom data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Labor costs - Employee/workforce costs
export const laborCosts = pgTable("labor_costs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  employeeName: varchar("employee_name", { length: 255 }),
  role: varchar("role", { length: 100 }).notNull(),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  shift: varchar("shift", { length: 50 }),
  notes: text("notes"),
  monthKey: varchar("month_key", { length: 7 }).default("default").notNull(),
  customFields: jsonb("custom_fields"), // Flexible custom data
  createdAt: timestamp("created_at").defaultNow(),
});

// Break-even analysis snapshots
export const breakEvenAnalysis = pgTable("break_even_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  analysisDate: timestamp("analysis_date").notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  totalFixedCosts: decimal("total_fixed_costs", { precision: 12, scale: 2 }).notNull(),
  averageVariableCostPercentage: decimal("avg_variable_cost_percentage", { precision: 5, scale: 2 }).notNull(),
  breakEvenRevenue: decimal("break_even_revenue", { precision: 12, scale: 2 }).notNull(),
  breakEvenUnits: integer("break_even_units"),
  actualRevenue: decimal("actual_revenue", { precision: 12, scale: 2 }),
  profitLoss: decimal("profit_loss", { precision: 12, scale: 2 }),
  marginOfSafety: decimal("margin_of_safety", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue settings - Manual vs automatic revenue tracking
export const revenueSettings = pgTable("revenue_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  isManualMode: boolean("is_manual_mode").default(false).notNull(),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manual revenue entries
export const manualRevenue = pgTable("manual_revenue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  dailyRevenue: decimal("daily_revenue", { precision: 10, scale: 2 }),
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost notes - Notes for cost sections
export const costNotes = pgTable("cost_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sectionType: varchar("section_type", { length: 50 }).notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales and Conversion Data - Dati vendita e conversione per calcoli CAC e ROI
export const salesConversionData = pgTable("sales_conversion_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  contattiTotali: integer("contatti_totali").default(0), // Lead/contatti generati nel mese
  nuoviClienti: integer("nuovi_clienti").default(0), // Nuovi clienti acquisiti (non totale clienti)
  clientiDaProve: integer("clienti_da_prove").default(0), // Clienti acquisiti da prove gratuite
  costoProveGratuite: decimal("costo_prove_gratuite", { precision: 10, scale: 2 }).default("0"), // Costo totale prove gratuite
  spesaMarketing: decimal("spesa_marketing", { precision: 10, scale: 2 }).default("0"), // Budget/spesa marketing totale del mese
  numeroTransazioni: integer("numero_transazioni").default(0), // Numero transazioni totali
  valoreMedioTransazione: decimal("valore_medio_transazione", { precision: 10, scale: 2 }).default("0"), // Scontrino medio
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint per user_id + month_key
  uniqueUserMonth: index("sales_conversion_unique_user_month").on(table.userId, table.monthKey),
}));

// Unit Variable Costs - Costi variabili unitari per cliente
export const unitVariableCosts = pgTable("unit_variable_costs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  costoMaterialeCliente: decimal("costo_materiale_cliente", { precision: 10, scale: 2 }).default("0"), // Costo materiale diretto per cliente
  oreLavoroCliente: decimal("ore_lavoro_cliente", { precision: 5, scale: 2 }).default("0"), // Ore lavoro medie per cliente
  costoOrarioLavoro: decimal("costo_orario_lavoro", { precision: 10, scale: 2 }).default("0"), // Costo orario del lavoro
  commissioniTransazione: decimal("commissioni_transazione", { precision: 10, scale: 2 }).default("0"), // Commissioni per transazione (es. Stripe, PayPal)
  altriCostiVariabiliUnitari: decimal("altri_costi_variabili_unitari", { precision: 10, scale: 2 }).default("0"), // Altri costi variabili per cliente
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Unique constraint per user_id + month_key
  uniqueUserMonth: index("unit_variable_costs_unique_user_month").on(table.userId, table.monthKey),
}));

// Schemas for validation
export const insertBusinessEntitySchema = createInsertSchema(businessEntities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomAttributeSchema = createInsertSchema(customAttributes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFixedCostSchema = createInsertSchema(fixedCosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVariableCostSchema = createInsertSchema(variableCosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLaborCostSchema = createInsertSchema(laborCosts).omit({ id: true, createdAt: true });
export const insertBreakEvenAnalysisSchema = createInsertSchema(breakEvenAnalysis).omit({ id: true, createdAt: true });
export const insertRevenueSettingSchema = createInsertSchema(revenueSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertManualRevenueSchema = createInsertSchema(manualRevenue).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCostNoteSchema = createInsertSchema(costNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSalesConversionDataSchema = createInsertSchema(salesConversionData).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUnitVariableCostsSchema = createInsertSchema(unitVariableCosts).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type BusinessEntity = typeof businessEntities.$inferSelect;
export type InsertBusinessEntity = z.infer<typeof insertBusinessEntitySchema>;
export type CustomAttribute = typeof customAttributes.$inferSelect;
export type InsertCustomAttribute = z.infer<typeof insertCustomAttributeSchema>;
export type FixedCost = typeof fixedCosts.$inferSelect;
export type InsertFixedCost = z.infer<typeof insertFixedCostSchema>;
export type VariableCost = typeof variableCosts.$inferSelect;
export type InsertVariableCost = z.infer<typeof insertVariableCostSchema>;
export type LaborCost = typeof laborCosts.$inferSelect;
export type InsertLaborCost = z.infer<typeof insertLaborCostSchema>;
export type BreakEvenAnalysis = typeof breakEvenAnalysis.$inferSelect;
export type InsertBreakEvenAnalysis = z.infer<typeof insertBreakEvenAnalysisSchema>;
export type RevenueSetting = typeof revenueSettings.$inferSelect;
export type InsertRevenueSetting = z.infer<typeof insertRevenueSettingSchema>;
export type ManualRevenue = typeof manualRevenue.$inferSelect;
export type InsertManualRevenue = z.infer<typeof insertManualRevenueSchema>;
export type CostNote = typeof costNotes.$inferSelect;
export type InsertCostNote = z.infer<typeof insertCostNoteSchema>;
export type SalesConversionData = typeof salesConversionData.$inferSelect;
export type InsertSalesConversionData = z.infer<typeof insertSalesConversionDataSchema>;
export type UnitVariableCosts = typeof unitVariableCosts.$inferSelect;
export type InsertUnitVariableCosts = z.infer<typeof insertUnitVariableCostsSchema>;