import {NextResponse} from "next/server";
import {authorize} from "@/lib/api-auth";
import {getTenantBillingHistory} from "@/lib/tenant-billing-history";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Accept, Content-Type",
};

const headers = {"Cache-Control": "private, no-store", ...corsHeaders};

export function OPTIONS() {
  return new NextResponse(null, {status: 204, headers: corsHeaders});
}

export async function GET(request: Request) {
  const auth = await authorize(request, ["tenant"]);
  if (auth.response) {
    const response = auth.response;
    Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
    return response;
  }

  try {
    // No tenant/user ID from a URL or request body can override this identity.
    const history = await getTenantBillingHistory(auth.user.id);
    if (!history) {
      return NextResponse.json(
        {
          error: "Your account is not linked to a tenant record. Please contact your boarding-house owner.",
          code: "TENANT_NOT_LINKED",
        },
        {status: 403, headers},
      );
    }
    return NextResponse.json(history, {headers});
  } catch {
    return NextResponse.json(
      {error: "Failed to load billing history."},
      {status: 500, headers},
    );
  }
}
