const hasUnsafeCharacters = (value: string) =>
  value.includes("\\") || [...value].some((char) => char.charCodeAt(0) <= 32);

/** Accept normalized same-origin application paths only. */
export function isValidReturnUrl(value: string): boolean {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    hasUnsafeCharacters(value)
  )
    return false;
  try {
    const url = new URL(value, "https://portal.invalid");
    if (url.origin !== "https://portal.invalid") return false;
    const path = decodeURIComponent(url.pathname).toLowerCase();
    return (
      !hasUnsafeCharacters(path) &&
      !["/api", "/admin", "/auth"].some(
        (prefix) => path === prefix || path.startsWith(prefix + "/"),
      )
    );
  } catch {
    return false;
  }
}
