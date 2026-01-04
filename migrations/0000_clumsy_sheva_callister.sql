CREATE TABLE "account_architecture" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"income_account_name" varchar DEFAULT 'Conto di Ingresso' NOT NULL,
	"income_account_bank_name" varchar,
	"income_account_iban" varchar,
	"income_account_balance" numeric(12, 2) DEFAULT '0',
	"wealth_account_name" varchar DEFAULT 'Conto Pila' NOT NULL,
	"wealth_account_bank_name" varchar,
	"wealth_account_iban" varchar,
	"wealth_account_balance" numeric(12, 2) DEFAULT '0',
	"wealth_monthly_allocation" numeric(12, 2) DEFAULT '0',
	"operating_account_name" varchar DEFAULT 'Conto Circolante' NOT NULL,
	"operating_account_bank_name" varchar,
	"operating_account_iban" varchar,
	"operating_account_balance" numeric(12, 2) DEFAULT '0',
	"operating_monthly_allocation" numeric(12, 2) DEFAULT '0',
	"emergency_account_name" varchar DEFAULT 'Conto Emergenze' NOT NULL,
	"emergency_account_bank_name" varchar,
	"emergency_account_iban" varchar,
	"emergency_account_balance" numeric(12, 2) DEFAULT '0',
	"emergency_target_amount" numeric(12, 2) DEFAULT '0',
	"emergency_monthly_allocation" numeric(12, 2) DEFAULT '0',
	"investment_account_name" varchar DEFAULT 'Conto Investimenti' NOT NULL,
	"investment_account_bank_name" varchar,
	"investment_account_iban" varchar,
	"investment_account_balance" numeric(12, 2) DEFAULT '0',
	"investment_monthly_allocation" numeric(12, 2) DEFAULT '0',
	"savings_account_name" varchar DEFAULT 'Conto Accantonamenti' NOT NULL,
	"savings_account_bank_name" varchar,
	"savings_account_iban" varchar,
	"savings_account_balance" numeric(12, 2) DEFAULT '0',
	"savings_monthly_allocation" numeric(12, 2) DEFAULT '0',
	"monthly_income" numeric(12, 2) DEFAULT '0',
	"auto_distribution_enabled" boolean DEFAULT false,
	"distribution_day" integer DEFAULT 2,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"unlocked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"currency" varchar DEFAULT 'EUR',
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "break_even_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"analysis_date" timestamp NOT NULL,
	"period" varchar(20) NOT NULL,
	"total_fixed_costs" numeric(12, 2) NOT NULL,
	"avg_variable_cost_percentage" numeric(5, 2) NOT NULL,
	"break_even_revenue" numeric(12, 2) NOT NULL,
	"break_even_units" integer,
	"actual_revenue" numeric(12, 2),
	"profit_loss" numeric(12, 2),
	"margin_of_safety" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"needs_percentage" numeric(5, 2) DEFAULT '50.00',
	"wants_percentage" numeric(5, 2) DEFAULT '30.00',
	"savings_percentage" numeric(5, 2) DEFAULT '20.00',
	"monthly_income" numeric(10, 2),
	"custom_categories" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "category_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"merchant_pattern" varchar NOT NULL,
	"category" varchar NOT NULL,
	"subcategory" varchar,
	"budget_category" varchar NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.00',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"category" text DEFAULT 'Community',
	"likes" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"section_type" varchar(50) NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"month_key" varchar(7) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"lesson_id" integer,
	"event" varchar NOT NULL,
	"event_data" text,
	"session_id" varchar,
	"user_agent" text,
	"ip_address" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon_url" text,
	"requirements" text,
	"badge_type" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer,
	"course_id" integer,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"is_public" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"category_id" integer,
	"title" varchar NOT NULL,
	"description" text,
	"video_url" text,
	"video_type" varchar(20) DEFAULT 'youtube',
	"audio_url" text,
	"text_content" text,
	"duration" integer,
	"sort_order" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"level" varchar NOT NULL,
	"tags" text[],
	"estimated_duration" integer,
	"is_published" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"iban" varchar(34),
	"balance" numeric(12, 2) DEFAULT '0',
	"monthly_allocation" numeric(12, 2) DEFAULT '0',
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"icon" varchar(50) DEFAULT 'Wallet',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "educational_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"difficulty" varchar NOT NULL,
	"duration" integer,
	"content_url" text,
	"thumbnail_url" text,
	"tags" text[],
	"is_published" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"currency" varchar DEFAULT 'EUR',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fixed_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"monthly_amount" numeric(10, 2) NOT NULL,
	"month_key" varchar(7) DEFAULT 'default' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"current_amount" numeric(12, 2) DEFAULT '0',
	"monthly_contribution" numeric(12, 2),
	"target_date" date,
	"priority" integer DEFAULT 1,
	"expected_return" numeric(5, 2) DEFAULT '10.00',
	"currency" varchar DEFAULT 'EUR',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"currency" varchar DEFAULT 'EUR',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"symbol" varchar,
	"quantity" numeric(12, 8),
	"average_price" numeric(12, 4),
	"current_price" numeric(12, 4),
	"currency" varchar DEFAULT 'EUR',
	"goal_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "labor_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"employee_name" varchar(255),
	"role" varchar(100) NOT NULL,
	"hours_worked" numeric(5, 2) NOT NULL,
	"hourly_rate" numeric(8, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"shift" varchar(50),
	"notes" text,
	"month_key" varchar(7) DEFAULT 'default' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"remaining_amount" numeric(12, 2) NOT NULL,
	"monthly_payment" numeric(12, 2),
	"interest_rate" numeric(5, 2),
	"currency" varchar DEFAULT 'EUR',
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manual_revenue" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"month_key" varchar(7) NOT NULL,
	"date" varchar(10) NOT NULL,
	"daily_revenue" numeric(10, 2),
	"monthly_revenue" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"risk_level" varchar NOT NULL,
	"expected_return" numeric(5, 2),
	"volatility" numeric(5, 2),
	"min_investment" numeric(12, 2) DEFAULT '100',
	"target_audience" text,
	"rebalance_frequency" varchar DEFAULT 'quarterly',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer NOT NULL,
	"asset_class" varchar NOT NULL,
	"region" varchar,
	"sector" varchar,
	"ticker" varchar,
	"allocation" numeric(5, 2) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"question" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_answer" integer NOT NULL,
	"explanation" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar,
	"subcategory" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"merchant" varchar,
	"budget_category" varchar,
	"frequency" varchar NOT NULL,
	"day_of_month" integer,
	"day_of_week" integer,
	"month_of_year" integer,
	"next_execution_date" date NOT NULL,
	"is_active" boolean DEFAULT true,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "revenue_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"month_key" varchar(7) NOT NULL,
	"is_manual_mode" boolean DEFAULT false NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_sub_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"architecture_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"target_amount" numeric(12, 2) DEFAULT '0',
	"current_amount" numeric(12, 2) DEFAULT '0',
	"monthly_allocation" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"subcategory" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"merchant" varchar,
	"account_type" varchar,
	"date" date NOT NULL,
	"goal_id" integer,
	"investment_id" integer,
	"currency" varchar DEFAULT 'EUR',
	"is_recurring" boolean DEFAULT false,
	"recurring_id" integer,
	"budget_category" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar,
	"role" varchar NOT NULL,
	"specialization" text,
	"experience" varchar,
	"bio" text,
	"profile_image_url" text,
	"rating" numeric(2, 1) DEFAULT '0',
	"total_reviews" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"available_hours" text,
	"hourly_rate" numeric(8, 2),
	"assigned_emails" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tutors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_course_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"completed_lessons" integer[] DEFAULT '{}',
	"completion_percentage" numeric(5, 2) DEFAULT '0',
	"last_accessed_at" timestamp,
	"completed_at" timestamp,
	"certificate_issued" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_education_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_id" integer NOT NULL,
	"progress_percentage" numeric(5, 2) DEFAULT '0',
	"completed_at" timestamp,
	"rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"watched_duration" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"quiz_score" numeric(5, 2),
	"quiz_attempts" integer DEFAULT 0,
	"notes" text,
	"last_watched_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module" varchar NOT NULL,
	"step" varchar,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "variable_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"unit_type" varchar(50) NOT NULL,
	"unit_cost" numeric(10, 4) NOT NULL,
	"month_key" varchar(7) DEFAULT 'default' NOT NULL,
	"menu_item_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"current_position" integer DEFAULT 0,
	"total_duration" integer DEFAULT 0,
	"watched_seconds" integer DEFAULT 0,
	"completion_percentage" numeric(5, 2) DEFAULT '0',
	"watch_count" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"last_watched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "watch_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"start_position" integer DEFAULT 0,
	"end_position" integer DEFAULT 0,
	"duration" integer DEFAULT 0,
	"session_start" timestamp DEFAULT now(),
	"session_end" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account_architecture" ADD CONSTRAINT "account_architecture_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "break_even_analysis" ADD CONSTRAINT "break_even_analysis_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_settings" ADD CONSTRAINT "budget_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_notes" ADD CONSTRAINT "cost_notes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_analytics" ADD CONSTRAINT "course_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_analytics" ADD CONSTRAINT "course_analytics_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_analytics" ADD CONSTRAINT "course_analytics_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_accounts" ADD CONSTRAINT "custom_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_costs" ADD CONSTRAINT "fixed_costs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_costs" ADD CONSTRAINT "labor_costs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_materials" ADD CONSTRAINT "lesson_materials_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_revenue" ADD CONSTRAINT "manual_revenue_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_allocations" ADD CONSTRAINT "portfolio_allocations_portfolio_id_model_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."model_portfolios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_settings" ADD CONSTRAINT "revenue_settings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_sub_accounts" ADD CONSTRAINT "savings_sub_accounts_architecture_id_account_architecture_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."account_architecture"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_course_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."course_badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_education_progress" ADD CONSTRAINT "user_education_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_education_progress" ADD CONSTRAINT "user_education_progress_content_id_educational_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."educational_content"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variable_costs" ADD CONSTRAINT "variable_costs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_sessions" ADD CONSTRAINT "watch_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_sessions" ADD CONSTRAINT "watch_sessions_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");