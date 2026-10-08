import "server-only";

import {eq} from "drizzle-orm";
import {db} from "@/db";
import {profiles} from "@/db/schema";
import {createClient} from "@/lib/supabase/server";

export async function getApiUser(request: Request) {
	const header = request.headers.get("Authorization");

	if (!header?.startsWith("Bearer ")) {
		return null;
	}

	const token = header.slice("Bearer ".length).trim();

	if (!token) {
		return null;
	}

	try {
		const supabase = await createClient();
		const {data, error} = await supabase.auth.getClaims(token);

		if (error || !data?.claims) {
			return null;
		}

		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, data.claims.sub));

		return profile ?? null;
	} catch {
		return null;
	}
}
