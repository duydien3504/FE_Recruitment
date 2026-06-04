import React, { useState, useRef } from 'react';
import { useCvStore } from '../../store/cvStore';
import type { CustomSection } from '../../store/cvStore';
import { CvService } from '../../services/cv.service';
import TemplateGalleryPanel from './TemplateGalleryPanel';
import SampleLibraryPanel from './SampleLibraryPanel';
import CreateCustomSectionModal from './CreateCustomSectionModal';

interface CustomFont {
  name: string;
  fileName: string;
}

const LeftSidebar: React.FC = () => {
  const { themeConfig, updateTheme, cvData, setCvData, updateSection, syncAllColors, columnLayout, setColumnLayout, addCustomSection } = useCvStore();
  const [activeTab, setActiveTab] = useState('design');
  const [customSectionModalOpen, setCustomSectionModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncColorPrompt, setSyncColorPrompt] = useState<string | null>(null);
  const [selectedFontSize, setSelectedFontSize] = useState('14');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [fontUploadError, setFontUploadError] = useState<string | null>(null);
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const [aiIndustry, setAiIndustry] = useState('Công nghệ thông tin');
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiSection, setAiSection] = useState('experience');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fontUploadRef = useRef<HTMLInputElement>(null);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontUploadError(null);
    setIsLoadingFont(true);

    const allowedExts = ['.ttf', '.otf', '.woff', '.woff2'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      setFontUploadError('Chỉ hỗ trợ file .ttf, .otf, .woff, .woff2');
      setIsLoadingFont(false);
      return;
    }

    // Tên font = tên file bỏ đuôi
    const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');

    // Kiểm tra trùng tên
    if (customFonts.some(f => f.name === fontName)) {
      setFontUploadError(`Font "${fontName}" đã được tải lên rồi.`);
      setIsLoadingFont(false);
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      const fontFace = new FontFace(fontName, `url(${url})`);
      await fontFace.load();
      document.fonts.add(fontFace);

      setCustomFonts(prev => [...prev, { name: fontName, fileName: file.name }]);
      updateTheme({ fontFamily: fontName });
    } catch (err) {
      setFontUploadError('Không thể tải font. Vui lòng kiểm tra lại file.');
    } finally {
      setIsLoadingFont(false);
      // Reset input để có thể upload lại cùng file nếu cần
      if (fontUploadRef.current) fontUploadRef.current.value = '';
    }
  };

  const removeCustomFont = (fontName: string) => {
    setCustomFonts(prev => prev.filter(f => f.name !== fontName));
    if (themeConfig.fontFamily === fontName) {
      updateTheme({ fontFamily: 'Be Vietnam Pro' });
    }
  };

  const dispatchFormat = (type: string, value?: any) => {
    window.dispatchEvent(new CustomEvent('tiptap-format', { detail: { type, value } }));
  };

  const tabs = [
    {
      id: 'design', label: 'Thiết kế & Font', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
      )
    },
    {
      id: 'add', label: 'Thêm mục', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
      )
    },
    {
      id: 'layout', label: 'Bố cục', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
      )
    },
    {
      id: 'templates', label: 'Đổi mẫu CV', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
      )
    },
    {
      id: 'ai', label: 'Gợi ý viết CV', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M21 17v4" /><path d="M19 19h4" /></svg>
      )
    },
    {
      id: 'library', label: 'Thư viện CV', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
      )
    },
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

  const handleSyncAllColors = (color: string) => {
    syncAllColors(color);
    setSyncColorPrompt(null);
  };

  const handleAiSuggest = async () => {
    if (!aiIndustry.trim()) {
      setAiError('Vui lòng nhập ngành nghề');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiSuggestions([]);
    
    try {
      const sectionMap: Record<string, string> = {
        experience: 'Kinh nghiệm làm việc',
        education: 'Học vấn',
        projects: 'Dự án',
        awards: 'Giải thưởng',
        about: 'Mục tiêu nghề nghiệp'
      };
      
      const res = await CvService.aiSuggest({
        industry: aiIndustry,
        section: sectionMap[aiSection] || aiSection,
        keyword: aiKeyword,
        currentText: ''
      });
      
      if (res.success && res.data?.suggestions) {
        setAiSuggestions(res.data.suggestions);
      } else {
        setAiError('Không có gợi ý nào được tạo ra.');
      }
    } catch (err: any) {
      console.error('AI Suggestion Error:', err);
      setAiError(err.response?.data?.message || err.message || 'Lỗi máy chủ khi gọi AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateCustomSection = (title: string, icon: string) => {
    const newSection: CustomSection = {
      id: crypto.randomUUID(),
      title, icon, items: [],
    };
    addCustomSection(newSection);
    const alreadyInLayout = columnLayout.left.includes('customSections') || columnLayout.right.includes('customSections');
    if (!alreadyInLayout) {
      setColumnLayout({ ...columnLayout, right: [...columnLayout.right, 'customSections'] });
    }
  };

  return (
    <>
    <CreateCustomSectionModal
      isOpen={customSectionModalOpen}
      onClose={() => setCustomSectionModalOpen(false)}
      onCreate={handleCreateCustomSection}
    />
    <div className="flex h-full bg-white border-r shadow-sm overflow-hidden rounded-l-2xl shrink-0">
      {/* Vertical Icon Bar */}
      <div className="w-20 bg-gray-50 border-r flex flex-col py-4 items-center space-y-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-xl transition-all flex flex-col items-center space-y-1 w-16 ${activeTab === tab.id
                ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                : 'text-gray-500 hover:bg-gray-100'
              }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium text-center leading-tight">{tab.label}</span>
          </button>
        ))}

      </div>

      {/* Dynamic Content Panel */}
      <div className="w-80 flex flex-col min-h-0 overflow-hidden self-stretch">
        <div className="shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <button onClick={() => setActiveTab('design')} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>

        <div className={`flex-1 min-h-0 px-6 pb-6 ${activeTab === 'library' || activeTab === 'templates' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overscroll-y-contain'}`}>
        {activeTab === 'design' && (
          <div className="space-y-8">
            {/* Font Family */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Phông chữ</label>
              <select
                value={themeConfig.fontFamily}
                onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-primary transition-all text-sm outline-none"
                style={{ fontFamily: themeConfig.fontFamily }}
              >
                {/* ── Sans-serif Hiện đại & Chuyên nghiệp ── */}
                <optgroup label="── Sans-serif Hiện đại ──">
                  <option value="Be Vietnam Pro" style={{ fontFamily: 'Be Vietnam Pro' }}>Be Vietnam Pro</option>
                  <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
                  <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                  <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
                  <option value="Poppins" style={{ fontFamily: 'Poppins' }}>Poppins</option>
                  <option value="DM Sans" style={{ fontFamily: 'DM Sans' }}>DM Sans</option>
                  <option value="Plus Jakarta Sans" style={{ fontFamily: 'Plus Jakarta Sans' }}>Plus Jakarta Sans</option>
                  <option value="Source Sans 3" style={{ fontFamily: 'Source Sans 3' }}>Source Sans 3</option>
                  <option value="Work Sans" style={{ fontFamily: 'Work Sans' }}>Work Sans</option>
                  <option value="Barlow" style={{ fontFamily: 'Barlow' }}>Barlow</option>
                </optgroup>

                {/* ── Sans-serif Thanh lịch & Sáng tạo ── */}
                <optgroup label="── Sans-serif Thanh lịch ──">
                  <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                  <option value="Raleway" style={{ fontFamily: 'Raleway' }}>Raleway</option>
                  <option value="Nunito" style={{ fontFamily: 'Nunito' }}>Nunito</option>
                  <option value="Outfit" style={{ fontFamily: 'Outfit' }}>Outfit</option>
                  <option value="Lexend" style={{ fontFamily: 'Lexend' }}>Lexend</option>
                  <option value="Josefin Sans" style={{ fontFamily: 'Josefin Sans' }}>Josefin Sans</option>
                </optgroup>

                {/* ── Sans-serif Công nghệ & Minimalist ── */}
                <optgroup label="── Sans-serif Công nghệ ──">
                  <option value="Space Grotesk" style={{ fontFamily: 'Space Grotesk' }}>Space Grotesk</option>
                  <option value="Sora" style={{ fontFamily: 'Sora' }}>Sora</option>
                </optgroup>

                {/* ── Serif Sang trọng & Học thuật ── */}
                <optgroup label="── Serif Sang trọng ──">
                  <option value="Lora" style={{ fontFamily: 'Lora' }}>Lora</option>
                  <option value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
                  <option value="Merriweather" style={{ fontFamily: 'Merriweather' }}>Merriweather</option>
                  <option value="Source Serif 4" style={{ fontFamily: 'Source Serif 4' }}>Source Serif 4</option>
                  <option value="EB Garamond" style={{ fontFamily: 'EB Garamond' }}>EB Garamond</option>
                  <option value="Libre Baskerville" style={{ fontFamily: 'Libre Baskerville' }}>Libre Baskerville</option>
                  <option value="Crimson Text" style={{ fontFamily: 'Crimson Text' }}>Crimson Text</option>
                </optgroup>

                {/* ── Font tùy chỉnh (upload) ── */}
                {customFonts.length > 0 && (
                  <optgroup label="── Font tùy chỉnh ──">
                    {customFonts.map(f => (
                      <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                        {f.name} ✦
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Upload Font Button */}
              <div className="mt-3">
                {/* Hidden file input */}
                <input
                  ref={fontUploadRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={handleFontUpload}
                />
                <button
                  onClick={() => fontUploadRef.current?.click()}
                  disabled={isLoadingFont}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 hover:border-primary/60 transition-all disabled:opacity-60"
                >
                  {isLoadingFont ? (
                    <>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Đang tải font...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Tải font lên (.ttf / .otf / .woff)
                    </>
                  )}
                </button>

                {/* Error message */}
                {fontUploadError && (
                  <p className="mt-2 text-[10px] text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {fontUploadError}
                  </p>
                )}

                {/* List custom fonts with delete */}
                {customFonts.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Font đã tải lên</p>
                    {customFonts.map(f => (
                      <div
                        key={f.name}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${themeConfig.fontFamily === f.name
                            ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                          }`}
                        onClick={() => updateTheme({ fontFamily: f.name })}
                        style={{ fontFamily: f.name }}
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCustomFont(f.name); }}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Xóa font"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Màu chủ đề</label>
              <div className="flex flex-wrap gap-3">
                {['#1A73E8', '#00b14f', '#e91e63', '#9c27b0', '#ff9800', '#3f51b5'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateTheme({ primaryColor: color })}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${themeConfig.primaryColor === color ? 'border-primary/20 scale-110 shadow-md' : 'border-transparent'
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
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
                  <div className="flex-1 relative">
                    <input
                      type="color"
                      onChange={(e) => {
                        const newColor = e.target.value;
                        dispatchFormat('color', newColor);
                        setSyncColorPrompt(newColor);
                      }}
                      className="w-full h-10 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white hover:border-primary/30 transition-all shadow-sm"
                      title="Màu chữ"
                    />

                    {syncColorPrompt && (
                      <div className="fixed bottom-10 left-[410px] z-[100] w-72 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: syncColorPrompt }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">Đồng bộ màu chữ?</p>
                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Bạn có muốn áp dụng màu này cho toàn bộ nội dung trong CV không?</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSyncAllColors(syncColorPrompt)}
                            className="flex-1 bg-primary text-white text-[10px] font-bold py-2 rounded-lg hover:bg-primary-dark transition-all shadow-sm"
                          >
                            ĐỒNG Ý
                          </button>
                          <button
                            onClick={() => setSyncColorPrompt(null)}
                            className="flex-1 bg-gray-50 text-gray-600 text-[10px] font-bold py-2 rounded-lg hover:bg-gray-100 transition-all"
                          >
                            KHÔNG
                          </button>
                        </div>
                      </div>
                    )}
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
            {/* Nút tạo mục tùy chỉnh */}
            <button
              onClick={() => setCustomSectionModalOpen(true)}
              className="w-full flex items-center p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-left group"
            >
              <span className="text-xl mr-4">✨</span>
              <div className="flex-1">
                <span className="text-sm font-semibold text-primary">Tạo mục tùy chỉnh</span>
                <p className="text-[10px] text-primary/60 font-medium">Chứng chỉ, Sở thích, Ngôn ngữ...</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-primary/50 group-hover:text-primary"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            </button>
            {[
              { id: 'experience', label: 'Kinh nghiệm làm việc', icon: '💼' },
              { id: 'education', label: 'Học vấn', icon: '🎓' },
              { id: 'skills', label: 'Kỹ năng', icon: '⚡' },
              { id: 'awards', label: 'Giải thưởng', icon: '🏆' },
              { id: 'projects', label: 'Dự án', icon: '🚀' },
              { id: 'about', label: 'Mục tiêu nghề nghiệp', icon: '🎯' },
              { id: 'contact', label: 'Thông tin liên hệ', icon: '📞' },
              { id: 'profile', label: 'Họ tên & Ảnh', icon: '👤' },
            ].map(item => {
              const isInLayout = columnLayout.left.includes(item.id) || columnLayout.right.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!isInLayout) {
                      const newLayout = {
                        left: [...columnLayout.left],
                        right: [...columnLayout.right]
                      };
                      if (['education', 'experience', 'projects', 'awards'].includes(item.id)) {
                        newLayout.right.push(item.id);
                      } else {
                        newLayout.left.push(item.id);
                      }
                      setColumnLayout(newLayout);
                    } else {
                      if (['experience', 'education', 'skills', 'awards', 'projects'].includes(item.id)) {
                        if (item.id === 'skills' && typeof cvData.skills === 'string') return;
                        const newId = `${item.id}-${Date.now()}`;
                        const currentList = Array.from(cvData[item.id] || []);
                        updateSection(item.id, [...currentList, { id: newId, title: '', description: '' }]);
                      }
                    }
                  }}
                  className={`w-full flex items-center p-4 rounded-xl border transition-all text-left group ${
                    !isInLayout ? 'border-dashed border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xl mr-4">{item.icon}</span>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${!isInLayout ? 'text-gray-400' : 'text-gray-700 group-hover:text-primary'}`}>
                      {item.label}
                    </span>
                    {!isInLayout && <p className="text-[10px] text-gray-500 font-medium">✨ Click để thêm lại mục này</p>}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-auto ${!isInLayout ? 'text-gray-300' : 'text-gray-300 group-hover:text-primary'}`}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                </button>
              );
            })}
          </div>
        )}

        {/* Đổi mẫu CV — chỉ thay đổi giao diện */}
        {activeTab === 'templates' && <TemplateGalleryPanel />}

        {/* Thư viện mẫu CV — xem & dùng mẫu hoàn chỉnh */}
        {activeTab === 'library' && <SampleLibraryPanel />}

        {/* Layout tab — placeholder (chưa implement) */}
        {activeTab === 'layout' && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
            </div>
            <p className="text-sm text-gray-500">Mục <b>Bố cục</b> đang được tích hợp thêm dữ liệu.</p>
          </div>
        )}

        {/* AI tab — Đã implement gọi API */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">✨</span>
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-tight">Trợ lý AI chuyên sâu</h3>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                Sử dụng AI để sinh các nội dung dạng bullet-point (gạch đầu dòng) chuyên nghiệp, tối ưu cho từng ngành nghề.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ngành nghề</label>
                <input
                  type="text"
                  value={aiIndustry}
                  onChange={(e) => setAiIndustry(e.target.value)}
                  placeholder="Ví dụ: IT Backend, Marketing, Sales..."
                  className="w-full border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300 shadow-sm border"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phần nội dung</label>
                <select
                  value={aiSection}
                  onChange={(e) => setAiSection(e.target.value)}
                  className="w-full border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm border"
                >
                  <option value="experience">💼 Kinh nghiệm làm việc</option>
                  <option value="projects">🚀 Dự án cá nhân</option>
                  <option value="education">🎓 Học vấn</option>
                  <option value="skills">⚡ Kỹ năng</option>
                  <option value="about">🎯 Mục tiêu nghề nghiệp</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Từ khoá (Tuỳ chọn)</label>
                <input
                  type="text"
                  value={aiKeyword}
                  onChange={(e) => setAiKeyword(e.target.value)}
                  placeholder="Ví dụ: ReactJS, Java, Quản lý..."
                  className="w-full border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-300 shadow-sm border"
                />
              </div>

              <button
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 active:scale-95"
              >
                {aiLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <span className="text-xs">AI đang soạn thảo...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    <span className="text-xs uppercase tracking-wider">Tạo gợi ý ngay</span>
                  </>
                )}
              </button>

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] rounded-lg animate-shake font-medium">
                  {aiError}
                </div>
              )}

              {aiSuggestions.length > 0 && (
                <div className="pt-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Kết quả từ AI</p>
                  {aiSuggestions.map((text, idx) => (
                    <div key={idx} className="group bg-white p-3.5 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all relative">
                      <p className="text-xs text-gray-700 leading-relaxed pr-8">
                        {text}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          // Thêm toast hoặc feedback ở đây nếu cần
                        }}
                        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                      </button>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 italic text-center pt-2">
                    * Bấm nút biểu tượng copy để sao chép vào bộ nhớ đệm
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
};

export default LeftSidebar;
