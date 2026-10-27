import {z} from "zod";

export const CredentialsSchema = z.object({
	email: z.email({
		error: "Enter a valid email.",
	}),

	password: z.string().min(6, {
		error: "The password needs at least 6 characters.",
	}),
});

export const CreateRoomSchema = z.object({
	roomNumber: z
		.string({error: "Room number is required."})
		.trim()
		.min(1, {error: "Room number is required."}),

	monthlyRent: z
		.number({error: "Monthly rent must be a number."})
		.min(0, {error: "Monthly rent can't be negative."})
		.max(99999999.99, {error: "Monthly rent is too large."})
		.multipleOf(0.01, {error: "Monthly rent can have at most 2 decimals."}),

	maxOccupancy: z
		.number({error: "Max occupancy must be a number."})
		.int({error: "Max occupancy must be a whole number."})
		.min(1, {error: "Max occupancy must be at least 1."})
		.default(1),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
