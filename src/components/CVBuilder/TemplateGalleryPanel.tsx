import React, { useEffect, useState, useCallback } from 'react';
import { CvService } from '../../services/cv.service';
import { useCvStore } from '../../store/cvStore';
import type { CvTemplate, TemplateCategory } from '../../types/cv.types';

// ─── Fallback thumbnail (plain colored placeholder) ────────────────────────
const PlaceholderThumbnail: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <div
    className="w-full h-full flex flex-col items-center justify-center rounded-lg"
    style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)` }}
  >
    <div className="w-10 h-12 rounded border-2 mb-2 flex flex-col overflow-hidden" style={{ borderColor: color }}>
      <div className="h-3 w-full" style={{ background: color }} />
      <div className="flex-1 p-1 space-y-0.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-0.5 rounded-full bg-gray-300" style={{ width: `${70 - i * 10}%` }} />
        ))}
      </div>
    </div>
    <span className="text-[9px] font-bold text-gray-500 text-center px-1 leading-tight line-clamp-2">{name}</span>
  </div>
);

// ─── Category tab list ──────────────────────────────────────────────────────
const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'IT', label: 'IT' },
  { id: 'Marketing', label: 'Marketing' },
  { id: 'Business', label: 'Kinh tế' },
  { id: 'Social', label: 'Social' },
  { id: 'Finance', label: 'Finance' },
  { id: 'Design', label: 'Design' },
  { id: 'General', label: 'Chung' },
];

// ─── Category badge colour map ──────────────────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  IT: '#6366f1',
  Marketing: '#f59e0b',
  Business: '#0ea5e9',
  Social: '#7c3aed',
  Finance: '#10b981',
  Design: '#ec4899',
  Education: '#8b5cf6',
  Healthcare: '#ef4444',
  General: '#64748b',
};

// ─── Skeleton card ──────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
    <div className="aspect-[3/4] bg-gray-100" />
    <div className="p-2 space-y-1.5">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const TemplateGalleryPanel: React.FC = () => {
  const { templateId, setTemplateId, updateTheme } = useCvStore();

  const [templates, setTemplates] = useState<CvTemplate[]>([]);
  const [filteredList, setFilteredList] = useState<CvTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  // ── Fetch all templates once on mount
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CvService.getTemplates(); // no category → get all active
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
        setFilteredList(res.data);
      }
    } catch (err: any) {
      console.error('[TemplateGallery] Fetch error:', err);
      setError('Không thể tải danh sách mẫu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ── Client-side filter (avoids extra API calls per tab click)
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredList(templates);
    } else {
      setFilteredList(templates.filter(t => t.category === activeCategory));
    }
  }, [activeCategory, templates]);

  // ── Apply template selection
  const handleSelectTemplate = async (template: CvTemplate) => {
    if (isApplying) return;
    setIsApplying(template.id);
    try {
      // 1. Update store with new templateId
      setTemplateId(template.id);
      // 2. Apply defaultConfig to themeConfig (primaryColor + fontFamily)
      if (template.defaultConfig) {
        updateTheme({
          primaryColor: template.defaultConfig.primaryColor,
          fontFamily: template.defaultConfig.fontFamily,
          ...(template.defaultConfig.layoutMode
            ? { layoutMode: template.defaultConfig.layoutMode }
            : {}),
        });
      }
    } finally {
      // Small delay gives user visual feedback
      setTimeout(() => setIsApplying(null), 600);
    }
  };

  const categoryColor = (cat: string) => CATEGORY_COLOR[cat] || '#64748b';

  return (
    <div className="flex flex-col h-full" id="template-gallery-panel">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-4">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Chọn một mẫu CV phù hợp với ngành nghề của bạn.<br />
          Màu chủ đề và font sẽ được cập nhật tự động.
        </p>
      </div>

      {/* ── Category Filter Tabs ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            id={`template-tab-${tab.id}`}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${activeCategory === tab.id
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40 hover:text-primary'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Template Count ─────────────────────────────────────────── */}
      {!isLoading && !error && (
        <p className="text-[10px] text-gray-400 mb-3">
          {filteredList.length} mẫu {activeCategory !== 'all' ? `ngành ${activeCategory}` : 'tất cả ngành'}
        </p>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={fetchTemplates}
            className="text-xs text-primary underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Loading skeletons ─────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Template Grid ─────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 flex-1">
          {filteredList.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-xs text-gray-400">Chưa có mẫu CV cho ngành này.</p>
            </div>
          ) : (
            filteredList.map(template => {
              const isSelected = templateId === template.id;
              const isBeingApplied = isApplying === template.id;
              const catColor = categoryColor(template.category);

              return (
                <div
                  key={template.id}
                  id={`template-card-${template.id}`}
                  className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 bg-white group shadow-sm hover:shadow-md ${isSelected
                      ? 'border-primary shadow-primary/20 shadow-md'
                      : 'border-gray-100 hover:border-primary/50'
                    }`}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelectTemplate(template)}
                  title={template.name}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.classList.add('placeholder-active');
                          }
                        }}
                      />
                    ) : (
                      <PlaceholderThumbnail name={template.name} color={template.defaultConfig.primaryColor} />
                    )}

                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${hoveredId === template.id && !isSelected ? 'opacity-100' : 'opacity-0'
                      }`}>
                      <span className="text-white text-[10px] font-bold px-3 py-1.5 bg-primary rounded-full shadow-lg">
                        Dùng mẫu này
                      </span>
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}

                    {/* Applying spinner */}
                    {isBeingApplied && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-gray-700 truncate leading-tight">{template.name}</p>
                    <span
                      className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                      style={{ background: catColor + '22', color: catColor }}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Currently selected info ───────────────────────────────── */}
      {templateId && templateId !== 'default_template' && (
        <div className="mt-auto pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">
            Mẫu đang dùng:{' '}
            <span className="font-semibold text-primary">
              {templates.find(t => t.id === templateId)?.name ?? templateId}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateGalleryPanel;
