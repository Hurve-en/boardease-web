import {z} from "zod";

export const CredentialsSchema = z.object({
	email: z.email({
		error: "Enter a valid email.",
	}),

	password: z.string().min(6, {
		error: "The password needs at least 6 characters.",
	}),
});
