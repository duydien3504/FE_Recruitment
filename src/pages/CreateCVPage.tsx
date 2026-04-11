import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCvStore } from '../store/cvStore';
import Header from '../components/Header';
import LeftSidebar from '../components/CVBuilder/LeftSidebar';
import MainCanvas from '../components/CVBuilder/MainCanvas';
import PreviewModal from '../components/CVBuilder/PreviewModal';
import { CvService } from '../services/cv.service';

const CreateCVPage: React.FC = () => {
  const { cvData, themeConfig, atsScore, columnLayout, templateId } = useCvStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    console.log('✅ Chúc mừng! CV Store đã khởi tạo thành công.');
    console.log('📦 Current State Injection:', { cvData, themeConfig, atsScore, columnLayout });
  }, [cvData, themeConfig, atsScore, columnLayout]);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
       const response = await CvService.exportCv({
         cvData,
         themeConfig,
         columnLayout,
         templateId: templateId || '2-column-dark'  // fallback nếu chưa chọn mẫu
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
      alert("Lỗi xuất PDF. Vui lòng kiểm tra lại dịch vụ Backend.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = async () => {
    setIsRendering(true);
    try {
      const html = await CvService.getPreviewHtml({
        cvData,
        themeConfig,
        columnLayout,
        templateId
      });
      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Lỗi render xem trước:", err);
      alert("Không thể tải bản xem trước.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-charcoal antialiased overflow-x-hidden">
      <Header />
      
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
              <button 
                onClick={handlePreview}
                disabled={isRendering}
                className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
              >
                 {isRendering ? (
                    <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                 ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                 )}
                 <span>Xem trước</span>
              </button>
              <button 
                onClick={async () => {
                  try {
                    await CvService.updateDraft({
                      cvData,
                      themeConfig,
                      templateId: templateId || '2-column-dark',
                      columnLayout
                    });
                    alert("Đã lưu CV thành công!");
                  } catch (err) {
                    console.error("Lỗi khi lưu CV:", err);
                    alert("Có lỗi xảy ra khi lưu CV.");
                  }
                }}
                className="flex items-center space-x-2 bg-primary hover:bg-blue-600 text-white px-5 py-1.5 rounded-lg font-bold text-sm shadow-sm transition-all"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                 <span>Lưu CV</span>
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

        <PreviewModal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          htmlContent={previewHtml} 
        />
      </div>
    </div>
  );
};

export default CreateCVPage;
