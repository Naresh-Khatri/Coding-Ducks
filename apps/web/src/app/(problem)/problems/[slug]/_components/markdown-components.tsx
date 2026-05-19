import type { Components } from "react-markdown";

import { ShikiCode } from "~/components/shiki-code";

export const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      className="mt-0 mb-6 text-3xl font-extrabold tracking-tight"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="text-foreground/90 mt-8 mb-4 border-b border-white/5 pb-2 text-xl font-bold tracking-tight"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-foreground/80 mt-6 mb-3 text-lg font-bold" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="text-foreground/70 mb-4 text-sm leading-relaxed" {...props} />
  ),
  pre: ({ children }) => (
    <div className="bg-accent/20 my-4 overflow-x-auto rounded-lg border border-white/5 p-4">
      {children}
    </div>
  ),
  code: ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    if (match) {
      const code = String(children).replace(/\n$/, "");
      return <ShikiCode code={code} lang={match[1]!} />;
    }

    return (
      <code
        className="bg-accent/40 text-primary rounded px-1.5 py-0.5 font-mono text-xs font-medium"
        {...props}
      >
        {children}
      </code>
    );
  },
  ul: ({ node, ...props }) => (
    <ul
      className="text-foreground/70 mb-6 ml-5 list-outside list-disc space-y-2 text-sm"
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="text-foreground/70 mb-6 ml-5 list-outside list-decimal space-y-2 text-sm"
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="text-foreground/90 font-semibold" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="text-foreground/80 italic" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a
      className="text-primary font-medium underline underline-offset-2 hover:opacity-80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="text-foreground/60 border-primary/40 my-4 border-l-2 pl-4 text-sm italic"
      {...props}
    />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-8 border-white/5" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-accent/30 text-foreground/80" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="divide-y divide-white/5" {...props} />
  ),
  tr: ({ node, ...props }) => <tr {...props} />,
  th: ({ node, ...props }) => (
    <th className="px-4 py-2 font-semibold" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="text-foreground/70 px-4 py-2" {...props} />
  ),
};
