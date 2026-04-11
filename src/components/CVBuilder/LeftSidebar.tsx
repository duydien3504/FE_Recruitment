import React, { useState } from 'react';
import { useCvStore } from '../../store/cvStore';
import { CvService } from '../../services/cv.service';
import TemplateGalleryPanel from './TemplateGalleryPanel';

const LeftSidebar: React.FC = () => {
  const { themeConfig, updateTheme, cvData, setCvData, updateSection } = useCvStore();
  const [activeTab, setActiveTab] = useState('design');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState('14');

  const dispatchFormat = (type: string, value?: any) => {
    window.dispatchEvent(new CustomEvent('tiptap-format', { detail: { type, value } }));
  };

  const tabs = [
    { id: 'design', label: 'Thiết kế & Font', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    )},
    { id: 'add', label: 'Thêm mục', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
    )},
    { id: 'layout', label: 'Bố cục', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    )},
    { id: 'templates', label: 'Đổi mẫu CV', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
    )},
    { id: 'ai', label: 'Gợi ý viết CV', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M21 17v4"/><path d="M19 19h4"/></svg>
    )},
    { id: 'library', label: 'Thư viện CV', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
    )},
  ];

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    try {
      const res = await CvService.autoFillProfile();
      if (res.success && res.data) {
         setCvData({ ...cvData, ...res.data });
      }
    } catch (error) {
      console.error("Lỗi đồng bộ:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-full bg-white border-r shadow-sm overflow-hidden rounded-l-2xl shrink-0">
      {/* Vertical Icon Bar */}
      <div className="w-20 bg-gray-50 border-r flex flex-col py-4 items-center space-y-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-xl transition-all flex flex-col items-center space-y-1 w-16 ${
              activeTab === tab.id 
                ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium text-center leading-tight">{tab.label}</span>
          </button>
        ))}
        
        <div className="mt-auto pb-4">
           <button 
             onClick={handleSyncProfile}
             disabled={isSyncing}
             className="p-3 text-primary hover:bg-primary/10 rounded-xl transition-all"
             title="Đồng bộ hồ sơ"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSyncing ? 'animate-spin' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
           </button>
        </div>
      </div>

      {/* Dynamic Content Panel */}
      <div className="w-80 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h2>
          <button onClick={() => setActiveTab('design')} className="text-gray-400 hover:text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {activeTab === 'design' && (
          <div className="space-y-8">
            {/* Font Family */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Phông chữ</label>
              <select 
                value={themeConfig.fontFamily}
                onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
              >
                <option value="Be Vietnam Pro">Be Vietnam Pro</option>
                <option value="Roboto">Roboto</option>
                <option value="Inter">Inter</option>
                <option value="Lora">Lora</option>
              </select>
            </div>

            {/* Color Theme */}
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Màu chủ đề</label>
              <div className="flex flex-wrap gap-3">
                 {['#1A73E8', '#00b14f', '#e91e63', '#9c27b0', '#ff9800', '#3f51b5'].map(color => (
                   <button 
                     key={color}
                     onClick={() => updateTheme({ primaryColor: color })}
                     className={`w-10 h-10 rounded-full border-4 transition-all ${
                       themeConfig.primaryColor === color ? 'border-primary/20 scale-110 shadow-md' : 'border-transparent'
                     }`}
                     style={{ backgroundColor: color }}
                   />
                 ))}
                 <div className="relative">
                    <input 
                      type="color" 
                      value={themeConfig.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-full cursor-pointer border-0 p-0 overflow-hidden opacity-0 absolute"
                    />
                    <div className="w-10 h-10 rounded-full bg-conic-gradient border border-gray-200 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                 </div>
              </div>
            </div>

            {/* Rich Text Format Bridge */}
            <div className="pt-4 border-t border-gray-100">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Định dạng đoạn bôi đen</label>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <button 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => dispatchFormat('bold')}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-primary/10 hover:border-primary/30 hover:text-primary font-bold transition-all shadow-sm"
                      title="In đậm"
                    >B</button>
                    <button 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => dispatchFormat('italic')}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-primary/10 hover:border-primary/30 hover:text-primary italic transition-all shadow-sm"
                      title="In nghiêng"
                    >I</button>
                    <div className="w-[1px] h-6 bg-gray-200 mx-1" />
                    <div className="flex-1 relative group">
                      <input 
                        type="color" 
                        onChange={(e) => dispatchFormat('color', e.target.value)}
                        className="w-full h-10 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white hover:border-primary/30 transition-all shadow-sm"
                        title="Màu chữ"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <select 
                        value={selectedFontSize}
                        onChange={(e) => {
                          setSelectedFontSize(e.target.value);
                          dispatchFormat('fontSize', e.target.value);
                        }}
                        className="w-full border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                      >
                        <option value="10">Cỡ chữ: 10px</option>
                        <option value="11">Cỡ chữ: 11px</option>
                        <option value="12">Cỡ chữ: 12px</option>
                        <option value="13">Cỡ chữ: 13px</option>
                        <option value="14">Cỡ chữ: 14px</option>
                        <option value="16">Cỡ chữ: 16px</option>
                        <option value="18">Cỡ chữ: 18px</option>
                        <option value="20">Cỡ chữ: 20px</option>
                        <option value="24">Cỡ chữ: 24px</option>
                      </select>
                    </div>
                    <button 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => dispatchFormat('fontSize', selectedFontSize)}
                      className="px-3 h-8 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark transition-all shadow-sm"
                    >
                      ÁP DỤNG
                    </button>
                  </div>
               </div>
               <p className="text-[10px] text-gray-400 mt-3 italic leading-relaxed border-l-2 border-primary/20 pl-2">
                 * Hướng dẫn: Bôi đen đoạn chữ trong CV, sau đó nhấn các nút ở trên để định dạng.
               </p>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
           <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 underline">Click để thêm vào CV</label>
              {[
                { id: 'experience', label: 'Kinh nghiệm làm việc', icon: '💼' },
                { id: 'education', label: 'Học vấn', icon: '🎓' },
                { id: 'skills', label: 'Kỹ năng', icon: '⚡' },
                { id: 'awards', label: 'Giải thưởng', icon: '🏆' },
                { id: 'projects', label: 'Dự án', icon: '🚀' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => {
                    const newId = `${item.id}-${Date.now()}`;
                    const currentList = Array.from(cvData[item.id] || []);
                    updateSection(item.id, [...currentList, { id: newId, title: '', description: '' }]);
                  }}
                  className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <span className="text-xl mr-4">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary">{item.label}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-gray-300 group-hover:text-primary"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </button>
              ))}
           </div>
        )}

        {/* Template Gallery — tab 'Đổi mẫu CV' và 'Thư viện CV' đều dùng chung 1 component */}
        {(activeTab === 'templates' || activeTab === 'library') && (
          <TemplateGalleryPanel />
        )}

        {/* Layout tab — placeholder (chưa implement) */}
        {activeTab === 'layout' && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
             </div>
             <p className="text-sm text-gray-500">Mục <b>Bố cục</b> đang được tích hợp thêm dữ liệu.</p>
          </div>
        )}

        {/* AI tab — placeholder (chưa implement) */}
        {activeTab === 'ai' && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
             </div>
             <p className="text-sm text-gray-500">Mục <b>Gợi ý viết CV</b> đang được tích hợp AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
