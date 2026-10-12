import { Capacitor } from "@capacitor/core";

export function toBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 32768)
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  return btoa(chunks.join(""));
}
export function fromBase64(encoded: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
}
export async function shareFile(blob: Blob, filename: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const safeName =
    filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "slate-export";
  // Unique cache paths prevent a second export from changing an active share.
  const path = `slate-exports/${crypto.randomUUID()}/${safeName}`;
  const file = await Filesystem.writeFile({
    path,
    directory: Directory.Cache,
    recursive: true,
    data: toBase64(new Uint8Array(await blob.arrayBuffer())),
  });
  await Share.share({
    files: [file.uri],
    title: filename,
    dialogTitle: "Save or share Slate export",
  });
  // The receiving application may still be copying: leave cleanup to OS cache eviction.
}
export async function pickFiles(
  multiple: boolean,
  accept?: string,
): Promise<File[]> {
  if (!Capacitor.isNativePlatform())
    throw new Error("The system file picker is only used in the native app.");
  const [{ FilePicker }, { Filesystem }] = await Promise.all([
    import("@capawesome/capacitor-file-picker"),
    import("@capacitor/filesystem"),
  ]);
  const types = accept?.split(",").filter((type) => type.includes("/"));
  if (
    types?.some((type) =>
      ["application/json", "application/zip"].includes(type),
    )
  )
    types.push("application/octet-stream");
  const result = await FilePicker.pickFiles({
    limit: multiple ? 0 : 1,
    readData: false,
    ...(types?.length ? { types } : {}),
  });
  if (
    result.files.length > 100 ||
    result.files.reduce((total, file) => total + file.size, 0) >
      128 * 1024 * 1024
  )
    throw new Error("Selected files exceed the 128 MiB import limit.");
  const files: File[] = [];
  for (const file of result.files) {
    if (!file.path) throw new Error("The selected file could not be opened.");
    const contents = await Filesystem.readFile({ path: file.path });
    const bytes =
      typeof contents.data === "string"
        ? fromBase64(contents.data)
        : new Uint8Array(await contents.data.arrayBuffer());
    if (bytes.length !== file.size)
      throw new Error(
        "The selected file changed while it was being read. Pick it again.",
      );
    files.push(new File([bytes], file.name, { type: file.mimeType }));
  }
  return files;
}
