import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  date,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  incomes: many(incomes),
  recurringExpenses: many(recurringExpenses),
  recurringExpenseAmounts: many(recurringExpenseAmounts),
  oneTimeExpenses: many(oneTimeExpenses),
  savingsGoals: many(savingsGoals),
}));

// financial domain tables

export const incomes = pgTable("incomes", {
  id: text("id").primaryKey(),
  monthKey: text("month_key").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, {
    fields: [incomes.userId],
    references: [users.id],
  }),
}));

export const recurringExpenses = pgTable("recurring_expenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  active: boolean("active").notNull(),
  startMonth: text("start_month").notNull(),
  endMonth: text("end_month"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const recurringExpensesRelations = relations(
  recurringExpenses,
  ({ one }) => ({
    user: one(users, {
      fields: [recurringExpenses.userId],
      references: [users.id],
    }),
  })
);

export const recurringExpenseAmounts = pgTable("recurring_expense_amounts", {
  id: text("id").primaryKey(),
  recurringId: text("recurring_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  effectiveMonth: text("effective_month").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id").notNull(),
});

export const recurringExpenseAmountsRelations = relations(
  recurringExpenseAmounts,
  ({ one }) => ({
    recurring: one(recurringExpenses, {
      fields: [recurringExpenseAmounts.recurringId],
      references: [recurringExpenses.id],
    }),
    user: one(users, {
      fields: [recurringExpenseAmounts.userId],
      references: [users.id],
    }),
  })
);

export const oneTimeExpenses = pgTable("one_time_expenses", {
  id: text("id").primaryKey(),
  monthKey: text("month_key").notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull(),
  sourceRecurringId: text("source_recurring_id"),
  sourceInstallmentId: text("source_installment_id"),
  installmentNumber: integer("installment_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// A fixed-term payment split into `totalInstallments` monthly installments.
// Installments become one-time expenses lazily, when their month begins (see
// src/lib/installments-server.ts); `generatedCount` is how many exist so far.
export const installmentPlans = pgTable("installment_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  totalInstallments: integer("total_installments").notNull(),
  generatedCount: integer("generated_count").notNull().default(0),
  // 'installment' (default) or 'mortgage' — a mortgage is the same monthly plan
  // plus an optional borrowed capital used to estimate rate and interest split.
  kind: text("kind").notNull().default("installment"),
  financedAmount: numeric("financed_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// Changes to a plan's terms after creation — see drizzle/0006. A 'revision' is a
// recalculated payment / changed duration from installment `fromInstallment` on;
// an 'extra' is an early repayment, after which the plan continues with the
// new payment / total. Installments before `fromInstallment` keep their terms.
export const installmentPlanRevisions = pgTable("installment_plan_revisions", {
  id: text("id").primaryKey(),
  planId: text("plan_id")
    .notNull()
    .references(() => installmentPlans.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("revision"),
  fromInstallment: integer("from_installment").notNull(),
  payment: numeric("payment", { precision: 12, scale: 2 }).notNull(),
  totalInstallments: integer("total_installments").notNull(),
  extraAmount: numeric("extra_amount", { precision: 12, scale: 2 }),
  extraDate: date("extra_date", { mode: "string" }),
  expenseId: text("expense_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const oneTimeExpensesRelations = relations(oneTimeExpenses, ({ one }) => ({
  user: one(users, {
    fields: [oneTimeExpenses.userId],
    references: [users.id],
  }),
}));

export const savingsGoals = pgTable("savings_goals", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  deadline: timestamp("deadline").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  user: one(users, {
    fields: [savingsGoals.userId],
    references: [users.id],
  }),
  contributions: many(goalContributions),
}));

export const goalContributions = pgTable("goal_contributions", {
  id: text("id").primaryKey(),
  goalId: text("goal_id")
    .notNull()
    .references(() => savingsGoals.id, { onDelete: "cascade" }),
  monthKey: text("month_key").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goalContributionsRelations = relations(
  goalContributions,
  ({ one }) => ({
    goal: one(savingsGoals, {
      fields: [goalContributions.goalId],
      references: [savingsGoals.id],
    }),
  })
);
