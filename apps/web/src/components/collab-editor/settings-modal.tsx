import { useState } from "react";
import { Settings } from "lucide-react";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";

const POPULAR_LIBRARIES = [
  { name: "Tailwind CSS", tag: '<script src="https://cdn.tailwindcss.com"></script>', logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" },
  { name: "Bootstrap 5", tag: '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">', logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" },
  { name: "jQuery", tag: '<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>', logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jquery/jquery-original.svg" },
  { name: "React", tag: '<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>\n<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>', logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
  { name: "Vue 3", tag: '<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>', logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" },
  { name: "FontAwesome", tag: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">', logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/fontawesome.svg" },
  { name: "GSAP", tag: '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>', logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/greensock.svg" },
  { name: "Three.js", tag: '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/threedotjs.svg" },
  { name: "P5.js", tag: '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js"></script>', logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/p5dotjs.svg" },
];

interface SettingsModalProps {
  head: string;
  onHeadChange: (val: string) => void;
  body: string;
  onBodyChange: (val: string) => void;
}

export function SettingsModal({ head, onHeadChange, body, onBodyChange }: SettingsModalProps) {
  const [open, setOpen] = useState(false);

  const addLibrary = (tag: string) => {
    if (head.includes(tag)) return; // Simple duplicate check
    onHeadChange(head + (head ? "\n" : "") + tag);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-3xl max-w-4xl">
        <DialogHeader>
          <DialogTitle>Pen Settings</DialogTitle>
          <DialogDescription>
            Configure global settings for this pen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Head & Body Scripts */}
          <div className="space-y-4">
            {/* Head Scripts Section */}
            <div className="space-y-2">
              <Label>HTML Head Scripts</Label>
              <div className="rounded-md border overflow-hidden">
                <CodeMirror
                  value={head}
                  onChange={onHeadChange}
                  height="180px"
                  theme={oneDark}
                  extensions={[html(), EditorView.lineWrapping]}
                  placeholder="<meta ...>, <link ...>, <script ...>"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLineGutter: false,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Stuff here goes into the &lt;head&gt; of the preview.
              </p>
            </div>

            {/* Body Scripts Section */}
            <div className="space-y-2">
              <Label>HTML Body Scripts</Label>
              <div className="rounded-md border overflow-hidden">
                <CodeMirror
                  value={body}
                  onChange={onBodyChange}
                  height="180px"
                  theme={oneDark}
                  extensions={[html(), EditorView.lineWrapping]}
                  placeholder="<script ...>"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLineGutter: false,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Scripts here are injected at the end of &lt;body&gt;, before your JS code.
              </p>
            </div>
          </div>

          {/* Right Column: Quick Add Libraries */}
          <div className="space-y-2">
            <Label>Quick Add Libraries</Label>
            <ScrollArea className="h-[450px] rounded-md border p-4">
              <div className="grid grid-cols-1 gap-2">
                {POPULAR_LIBRARIES.map((lib) => (
                  <div key={lib.name} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <img src={lib.logo} alt={lib.name} className="h-5 w-5" />
                      <span className="font-medium text-sm">{lib.name}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addLibrary(lib.tag)}
                      disabled={head.includes(lib.tag)}
                    >
                      {head.includes(lib.tag) ? "Added" : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
