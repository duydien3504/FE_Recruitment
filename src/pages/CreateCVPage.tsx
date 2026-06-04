import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvStore } from '../store/cvStore';
import type { ColumnLayout, CvData, ThemeConfig } from '../store/cvStore';
import Header from '../components/Header';
import LeftSidebar from '../components/CVBuilder/LeftSidebar';
import MainCanvas from '../components/CVBuilder/MainCanvas';
import { CV_BUILDER_FETCH_DRAFT_ON_MOUNT } from '../constants/cvBuilderFlags';
import { DEFAULT_CV_TEMPLATE_ID } from '../constants/cvTemplateDefaults';
import {
  CvService,
  formatCvApiError,
  matchOrFirstTemplateId,
  pickTemplateIdFromDraftData,
  resolveCvTemplateIdForSave
} from '../services/cv.service';
import { toast } from 'sonner';
import { downloadBlob } from '../utils/downloadBlob';

// ─── CV Preview Modal — render MainCanvas previewMode (y hệt canvas, chỉ đọc) ──
const PreviewModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          Xem trước CV — Chỉ đọc
        </div>
        <button
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          ✕ Đóng <span style={{ opacity: 0.5, fontSize: 10 }}>Esc</span>
        </button>
      </div>

      {/* CV Canvas — render y hệt main canvas, chỉ đọc (pointer-events: none trong previewMode) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <MainCanvas previewMode />
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const CreateCVPage: React.FC = () => {
  const {
    cvData,
    themeConfig,
    atsScore,
    columnLayout,
    templateId,
    setCvData,
    setTemplateId,
    updateTheme,
    setAtsScore,
    setColumnLayout
  } = useCvStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    console.log('✅ Chúc mừng! CV Store đã khởi tạo thành công.');
    console.log('📦 Current State Injection:', { cvData, themeConfig, atsScore, columnLayout });
  }, [cvData, themeConfig, atsScore, columnLayout]);

  // Load Google Fonts khi fontFamily thay đổi
  useEffect(() => {
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
    const font = themeConfig.fontFamily;
    const slug = GOOGLE_FONTS[font];
    if (!slug) return;
    const id = `gfont-${font.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
    document.head.appendChild(link);
  }, [themeConfig.fontFamily]);

  // Tải template id + (tuỳ chọn) bản nháp. GET /cv-builder mặc định tắt — xem cvBuilderFlags.ts
  useEffect(() => {
    let cancelled = false;

    const loadDraftAndTemplate = async () => {
      let row: Record<string, unknown> | null = null;

      if (CV_BUILDER_FETCH_DRAFT_ON_MOUNT) {
        try {
          const draft = await CvService.getDraft();
          if (cancelled) return;
          if (draft && typeof draft === 'object') {
            const d = draft as { success?: boolean; data?: unknown };
            if (d.success && d.data && typeof d.data === 'object') {
              row = d.data as Record<string, unknown>;
            } else if (d.data && typeof d.data === 'object') {
              row = d.data as Record<string, unknown>;
            }
          }
        } catch (e) {
          console.warn('[CV Builder] Không đọc được bản nháp (GET /cv-builder).', e);
        }
      }

      if (cancelled) return;

      const tidFromDraft = row ? pickTemplateIdFromDraftData(row) : null;
      if (row) {
        if (row.cvData) setCvData(row.cvData as CvData);
        if (row.themeConfig) updateTheme(row.themeConfig as Partial<ThemeConfig>);
        if (row.atsScore !== undefined) setAtsScore(Number(row.atsScore));
        if (row.columnLayout) setColumnLayout(row.columnLayout as ColumnLayout);
      }

      try {
        const tplRes = await CvService.getTemplates();
        if (cancelled) return;
        const chosen =
          matchOrFirstTemplateId(tidFromDraft ?? undefined, tplRes) ??
          matchOrFirstTemplateId(tidFromDraft ?? undefined, (tplRes as { data?: unknown })?.data);
        setTemplateId(chosen ?? DEFAULT_CV_TEMPLATE_ID);
      } catch (e) {
        console.error('[CV Builder] Không tải được danh sách mẫu (GET /cv-builder/templates):', e);
      }
    };

    void loadDraftAndTemplate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi mount
  }, []);

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    try {
      const res = await CvService.autoFillProfile();
      if (res.success && res.data) {
        setCvData({ ...cvData, ...res.data });
        toast.success('Đã đồng bộ hồ sơ thành công!', { description: 'Thông tin từ hồ sơ đã được điền vào CV.' });
      }
    } catch (error) {
      console.error('Lỗi đồng bộ:', error);
      toast.error('Không thể đồng bộ hồ sơ');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const resolved = await resolveCvTemplateIdForSave(templateId);
      await CvService.updateDraft({
        cvData,
        themeConfig,
        templateId: resolved,
        columnLayout,
      });
      const blob = await CvService.exportCv({
        cvData,
        themeConfig,
        templateId: resolved,
        columnLayout,
      });
      downloadBlob(blob, 'StitchRecruit_CV_Export.pdf');
      toast.success('Đã tải xuống PDF.');
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      toast.error(formatCvApiError(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const resolved = await resolveCvTemplateIdForSave(templateId);
      setTemplateId(resolved);
      await CvService.updateDraft({
        cvData,
        themeConfig,
        templateId: resolved,
        columnLayout
      });

      // Script hiển thị khi lưu CV thành công
      toast.success("Đã lưu CV thành công!", {
        description: "Bản nháp của bạn đã được cập nhật.",
        duration: 3000,
      });

    } catch (err) {
      console.error("Lỗi khi lưu CV:", err);
      const errorMessage = formatCvApiError(err);

      if (errorMessage.includes("fk_cv_builders_template_id")) {
        toast.error("Lỗi dữ liệu hệ thống (Template ID)", {
          description: "Template ID không tồn tại trong DB. Hãy yêu cầu Backend seed dữ liệu bảng cv_templates.",
          duration: 5000,
        });
      } else {
        toast.error("Có lỗi khi lưu CV", {
          description: errorMessage,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-charcoal antialiased overflow-x-hidden">
      <Header />

      {/* Preview Modal */}
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} />

      {/* Mobile/Tablet Block Overlay */}
      <div className="lg:hidden fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Trình tạo CV chỉ hỗ trợ trên Desktop</h2>
        <p className="text-slate-500 max-w-xs leading-relaxed">
          Để đảm bảo trải nghiệm thiết kế tốt nhất và độ chính xác của định dạng PDF, vui lòng truy cập trang này bằng máy tính (màn hình rộng trên 1024px).
        </p>
        <Link to="/resumes" className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg">
          Quay lại Quản lý CV
        </Link>
      </div>

      <div className="hidden lg:flex lg:flex-col h-screen overflow-hidden">
        {/* Sub-header cho CV Builder */}
        <div className="fixed top-20 left-0 w-full bg-white z-40 border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <Link to="/resumes" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
              <input
                type="text"
                defaultValue="CV chưa đặt tên"
                className="font-bold text-slate-700 bg-transparent border-0 focus:ring-0 p-0 outline-none w-48"
              />
              <button className="text-gray-300 hover:text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg></button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Đồng bộ hồ sơ */}
            <button
              onClick={handleSyncProfile}
              disabled={isSyncing}
              className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-4 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              title="Điền tự động thông tin từ hồ sơ cá nhân vào CV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSyncing ? 'animate-spin' : ''}>
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ hồ sơ'}</span>
            </button>

            {/* Tải xuống PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-blue-600 px-4 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
              )}
              <span>Tải xuống PDF</span>
            </button>

            {/* Xem trước — đã có onClick */}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              <span>Xem trước</span>
            </button>

            {/* Lưu CV */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-primary hover:bg-blue-600 text-white px-5 py-1.5 rounded-lg font-bold text-sm shadow-sm transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu CV'}</span>
            </button>
          </div>
        </div>

        <main className="flex-1 min-h-0 pt-36 flex p-4 shadow-inner overflow-hidden items-stretch"
          style={{
            '--cv-primary-color': themeConfig.primaryColor,
            '--cv-font-family': themeConfig.fontFamily
          } as React.CSSProperties}
        >
          {/* Component Toolbar Trái mỏng nhẹ cho việc cấu hình CV */}
          <LeftSidebar />

          {/* Component Bản nháp CV thật để user soi (sẽ chiếm trọn không gian còn lại) */}
          <MainCanvas />
        </main>


      </div>
    </div>
  );
};

export default CreateCVPage;
