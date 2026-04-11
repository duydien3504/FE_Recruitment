import React, { useState } from 'react';
import { CvService } from '../../services/cv.service';

interface AiAssistantModalProps {
  isOpen: boolean;
  section: string;
  currentText: string;
  onClose: () => void;
  onAppend: (text: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  section,
  currentText,
  onClose,
  onAppend
}) => {
  const [industry, setIndustry] = useState('IT / Software');
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errorInfo, setErrorInfo] = useState<string>('');

  if (!isOpen) return null;

  const handleSuggest = async () => {
    setIsLoading(true);
    setSuggestions([]);
    setErrorInfo('');
    try {
      const payload = {
        industry,
        section,
        currentText,
        keyword
      };
      const res = await CvService.aiSuggest(payload);
      if (res.success && res.data && res.data.suggestions) {
         setSuggestions(res.data.suggestions);
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setErrorInfo(error.response?.data?.message || error.message || "Lỗi giao tiếp với AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[550px] relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent flex items-center">
            ✨ Trợ lý AI Viết CV
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cấu hình Payload */}
        <div className="flex flex-col gap-4 mb-5 overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ngành nghề (Industry)</label>
              <input 
                type="text" 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border-gray-300 rounded-lg p-2 bg-gray-50 focus:ring-purple-500 focus:border-purple-500 outline-none border"
                placeholder="Ví dụ: Marketing, Kế toán, Phần mềm..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gợi ý từ khoá / Vị trí (Tuỳ chọn)</label>
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full border-gray-300 rounded-lg p-2 bg-gray-50 focus:ring-purple-500 focus:border-purple-500 outline-none border"
                placeholder="Ví dụ: Backend Developer Nodejs, Quản lý chi phí..."
              />
              <p className="text-xs text-gray-500 mt-1">Phân mục đang viết: <b>{section}</b></p>
            </div>

            <button 
                onClick={handleSuggest}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center space-x-2"
            >
                {isLoading ? (
                    <>
                       <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                       </svg>
                       <span>AI đang soạn thảo... (Có thể mất 10s-15s)</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                        <span>Tạo Gợi Ý Ngay</span>
                    </>
                )}
            </button>
        </div>

        {/* Kết quả Option */}
        <div className="flex-1 overflow-y-auto relative min-h-[150px] border-t pt-4 border-gray-100">
           {errorInfo && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                  {errorInfo}
              </div>
           )}
           
           {!isLoading && suggestions.length > 0 && (
               <div className="space-y-3">
                   {suggestions.map((text, idx) => (
                       <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-lg hover:border-purple-300 transition-colors group">
                           <p className="text-sm text-gray-800 mb-2 leading-relaxed">{text}</p>
                           <div className="flex justify-end gap-2">
                               <button 
                                  onClick={() => {
                                      navigator.clipboard.writeText(text);
                                  }}
                                  className="text-xs px-3 py-1.5 text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-100 transition"
                               >
                                  Copy
                               </button>
                               <button 
                                  onClick={() => {
                                      onAppend(text);
                                  }}
                                  className="text-xs px-3 py-1.5 text-white bg-purple-600 rounded shadow hover:bg-purple-700 transition"
                               >
                                  + Chèn vào
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
           )}

           {!isLoading && suggestions.length === 0 && !errorInfo && (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"/><path d="m18 16 2-2"/><path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"/></svg>
                    <p className="text-sm font-medium border-b border-gray-300 pb-1">AI Đang Nghỉ Ngơi</p>
                    <p className="text-xs mt-2 w-3/4 text-center">Bấm 'Tạo Gợi Ý' để mô hình OpenRouter GenAI sinh ra các gạch đầu dòng chuyên nghiệp cho bạn.</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
