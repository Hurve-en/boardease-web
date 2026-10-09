"use server";

import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CredentialsSchema} from "@/lib/definitions";

export type LoginState = {
    message: string;
    email: string;
    success?: boolean;  
};

export async function signIn(
	_prev: LoginState,
	form: FormData,
): Promise<LoginState> {
	const email = String(form.get("email") ?? "");

	const parsed = CredentialsSchema.safeParse({
		email,
		password: form.get("password"),
	});

	

	if (!parsed.success) {
		return {
			message: parsed.error.issues[0].message,
			email,
		};
	}

	const supabase = await createClient();

	const {error} = await supabase.auth.signInWithPassword(parsed.data);

	if (error) {
		return {
			message: "Wrong email or password.",
			email,
		};
	}

	redirect("/dashboard");
}

