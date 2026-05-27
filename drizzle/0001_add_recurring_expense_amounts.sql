CREATE TABLE "recurring_expense_amounts" (
	"id" text PRIMARY KEY NOT NULL,
	"recurring_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"effective_month" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_expense_amounts" ADD CONSTRAINT "recurring_expense_amounts_recurring_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expense_amounts" ADD CONSTRAINT "recurring_expense_amounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;