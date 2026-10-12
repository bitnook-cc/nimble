import { it, expect } from "vitest";
import { isValidReturnUrl } from "../url-validator";
it.each([
  "/\\evil.test",
  "//evil.test",
  "/%5cevil.test",
  "/a/../api/logout",
  "/%61pi/logout",
  "https://evil.test",
  "/\t/evil.test",
])("rejects unsafe return URL %s", (url) =>
  expect(isValidReturnUrl(url)).toBe(false),
);
it.each(["/", "/settings", "/monsters?type=dragon#results"])(
  "accepts application return URL %s",
  (url) => expect(isValidReturnUrl(url)).toBe(true),
);
