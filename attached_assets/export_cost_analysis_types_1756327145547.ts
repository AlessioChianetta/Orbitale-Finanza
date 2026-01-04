
import { pgTable, serial, text, integer, timestamp, boolean, jsonb, varchar, numeric } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import * as z from "zod";

// Cost Management Tables
export const fixedCosts = pgTable('fixed_costs', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  monthlyAmount: numeric('monthly_amount', { precision: 10, scale: 2 }).notNull(),
  monthKey: varchar('month_key', { length: 7 }).default('default').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const variableCosts = pgTable('variable_costs', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  unitType: varchar('unit_type', { length: 50 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 4 }).notNull(),
  monthKey: varchar('month_key', { length: 7 }).default('default').notNull(),
  menuItemId: integer('menu_item_id').references(() => menuItems.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const laborCosts = pgTable('labor_costs', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  date: timestamp('date').notNull(),
  employeeName: varchar('employee_name', { length: 255 }),
  role: varchar('role', { length: 100 }).notNull(),
  hoursWorked: numeric('hours_worked', { precision: 5, scale: 2 }).notNull(),
  hourlyRate: numeric('hourly_rate', { precision: 8, scale: 2 }).notNull(),
  totalCost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
  shift: varchar('shift', { length: 50 }),
  notes: text('notes'),
  monthKey: varchar('month_key', { length: 7 }).default('default').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const breakEvenAnalysis = pgTable('break_even_analysis', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  analysisDate: timestamp('analysis_date').notNull(),
  period: varchar('period', { length: 20 }).notNull(),
  totalFixedCosts: numeric('total_fixed_costs', { precision: 12, scale: 2 }).notNull(),
  averageVariableCostPercentage: numeric('avg_variable_cost_percentage', { precision: 5, scale: 2 }).notNull(),
  breakEvenRevenue: numeric('break_even_revenue', { precision: 12, scale: 2 }).notNull(),
  breakEvenUnits: integer('break_even_units'),
  actualRevenue: numeric('actual_revenue', { precision: 12, scale: 2 }),
  profitLoss: numeric('profit_loss', { precision: 12, scale: 2 }),
  marginOfSafety: numeric('margin_of_safety', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revenueSettings = pgTable('revenue_settings', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  monthKey: varchar('month_key', { length: 7 }).notNull(),
  isManualMode: boolean('is_manual_mode').default(false).notNull(),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const manualRevenue = pgTable('manual_revenue', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  monthKey: varchar('month_key', { length: 7 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  dailyRevenue: numeric('daily_revenue', { precision: 10, scale: 2 }),
  monthlyRevenue: numeric('monthly_revenue', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const costNotes = pgTable('cost_notes', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sectionType: varchar('section_type', { length: 50 }).notNull(),
  sectionKey: varchar('section_key', { length: 100 }).notNull(),
  monthKey: varchar('month_key', { length: 7 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schemas per validazione
export const insertFixedCostSchema = createInsertSchema(fixedCosts).omit({ id: true });
export type InsertFixedCost = z.infer<typeof insertFixedCostSchema>;
export type FixedCost = typeof fixedCosts.$inferSelect;

export const insertVariableCostSchema = createInsertSchema(variableCosts).omit({ id: true });
export type InsertVariableCost = z.infer<typeof insertVariableCostSchema>;
export type VariableCost = typeof variableCosts.$inferSelect;

export const insertLaborCostSchema = createInsertSchema(laborCosts).omit({ id: true });
export type InsertLaborCost = z.infer<typeof insertLaborCostSchema>;
export type LaborCost = typeof laborCosts.$inferSelect;

export const insertRevenueSettingSchema = createInsertSchema(revenueSettings).omit({ id: true });
export type InsertRevenueSetting = z.infer<typeof insertRevenueSettingSchema>;
export type RevenueSetting = typeof revenueSettings.$inferSelect;

export const insertManualRevenueSchema = createInsertSchema(manualRevenue).omit({ id: true });
export type InsertManualRevenue = z.infer<typeof insertManualRevenueSchema>;
export type ManualRevenue = typeof manualRevenue.$inferSelect;

export const insertCostNoteSchema = createInsertSchema(costNotes).omit({ id: true });
export type InsertCostNote = z.infer<typeof insertCostNoteSchema>;
export type CostNote = typeof costNotes.$inferSelect;
