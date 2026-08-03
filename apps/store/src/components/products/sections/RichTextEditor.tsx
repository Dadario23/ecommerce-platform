"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, Link as LinkIcon, Heading2, Heading3, List,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const BUTTON =
  "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors data-[active=true]:bg-blue-50 data-[active=true]:text-(--tenant-primary)";

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[140px] px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del link", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-300 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <button
          type="button"
          data-active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={BUTTON}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          data-active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={BUTTON}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          data-active={editor.isActive("link")}
          onClick={setLink}
          className={BUTTON}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          data-active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={BUTTON}
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          data-active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={BUTTON}
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          data-active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={BUTTON}
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
