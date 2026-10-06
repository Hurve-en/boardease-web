import "server-only";

import {cache} from "react";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export const verifyUser = cache(async () => {
	const supabase = await createClient();

	const {data} = await supabase.auth.getClaims();

	if (!data?.claims) {
		redirect("/login");
	}

	return data.claims;
});
