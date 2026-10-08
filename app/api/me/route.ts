import {NextResponse} from "next/server";
import {getApiUser} from "@/lib/api-auth";

export async function GET(request: Request) {
	const profile = await getApiUser(request);

	if (!profile) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	return NextResponse.json(profile);
}
