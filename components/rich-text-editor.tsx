"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { JSONContent } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

type RichTextEditorProps = {
  value?: JSONContent;
  onChange: (payload: { json: JSONContent; text: string }) => void;
  insertTextRequest?: {
    id: number;
    text: string;
  } | null;
  placeholder?: string;
  editable?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  insertTextRequest,
  placeholder = "记录你的梦境细节，越具体越能帮助后续分析...",
  editable = true
}: RichTextEditorProps) {
  const lastInsertId = useRef<number | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      })
    ],
    immediatelyRender: false,
    content: value,
    editable,
    onUpdate: ({ editor: instance }) => {
      onChange({
        json: instance.getJSON(),
        text: instance.getText()
      });
    }
  });

  useEffect(() => {
    if (editor && value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!editor || !editable || !insertTextRequest || lastInsertId.current === insertTextRequest.id) {
      return;
    }

    const text = insertTextRequest.text.trim();
    if (!text) {
      return;
    }

    lastInsertId.current = insertTextRequest.id;
    editor
      .chain()
      .focus("end")
      .insertContent({
        type: "paragraph",
        content: [
          {
            type: "text",
            text
          }
        ]
      })
      .run();
  }, [editable, editor, insertTextRequest]);

  if (!editor) {
    return <div className="rich-editor-shell"><div className="ProseMirror">编辑器加载中...</div></div>;
  }

  return (
    <div className="rich-editor-shell">
      <div className="editor-toolbar">
        <button disabled={!editable} type="button" onClick={() => editor.chain().focus().toggleBold().run()}>
          加粗
        </button>
        <button disabled={!editable} type="button" onClick={() => editor.chain().focus().toggleItalic().run()}>
          斜体
        </button>
        <button disabled={!editable} type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          列表
        </button>
        <button disabled={!editable} type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          小标题
        </button>
        <button disabled={!editable} type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          清空格式
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
