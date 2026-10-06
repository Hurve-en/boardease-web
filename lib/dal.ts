import "server-only";

import {cache} from "react";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export const verifyAdmin = cache(async () => {
	const supabase = await createClient();

	const {data} = await supabase.auth.getClaims();

	const claims = data?.claims;

	if (!claims || claims.app_metadata?.role !== "admin") {
		redirect("/login");
	}

	return {
		userId: claims.sub,
		email: claims.email as string,
	};
});
