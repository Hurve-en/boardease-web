import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {CredentialsSchema} from "@/lib/definitions";

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);

	const parsed = CredentialsSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{error: parsed.error.issues[0].message},
			{status: 400},
		);
	}

	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{auth: {persistSession: false, autoRefreshToken: false}},
	);

	const {data, error} = await supabase.auth.signInWithPassword(parsed.data);

	if (error || !data.session) {
		return NextResponse.json(
			{error: "Wrong email or password."},
			{status: 401},
		);
	}

	const {data: claimsData} = await supabase.auth.getClaims(
		data.session.access_token,
	);
	const role =
		(claimsData?.claims as {user_role?: string | null} | undefined)
			?.user_role ?? null;

	return NextResponse.json({
		accessToken: data.session.access_token,
		refreshToken: data.session.refresh_token,
		user: {id: data.user.id, email: data.user.email, role},
	});
}
