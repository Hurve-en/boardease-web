import { NextResponse } from "next/server";
import { authorize } from "@/lib/api-auth";
import { getDashboardData } from "@/lib/dashboard";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(response: Response) {
	Object.entries(corsHeaders).forEach(([name, value]) => {
		response.headers.set(name, value);
	});
	return response;
}

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return withCors(auth.response);

	try {
		return withCors(NextResponse.json(await getDashboardData()));
	} catch {
		return withCors(
			NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 }),
		);
	}
}