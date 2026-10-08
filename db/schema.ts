import {pgTable, text, uuid} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
	id: uuid("id").primaryKey(),
	email: text("email").notNull(),
	role: text("role").notNull().default("client"),
}).enableRLS();
