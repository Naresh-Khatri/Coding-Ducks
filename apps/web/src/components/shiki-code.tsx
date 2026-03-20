"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface ShikiCodeProps {
  code: string;
  lang: string;
}

export function ShikiCode({ code, lang }: ShikiCodeProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, {
      lang: lang || "text",
      theme: "vitesse-dark",
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // fallback: render as plain text
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (!html) {
    return (
      <code className="font-mono text-xs whitespace-pre">{code}</code>
    );
  }

  return (
    <div
      className="shiki-code [&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:font-mono [&>pre]:text-xs"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
