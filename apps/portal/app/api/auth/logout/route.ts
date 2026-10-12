import { isTrustedRequest } from "@/lib/security/request-origin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  if (!isTrustedRequest(request))
    return Response.json(
      { error: "Untrusted request origin" },
      { status: 403 },
    );
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear the custom JWT cookie using Next.js cookies API
  const cookieStore = await cookies();
  cookieStore.delete("nimble-auth");

  return Response.json({ success: true });
}
