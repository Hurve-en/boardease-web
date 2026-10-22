import {sql} from "drizzle-orm";

import {
	check,
	date,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const assignmentStatusEnum = pgEnum("assignment_status", [
	"active",
	"inactive",
]);

export const roomStatusEnum = pgEnum("room_status", ["occupied", "unoccupied"]);

export const billStatusEnum = pgEnum("bill_status", [
	"paid",
	"partial",
	"unpaid",
]);

export const profiles = pgTable("profiles", {
	id: uuid("id").primaryKey(),

	email: text("email").notNull(),

	name: text("name").notNull(),

	createdAt: timestamp("created_at", {withTimezone: true})
		.notNull()
		.defaultNow(),
}).enableRLS();

export const tenants = pgTable(
	"tenants",
	{
		tenantId: uuid("tenant_id").primaryKey().defaultRandom(),

		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.id, {onDelete: "cascade"}),

		firstName: text("first_name").notNull(),

		lastName: text("last_name").notNull(),

		contactNumber: text("contact_number").notNull(),

		createdAt: timestamp("created_at", {withTimezone: true})
			.notNull()
			.defaultNow(),
	},
	(table) => [unique("tenants_user_id_unique").on(table.userId)],
).enableRLS();

export const rooms = pgTable(
	"rooms",
	{
		roomId: uuid("room_id").primaryKey().defaultRandom(),

		roomNumber: text("room_number").notNull(),

		monthlyRent: numeric("monthly_rent", {
			precision: 10,
			scale: 2,
		}).notNull(),

		maxOccupancy: integer("max_occupancy").notNull(),

		status: roomStatusEnum("status").notNull().default("unoccupied"),

		createdAt: timestamp("created_at", {withTimezone: true})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		unique("rooms_room_number_unique").on(table.roomNumber),
		check("rooms_capacity_positive", sql`${table.maxOccupancy} >= 1`),
		check("rooms_monthly_rent_nonnegative", sql`${table.monthlyRent} >= 0`),
	],
).enableRLS();

export const tenantRoomAssignment = pgTable(
	"tenant_room_assignment",
	{
		assignmentId: uuid("assignment_id").primaryKey().defaultRandom(),

		tenantId: uuid("tenant_id")
			.notNull()
			.references(() => tenants.tenantId, {onDelete: "cascade"}),

		roomId: uuid("room_id")
			.notNull()
			.references(() => rooms.roomId, {onDelete: "cascade"}),

		startDate: date("start_date").notNull(),

		endDate: date("end_date").notNull(),

		status: assignmentStatusEnum("status").notNull().default("active"),
	},
	(table) => [
		check(
			"start_date_must_be_lesser_than_end_date",
			sql`${table.startDate} < ${table.endDate}`,
		),
		unique("room_assignment_room_start_unique").on(
			table.tenantId,
			table.roomId,
			table.startDate,
		),
	],
).enableRLS();

export const bills = pgTable(
	"bills",
	{
		billId: uuid("bill_id").primaryKey().defaultRandom(),

		tenantId: uuid("tenant_id")
			.notNull()
			.references(() => tenants.tenantId, {onDelete: "cascade"}),

		billingMonth: date("billing_month").notNull(),

		rentAmount: numeric("rent_amount", {
			precision: 10,
			scale: 2,
		}).notNull(),

		electricCharge: numeric("electric_charge", {
			precision: 10,
			scale: 2,
		}).notNull(),

		waterCharge: numeric("water_charge", {
			precision: 10,
			scale: 2,
		}).notNull(),

		totalAmount: numeric("total_amount", {
			precision: 10,
			scale: 2,
		}).notNull(),

		dueDate: date("due_date").notNull(),
		status: billStatusEnum("status").notNull().default("unpaid"),

		outstandingBalance: numeric("outstanding_balance", {
			precision: 10,
			scale: 2,
		}).notNull(),

		createdAt: timestamp("created_at", {withTimezone: true})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		unique("bills_tenant_billing_month_unique").on(
			table.tenantId,
			table.billingMonth,
		),
		check("rent_amount_nonnegative", sql`${table.rentAmount} >= 0`),
		check("electric_amount_nonnegative", sql`${table.electricCharge} >= 0`),
		check("water_amount_nonnegative", sql`${table.waterCharge} >= 0`),
		check("total_amount_nonnegative", sql`${table.totalAmount} >= 0`),
		check(
			"outstanding_balance_nonnegative",
			sql`${table.outstandingBalance} >= 0`,
		),
		check(
			"bills_outstanding_not_greater_than_total",
			sql`${table.outstandingBalance} <= ${table.totalAmount}`,
		),
		check(
			"bills_total_matches_charges",
			sql`${table.totalAmount} = ${table.rentAmount} + ${table.electricCharge} + ${table.waterCharge}`,
		),
	],
).enableRLS();

export const payments = pgTable(
	"payments",
	{
		paymentId: uuid("payment_id").primaryKey().defaultRandom(),

		billId: uuid("bill_id")
			.notNull()
			.references(() => bills.billId, {onDelete: "cascade"}),

		recordedBy: uuid("recorded_by")
			.notNull()
			.references(() => profiles.id),

		amount: numeric("amount", {
			precision: 10,
			scale: 2,
		}).notNull(),

		paymentDate: date("payment_date").notNull(),

		createdAt: timestamp("created_at", {withTimezone: true})
			.notNull()
			.defaultNow(),
	},
	(table) => [check("amount_nonnegative", sql`${table.amount} >= 0`)],
).enableRLS();
