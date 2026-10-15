import { parseDocument, stringify } from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import {
  mapReferenceLinks,
  normalizeRelationshipTags,
  readReference,
  referenceMarkdown,
  referenceHref,
} from "./references";

export type HeaderRelationship = { target: string; tags: string[] };
export type RelationshipReference = HeaderRelationship & {
  href?: string;
  source: string;
  origin: "header" | "inline";
  index: number;
  start: number;
  end: number;
  label: string;
};
type Node = {
  type: string;
  value?: string;
  url?: string;
  identifier?: string;
  children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
};
const parser = unified().use(remarkParse).use(remarkGfm);
export function readDocument(markdown: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  const errors: string[] = [];
  let metadata: Record<string, unknown> = {};
  if (match) {
    try {
      const doc = parseDocument(match[1], { uniqueKeys: true });
      if (doc.errors.length) throw new Error(doc.errors[0].message);
      const value: unknown = doc.toJS({ maxAliasCount: 0 });
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Metadata must be a mapping.");
      metadata = value as Record<string, unknown>;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Invalid metadata.");
    }
  } else if (markdown.startsWith("---\n") || markdown.startsWith("---\r\n"))
    errors.push("The metadata header needs a closing --- line.");
  const relationships: HeaderRelationship[] = [];
  if (metadata.relationships !== undefined) {
    if (
      !Array.isArray(metadata.relationships) ||
      metadata.relationships.length > 1000
    )
      errors.push("Relationships must be a list of at most 1,000 entries.");
    else
      for (const [index, value] of metadata.relationships.entries()) {
        const row = value as Partial<HeaderRelationship> | null;
        if (
          !row ||
          typeof row.target !== "string" ||
          !row.target.trim() ||
          row.target.length > 500 ||
          (row.tags !== undefined &&
            (!Array.isArray(row.tags) ||
              row.tags.length > 80 ||
              row.tags.some(
                (tag) => typeof tag !== "string" || tag.length > 100,
              )))
        ) {
          errors.push(
            `Relationship ${index + 1} needs a target and a list of string tags.`,
          );
        } else
          relationships.push({
            target: row.target.trim(),
            tags: normalizeRelationshipTags(row.tags ?? []),
          });
      }
  }
  for (const key of ["title", "category"])
    if (
      metadata[key] !== undefined &&
      (typeof metadata[key] !== "string" ||
        (metadata[key] as string).length > 160 ||
        (key === "title" && !(metadata[key] as string).trim()))
    )
      errors.push(`Invalid ${key} in metadata.`);
  if (
    metadata.tags !== undefined &&
    (!Array.isArray(metadata.tags) ||
      metadata.tags.length > 80 ||
      metadata.tags.some((tag) => typeof tag !== "string" || tag.length > 100))
  )
    errors.push("Document tags must be a list of strings.");
  return {
    metadata,
    relationships,
    content: match ? markdown.slice(match[0].length) : markdown,
    prefixLength: match?.[0].length ?? 0,
    hasHeader: !!match,
    errors,
  };
}
export function writeDocument(
  markdown: string,
  patch: Record<string, unknown>,
  content?: string,
) {
  const doc = readDocument(markdown);
  if (doc.errors.length)
    throw new Error(
      "Fix the Markdown metadata before editing it with these controls.",
    );
  return (
    "---\n" +
    stringify({ ...doc.metadata, ...patch }, { lineWidth: 0 }).trimEnd() +
    "\n---\n" +
    (content ?? doc.content)
  );
}
export function scopedTarget(target: string, source: string) {
  if (target.includes("::")) return target;
  if (target.startsWith("#")) return source.split("#")[0] + target;
  return source.slice(0, source.indexOf("::") + 2) + target;
}
export function documentReferences(markdown: string, source: string) {
  const doc = readDocument(markdown),
    references: RelationshipReference[] = [];
  if (doc.errors.length) return { references, errors: doc.errors };
  doc.relationships.forEach((row, index) =>
    references.push({
      ...row,
      target: scopedTarget(row.target, source),
      source,
      origin: "header",
      index,
      start: 0,
      end: doc.prefixLength,
      label: row.target,
    }),
  );
  const root = parser.parse(doc.content) as Node;
  const definitions = new Map<string, string>();
  const collect = (node: Node) => {
    if (node.type === "definition" && node.identifier && node.url)
      definitions.set(node.identifier.toLowerCase(), node.url);
    node.children?.forEach(collect);
  };
  collect(root);
  const text = (node: Node): string =>
    node.value ?? node.children?.map(text).join("") ?? "";
  const visit = (node: Node) => {
    if (
      [
        "code",
        "inlineCode",
        "definition",
        "html",
        "image",
        "imageReference",
      ].includes(node.type)
    )
      return;
    const start = node.position?.start.offset ?? 0,
      end = node.position?.end.offset ?? start;
    if (node.type === "link" || node.type === "linkReference") {
      const href =
        node.url ?? definitions.get(node.identifier?.toLowerCase() ?? "") ?? "";
      const ref = readReference(href);
      if (ref)
        references.push({
          ...ref,
          href,
          target: scopedTarget(ref.target, source),
          source,
          origin: "inline",
          index: references.length,
          start: doc.prefixLength + start,
          end: doc.prefixLength + end,
          label: text(node),
        });
      return;
    }
    if (node.type === "text" && node.value) {
      // Shorthand accepts IDs and compact tags. The picker supports any string tag.
      for (const match of doc.content
        .slice(start, end)
        .matchAll(
          /(?<![\\\w@])@([a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9_/-]+)*)(?::([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*(?:,[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*)*))?(?![\w@])/g,
        ))
        references.push({
          source,
          target: scopedTarget(match[1], source),
          tags: normalizeRelationshipTags(match[2]?.split(",") ?? []),
          origin: "inline",
          index: references.length,
          start: doc.prefixLength + start + match.index!,
          end: doc.prefixLength + start + match.index! + match[0].length,
          label: match[1],
        });
      return;
    }
    node.children?.forEach(visit);
  };
  visit(root);
  return { references, errors: doc.errors };
}
export function markdownForDisplay(
  markdown: string,
  source = "local::document",
) {
  let body = readDocument(markdown).content;
  const references = documentReferences(body, source).references.filter((ref) =>
    body.slice(ref.start, ref.end).startsWith("@"),
  );
  for (const ref of references.reverse())
    body =
      body.slice(0, ref.start) +
      referenceMarkdown(ref.label, ref.target, ref.tags) +
      body.slice(ref.end);
  return body;
}
export function mapDocumentTargets(
  markdown: string,
  remap: (target: string) => string,
  source = "local::document",
) {
  const doc = readDocument(markdown);
  if (doc.errors.length) return mapReferenceLinks(markdown, remap);
  let content = doc.content;
  const inline = documentReferences(doc.content, source).references.filter(
    (ref) => ref.origin === "inline",
  );
  for (const ref of inline.reverse()) {
    const target = remap(ref.target);
    if (target !== ref.target) {
      const original = doc.content.slice(ref.start, ref.end);
      const replacement =
        ref.href && original.includes(ref.href)
          ? original.replace(ref.href, referenceHref(target, ref.tags))
          : referenceMarkdown(ref.label, target, ref.tags);
      content =
        content.slice(0, ref.start) + replacement + content.slice(ref.end);
    }
  }
  if (!doc.hasHeader) return content;
  const relationships = doc.relationships.map((row) => ({
    ...row,
    target: remap(scopedTarget(row.target, source)),
  }));
  return writeDocument(
    markdown,
    doc.metadata.relationships !== undefined ? { relationships } : {},
    content,
  );
}
export function removeDocumentReference(
  markdown: string,
  reference: RelationshipReference,
) {
  const current = documentReferences(
    markdown,
    reference.source,
  ).references.find(
    (row) => row.origin === reference.origin && row.index === reference.index,
  );
  if (
    !current ||
    current.target !== reference.target ||
    JSON.stringify(current.tags) !== JSON.stringify(reference.tags) ||
    current.start !== reference.start ||
    current.end !== reference.end ||
    current.label !== reference.label
  )
    throw new Error(
      "The references changed. Wait for indexing, then try again.",
    );
  if (reference.origin === "header") {
    const doc = readDocument(markdown);
    return writeDocument(markdown, {
      relationships: doc.relationships.filter(
        (_, index) => index !== reference.index,
      ),
    });
  }
  const original = markdown.slice(reference.start, reference.end);
  const label =
    /^\[([\s\S]*)\](?:\(|\[)/.exec(original)?.[1] ?? reference.label;
  return (
    markdown.slice(0, reference.start) + label + markdown.slice(reference.end)
  );
}
export function updateReferenceTags(
  markdown: string,
  reference: RelationshipReference,
  tags: string[],
) {
  // Reuse the same stale-occurrence check as unlinking before touching source.
  removeDocumentReference(markdown, reference);
  if (reference.origin === "header") {
    const doc = readDocument(markdown);
    return writeDocument(markdown, {
      relationships: doc.relationships.map((row, index) =>
        index === reference.index
          ? { ...row, tags: normalizeRelationshipTags(tags) }
          : row,
      ),
    });
  }
  const original = markdown.slice(reference.start, reference.end);
  const replacement =
    reference.href && original.includes(reference.href)
      ? original.replace(reference.href, referenceHref(reference.target, tags))
      : referenceMarkdown(reference.label, reference.target, tags);
  return (
    markdown.slice(0, reference.start) +
    replacement +
    markdown.slice(reference.end)
  );
}
