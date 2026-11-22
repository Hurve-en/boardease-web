import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {getTenantAccount} from "@/lib/tenant-account";

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
