import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {getDashboardData} from "@/lib/dashboard";

export async function GET(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	try {
		return NextResponse.json(await getDashboardData());
	} catch {
		return NextResponse.json(
			{error: "Failed to load dashboard."},
			{status: 500},
		);
	}
}
