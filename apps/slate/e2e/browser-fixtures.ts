import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

let origin: string | undefined;
let localServer: Server | undefined;
export async function stopServer(server: Server) {
  if (!server.listening) return;
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

// WebKit's offline emulation rejects even service-worker-served navigations:
// https://github.com/microsoft/playwright/issues/42775
// Stop a test-owned origin instead; cached responses must still work, and no
// application/network requests can reach a live server. Other engines retain
// their normal offline emulation. No assertions are skipped.
export async function disconnect(
  context: BrowserContext,
  server = localServer,
) {
  if (context.browser()?.browserType().name() !== "webkit") {
    await context.setOffline(true);
    return;
  }
  if (!server)
    throw new Error("Offline WebKit tests require a test-owned origin");
  await stopServer(server);
}
export function slateURL(_page: Page) {
  return origin ?? "/";
}
export const test = base.extend<{ offlineOrigin: void }>({
  offlineOrigin: [
    async ({ browserName, baseURL }, use) => {
      if (browserName !== "webkit" || baseURL?.includes(":3011")) {
        await use();
        return;
      }
      const dist = resolve("dist");
      const types: Record<string, string> = {
        ".js": "application/javascript",
        ".html": "text/html",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".woff2": "font/woff2",
        ".webmanifest": "application/manifest+json",
      };
      const server = createServer(async (request, response) => {
        try {
          const path = new URL(request.url!, "http://localhost").pathname;
          const file = resolve(
            dist,
            "." + (path === "/" ? "/index.html" : path),
          );
          if (!file.startsWith(dist + sep)) {
            response.writeHead(403).end();
            return;
          }
          const bytes = await readFile(file);
          response.writeHead(200, {
            "Content-Type": types[extname(file)] ?? "application/octet-stream",
            "Cache-Control": "no-store",
          });
          response.end(bytes);
        } catch {
          response.writeHead(404).end();
        }
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Missing test origin");
      origin = `http://127.0.0.1:${address.port}/`;
      localServer = server;
      try {
        await use();
      } finally {
        await stopServer(server);
        origin = undefined;
        localServer = undefined;
      }
    },
    { auto: true },
  ],
});
