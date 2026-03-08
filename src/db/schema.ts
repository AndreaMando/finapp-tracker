import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// financial domain tables

export const incomes = sqliteTable("incomes", {
  id: text("id").primaryKey(),
  monthKey: text("month_key").notNull(),
  amount: real("amount").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const recurringExpenses = sqliteTable("recurring_expenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  active: integer("active").notNull(), // treated as 0/1
  startMonth: text("start_month").notNull(),
  createdAt: text("created_at").notNull(),
});

export const oneTimeExpenses = sqliteTable("one_time_expenses", {
  id: text("id").primaryKey(),
  monthKey: text("month_key").notNull(),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const savingsGoals = sqliteTable("savings_goals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull(),
  deadline: text("deadline").notNull(),
  color: text("color").notNull(),
  createdAt: text("created_at").notNull(),
});

export const goalContributions = sqliteTable("goal_contributions", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  monthKey: text("month_key").notNull(),
  amount: real("amount").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});
