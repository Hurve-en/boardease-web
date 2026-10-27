import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {CreateRoomSchema} from "@/lib/definitions";
import {
	createRoom,
	getRoomSummary,
	getRooms,
	isDuplicateRoomNumber,
} from "@/lib/room";

export async function GET(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	try {
		const [summary, rooms] = await Promise.all([getRoomSummary(), getRooms()]);
		return NextResponse.json({summary, rooms});
	} catch {
		return NextResponse.json({error: "Failed to load rooms."}, {status: 500});
	}
}

export async function POST(request: Request) {
	const auth = await authorize(request, ["admin"]);
	if (auth.response) return auth.response;

	const body = await request.json().catch(() => null);

	const parsed = CreateRoomSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{error: parsed.error.issues[0].message},
			{status: 400},
		);
	}

	try {
		const room = await createRoom(parsed.data);
		return NextResponse.json(room, {status: 201});
	} catch (error) {
		if (isDuplicateRoomNumber(error)) {
			return NextResponse.json(
				{error: "Room number already exists."},
				{status: 409},
			);
		}
		return NextResponse.json({error: "Failed to create room."}, {status: 500});
	}
}
