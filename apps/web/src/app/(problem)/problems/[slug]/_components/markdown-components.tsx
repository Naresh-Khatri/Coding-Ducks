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
  pre: ({ node, children, ...props }) => (
    <div
      className="bg-accent/20 my-4 overflow-x-auto rounded-lg border border-white/5 p-4"
      {...props}
    >
      {children}
    </div>
  ),
  code: ({ node, className, children, ...props }: any) => {
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
  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="text-foreground/90 font-semibold" {...props} />
  ),
};
