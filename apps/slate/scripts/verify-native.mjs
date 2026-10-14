import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function files(directory, prefix = "") {
  const result = [];
  for (const name of await readdir(directory)) {
    const relative = join(prefix, name),
      absolute = join(directory, name);
    if ((await stat(absolute)).isDirectory())
      result.push(...(await files(absolute, relative)));
    else result.push(relative);
  }
  return result;
}
const assets = (await files(join(root, "dist"))).filter(
  (file) => !file.startsWith("content-packs"),
);
let applicationId;
for (const platform of ["android", "ios"]) {
  const folder = join(
    root,
    platform === "android" ? "android/app/src/main/assets" : "ios/App/App",
  );
  const config = JSON.parse(
    await readFile(join(folder, "capacitor.config.json"), "utf8"),
  );
  if (
    config.server?.url ||
    !config.appId ||
    (applicationId && config.appId !== applicationId)
  )
    throw new Error(`${platform}: unexpected remote server or application ID`);
  applicationId = config.appId;
  const bundled = await files(join(folder, "public"));
  if (bundled.some((file) => file.startsWith("content-packs")))
    throw new Error(
      `${platform}: optional hosted packs must not be bundled; run cap:sync`,
    );
  for (const file of assets) {
    const [built, copied] = await Promise.all([
      readFile(join(root, "dist", file)),
      readFile(join(folder, "public", file)),
    ]);
    if (hash(built) !== hash(copied))
      throw new Error(
        `${platform}: stale or missing bundled asset ${file}; run cap:prepare`,
      );
  }
  console.log(
    `${platform}: ${assets.length} bundled files match the production build; no remote server.`,
  );
}
console.log(
  "Bundle verification passed. Compiling, signing, first launch offline, and persistence through device upgrades still require the platform SDKs and devices.",
);
