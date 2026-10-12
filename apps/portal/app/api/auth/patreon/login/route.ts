import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isTrustedRequest } from "@/lib/security/request-origin";
export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request))
    return Response.json(
      { error: "Untrusted request origin" },
      { status: 403 },
    );
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  if (
    !process.env.PATREON_CLIENT_ID ||
    !process.env.PATREON_CAMPAIGN_ID ||
    !process.env.NEXT_PUBLIC_SITE_URL
  )
    return Response.json(
      { error: "Patreon OAuth not configured" },
      { status: 503 },
    );
  const state = randomBytes(32).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.PATREON_CLIENT_ID,
    redirect_uri:
      process.env.NEXT_PUBLIC_SITE_URL + "/api/auth/patreon/callback",
    scope: "identity identity[email] identity.memberships",
    state,
  });
  const response = NextResponse.json({
    url: "https://www.patreon.com/oauth2/authorize?" + params,
  });
  response.cookies.set(
    "patreon-oauth-state",
    JSON.stringify({ state, userId: user.id, createdAt: Date.now() }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/patreon",
      maxAge: 600,
    },
  );
  return response;
}
