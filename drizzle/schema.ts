import { pgTable, foreignKey, uuid, numeric, text, timestamp, date, unique, pgPolicy, bigint, check, integer, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const appPermission = pgEnum("app_permission", ['dashboard.view', 'rooms.manage', 'tenants.manage', 'assignments.manage', 'bills.manage', 'payments.manage', 'billing.view_all', 'billing.view_own'])
export const appRole = pgEnum("app_role", ['admin', 'tenant'])
export const assignmentStatus = pgEnum("assignment_status", ['active', 'inactive'])
export const billStatus = pgEnum("bill_status", ['paid', 'partial', 'unpaid'])
export const paymentSubmissionStatus = pgEnum("payment_submission_status", ['pending', 'approved', 'needs_update'])
export const roomStatus = pgEnum("room_status", ['occupied', 'unoccupied'])


export const paymentSubmissions = pgTable("payment_submissions", {
	submissionId: uuid("submission_id").defaultRandom().primaryKey().notNull(),
	billId: uuid("bill_id").notNull(),
	submittedBy: uuid("submitted_by").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	referenceNumber: text("reference_number").notNull(),
	receiptPath: text("receipt_path").notNull(),
	status: paymentSubmissionStatus().default('pending').notNull(),
	reviewedBy: uuid("reviewed_by"),
	reviewNote: text("review_note"),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	paymentDate: date("payment_date"),
}, (table) => [
	foreignKey({
			columns: [table.billId],
			foreignColumns: [bills.billId],
			name: "payment_submissions_bill_id_fkey"
		}),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [profiles.id],
			name: "payment_submissions_reviewed_by_fkey"
		}),
	foreignKey({
			columns: [table.submittedBy],
			foreignColumns: [tenants.tenantId],
			name: "payment_submissions_submitted_by_fkey"
		}),
]);

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

export const rooms = pgTable("rooms", {
	roomId: uuid("room_id").defaultRandom().primaryKey().notNull(),
	roomNumber: text("room_number").notNull(),
	monthlyRent: numeric("monthly_rent", { precision: 10, scale:  2 }).notNull(),
	maxOccupancy: integer("max_occupancy").notNull(),
	status: roomStatus().default('unoccupied').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	boardingHouseId: uuid("boarding_house_id"),
}, (table) => [
	foreignKey({
			columns: [table.boardingHouseId],
			foreignColumns: [boardingHouses.id],
			name: "rooms_boarding_house_id_boarding_houses_id_fk"
		}),
	unique("rooms_house_room_unique").on(table.roomNumber, table.boardingHouseId),
	check("rooms_capacity_positive", sql`max_occupancy >= 1`),
	check("rooms_monthly_rent_nonnegative", sql`monthly_rent >= (0)::numeric`),
]);

export const boardingHouses = pgTable("boarding_houses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("boarding_houses_name_unique").on(table.name),
]);

export const tenants = pgTable("tenants", {
	tenantId: uuid("tenant_id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	contactNumber: text("contact_number").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "tenants_user_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("tenants_user_id_unique").on(table.userId),
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

export const notifications = pgTable("notifications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "notifications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	recipientId: uuid("recipient_id").notNull(),
	role: appRole().notNull(),
	billId: uuid("bill_id").notNull(),
	kind: text().notNull(),
	eventKey: text("event_key").notNull(),
	title: text().notNull(),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("notifications_inbox_idx").using("btree", table.recipientId.asc().nullsLast().op("uuid_ops"), table.role.asc().nullsLast().op("uuid_ops"), table.id.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.billId],
			foreignColumns: [bills.billId],
			name: "notifications_bill_id_bills_bill_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [profiles.id],
			name: "notifications_recipient_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("notifications_event_unique").on(table.recipientId, table.eventKey),
]);

export const pushTokens = pgTable("push_tokens", {
	token: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	platform: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("push_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "push_tokens_user_id_fkey"
		}).onDelete("cascade"),
]);
