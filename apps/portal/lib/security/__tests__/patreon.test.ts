import { it, expect } from "vitest";
import { membershipTags, reconcileMembershipTags } from "../patreon";
const member = (campaign: string, status = "active_patron", cents = 1000) => ({
  type: "member",
  relationships: { campaign: { data: { id: campaign } } },
  attributes: { patron_status: status, currently_entitled_amount_cents: cents },
});
it("does not grant access for a different creator or an inactive membership", () => {
  expect(membershipTags([member("other")], "nimble")).toEqual([]);
  expect(
    membershipTags([member("nimble", "declined_patron")], "nimble"),
  ).toEqual([]);
  expect(membershipTags([member("nimble")], "")).toEqual([]);
});
it("grants the canonical Vault tag for an active Nimble membership", () =>
  expect(membershipTags([member("nimble")], "nimble")).toEqual([
    "patron",
    "patreon",
    "patreon-tier-3",
  ]));
it("removes stale membership tiers on downgrade or cancellation", () => {
  expect(
    reconcileMembershipTags(
      ["book", "patron", "patreon-tier-3"],
      membershipTags([member("nimble", "active_patron", 100)], "nimble"),
    ),
  ).toEqual(["book", "patron", "patreon", "patreon-tier-1"]);
  expect(
    reconcileMembershipTags(["book", "patron", "patreon-tier-3"], []),
  ).toEqual(["book"]);
});
