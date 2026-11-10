import { relations } from "drizzle-orm/relations";
import { usersInAuth, userRoles, profiles, tenants, bills, rooms, tenantRoomAssignment, payments } from "./schema";

export const userRolesRelations = relations(userRoles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userRoles.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	userRoles: many(userRoles),
	profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [profiles.id],
		references: [usersInAuth.id]
	}),
	tenants: many(tenants),
	payments: many(payments),
}));

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	profile: one(profiles, {
		fields: [tenants.userId],
		references: [profiles.id]
	}),
	bills: many(bills),
	tenantRoomAssignments: many(tenantRoomAssignment),
}));

export const billsRelations = relations(bills, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [bills.tenantId],
		references: [tenants.tenantId]
	}),
	payments: many(payments),
}));

export const tenantRoomAssignmentRelations = relations(tenantRoomAssignment, ({one}) => ({
	room: one(rooms, {
		fields: [tenantRoomAssignment.roomId],
		references: [rooms.roomId]
	}),
	tenant: one(tenants, {
		fields: [tenantRoomAssignment.tenantId],
		references: [tenants.tenantId]
	}),
}));

export const roomsRelations = relations(rooms, ({many}) => ({
	tenantRoomAssignments: many(tenantRoomAssignment),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	bill: one(bills, {
		fields: [payments.billId],
		references: [bills.billId]
	}),
	profile: one(profiles, {
		fields: [payments.recordedBy],
		references: [profiles.id]
	}),
}));