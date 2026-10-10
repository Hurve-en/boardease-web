import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser, type Role } from "@/lib/auth";

type AuthResult =
  | { user: CurrentUser; response: null }
  | { user: null; response: NextResponse };

export async function authorize(
  request: Request,
  allowed: Role[],
): Promise<AuthResult> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!allowed.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, response: null };
}
