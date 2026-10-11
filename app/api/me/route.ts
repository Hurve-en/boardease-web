import { NextResponse } from "next/server";
import { authorize } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authorize(request, ["admin", "tenant"]);
  if (auth.response) return auth.response;

  return NextResponse.json(auth.user);
}
