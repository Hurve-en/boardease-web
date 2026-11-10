import { pgTable, foreignKey, unique, pgPolicy, bigint, uuid, text, timestamp, check, numeric, integer, date, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const appPermission = pgEnum("app_permission", ['dashboard.view', 'rooms.manage', 'tenants.manage', 'assignments.manage', 'bills.manage', 'payments.manage', 'billing.view_all', 'billing.view_own'])
export const appRole = pgEnum("app_role", ['admin', 'tenant'])
export const assignmentStatus = pgEnum("assignment_status", ['active', 'inactive'])
export const billStatus = pgEnum("bill_status", ['paid', 'partial', 'unpaid'])
export const roomStatus = pgEnum("room_status", ['occupied', 'unoccupied'])


export const userRoles = pgTable("user_roles", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "user_roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9007199254740991, cache: 1 }),
	userId: uuid("user_id").notNull(),
	role: appRole().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_roles_user_id_key").on(table.userId),
	pgPolicy("Allow auth admin to read user roles", { as: "permissive", for: "select", to: ["supabase_auth_admin"], using: sql`true` }),
]);

export const rolePermissions = pgTable("role_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "role_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9007199254740991, cache: 1 }),
	role: appRole().notNull(),
	permission: appPermission().notNull(),
}, (table) => [
	unique("role_permissions_role_permission_key").on(table.role, table.permission),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_auth_users_id_fk"
		}).onDelete("cascade"),
]);

export const tenants = pgTable("tenants", {
	tenantId: uuid("tenant_id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	contactNumber: text("contact_number").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "tenants_user_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("tenants_user_id_unique").on(table.userId),
]);

export const rooms = pgTable("rooms", {
	roomId: uuid("room_id").defaultRandom().primaryKey().notNull(),
	roomNumber: text("room_number").notNull(),
	monthlyRent: numeric("monthly_rent", { precision: 10, scale:  2 }).notNull(),
	maxOccupancy: integer("max_occupancy").notNull(),
	status: roomStatus().default('unoccupied').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("rooms_room_number_unique").on(table.roomNumber),
	check("rooms_capacity_positive", sql`max_occupancy >= 1`),
	check("rooms_monthly_rent_nonnegative", sql`monthly_rent >= (0)::numeric`),
]);

export const bills = pgTable("bills", {
	billId: uuid("bill_id").defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	billingMonth: date("billing_month").notNull(),
	rentAmount: numeric("rent_amount", { precision: 10, scale:  2 }).notNull(),
	electricCharge: numeric("electric_charge", { precision: 10, scale:  2 }).notNull(),
	waterCharge: numeric("water_charge", { precision: 10, scale:  2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	dueDate: date("due_date").notNull(),
	status: billStatus().default('unpaid').notNull(),
	outstandingBalance: numeric("outstanding_balance", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.tenantId],
			name: "bills_tenant_id_tenants_tenant_id_fk"
		}).onDelete("cascade"),
	unique("bills_tenant_billing_month_unique").on(table.tenantId, table.billingMonth),
	check("bills_outstanding_not_greater_than_total", sql`outstanding_balance <= total_amount`),
	check("bills_total_matches_charges", sql`total_amount = ((rent_amount + electric_charge) + water_charge)`),
	check("electric_amount_nonnegative", sql`electric_charge >= (0)::numeric`),
	check("outstanding_balance_nonnegative", sql`outstanding_balance >= (0)::numeric`),
	check("rent_amount_nonnegative", sql`rent_amount >= (0)::numeric`),
	check("total_amount_nonnegative", sql`total_amount >= (0)::numeric`),
	check("water_amount_nonnegative", sql`water_charge >= (0)::numeric`),
]);

export const tenantRoomAssignment = pgTable("tenant_room_assignment", {
	assignmentId: uuid("assignment_id").defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	roomId: uuid("room_id").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	status: assignmentStatus().default('active').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.roomId],
			name: "tenant_room_assignment_room_id_rooms_room_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.tenantId],
			name: "tenant_room_assignment_tenant_id_tenants_tenant_id_fk"
		}).onDelete("cascade"),
	unique("room_assignment_room_start_unique").on(table.tenantId, table.roomId, table.startDate),
	check("start_date_must_be_lesser_than_end_date", sql`start_date < end_date`),
]);

export const payments = pgTable("payments", {
	paymentId: uuid("payment_id").defaultRandom().primaryKey().notNull(),
	billId: uuid("bill_id").notNull(),
	recordedBy: uuid("recorded_by").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentDate: date("payment_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.billId],
			foreignColumns: [bills.billId],
			name: "payments_bill_id_bills_bill_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recordedBy],
			foreignColumns: [profiles.id],
			name: "payments_recorded_by_profiles_id_fk"
		}),
	check("amount_nonnegative", sql`amount >= (0)::numeric`),
]);
