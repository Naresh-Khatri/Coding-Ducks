import { useMemo } from "react";

interface PreviewProps {
  html: string;
  css: string;
  js: string;
  head?: string;
  body?: string;
  className?: string;
}

export function Preview({ html, css, js, head = "", body = "", className }: PreviewProps) {
  const content = useMemo(() => {
    const preJs = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${head}
          <style>
            ${css}
          </style>
          <script>
            // Capture console logs and send to parent
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            console.log = (...args) => {
              window.parent.postMessage({ type: 'console', method: 'log', args }, '*');
              originalLog.apply(console, args);
            };
            
            console.error = (...args) => {
              window.parent.postMessage({ type: 'console', method: 'error', args }, '*');
              originalError.apply(console, args);
            };
            
            console.warn = (...args) => {
              window.parent.postMessage({ type: 'console', method: 'warn', args }, '*');
              originalWarn.apply(console, args);
            };

            window.onerror = function(message, source, lineno, colno, error) {
               const offset = window.__js_offset || 0;
               // Adjust line number if it seems to come from the user script
               const userLineno = lineno && lineno > offset ? lineno - offset : lineno;
               window.parent.postMessage({ type: 'console', method: 'error', args: [message], lineno: userLineno, colno }, '*');
            };
          </script>
        </head>
        <body>
          ${html}
          ${body}
          <script>
`;

    // Calculate lines in the pre-JS part
    // The user code starts after:
    // 1. The preJs block
    // 2. The line containing window.__js_offset = ...
    // So we need to subtract the number of lines in preJs + 1.
    const jsOffset = preJs.split('\n').length + 1;

    return `${preJs}
              window.__js_offset = ${jsOffset};
              ${js}
          </script>
        </body>
      </html>
    `;
  }, [html, css, js, head, body]);

  return (
    <iframe
      className={`h-full w-full bg-white ${className}`}
      sandbox="allow-scripts allow-modals allow-same-origin"
      title="Preview"
      srcDoc={content}
    />
  );
}
