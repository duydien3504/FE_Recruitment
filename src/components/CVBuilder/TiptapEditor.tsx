import React, { useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace('px', ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    } as any;
  },
});

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  editorClassName?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

// Global tracking for the last active editor instance
let globalLastActiveEditor: any = null;

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, className, editorClassName, placeholder, style }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      Placeholder.configure({
        placeholder: placeholder || 'Nhập nội dung...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm w-full outline-none bg-transparent max-w-none prose-p:my-0 prose-ul:my-0 prose-li:my-0 ${editorClassName || 'text-gray-700'}`,
      },
    },
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Track which editor was last focused
  useEffect(() => {
    if (!editor) return;

    const setAsActive = () => {
      globalLastActiveEditor = editor;
    };

    editor.on('focus', setAsActive);
    
    return () => {
      editor.off('focus', setAsActive);
      if (globalLastActiveEditor === editor) {
        globalLastActiveEditor = null;
      }
    };
  }, [editor]);

  // Listen for global formatting events
  useEffect(() => {
    if (!editor) return;

    const handleFormat = (e: any) => {
      // Only apply if this editor instance was the last one active/focused
      if (globalLastActiveEditor !== editor) return;

      const { type, value: formatValue } = e.detail;

      switch (type) {
        case 'bold':
          editor.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor.chain().focus().toggleItalic().run();
          break;
        case 'color':
          editor.chain().focus().setColor(formatValue).run();
          break;
        case 'fontSize':
          editor.chain().focus().setFontSize(formatValue).run();
          break;
        default:
          break;
      }
    };

    window.addEventListener('tiptap-format', handleFormat);
    return () => window.removeEventListener('tiptap-format', handleFormat);
  }, [editor]);

  if (!editor) {
    return <div className="p-4 text-gray-400 text-xs italic">Đang khởi tạo...</div>; 
  }

  return (
    <div style={style} className={`tiptap-wrapper resize-y overflow-hidden min-h-[20px] flex flex-col ${className || ''}`}>
      <div className="flex-1 cursor-text flex flex-col">
          <EditorContent editor={editor} />
      </div>
    </div>
  );
};
