import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, placeholder, className }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm w-full outline-none min-h-[100px] text-gray-700 bg-transparent',
      },
    },
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="p-4 text-gray-400 text-xs italic">Đang khởi tạo...</div>; 
  }

  return (
    <div className={`tiptap-wrapper resize-y overflow-auto min-h-[140px] flex flex-col ${className || ''}`}>
      <div className="flex-1 cursor-text flex flex-col">
          <EditorContent editor={editor} />
      </div>
    </div>
  );
};
