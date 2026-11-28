import { relations } from "drizzle-orm/relations";
import { bills, paymentSubmissions, profiles, tenants, usersInAuth, userRoles, boardingHouses, rooms, tenantRoomAssignment, payments, notifications, pushTokens } from "./schema";

export const paymentSubmissionsRelations = relations(paymentSubmissions, ({one}) => ({
	bill: one(bills, {
		fields: [paymentSubmissions.billId],
		references: [bills.billId]
	}),
	profile: one(profiles, {
		fields: [paymentSubmissions.reviewedBy],
		references: [profiles.id]
	}),
	tenant: one(tenants, {
		fields: [paymentSubmissions.submittedBy],
		references: [tenants.tenantId]
	}),
}));

export const billsRelations = relations(bills, ({one, many}) => ({
	paymentSubmissions: many(paymentSubmissions),
	tenant: one(tenants, {
		fields: [bills.tenantId],
		references: [tenants.tenantId]
	}),
	payments: many(payments),
	notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	paymentSubmissions: many(paymentSubmissions),
	usersInAuth: one(usersInAuth, {
		fields: [profiles.id],
		references: [usersInAuth.id]
	}),
	tenants: many(tenants),
	payments: many(payments),
	notifications: many(notifications),
}));

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	paymentSubmissions: many(paymentSubmissions),
	profile: one(profiles, {
		fields: [tenants.userId],
		references: [profiles.id]
	}),
	bills: many(bills),
	tenantRoomAssignments: many(tenantRoomAssignment),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userRoles.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	userRoles: many(userRoles),
	profiles: many(profiles),
	pushTokens: many(pushTokens),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	boardingHouse: one(boardingHouses, {
		fields: [rooms.boardingHouseId],
		references: [boardingHouses.id]
	}),
	tenantRoomAssignments: many(tenantRoomAssignment),
}));

export const boardingHousesRelations = relations(boardingHouses, ({many}) => ({
	rooms: many(rooms),
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

export const notificationsRelations = relations(notifications, ({one}) => ({
	bill: one(bills, {
		fields: [notifications.billId],
		references: [bills.billId]
	}),
	profile: one(profiles, {
		fields: [notifications.recipientId],
		references: [profiles.id]
	}),
}));

export const pushTokensRelations = relations(pushTokens, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [pushTokens.userId],
		references: [usersInAuth.id]
	}),
}));