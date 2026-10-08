import "server-only";

import {cache} from "react";
import {eq} from "drizzle-orm";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {db} from "@/db";
import {profiles} from "@/db/schema";

export const verifyAdmin = cache(async () => {
	const supabase = await createClient();

	const {data} = await supabase.auth.getClaims();

	const claims = data?.claims;

	if (!claims) {
		redirect("/login");
	}

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, claims.sub));

	if (!profile || profile.role !== "admin") {
		redirect("/login");
	}

	return {
		userId: claims.sub,
		email: claims.email as string,
	};
});
