import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SearchEntry = { permalink: string; searchBody: string };
const readCollection = (name: string): SearchEntry[] =>
  JSON.parse(
    readFileSync(resolve(__dirname, `../.velite/${name}.json`), "utf8"),
  );
const publicEntries = readCollection("publicSearch");
const restrictedEntries = [
  ...readCollection("patronSearch"),
  ...readCollection("purchasedSearch"),
];
const restricted = restrictedEntries.find(
  (entry) =>
    entry.searchBody.length > 200 &&
    !publicEntries.some((publicEntry) =>
      publicEntry.searchBody.includes(entry.searchBody.slice(40, 200)),
    ),
);

test("anonymous HTML and navigation payload omit restricted search bodies", async ({
  request,
}) => {
  expect(
    restricted,
    "Build at least one restricted content entry before testing access",
  ).toBeDefined();
  const privatePhrase = restricted!.searchBody.slice(40, 200);
  const requestHeaders: Record<string, string>[] = [{}, { RSC: "1" }];
  for (const headers of requestHeaders) {
    const response = await request.get("/", { headers });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).not.toContain(privatePhrase);
    expect(body).not.toContain(JSON.stringify(privatePhrase).slice(1, -1));
  }
});

test("anonymous readers can open public articles but restricted articles require login", async ({
  request,
}) => {
  expect(publicEntries.length).toBeGreaterThan(0);
  const publicResponse = await request.get(publicEntries[0].permalink);
  expect(publicResponse.status()).toBe(200);
  const restrictedResponse = await request.get(`${restricted!.permalink}/`, {
    maxRedirects: 0,
  });
  expect(restrictedResponse.status()).toBe(307);
  expect(restrictedResponse.headers().location).toContain("returnTo=");
  expect(restrictedResponse.headers()["cache-control"]).toContain("no-store");
});
