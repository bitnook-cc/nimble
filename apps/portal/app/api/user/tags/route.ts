import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current session from Supabase
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return Response.json(
        {
          error: "Not authenticated",
          login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
        },
        { status: 401 },
      );
    }

    // Get user tags from app_metadata (managed by Supabase)
    const membershipValid =
      Date.parse(user.app_metadata?.patreon_membership_expires_at || "") >
      Date.now();
    const userTags = (user.app_metadata?.tags || []).filter(
      (tag: string) =>
        membershipValid ||
        (tag !== "patron" &&
          tag !== "patreon" &&
          !tag.startsWith("patreon-tier-")),
    );

    return Response.json({
      user_id: user.id,
      tags: userTags,
      expires_at: new Date(Date.now() + 60000).toISOString(),
      cached_until: new Date(Date.now() + 60000).toISOString(), // 1 hour cache suggestion
    });
  } catch (error) {
    console.error("User tags API error:", error);
    return Response.json(
      {
        error: "Internal server error",
        login_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      },
      { status: 500 },
    );
  }
}
