import React, { useState, useEffect } from 'react';

// ─── Icon definitions ─────────────────────────────────────────────────────────
export const CUSTOM_SECTION_ICONS: Record<string, { emoji: string; label: string; svg: React.ReactNode }> = {
  award:    { emoji: '🏆', label: 'Giải thưởng', svg: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></> },
  star:     { emoji: '⭐', label: 'Nổi bật',     svg: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
  book:     { emoji: '📚', label: 'Học tập',     svg: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></> },
  globe:    { emoji: '🌐', label: 'Quốc tế',    svg: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
  users:    { emoji: '👥', label: 'Hoạt động',  svg: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></> },
  heart:    { emoji: '❤️', label: 'Sở thích',   svg: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></> },
  tool:     { emoji: '🔧', label: 'Công cụ',    svg: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></> },
  zap:      { emoji: '⚡', label: 'Năng lực',   svg: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></> },
  bookmark: { emoji: '🔖', label: 'Khác',       svg: <><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></> },
  default:  { emoji: '📋', label: 'Mặc định',   svg: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, icon: string) => void;
  /** Nếu truyền vào → modal ở chế độ chỉnh sửa */
  editSection?: { title: string; icon: string } | null;
}

const CreateCustomSectionModal: React.FC<Props> = ({ isOpen, onClose, onCreate, editSection }) => {
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('award');

  useEffect(() => {
    if (isOpen) {
      setTitle(editSection?.title ?? '');
      setSelectedIcon(editSection?.icon ?? 'award');
    }
  }, [isOpen, editSection]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed, selectedIcon);
    onClose();
  };

  const isEdit = !!editSection;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                {isEdit ? <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></> : <><path d="M12 5v14"/><path d="M5 12h14"/></>}
              </svg>
            </div>
            <h2 className="text-sm font-bold text-gray-800">{isEdit ? 'Chỉnh sửa mục' : 'Tạo mục tùy chỉnh'}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title input */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Tên mục <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Ví dụ: Chứng chỉ, Sở thích, Giải thưởng..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Chọn icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(CUSTOM_SECTION_ICONS).map(([key, { emoji, label, svg }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedIcon(key)}
                  title={label}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    selectedIcon === key
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={selectedIcon === key ? 'var(--color-primary, #00b14f)' : '#94a3b8'}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    {svg}
                  </svg>
                  <span className={`text-[8px] font-semibold leading-tight text-center ${selectedIcon === key ? 'text-primary' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {title.trim() && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {CUSTOM_SECTION_ICONS[selectedIcon]?.svg}
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700">{title}</p>
                <p className="text-[10px] text-gray-400">Mục tùy chỉnh</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isEdit ? <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></> : <><path d="M12 5v14"/><path d="M5 12h14"/></>}
            </svg>
            {isEdit ? 'Lưu thay đổi' : 'Tạo mục'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomSectionModal;
