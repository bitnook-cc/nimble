import * as runtime from 'react/jsx-runtime'

const sharedComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="text-3xl font-bold text-foreground mt-8 mb-4 first:mt-0"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-2xl font-semibold text-foreground mt-6 mb-3"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-xl font-semibold text-foreground mt-5 mb-2"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-lg font-medium text-foreground mt-4 mb-2"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="text-foreground leading-relaxed mb-4"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc list-inside text-foreground mb-4 space-y-1"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal list-inside text-foreground mb-4 space-y-1"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="text-foreground"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-border pl-4 py-2 bg-card text-foreground italic mb-4"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4 border border-slate-700"
      {...props}
    />
  ),
  a: (props: React.HTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-primary hover:text-foreground underline"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong
      className="font-semibold text-foreground"
      {...props}
    />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em
      className="italic text-foreground"
      {...props}
    />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-4">
      <table
        className="min-w-full border border-border rounded-lg"
        {...props}
      />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead
      className="bg-secondary"
      {...props}
    />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border border-border px-4 py-2 text-left font-semibold text-foreground"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border border-border px-4 py-2 text-foreground"
      {...props}
    />
  ),
}

// parse the Velite generated MDX code into a React component function
const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

interface MDXProps {
  code: string
  components?: Record<string, React.ComponentType>
}

// MDXContent component
export const MDXContent = ({ code, components }: MDXProps) => {
  const Component = useMDXComponent(code)
  return <Component components={{ ...sharedComponents, ...components }} />
}