// Keep optional hosted content out of the native application bundle.
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve, join, sep } from "node:path";
const root = resolve(import.meta.dirname, "..");
const workspace = join(root, "work");
await mkdir(workspace, { recursive: true });
const staging = await mkdtemp(join(workspace, "native-web-"));
if (!staging.startsWith(workspace + sep))
  throw new Error("Invalid native staging path");
try {
  await cp(join(root, "dist"), staging, {
    recursive: true,
    filter: (file) => file !== join(root, "dist/content-packs"),
  });
  const cli = resolve(root, "../../node_modules/@capacitor/cli/bin/capacitor");
  const result = spawnSync(
    process.execPath,
    [cli, "sync", ...process.argv.slice(2)],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, SLATE_NATIVE_WEB_DIR: staging },
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  // Only the task-owned, validated temporary directory is removed.
  await rm(staging, { recursive: true, force: true });
}
