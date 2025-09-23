import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headers
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold mb-2 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-medium mb-1 text-foreground">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-xs font-medium mb-1 text-foreground">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-xs font-medium mb-1 text-muted-foreground">{children}</h6>
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li>{children}</li>
        ),
        
        // Emphasis
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        
        // Code
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-muted text-muted-foreground px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-muted text-muted-foreground p-2 rounded text-xs font-mono whitespace-pre-wrap mb-2">
              {children}
            </code>
          );
        },
        
        // Links
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary hover:text-primary/80 underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-border pl-4 py-2 mb-2 bg-muted/50 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border border-border rounded-md">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-border">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-r border-border last:border-r-0">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-foreground border-r border-border last:border-r-0">
            {children}
          </td>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="border-border my-4" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}