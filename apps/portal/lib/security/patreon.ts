export interface Membership {
  type: string;
  relationships?: { campaign?: { data?: { id: string } } };
  attributes: {
    patron_status?: string;
    currently_entitled_amount_cents?: number;
  };
}
export function membershipTags(
  memberships: Membership[],
  campaignId: string,
): string[] {
  if (!campaignId) return [];
  const membership = memberships.find(
    (m) =>
      m.type === "member" &&
      m.relationships?.campaign?.data?.id === campaignId &&
      m.attributes?.patron_status === "active_patron",
  );
  if (!membership) return [];
  const tags = ["patron", "patreon"];
  const cents = membership.attributes.currently_entitled_amount_cents || 0;
  if (cents >= 1000) tags.push("patreon-tier-3");
  else if (cents >= 500) tags.push("patreon-tier-2");
  else if (cents >= 100) tags.push("patreon-tier-1");
  return tags;
}
export function reconcileMembershipTags(
  existing: string[],
  current: string[],
): string[] {
  return [
    ...new Set([
      ...existing.filter(
        (tag) =>
          tag !== "patron" &&
          tag !== "patreon" &&
          !tag.startsWith("patreon-tier-"),
      ),
      ...current,
    ]),
  ];
}
