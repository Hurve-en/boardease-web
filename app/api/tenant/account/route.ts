import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {z} from "zod";
import {getTenantAccount, updateProfileName} from "@/lib/tenant-account";

const headers = {"Cache-Control": "private, no-store"};

export async function GET(request: Request) {
  const auth = await authorize(request, ["tenant"]);
  if (auth.response) {
    auth.response.headers.set("Cache-Control", headers["Cache-Control"]);
    return auth.response;
  }
  try {
    const account = await getTenantAccount(auth.user.id);
    if (!account) return NextResponse.json({error: "Your account profile is unavailable."}, {status: 404, headers});
    return NextResponse.json(account, {headers});
  } catch {
    return NextResponse.json({error: "Failed to load account information."}, {status: 500, headers});
  }
}

const editProfile = z.strictObject({name: z.string().trim().min(1).max(120)});

export async function PATCH(request: Request) {
  const auth = await authorize(request, ["tenant"]);
  if (auth.response) return auth.response;

  const input = editProfile.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({error: "Provide a display name of 1–120 characters."}, {status: 400, headers});
  }

  try {
    const profile = await updateProfileName(auth.user.id, input.data.name);
    if (!profile) return NextResponse.json({error: "Your account profile is unavailable."}, {status: 404, headers});
    return NextResponse.json(profile, {headers});
  } catch {
    return NextResponse.json({error: "Could not save your display name."}, {status: 500, headers});
  }
}
