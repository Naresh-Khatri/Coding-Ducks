"use client";

import { useEffect } from "react";
import {
  Bold,
  Code,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { cn } from "~/lib/utils";

// Minimal feature set — inline marks + lists + quote, nothing heavier.
const extensions = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    horizontalRule: false,
  }),
];

const proseClass =
  "prose prose-invert prose-slate max-w-none text-sm focus:outline-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Min height of the editable area (Tailwind class). Default min-h-16. */
  minHeightClass?: string;
  /** Rendered inside the editor box, below the editable area. */
  footer?: React.ReactNode;
}

function ToolbarButton({
  editor,
  active,
  onClick,
  label,
  children,
}: {
  editor: Editor;
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={() => {
        onClick();
        editor.commands.focus();
      }}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-white/5 rounded p-1 transition-colors",
        active && "bg-white/10 text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeightClass = "min-h-16",
  footer,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: cn(proseClass, minHeightClass, "px-3 py-2") },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Reset when the caller clears the field (e.g. after posting).
  useEffect(() => {
    if (editor && value === "" && !editor.isEmpty) {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "focus-within:border-ring rounded-md border bg-transparent",
        className,
      )}
    >
      <div className="flex gap-0.5 border-b px-1.5 py-1">
        <ToolbarButton
          editor={editor}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="bg-border mx-1 w-px" />
        <ToolbarButton
          editor={editor}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p className="text-muted-foreground pointer-events-none absolute top-2 left-3 text-sm">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
      {footer && (
        <div className="border-t px-3 py-2">{footer}</div>
      )}
    </div>
  );
}

// Read-only renderer. Parsing stored HTML through the same schema drops
// anything not in it, so user content can't smuggle markup/scripts.
export function RichTextContent({ html }: { html: string }) {
  const editor = useEditor({
    extensions,
    content: html,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: proseClass } },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
