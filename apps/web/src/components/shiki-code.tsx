"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { codeToHtml } from "shiki";

import { Button } from "~/components/ui/button";

interface ShikiCodeProps {
  code: string;
  lang: string;
}

export function ShikiCode({ code, lang }: ShikiCodeProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
      {html ? (
        <div
          className="shiki-code [&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:font-mono [&>pre]:text-xs"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <code className="font-mono text-xs whitespace-pre">{code}</code>
      )}
    </div>
  );
}
