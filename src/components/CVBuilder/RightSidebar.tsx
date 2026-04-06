import React, { useState } from 'react';
import { useCvStore } from '../../store/cvStore';
import { CvService } from '../../services/cv.service';

const RightSidebar: React.FC = () => {
  const { atsScore, setAtsScore, cvData } = useCvStore();
  const [jdText, setJdText] = useState('');
  const [isCheckingAts, setIsCheckingAts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);

  const compileCvText = () => {
    let str = "";
    if (cvData.personal) {
       str += `${cvData.personal.fullName || ''} ${cvData.personal.title || ''} `;
    }
    if (cvData.about) str += `${cvData.about} `;
    
    if (cvData.experience) {
       cvData.experience.forEach((e: any) => {
          str += `${e.company || ''} ${e.title || ''} ${e.description || ''} `;
       });
    }
    if (cvData.education) {
       cvData.education.forEach((e: any) => {
          str += `${e.school || ''} ${e.degree || ''} ${e.description || ''} `;
       });
    }
    if (cvData.skills) {
       if (typeof cvData.skills === 'string') str += `${cvData.skills} `;
       else if (Array.isArray(cvData.skills)) str += cvData.skills.map((s: any) => s.name || s).join(" ");
    }
    
    // Xóa tất cả thẻ HTML tag
    return str.replace(/<[^>]*>?/gm, ' ');
  };

  const handleAtsCheck = async () => {
    if (!jdText.trim()) return alert('Vui lòng dán Mô tả công việc (Job Description) vào ô trống!');
    setIsCheckingAts(true);
    try {
       const cvTextRaw = compileCvText();
       const res = await CvService.checkAts({ cvText: cvTextRaw, jdText: jdText });
       if (res.success) {
          // Response schema usually { matchScore: 85, missingKeywords: [...] }
          const score = res.data?.matchScore || res.data?.score || 0;
          setAtsScore(score);
          setMissingKeywords(res.data?.missingKeywords || []);
       }
    } catch (err) {
       console.error("Lỗi chấm điểm ATS:", err);
       alert("Lỗi kết nối AI đánh giá ATS.");
    } finally {
       setIsCheckingAts(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const response = await CvService.exportCv(); // Response trả về Blob
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
      alert("Hệ thống Backend kết xuất PDF chưa phản hồi (Hãy chắc chắn backend cài đặt Puppeteer thành công).");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-80 shrink-0 bg-white rounded-r-2xl shadow border-l flex flex-col h-full overflow-hidden">
      <div className="p-6 overflow-y-auto flex-[1]">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Đánh Giá ATS</h2>
        
        <div className="p-6 bg-blue-50/50 rounded-xl text-center border border-blue-100 flex flex-col items-center justify-center relative overflow-hidden">
           <p className="text-sm text-blue-800 font-semibold mb-2">Mức Độ Phù Hợp JD</p>
           {/* Vòng tròn % Rating */}
           <div className={`flex items-center justify-center w-24 h-24 rounded-full border-8 transition-all duration-1000 ${atsScore >= 80 ? 'border-green-500 text-green-600' : atsScore >= 50 ? 'border-yellow-400 text-yellow-600' : 'border-blue-500 text-blue-600'}`}>
             <span className="text-3xl font-black">{atsScore}%</span>
           </div>
           {isCheckingAts && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                 <span className="animate-pulse text-sm font-bold text-gray-600">Đang phân tích...</span>
              </div>
           )}
        </div>

        {missingKeywords.length > 0 && (
           <div className="mt-6">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase mb-3 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                 Thiếu từ khóa quan trọng
              </h4>
              <div className="flex flex-wrap gap-2">
                 {missingKeywords.map((kw, i) => (
                    <span key={i} className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 shadow-sm">{kw}</span>
                 ))}
              </div>
           </div>
        )}

        {/* Input JD */}
        <div className="mt-8">
           <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả công việc (JD)</label>
           <textarea 
             value={jdText}
             onChange={(e) => setJdText(e.target.value)}
             className="w-full border-gray-300 rounded-lg shadow-sm p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 min-h-[140px] text-sm resize-y"
             placeholder="Dán toàn bộ nội dung Job Description nhà tuyển dụng yêu cầu vào đây để AI phân tích..."
           ></textarea>
        </div>
      </div>
      
      {/* Nút tác vụ chốt */}
      <div className="p-6 border-t bg-gray-50">
          <button 
            onClick={handleAtsCheck}
            disabled={isCheckingAts}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r hover:bg-gradient-to-l from-indigo-500 to-purple-600 text-white rounded-lg py-3 px-4 shadow-md transition-all duration-300 disabled:opacity-50"
          >
            {isCheckingAts ? (
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
               </svg>
            ) : (
               <span className="font-medium">Đánh giá phù hợp với JD</span>
            )}
          </button>

          <button 
            onClick={handleExportPdf}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-blue-600 text-white rounded-lg py-3 px-4 shadow-md transition-all duration-300 mt-3 disabled:opacity-50"
          >
            {isExporting ? (
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
               </svg>
            ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                 <span className="font-medium">Tải xuống PDF (Export)</span>
               </>
            )}
          </button>
      </div>
    </div>
  );
};

export default RightSidebar;
