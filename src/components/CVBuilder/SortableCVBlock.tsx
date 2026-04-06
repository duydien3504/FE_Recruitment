import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: string;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
}

export const SortableCVBlock: React.FC<Props> = ({ id, children, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/block bg-transparent z-10 transition-all duration-200">
      {/* Nút Grip (Cầm) để kéo thả, chỉ hiện khi hover */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute -left-7 top-4 opacity-0 group-hover/block:opacity-100 cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-blue-500 transition-opacity"
        title="Kéo để đổi vị trí"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
        </svg>
      </div>

      {/* Nút Xóa Block */}
      {onRemove && (
        <button 
          onClick={() => onRemove(id)}
          className="absolute -right-3 -top-3 opacity-0 group-hover/block:opacity-100 bg-white shadow-md rounded-full p-1 text-red-500 hover:bg-red-50 border border-red-100 transition-opacity z-20"
          title="Xóa mục này"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}

      {children}
    </div>
  );
};
