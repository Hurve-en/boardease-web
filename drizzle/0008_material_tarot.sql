CREATE TYPE "public"."assignment_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('paid', 'partial', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('occupied', 'unoccupied');--> statement-breakpoint
CREATE TABLE "bills" (
	"bill_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"billing_month" date NOT NULL,
	"rent_amount" numeric(10, 2) NOT NULL,
	"electric_charge" numeric(10, 2) NOT NULL,
	"water_charge" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"due_date" date NOT NULL,
	"status" "bill_status" DEFAULT 'unpaid' NOT NULL,
	"outstanding_balance" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bills_tenant_billing_month_unique" UNIQUE("tenant_id","billing_month"),
	CONSTRAINT "rent_amount_nonnegative" CHECK ("bills"."rent_amount" >= 0),
	CONSTRAINT "electric_amount_nonnegative" CHECK ("bills"."electric_charge" >= 0),
	CONSTRAINT "water_amount_nonnegative" CHECK ("bills"."water_charge" >= 0),
	CONSTRAINT "total_amount_nonnegative" CHECK ("bills"."total_amount" >= 0),
	CONSTRAINT "outstanding_balance_nonnegative" CHECK ("bills"."outstanding_balance" >= 0),
	CONSTRAINT "bills_outstanding_not_greater_than_total" CHECK ("bills"."outstanding_balance" <= "bills"."total_amount")
);
--> statement-breakpoint
ALTER TABLE "bills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"payment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"recorded_by" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amount_nonnegative" CHECK ("payments"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"room_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_number" text NOT NULL,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"max_occupancy" integer NOT NULL,
	"status" "room_status" DEFAULT 'unoccupied' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number"),
	CONSTRAINT "rooms_capacity_positive" CHECK ("rooms"."max_occupancy" >= 1),
	CONSTRAINT "rooms_monthly_rent_nonnegative" CHECK ("rooms"."monthly_rent" >= 0)
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenant_room_assignment" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "assignment_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_room_assignment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenants" (
	"tenant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"contact_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_bills_bill_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("bill_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_room_assignment" ADD CONSTRAINT "tenant_room_assignment_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_room_assignment" ADD CONSTRAINT "tenant_room_assignment_room_id_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;