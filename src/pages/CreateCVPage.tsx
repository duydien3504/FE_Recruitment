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

// ─── CV Preview Modal ──────────────────────────────────────────────────────────
const PreviewModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cvData, themeConfig, columnLayout } = useCvStore();

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

  const html = (s: string) => ({ __html: s || '' });

  const skillsHtml = typeof cvData.skills === 'string'
    ? cvData.skills
    : Array.isArray(cvData.skills) && cvData.skills.length > 0
      ? cvData.skills.map((s: any) => `<span style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:4px;padding:2px 8px;margin:2px;font-size:9px">${s.name || s}</span>`).join('')
      : '<span style="opacity:0.3;font-size:10px">Chưa có kỹ năng</span>';

  const sectionLabels: Record<string, string> = {
    education: 'HỌC VẤN', experience: 'KINH NGHIỆM',
    projects: 'DỰ ÁN', awards: 'GIẢI THƯỞNG'
  };

  const renderSection = (sectionId: string, isDark: boolean) => {
    const pri = themeConfig.primaryColor;

    if (sectionId === 'profile') return (
      <div key="profile" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 12px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: `3px solid ${pri}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cvData.personal?.avatarUrl
            ? <img src={cvData.personal.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          }
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}
          dangerouslySetInnerHTML={html(cvData.personal?.fullName || '<span style="opacity:0.3">Chưa có tên</span>')} />
        <p style={{ fontSize: 10, color: pri, fontStyle: 'italic', margin: 0 }}
          dangerouslySetInnerHTML={html(cvData.personal?.title || '')} />
      </div>
    );

    if (sectionId === 'contact') return (
      <div key="contact" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: pri, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 10 }}>LIÊN HỆ</p>
        {[
          { v: cvData.personal?.phoneNumber, icon: '📞' },
          { v: cvData.personal?.email, icon: '✉️' },
          { v: cvData.personal?.address, icon: '📍' },
        ].filter(i => i.v).map((i, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 9, lineHeight: 1.6 }}>{i.icon}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{i.v}</span>
          </div>
        ))}
      </div>
    );

    if (sectionId === 'about') return (
      <div key="about" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: pri, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 8 }}>MỤC TIÊU</p>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontStyle: 'italic' }}
          dangerouslySetInnerHTML={html(cvData.about || '<span style="opacity:0.3">Chưa có nội dung</span>')} />
      </div>
    );

    if (sectionId === 'skills') return (
      <div key="skills" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: pri, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 8 }}>KỸ NĂNG</p>
        <div dangerouslySetInnerHTML={html(skillsHtml)} />
      </div>
    );

    const items: any[] = cvData[sectionId] || [];
    const labelRaw = cvData.customLabels?.[sectionId] || sectionLabels[sectionId] || sectionId.toUpperCase();

    return (
      <div key={sectionId} style={{ marginBottom: isDark ? 18 : 28 }}>
        {isDark ? (
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: pri, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4, marginBottom: 10 }}
            dangerouslySetInnerHTML={html(labelRaw)} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: pri, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z"/><path d="M7 7h.01"/></svg>
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#1e293b', margin: 0 }}
              dangerouslySetInnerHTML={html(labelRaw)} />
          </div>
        )}
        {items.length === 0
          ? <p style={{ fontSize: 9, opacity: 0.25, fontStyle: 'italic', color: isDark ? '#fff' : '#000' }}>Chưa có dữ liệu</p>
          : items.map((item: any) => (
            <div key={item.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isDark ? 10 : 12, fontWeight: 700, color: isDark ? '#fff' : '#1e293b' }}
                    dangerouslySetInnerHTML={html(item.title || item.school || '')} />
                  <div style={{ fontSize: isDark ? 8 : 10, fontStyle: 'italic', color: isDark ? pri : '#64748b', marginTop: 2 }}
                    dangerouslySetInnerHTML={html(item.degree || item.company || '')} />
                </div>
                {item.period && <div style={{ fontSize: 8, color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8', flexShrink: 0 }}>{item.period}</div>}
              </div>
              {item.description && (
                <div style={{ fontSize: isDark ? 8 : 10, color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', marginTop: 5, lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={html(item.description)} />
              )}
            </div>
          ))
        }
      </div>
    );
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
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

      {/* Scrollable CV area */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px 48px' }}>
        {/* CV Paper — fixed A4 width, auto-scale via transform */}
        <div
          style={{
            width: 794,    /* 210mm ≈ 794px at 96dpi */
            minHeight: 1123, /* 297mm ≈ 1123px */
            background: '#fff',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            borderRadius: 2,
            fontFamily: `'${themeConfig.fontFamily}', sans-serif`,
            display: 'flex',
            overflow: 'hidden',
            transformOrigin: 'top center',
            transform: 'scale(0.75)',
            marginBottom: -280,  /* compensate scale shrinkage */
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cột Trái (Dark Sidebar) */}
          <div style={{ width: 270, flexShrink: 0, background: '#2d3e50', color: '#fff', padding: '28px 18px', overflowY: 'auto' }}>
            {columnLayout.left.map((sid: string) => renderSection(sid, true))}
          </div>

          {/* Cột Phải (Main Content) */}
          <div style={{ flex: 1, padding: '32px 24px', background: '#fff', overflowY: 'auto' }}>
            {columnLayout.right.map((sid: string) => renderSection(sid, false))}
          </div>
        </div>
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

  useEffect(() => {
    console.log('✅ Chúc mừng! CV Store đã khởi tạo thành công.');
    console.log('📦 Current State Injection:', { cvData, themeConfig, atsScore, columnLayout });
  }, [cvData, themeConfig, atsScore, columnLayout]);

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

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const resolved = await resolveCvTemplateIdForSave(templateId);
      setTemplateId(resolved);
      const response = await CvService.exportCv({
        cvData,
        themeConfig,
        columnLayout,
        templateId: resolved
      });
      const downloadUrl = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'StitchRecruit_CV_Export.pdf'); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch(err) {
      console.error("Lỗi xuất PDF:", err);
      toast.error("Lỗi xuất PDF. Vui lòng kiểm tra lại dịch vụ Backend.");
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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
         </div>
         <h2 className="text-2xl font-bold text-slate-800 mb-4">Trình tạo CV chỉ hỗ trợ trên Desktop</h2>
         <p className="text-slate-500 max-w-xs leading-relaxed">
            Để đảm bảo trải nghiệm thiết kế tốt nhất và độ chính xác của định dạng PDF, vui lòng truy cập trang này bằng máy tính (màn hình rộng trên 1024px).
         </p>
         <Link to="/resumes" className="mt-8 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg">
            Quay lại Quản lý CV
         </Link>
      </div>

      <div className="hidden lg:block">
        {/* Sub-header cho CV Builder */}
        <div className="fixed top-20 left-0 w-full bg-white z-40 border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
           <div className="flex items-center space-x-4">
              <Link to="/resumes" className="text-gray-400 hover:text-gray-600 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </Link>
              <div className="flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                 <input 
                   type="text" 
                   defaultValue="CV chưa đặt tên" 
                   className="font-bold text-slate-700 bg-transparent border-0 focus:ring-0 p-0 outline-none w-48"
                 />
                 <button className="text-gray-300 hover:text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              </div>
           </div>
           
           <div className="flex items-center space-x-3">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                 )}
                 <span>Tải xuống PDF</span>
              </button>

              {/* Xem trước — đã có onClick */}
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
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
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                 )}
                 <span>{isSaving ? 'Đang lưu...' : 'Lưu CV'}</span>
              </button>
           </div>
        </div>
        
        <main className="pt-36 flex p-4 shadow-inner min-h-[calc(100vh-80px)] overflow-x-auto"
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
