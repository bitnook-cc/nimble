import { createClient } from "./supabase/server";

/**
 * Get the current user's tags from Supabase session
 * @returns Array of user tags, empty array if not authenticated
 */
export async function getUserTags(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return [];
  }

  const metadata = user.app_metadata || {};
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.filter(
        (tag: unknown): tag is string => typeof tag === "string",
      )
    : [];
  const membershipValid =
    Date.parse(metadata.patreon_membership_expires_at || "") > Date.now();
  return tags.filter(
    (tag: string) =>
      membershipValid ||
      (tag !== "patron" &&
        tag !== "patreon" &&
        !tag.startsWith("patreon-tier-")),
  );
}

/**
 * Check if the current user has a specific tag
 * @param tag - The tag to check for
 * @returns True if user has the tag, false otherwise
 */
export async function hasTag(tag: string): Promise<boolean> {
  const tags = await getUserTags();
  return tags.includes(tag);
}

/**
 * Check if the current user has premium access
 * @returns True if user has premium tag, false otherwise
 */
export async function hasPremiumAccess(): Promise<boolean> {
  return hasTag("premium");
}
