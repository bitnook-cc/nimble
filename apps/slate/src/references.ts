export function normalizeRelationshipTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}
export function referenceHref(target: string, tags: string[] = []) {
  const query = new URLSearchParams();
  for (const tag of normalizeRelationshipTags(tags)) query.append("tag", tag);
  const encoded = encodeURIComponent(target).replace(
    /[!'()*]/g,
    (value) => "%" + value.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `slate:${encoded}${query.size ? "?" + query : ""}`;
}
export function referenceMarkdown(
  title: string,
  target: string,
  tags: string[] = [],
) {
  return `[${title.replace(/[\\[\]]/g, "\\$&")}](${referenceHref(target, tags)})`;
}
export function readReference(href: string) {
  if (!href.startsWith("slate:")) return null;
  try {
    const [encoded, query] = href.slice(6).split("?", 2);
    return {
      target: decodeURIComponent(encoded),
      tags: normalizeRelationshipTags(new URLSearchParams(query).getAll("tag")),
    };
  } catch {
    return null;
  }
}
export const readTarget = (href: string) => readReference(href)?.target ?? null;
export function mapReferenceLinks(
  body: string,
  remap: (target: string) => string,
) {
  return body.replace(/slate:([^\s)]+)/g, (whole) => {
    const ref = readReference(whole);
    return ref ? referenceHref(remap(ref.target), ref.tags) : whole;
  });
}
export function mentionParts(text: string) {
  const separator = text.search(/(?<!:):(?!:)/);
  return separator < 0
    ? { query: text, tags: [] as string[] }
    : {
        query: text.slice(0, separator),
        tags: normalizeRelationshipTags(text.slice(separator + 1).split(",")),
      };
}
