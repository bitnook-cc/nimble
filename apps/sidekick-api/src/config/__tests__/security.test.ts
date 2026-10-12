import { describe, it, expect } from "vitest";
import {
  validateCallbackUrl,
  validOAuthState,
  isAllowedOrigin,
} from "../security.js";
describe("OAuth trust boundaries", () => {
  it.each([
    "https://localhost.attacker.test/auth/callback",
    "https://evil.test/auth/callback",
    "http://localhost:3000@evil.test/auth/callback",
    "http://localhost:3000/other",
    "http://localhost:3000/\\evil.test",
  ])("rejects callback %s", (url) =>
    expect(validateCallbackUrl(url)).toBeNull(),
  );
  it("accepts the exact application callback", () =>
    expect(validateCallbackUrl("http://localhost:3000/auth/callback")).toBe(
      "http://localhost:3000/auth/callback",
    ));
  it("does not trust origins containing localhost", () =>
    expect(isAllowedOrigin("https://localhost.attacker.test")).toBe(false));
  it("requires matching browser state within ten minutes", () => {
    const pending = { state: "a".repeat(64), createdAt: Date.now() };
    expect(validOAuthState(pending.state, pending)).toBe(true);
    expect(validOAuthState("b".repeat(64), pending)).toBe(false);
    expect(validOAuthState(pending.state, undefined)).toBe(false);
    expect(
      validOAuthState(pending.state, {
        ...pending,
        createdAt: Date.now() - 600001,
      }),
    ).toBe(false);
    expect(validOAuthState(["a"], pending)).toBe(false);
  });
});
