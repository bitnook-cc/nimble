import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
} from "react";
import { readTarget } from "../content-schema";
import { headingId, resolveEntry, type Entry } from "../content";
import type { ContentPack } from "../content-schema";
import type { Roll } from "../model";

type LinkContext = {
  all: Entry[];
  open: (target: string) => void;
  onRoll: (formula: string) => Roll;
  results: Record<string, string>;
  setResults: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};
const MarkdownLinks = createContext<LinkContext | null>(null);

// Keep the renderer identity stable so a preview can restore focus to its link.
function MarkdownLink({ href, children }: ComponentProps<"a">) {
  const context = useContext(MarkdownLinks);
  if (!context) throw new Error("Markdown link context missing");
  const { all, open, onRoll, results, setResults } = context;

  const target = href ? readTarget(href) : null;
  if (target) {
    const found = resolveEntry(all, target);
    return (
      <button
        className={`reference-link ${found ? "" : "missing-reference"}`}
        title={found?.title ?? "Reference unavailable offline"}
        onClick={() => open(target)}
      >
        {found?.title ?? children}
        {!found ? " (missing)" : ""}
      </button>
    );
  }
  if (href?.startsWith("roll:")) {
    let formula;
    try {
      formula = decodeURIComponent(href.slice(5));
    } catch {
      formula = "";
    }
    return (
      <span>
        <button
          className="reference-link"
          onClick={() => {
            try {
              const r = onRoll(formula);
              setResults((current) => ({
                ...current,
                [formula]:
                  r.result.total +
                  " (" +
                  r.result.tokens
                    .filter((t) => t.type === "dice")
                    .map((t) =>
                      JSON.stringify(t.diceData.dice.map((d) => d.value)),
                    )
                    .join(", ") +
                  ")",
              }));
            } catch (e) {
              setResults((current) => ({
                ...current,
                [formula]: e instanceof Error ? e.message : "Unable to roll",
              }));
            }
          }}
        >
          {formula}
        </button>
        {results[formula] && (
          <span className="inline-roll" role="status">
            {" "}
            {results[formula]}
          </span>
        )}
      </span>
    );
  }
  if (href?.startsWith("#")) return <span>{children}</span>;
  return href && /^https?:\/\//i.test(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );
}

export function Markdown({
  body,
  all,
  open,
  pack,
  onRoll,
}: {
  onRoll: (formula: string) => Roll;
  body: string;
  all: Entry[];
  open: (target: string) => void;
  pack?: ContentPack;
}) {
  const [results, setResults] = useState<Record<string, string>>({});
  return (
    <MarkdownLinks.Provider value={{ all, open, onRoll, results, setResults }}>
      <div className="markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          urlTransform={(url) =>
            url.startsWith("slate:") || url.startsWith("roll:")
              ? url
              : defaultUrlTransform(url)
          }
          components={{
            a: MarkdownLink,
            img: ({ src, alt }) =>
              pack?.assets[src ?? ""] ? (
                <img src={pack.assets[src!]} alt={alt ?? ""} loading="lazy" />
              ) : (
                <span className="hint">
                  [Image unavailable offline: {alt || "image"}]
                </span>
              ),
            h1: ({ children }) => (
              <h2 data-anchor={headingId(String(children))}>{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 data-anchor={headingId(String(children))}>{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 data-anchor={headingId(String(children))}>{children}</h4>
            ),
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </MarkdownLinks.Provider>
  );
}
