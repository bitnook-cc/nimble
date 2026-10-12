import { isValidReturnUrl } from "@/lib/security/url-validator";
import { isTrustedRequest } from "@/lib/security/request-origin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request))
    return Response.json(
      { error: "Untrusted request origin" },
      { status: 403 },
    );
  const { provider, returnTo } = await request.json();
  if (!["google", "discord"].includes(provider))
    return Response.json({ error: "Unsupported provider" }, { status: 400 });
  if (returnTo && !isValidReturnUrl(returnTo))
    return Response.json({ error: "Invalid return path" }, { status: 400 });
  const supabase = await createClient();

  // Build redirect URL with returnTo parameter if present
  const callbackUrl = new URL(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
  );
  if (returnTo) {
    callbackUrl.searchParams.set("next", returnTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ url: data.url });
}
