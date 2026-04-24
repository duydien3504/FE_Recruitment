import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useCvStore } from '../../store/cvStore';
import { SortableCVBlock } from './SortableCVBlock';
import { AiAssistantModal } from './AiAssistantModal';
import { TiptapEditor } from './TiptapEditor';

// ─── Layout Presets theo templateId ──────────────────────────────────────────
// Mỗi template có bộ thuộc tính visual riêng — không chỉ màu mà còn cả bố cục.
interface TemplateLayoutPreset {
  /** Kiểu bố cục tổng thể */
  layoutStyle: 'standard' | 'hero-top' | 'right-sidebar';
  /** Màu nền sidebar */
  sidebarBg: string;
  /** Độ rộng sidebar (mm) */
  sidebarWidth: string;
  /** Màu nền cột chính */
  mainBg: string;
  /** Padding cột chính */
  mainPadding: string;
  /** Style tiêu đề section */
  sectionHeaderStyle: 'modern' | 'hero' | 'pill' | 'none' | 'icon-circle' | 'underline';
}

const TEMPLATE_LAYOUT_PRESETS: Record<string, TemplateLayoutPreset> = {
  // IT — Dark terminal/GitHub style
  'modern_it_01': {
    layoutStyle: 'standard',
    sidebarBg: '#161b22',
    sidebarWidth: '95mm',
    mainBg: '#ffffff',
    mainPadding: 'p-10',
    sectionHeaderStyle: 'underline',
  },
  // Marketing — Hero banner style (Thumbnail có banner vàng ở đầu)
  'creative_marketing_01': {
    layoutStyle: 'hero-top',
    sidebarBg: '#fffbf0',
    sidebarWidth: '85mm',
    mainBg: '#ffffff',
    mainPadding: 'p-8',
    sectionHeaderStyle: 'hero',
  },
  // Business — Right sidebar style
  'elegant_business_01': {
    layoutStyle: 'right-sidebar',
    sidebarBg: '#f8fafc',
    sidebarWidth: '90mm',
    mainBg: '#ffffff',
    mainPadding: 'p-10',
    sectionHeaderStyle: 'pill',
  },
  // Social — Warm friendly pastel
  'minimal_it_02': {
    layoutStyle: 'standard',
    sidebarBg: '#faf5ff',
    sidebarWidth: '85mm',
    mainBg: '#ffffff',
    mainPadding: 'p-10',
    sectionHeaderStyle: 'pill',
  },
};

const DEFAULT_PRESET: TemplateLayoutPreset = {
  layoutStyle: 'standard',
  sidebarBg: '#2d3e50',
  sidebarWidth: '95mm',
  mainBg: '#ffffff',
  mainPadding: 'p-12',
  sectionHeaderStyle: 'icon-circle',
};

const MainCanvas: React.FC = () => {
  const { cvData, updateSection, themeConfig, columnLayout, setColumnLayout, templateId } = useCvStore();
  
  // Resolve layout preset dựa theo templateId hiện tại
  const preset: TemplateLayoutPreset = TEMPLATE_LAYOUT_PRESETS[templateId] ?? DEFAULT_PRESET;
  const [zoom, setZoom] = React.useState(100);

  const [aiModalConfig, setAiModalConfig] = React.useState({
    isOpen: false,
    section: '',
    id: '',
    currentText: ''
  });

  const SECTION_CONFIGS: Record<string, { label: string; icon: any }> = {
    profile: { label: 'Ảnh & Họ tên', icon: null },
    contact: { label: 'Liên hệ', icon: null },
    about: { label: 'Mục tiêu', icon: null },
    skills: { label: 'Kỹ năng', icon: null },
    education: { label: 'Học vấn', icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></> },
    experience: { label: 'Kinh nghiệm', icon: <><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></> },
    projects: { label: 'Dự án', icon: <path d="m8 3 4 8 5-5 5 15H2L8 3z"/> },
    awards: { label: 'Giải thưởng', icon: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></> }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const findContainer = (id: string) => {
    if (id in columnLayout) return id;
    return Object.keys(columnLayout).find((key) => (columnLayout as any)[key].includes(id));
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string) || overId as string;

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const activeItems = (columnLayout as any)[activeContainer];
    const overItems = (columnLayout as any)[overContainer];

    const overIndex = overItems.indexOf(overId as string);

    let newIndex;
    if (overId in columnLayout) {
      newIndex = overItems.length + 1;
    } else {
      const isBelowLastItem = overId && overIndex === overItems.length - 1;
      const modifier = isBelowLastItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
    }

    setColumnLayout({
      ...columnLayout,
      [activeContainer]: activeItems.filter((item: string) => item !== active.id),
      [overContainer]: [
        ...overItems.slice(0, newIndex),
        active.id,
        ...overItems.slice(newIndex)
      ]
    } as any);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || overId;

    if (activeContainer && overContainer && activeContainer === overContainer) {
       const activeIndex = (columnLayout as any)[activeContainer].indexOf(activeId);
       const overIndex = (columnLayout as any)[overContainer].indexOf(overId);

       if (activeIndex !== overIndex) {
          setColumnLayout({
             ...columnLayout,
             [overContainer]: arrayMove((columnLayout as any)[overContainer], activeIndex, overIndex)
          } as any);
       }
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    const newLayout = {
      left: columnLayout.left.filter(id => id !== sectionId),
      right: columnLayout.right.filter(id => id !== sectionId)
    };
    setColumnLayout(newLayout);
  };

  const updateItem = (id: string, section: string, field: string, value: string) => {
     const list = Array.from(cvData[section] || []);
     const newList = list.map((item: any) => 
       item.id === id ? { ...item, [field]: value } : item
     );
     updateSection(section, newList);
  };


  const skillsHtml = typeof cvData.skills === 'string' 
     ? cvData.skills 
     : (Array.isArray(cvData.skills) && cvData.skills.length > 0 
          ? `<ul>${cvData.skills.map((s: any) => `<li>${s.name || s}</li>`).join('')}</ul>` 
          : '');

  const getBaseFontSize = () => {
    switch(themeConfig.fontSize) {
      case 'small': return 12;
      case 'large': return 16;
      case 'extra-large': return 18;
      default: return 14;
    }
  };

  const dynamicFontSize = (getBaseFontSize() * zoom) / 100;

  const renderSection = (sectionId: string, isDark: boolean) => {
    const config = SECTION_CONFIGS[sectionId];
    if (!config) return null;

    if (sectionId === 'profile') {
      return (
        <SortableCVBlock key="profile" id="profile">
          <div className="text-center group/avatar mb-4">
            <div className="w-40 h-40 mx-auto rounded-full border-4 border-white/20 overflow-hidden mb-4 bg-gray-100 flex items-center justify-center relative">
              {cvData.personal?.avatarUrl ? (
                  <img src={cvData.personal.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
            </div>
            <TiptapEditor 
              value={cvData.personal?.fullName || ''} 
              onChange={(val) => updateSection('personal', { ...cvData.personal, fullName: val })}
              editorClassName="text-center text-3xl font-bold uppercase tracking-wide text-white"
              className="min-h-0"
            />
            <TiptapEditor 
              value={cvData.personal?.title || ''} 
              onChange={(val) => updateSection('personal', { ...cvData.personal, title: val })}
              editorClassName="text-center text-sm italic text-gray-300 font-medium text-white"
              className="min-h-0 mt-1"
            />
          </div>
        </SortableCVBlock>
      );
    }

    if (sectionId === 'contact') {
      return (
        <SortableCVBlock key="contact" id="contact" onRemove={handleRemoveSection}>
          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[2px] border-b border-white/10 pb-1 mb-3" style={{ color: themeConfig.primaryColor }}>LIÊN HỆ</h4>
            <div className="space-y-2">
              {[
                { 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  ), 
                  value: cvData.personal?.phoneNumber || '', 
                  field: 'phoneNumber' 
                },
                { 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  ), 
                  value: cvData.personal?.email || '', 
                  field: 'email' 
                },
                { 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  ), 
                  value: cvData.personal?.address || '', 
                  field: 'address' 
                },
              ].map((info, idx) => (
                <div key={idx} className="flex items-start space-x-2 group">
                  <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded bg-white/10 text-white mt-0.5" style={{ color: themeConfig.primaryColor }}>{info.icon}</span>
                  <div className="flex-1 min-h-0">
                    <TiptapEditor 
                      value={info.value}
                      onChange={(val) => updateSection('personal', { ...cvData.personal, [info.field]: val })}
                      editorClassName="text-white text-[10px] leading-tight"
                      className="min-h-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SortableCVBlock>
      );
    }

    if (sectionId === 'about') {
      return (
        <SortableCVBlock key="about" id="about" onRemove={handleRemoveSection}>
          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[2px] border-b border-white/10 pb-1 mb-3" style={{ color: themeConfig.primaryColor }}>MỤC TIÊU NGHỀ NGHIỆP</h4>
            <TiptapEditor 
              value={cvData.about || ''}
              onChange={(val) => updateSection('about', val)}
              className="min-h-[40px]"
              editorClassName="text-white opacity-90 italic text-[10px] leading-relaxed"
            />
          </div>
        </SortableCVBlock>
      );
    }

    if (sectionId === 'skills') {
      return (
        <SortableCVBlock key="skills" id="skills" onRemove={handleRemoveSection}>
          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[2px] border-b border-white/10 pb-1 mb-3" style={{ color: themeConfig.primaryColor }}>KỸ NĂNG</h4>
            <TiptapEditor 
                value={skillsHtml}
                onChange={(val) => updateSection('skills', val)}
                className="min-h-[60px]"
                editorClassName="text-white opacity-90 text-[10px]"
            />
          </div>
        </SortableCVBlock>
      );
    }

    // Dynamic Sections (Education, Experience, etc.)
    const items = cvData[sectionId] || [];
    // Sidebar sáng (Marketing/IT Minimal) dùng chữ đen
    const isSidebarLight = preset.sidebarBg.startsWith('#e') || preset.sidebarBg.startsWith('#f');
    const textColor = isDark ? (isSidebarLight ? 'text-gray-800' : 'text-white') : 'text-gray-800';
    const subTextColor = isDark ? (isSidebarLight ? 'text-gray-500' : 'text-gray-300') : 'text-gray-500';

    // ─── Section Header theo preset.sectionHeaderStyle ───────────────────────
    const renderSectionHeader = () => {
      const labelValue = cvData.customLabels?.[sectionId] || config.label;
      const onLabelChange = (val: string) => {
        const customLabels = cvData.customLabels || {};
        updateSection('customLabels', { ...customLabels, [sectionId]: val });
      };

      if (isDark) {
        // Sidebar luôn dùng style compact chữ nhỏ
        return (
          <div className="flex items-center space-x-4 mb-4">
            <TiptapEditor
              value={labelValue}
              onChange={onLabelChange}
              editorClassName={`text-[10px] font-bold uppercase tracking-[2px] border-b pb-1 w-full ${
                isSidebarLight ? 'border-gray-300 text-gray-700' : 'border-white/10'
              }`}
              className="min-h-0 flex-1"
              style={{ color: themeConfig.primaryColor }}
            />
          </div>
        );
      }

      // Cột phải — render theo sectionHeaderStyle
      switch (preset.sectionHeaderStyle) {
        case 'hero':
          return (
            <div className="flex items-center mb-6 pl-4 border-l-4" style={{ borderColor: themeConfig.primaryColor }}>
              <TiptapEditor
                value={labelValue}
                onChange={onLabelChange}
                editorClassName="text-xl font-black uppercase tracking-[3px] text-slate-800"
                className="min-h-0 flex-1"
              />
            </div>
          );
        case 'underline':
          return (
            <div className="flex items-center mb-4 border-b-2 pb-2" style={{ borderColor: themeConfig.primaryColor }}>
               <span className="text-primary font-mono mr-2">//</span>
               <TiptapEditor
                value={labelValue}
                onChange={onLabelChange}
                editorClassName="text-base font-bold uppercase tracking-wider text-slate-700 font-mono"
                className="min-h-0 flex-1"
              />
            </div>
          );
        case 'pill':
          return (
            <div className="flex items-center mb-6">
              <div className="px-4 py-1.5 rounded-lg text-white text-xs font-bold mr-4 shadow-sm" style={{ backgroundColor: themeConfig.primaryColor }}>
                {(cvData.customLabels?.[sectionId] || config.label).toUpperCase()}
              </div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          );
        default: // 'icon-circle'
          return (
            <div className="flex items-center space-x-4 mb-6">
              {config.icon && (
                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-md rotate-3 group-hover:rotate-0 transition-transform" style={{ backgroundColor: themeConfig.primaryColor }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{config.icon}</svg>
                </div>
              )}
              <TiptapEditor
                value={labelValue}
                onChange={onLabelChange}
                editorClassName="text-xl font-extrabold uppercase tracking-tight text-slate-800"
                className="min-h-0 flex-1"
              />
            </div>
          );
      }
    };

    return (
      <SortableCVBlock key={sectionId} id={sectionId} onRemove={handleRemoveSection}>
        <section className={isDark ? 'mb-4' : 'mb-0'}>
          {renderSectionHeader()}
          <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item: any) => (
              <div key={item.id} className={`mb-4 group relative ${isDark ? '' : 'p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100'}`}>
                <div className={`${isDark ? 'flex flex-col' : 'flex justify-between items-start'} mb-1`}>
                  <div className="flex-1 min-w-0">
                    <TiptapEditor 
                      value={item.title || item.school || item.company || ''}
                      onChange={(val) => {
                        const field = sectionId === 'education' ? 'school' : (sectionId === 'experience' ? 'title' : 'title');
                        updateItem(item.id, sectionId, field, val);
                      }}
                      editorClassName={`font-bold ${textColor} ${isDark ? 'text-xs' : 'text-base'}`}
                      className="min-h-0"
                      placeholder="Tiêu đề / Tên đơn vị"
                    />
                    <TiptapEditor 
                      value={item.degree || item.company || ''}
                      onChange={(val) => {
                        const field = sectionId === 'education' ? 'degree' : 'company';
                        updateItem(item.id, sectionId, field, val);
                      }}
                      editorClassName={`${isDark ? 'text-[10px]' : 'text-sm'} ${subTextColor} italic mt-1`}
                      className="min-h-0"
                      placeholder="Vị trí / Ngành học"
                    />
                  </div>
                  <TiptapEditor 
                    value={item.period || ''}
                    onChange={(val) => updateItem(item.id, sectionId, 'period', val)}
                    editorClassName={`${isDark ? 'text-[9px] text-left mt-1' : 'text-xs text-right w-32'} font-semibold text-gray-400`}
                    className="min-h-0"
                    placeholder="Thời gian"
                  />
                </div>
                <div className={`${textColor} relative prose prose-sm max-w-none`}>
                  <TiptapEditor 
                    value={item.description || ''}
                    onChange={(val) => updateItem(item.id, sectionId, 'description', val)}
                    className="min-h-0"
                    editorClassName={`${isDark ? 'text-[10px]' : 'text-sm'} ${isDark ? 'text-white opacity-80' : 'text-gray-600'}`}
                  />
                </div>
              </div>
            ))}
          </SortableContext>
        </section>
      </SortableCVBlock>
    );
  };

  return (
    <div className="flex-1 min-w-[1100px] shrink-0 bg-gray-200 overflow-y-auto flex flex-col items-center py-6 px-4 scroll-smooth relative">
       {/* Zoom Controls */}
       <div className="fixed bottom-10 right-10 z-50 flex flex-col space-y-2 bg-white shadow-xl border border-gray-100 p-2 rounded-2xl">
          <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-gray-600" title="Phóng to">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
          <div className="h-[1px] bg-gray-100 mx-2" />
          <button onClick={handleResetZoom} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-xs font-bold text-primary">
            {zoom}%
          </button>
          <div className="h-[1px] bg-gray-100 mx-2" />
          <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors text-gray-600" title="Thu nhỏ">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
          </button>
       </div>

       {/* Bản CV Chính */}
       <div 
         id="cv-paper"
         className={`bg-white shadow-2xl relative html-to-pdf-target transition-all duration-300 overflow-hidden origin-top`}
         style={{ 
           width: '270mm', 
           minHeight: '297mm',
           fontFamily: themeConfig.fontFamily,
           lineHeight: themeConfig.lineSpacing,
           letterSpacing: `${themeConfig.charSpacing}px`,
           transform: `scale(${zoom / 100})`,
           marginBottom: `${(zoom - 100) * 3}px`,
           fontSize: `${dynamicFontSize}px`
         }}
       >
          <DndContext 
            collisionDetection={closestCenter} 
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className={`flex flex-col min-h-[297mm]`}>
               
               {/* 1. HERO TOP SECTION (Chỉ hiện nếu layoutStyle là hero-top) */}
               {preset.layoutStyle === 'hero-top' && (
                 <div className="w-full p-10 flex items-center space-x-10" style={{ backgroundColor: themeConfig.primaryColor }}>
                    <div className="w-40 h-40 shrink-0 rounded-full border-8 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                       {cvData.personal?.avatarUrl ? (
                           <img src={cvData.personal.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                       )}
                    </div>
                    <div className="flex-1">
                       <TiptapEditor 
                          value={cvData.personal?.fullName || ''} 
                          onChange={(val) => updateSection('personal', { ...cvData.personal, fullName: val })}
                          editorClassName="text-5xl font-black uppercase text-white tracking-widest"
                          className="min-h-0"
                       />
                       <TiptapEditor 
                          value={cvData.personal?.title || ''} 
                          onChange={(val) => updateSection('personal', { ...cvData.personal, title: val })}
                          editorClassName="text-xl font-medium text-white/80 mt-2 uppercase tracking-[4px]"
                          className="min-h-0"
                       />
                    </div>
                 </div>
               )}

               <div className={`flex flex-1 ${preset.layoutStyle === 'right-sidebar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* SIDEBAR COL */}
                  <div 
                    className="flex-shrink-0 p-8 transition-colors duration-500"
                    style={{ 
                      backgroundColor: preset.sidebarBg,
                      width: preset.sidebarWidth,
                      color: (preset.sidebarBg.startsWith('#e') || preset.sidebarBg.startsWith('#f')) ? '#1a1a1a' : '#ffffff'
                    }}
                  >
                     <SortableContext items={columnLayout.left} strategy={verticalListSortingStrategy}>
                        {columnLayout.left.map((sectionId) => {
                          // Nếu ở mode Hero-top, bỏ qua block Profile vì đã render ở banner
                          if (preset.layoutStyle === 'hero-top' && sectionId === 'profile') return null;
                          return renderSection(sectionId, true);
                        })}
                        {columnLayout.left.length === 0 && <div className="h-40 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-xs text-center border-spacing-4">Cột Sidebar</div>}
                     </SortableContext>
                  </div>

                  {/* MAIN CONTENT COL */}
                  <div className={`flex-1 ${preset.mainPadding} space-y-10 transition-colors duration-500`} style={{ backgroundColor: preset.mainBg }}>
                     <SortableContext items={columnLayout.right} strategy={verticalListSortingStrategy}>
                        {columnLayout.right.map((sectionId) => renderSection(sectionId, false))}
                        {columnLayout.right.length === 0 && <div className="h-40 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-xs text-center border-spacing-4">Cột Chính Nội Dung</div>}
                     </SortableContext>
                  </div>
               </div>
            </div>
          </DndContext>
       </div>

       <AiAssistantModal 
          isOpen={aiModalConfig.isOpen}
          section={aiModalConfig.section}
          currentText={aiModalConfig.currentText}
          onClose={() => setAiModalConfig(prev => ({ ...prev, isOpen: false }))}
          onAppend={(text) => {
             const sectionId = aiModalConfig.section === 'Kinh nghiệm' ? 'experience' : 'education';
             const list = Array.from(cvData[sectionId] || []);
             const idx = list.findIndex((i: any) => i.id === aiModalConfig.id);
             if (idx > -1) {
                const current = list[idx].description || '';
                list[idx].description = current + `<p>${text}</p>`;
                updateSection(sectionId, list);
             }
          }}
       />
    </div>
  );
};

export default MainCanvas;
