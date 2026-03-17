import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
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

export const oneTimeExpenses = pgTable("one_time_expenses", {
  id: text("id").primaryKey(),
  monthKey: text("month_key").notNull(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
