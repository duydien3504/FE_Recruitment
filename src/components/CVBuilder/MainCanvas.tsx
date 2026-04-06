import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useCvStore } from '../../store/cvStore';
import { SortableCVBlock } from './SortableCVBlock';
import { AiAssistantModal } from './AiAssistantModal';
import { TiptapEditor } from './TiptapEditor';

const MainCanvas: React.FC = () => {
  const { cvData, updateSection, themeConfig } = useCvStore();
  const [zoom, setZoom] = React.useState(100);
  
  const [aiModalConfig, setAiModalConfig] = React.useState({
    isOpen: false,
    section: '',
    id: '',
    currentText: ''
  });

  // Zoom helpers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  // Section configuration for rendering
  const sections = [
    { id: 'education', label: 'Học vấn', icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></> },
    { id: 'experience', label: 'Kinh nghiệm làm việc', icon: <><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></> },
    { id: 'projects', label: 'Dự án', icon: <path d="m8 3 4 8 5-5 5 15H2L8 3z"/> },
    { id: 'awards', label: 'Giải thưởng', icon: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></> }
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which section this ID belongs to
    for (const section of sections) {
       const list = cvData[section.id] || [];
       if (list.some((item: any) => item.id === active.id)) {
          const oldIndex = list.findIndex((item: any) => item.id === active.id);
          const newIndex = list.findIndex((item: any) => item.id === over.id);
          if (newIndex !== -1) {
             updateSection(section.id, arrayMove(list, oldIndex, newIndex));
          }
          break;
       }
    }
  };

  const updateItem = (id: string, section: string, field: string, value: string) => {
     const list = Array.from(cvData[section] || []);
     const newList = list.map((item: any) => 
       item.id === id ? { ...item, [field]: value } : item
     );
     updateSection(section, newList);
  };

  const removeItem = (id: string, section: string) => {
     const list = Array.from(cvData[section] || []);
     const newList = list.filter((item: any) => item.id !== id);
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
           marginBottom: `${(zoom - 100) * 3}px`, // Bù khoảng trống khi scale
           fontSize: `${dynamicFontSize}px`
         }}
       >
         <div className="flex min-h-[297mm]">
            {/* Cột Trái (Dark Sidebar) */}
            <div 
              className="w-[95mm] flex-shrink-0 text-white p-8 space-y-10"
              style={{ backgroundColor: '#2d3e50' }}
            >
               {/* Profile Image & Name */}
               <div className="text-center group/avatar">
                  <div className="w-40 h-40 mx-auto rounded-full border-4 border-white/20 overflow-hidden mb-6 bg-gray-100 flex items-center justify-center relative group">
                     {cvData.personal?.avatarUrl ? (
                         <img src={cvData.personal.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                     )}
                  </div>
                  <input 
                    type="text" 
                    value={cvData.personal?.fullName || ''} 
                    onChange={(e) => updateSection('personal', { ...cvData.personal, fullName: e.target.value })}
                    className="w-full bg-transparent text-center text-3xl font-bold uppercase tracking-wide border-0 focus:ring-0 p-0 mb-1 outline-none placeholder-white/30"
                    placeholder="HỌ TÊN"
                  />
                  <input 
                    type="text" 
                    value={cvData.personal?.title || ''} 
                    onChange={(e) => updateSection('personal', { ...cvData.personal, title: e.target.value })}
                    className="w-full bg-transparent text-center text-sm italic text-gray-300 font-medium border-0 focus:ring-0 p-0 outline-none placeholder-white/20"
                    placeholder="Vị trí ứng tuyển"
                  />
               </div>

               {/* LH Section */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-[2px] border-b border-white/10 pb-2 mb-4" style={{ color: themeConfig.primaryColor }}>LIÊN HỆ</h3>
                  <div className="space-y-3 text-[11px]">
                     {[
                       { icon: '📞', value: cvData.personal?.phoneNumber || '', field: 'phoneNumber', placeholder: 'Số điện thoại' },
                       { icon: '✉️', value: cvData.personal?.email || '', field: 'email', placeholder: 'Email cá nhân' },
                       { icon: '📍', value: cvData.personal?.address || '', field: 'address', placeholder: 'Địa chỉ cư trú' },
                     ].map((info, idx) => (
                       <div key={idx} className="flex items-center space-x-3 group">
                          <span className="w-5 h-5 flex items-center justify-center rounded bg-white/10 text-[10px]">{info.icon}</span>
                          <input 
                            type="text"
                            value={info.value}
                            onChange={(e) => updateSection('personal', { ...cvData.personal, [info.field]: e.target.value })}
                            className="bg-transparent border-0 focus:ring-0 p-0 text-[11px] outline-none flex-1 placeholder-white/20"
                            placeholder={info.placeholder}
                          />
                       </div>
                     ))}
                  </div>
               </div>

               {/* Mục tiêu nghề nghiệp */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-[2px] border-b border-white/10 pb-2 mb-4" style={{ color: themeConfig.primaryColor }}>MỤC TIÊU NGHỀ NGHIỆP</h3>
                  <textarea 
                    value={cvData.about || ''}
                    onChange={(e) => updateSection('about', e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[11px] leading-relaxed italic opacity-80 resize-none min-h-[80px] outline-none placeholder-white/20"
                    placeholder="Mô tả mục tiêu nghề nghiệp..."
                  />
               </div>

               {/* Kỹ năng */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-[2px] border-b border-white/10 pb-2 mb-4" style={{ color: themeConfig.primaryColor }}>KỸ NĂNG</h3>
                  <div className="text-[11px] opacity-80 cv-quill-editor-dark">
                     <TiptapEditor 
                        value={skillsHtml}
                        onChange={(val) => updateSection('skills', val)}
                        className="min-h-[100px]"
                     />
                  </div>
               </div>
            </div>

            {/* Cột Phải (Main Content) */}
            <div className="flex-1 p-12 space-y-12 bg-white">
               
               <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  {sections.map((section) => {
                    const items = cvData[section.id] || [];
                    if (items.length === 0) return null;

                    return (
                      <section key={section.id}>
                        <div className="flex items-center space-x-4 mb-6">
                           <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeConfig.primaryColor }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{section.icon}</svg>
                           </div>
                           <h3 className="text-lg font-bold uppercase tracking-wider text-gray-800">{section.label}</h3>
                        </div>

                        <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                           {items.map((item: any) => (
                             <SortableCVBlock key={item.id} id={item.id} onRemove={(id) => removeItem(id, section.id)}>
                                <div className="mb-8 group relative p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100">
                                   <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                         <input 
                                           type="text" 
                                           value={item.title || item.school || item.company || ''}
                                           onChange={(e) => {
                                              const field = section.id === 'education' ? 'school' : (section.id === 'experience' ? 'title' : 'title');
                                              updateItem(item.id, section.id, field, e.target.value);
                                           }}
                                           className="block font-bold text-gray-800 bg-transparent border-0 focus:ring-0 p-0 text-base outline-none w-full placeholder-gray-300"
                                           placeholder="Tiêu đề / Tên đơn vị"
                                         />
                                         <input 
                                           type="text" 
                                           value={item.degree || item.company || ''}
                                           onChange={(e) => {
                                              const field = section.id === 'education' ? 'degree' : 'company';
                                              updateItem(item.id, section.id, field, e.target.value);
                                           }}
                                           className="block text-sm text-gray-500 italic mt-1 bg-transparent border-0 focus:ring-0 p-0 outline-none w-full placeholder-gray-200"
                                           placeholder="Vị trí / Ngành học"
                                         />
                                      </div>
                                      <input 
                                         type="text" 
                                         value={item.period || ''}
                                         onChange={(e) => updateItem(item.id, section.id, 'period', e.target.value)}
                                         className="text-xs font-semibold text-gray-400 text-right bg-transparent border-0 focus:ring-0 p-0 outline-none w-32 placeholder-gray-200"
                                         placeholder="Thời gian"
                                      />
                                   </div>
                                   <div className="text-gray-600 relative">
                                      <TiptapEditor 
                                         value={item.description || ''}
                                         onChange={(val) => updateItem(item.id, section.id, 'description', val)}
                                         className="min-h-[40px]"
                                      />
                                      {section.id === 'experience' && (
                                         <button 
                                           onClick={() => setAiModalConfig({
                                             isOpen: true,
                                             section: 'Kinh nghiệm',
                                             id: item.id,
                                             currentText: item.description || ''
                                           })}
                                           className="absolute bottom-2 right-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center shadow-sm"
                                         >
                                           ✨ AI Viết Dùm
                                         </button>
                                      )}
                                   </div>
                                </div>
                             </SortableCVBlock>
                           ))}
                        </SortableContext>
                      </section>
                    );
                  })}
               </DndContext>
            </div>
         </div>
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
