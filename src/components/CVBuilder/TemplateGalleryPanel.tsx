import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CvService, formatCvApiError, resolveCvTemplateIdForSave } from '../../services/cv.service';
import { useCvStore } from '../../store/cvStore';
import type { CvTemplate } from '../../types/cv.types';
import type { ThemeConfig } from '../../store/cvStore';
import {
  parseSamplesResponse,
  mapSampleToCvData,
  mapSampleTheme,
  buildColumnLayoutFromSample,
} from '../../utils/cvSampleUtils';

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

// ─── Google Fonts map ────────────────────────────────────────────────────────
const GOOGLE_FONTS: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700',
  'Roboto': 'Roboto:wght@400;500;700',
  'Montserrat': 'Montserrat:wght@400;500;600;700',
  'Lato': 'Lato:wght@400;700',
  'Merriweather': 'Merriweather:wght@400;700',
  'Playfair Display': 'Playfair+Display:wght@400;600;700',
  'Fira Code': 'Fira+Code:wght@400;500;600',
  'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700',
  'Poppins': 'Poppins:wght@400;500;600;700',
  'DM Sans': 'DM+Sans:wght@400;500;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700',
  'Source Sans 3': 'Source+Sans+3:wght@400;600;700',
  'Work Sans': 'Work+Sans:wght@400;500;600;700',
  'Barlow': 'Barlow:wght@400;500;600;700',
  'Raleway': 'Raleway:wght@400;500;600;700',
  'Nunito': 'Nunito:wght@400;500;600;700',
  'Outfit': 'Outfit:wght@400;500;600;700',
  'Lexend': 'Lexend:wght@400;500;600;700',
  'Josefin Sans': 'Josefin+Sans:wght@400;600;700',
  'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
  'Sora': 'Sora:wght@400;500;600;700',
  'Lora': 'Lora:wght@400;600;700',
  'Source Serif 4': 'Source+Serif+4:wght@400;600;700',
  'EB Garamond': 'EB+Garamond:wght@400;500;600;700',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  'Crimson Text': 'Crimson+Text:wght@400;600;700',
};

/** Inject Google Fonts <link> nếu chưa có */
function loadGoogleFont(fontFamily: string) {
  const slug = GOOGLE_FONTS[fontFamily];
  if (!slug) return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
  document.head.appendChild(link);
}

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

// ─── Confirmation Dialog ─────────────────────────────────────────────────────
interface ConfirmDialogProps {
  templateName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ templateName, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 mx-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-gray-800 text-center mb-2">Điền nội dung mẫu?</h3>
      <p className="text-[11px] text-gray-500 text-center leading-relaxed mb-5">
        CV của bạn đang có nội dung. Dùng mẫu <span className="font-semibold text-gray-700">"{templateName}"</span> sẽ <span className="text-red-500 font-semibold">ghi đè toàn bộ</span> nội dung hiện tại.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
        >
          Huỷ
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          Đồng ý, ghi đè
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const TemplateGalleryPanel: React.FC = () => {
  const { templateId, setTemplateId, updateTheme, setCvData, setColumnLayout, cvData, themeConfig } = useCvStore();

  const [templates, setTemplates] = useState<CvTemplate[]>([]);
  const [filteredList, setFilteredList] = useState<CvTemplate[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [sampleLoadedId, setSampleLoadedId] = useState<string | null>(null);
  const [confirmTemplate, setConfirmTemplate] = useState<CvTemplate | null>(null);

  // ── Load Google Font khi fontFamily thay đổi
  useEffect(() => {
    if (themeConfig.fontFamily) {
      loadGoogleFont(themeConfig.fontFamily);
    }
  }, [themeConfig.fontFamily]);

  // ── Fetch all templates once on mount
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CvService.getTemplates();
      if (res.success && Array.isArray(res.data)) {
        // Deduplicate by template.id in case API returns duplicates
        const seen = new Map<string, CvTemplate>();
        (res.data as CvTemplate[]).forEach((t: CvTemplate) => seen.set(t.id, t));
        const unique = Array.from(seen.values());
        setTemplates(unique);
        setFilteredList(unique);
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

  // ── Chọn template → CHỈ áp dụng templateId + themeConfig, KHÔNG điền cvData
  const handleSelectTemplate = (template: CvTemplate) => {
    setTemplateId(template.id);
    if (template.defaultConfig) {
      updateTheme({
        primaryColor: template.defaultConfig.primaryColor,
        fontFamily: template.defaultConfig.fontFamily,
        ...(template.defaultConfig.layoutMode
          ? { layoutMode: template.defaultConfig.layoutMode }
          : {}),
      });
      // Load Google Font cho font mới
      if (template.defaultConfig.fontFamily) {
        loadGoogleFont(template.defaultConfig.fontFamily);
      }
    }
  };

  // ── Kiểm tra xem user có dữ liệu CV không
  const hasCvData = (): boolean => {
    if (!cvData) return false;
    return Object.values(cvData).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
      return v !== undefined && v !== null && v !== '';
    });
  };

  // ── Bấm "Dùng mẫu này" → gọi /samples để điền cvData
  const handleUseSample = (template: CvTemplate) => {
    if (isApplying) return;
    // Nếu user đang có dữ liệu → hỏi xác nhận trước
    if (hasCvData()) {
      setConfirmTemplate(template);
      return;
    }
    applySample(template);
  };

  // ── Thực sự gọi API /samples và điền cvData
  const applySample = async (template: CvTemplate) => {
    setConfirmTemplate(null);
    setIsApplying(template.id);
    setSampleLoadedId(null);
    try {
      const industry = template.category && template.category !== 'all'
        ? template.category.toLowerCase()
        : undefined;
      const res = await CvService.getSamples(industry);
      const { samples } = parseSamplesResponse(res);

      const sample = samples.find(s => s.templateId === template.id) ?? samples[0];

      if (sample) {
        const existingAvatar = (cvData as { personal?: { avatarUrl?: string } })?.personal?.avatarUrl || '';
        const mergedCvData = mapSampleToCvData(sample, existingAvatar);
        const themePatch = mapSampleTheme(sample.themeConfig);
        const layout = buildColumnLayoutFromSample(sample);

        setCvData(mergedCvData);
        updateTheme(themePatch as Partial<ThemeConfig>);
        setColumnLayout(layout);
        setTemplateId(sample.templateId);

        if (sample.themeConfig?.fontFamily) loadGoogleFont(sample.themeConfig.fontFamily);

        const resolved = await resolveCvTemplateIdForSave(sample.templateId);
        await CvService.updateDraft({
          cvData: mergedCvData,
          themeConfig: { ...themeConfig, ...themePatch },
          templateId: resolved,
          columnLayout: layout,
        });
        setTemplateId(resolved);
        setSampleLoadedId(template.id);
        toast.success('Đã áp dụng mẫu CV và lưu nháp.');
      }
    } catch (sampleErr) {
      console.warn('[TemplateGallery] Không tải được mẫu CV hoàn chỉnh:', sampleErr);
      toast.error(formatCvApiError(sampleErr));
    } finally {
      setTimeout(() => setIsApplying(null), 800);
    }
  };

  const categoryColor = (cat: string) => CATEGORY_COLOR[cat] || '#64748b';
  const selectedTemplate = templates.find(t => t.id === templateId);

  return (
    <div className="flex flex-col h-full min-h-0" id="template-gallery-panel">

      {/* ── Confirmation Dialog ──────────────────────────────────── */}
      {confirmTemplate && (
        <ConfirmDialog
          templateName={confirmTemplate.name}
          onConfirm={() => applySample(confirmTemplate)}
          onCancel={() => setConfirmTemplate(null)}
        />
      )}

      {/* ── Header cố định ───────────────────────────────────────── */}
      <div className="shrink-0">
      <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-blue-700">Click vào mẫu → chỉ đổi màu sắc & font</p>
            <p className="text-[10px] text-blue-500 leading-relaxed">Bấm <span className="font-bold">"Dùng mẫu này"</span> để điền nội dung CV mẫu vào editor.</p>
          </div>
        </div>
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
      </div>

      {/* ── Chỉ danh sách mẫu cuộn ─────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pr-1 -mr-1">
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
        <div className="grid grid-cols-2 gap-3 pb-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Template Grid ─────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-3 pb-4">
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
                  title={`${template.name} — Click để áp dụng giao diện`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <PlaceholderThumbnail name={template.name} color={template.defaultConfig.primaryColor} />
                    )}

                    {/* Hover overlay — chỉ hiện khi hover, chưa chọn */}
                    <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity duration-200 ${hoveredId === template.id ? 'opacity-100' : 'opacity-0'}`}>
                      {/* Nút 1: chỉ đổi giao diện */}
                      <button
                        className="text-white text-[9px] font-semibold px-3 py-1.5 bg-white/20 border border-white/40 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                        onClick={(e) => { e.stopPropagation(); handleSelectTemplate(template); }}
                      >
                        Áp dụng giao diện
                      </button>
                      {/* Nút 2: điền nội dung mẫu */}
                      <button
                        className="text-white text-[9px] font-bold px-3 py-1.5 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleUseSample(template); }}
                      >
                        Dùng mẫu này
                      </button>
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
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-[9px] text-primary font-semibold">Đang tải mẫu...</span>
                      </div>
                    )}

                    {/* Sample loaded badge */}
                    {sampleLoadedId === template.id && !isBeingApplied && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Mẫu hoàn chỉnh
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
      </div>

      {/* ── Footer: mẫu đang dùng + nút "Dùng mẫu này" ──────────── */}
      {selectedTemplate && (
        <div className="shrink-0 pt-3 border-t border-gray-100 space-y-2">
          <p className="text-[10px] text-gray-400">
            Mẫu đang dùng:{' '}
            <span className="font-semibold text-primary">{selectedTemplate.name}</span>
          </p>
          <button
            onClick={() => handleUseSample(selectedTemplate)}
            disabled={!!isApplying}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60"
          >
            {isApplying === selectedTemplate.id ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang tải...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                Dùng mẫu này (điền nội dung)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateGalleryPanel;
