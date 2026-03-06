
import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import { fetchWithAuth } from '../utils/auth';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Eye, X, Loader2, Sparkles, TrendingUp, Star } from 'lucide-react';

interface Resume {
    id: string;
    resumeId?: string;
    fileName: string;
    url?: string;
    fileUrl?: string;
    created_at: string;
    isPrimary?: boolean;
}

interface SuggestedJob {
    jobId: number;
    match_score: number;
    reason: string;
    // Expanded job info (assuming API might return it or we fetch it)
    title?: string;
    companyName?: string;
    logoUrl?: string;
    location?: string;
    salary?: string;
    created_at?: string;
}

export default function ResumesPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
    const [viewingResume, setViewingResume] = useState<Resume | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [activeTab, setActiveTab] = useState<'suggestions' | 'info'>('suggestions');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/resumes`);
            if (response.ok) {
                const json = await response.json();
                const mappedData = (json.data || []).map((item: any) => ({
                    ...item,
                    id: item.id || item.resumesId || item.resumeId,
                    fileName: item.fileName || item.name || "CV_Ung_Tuyen.pdf",
                    url: item.fileUrl || item.url
                }));
                setResumes(mappedData);
            }
        } catch (error) {
            console.error("Failed to fetch resumes", error);
            toast.error("Không thể tải danh sách CV");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
        fetchSuggestedJobs();
    }, []);

    const fetchSuggestedJobs = async () => {
        setLoadingSuggestions(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/jobs/suggested`);
            if (response.ok) {
                const json = await response.json();
                const rawSuggestions = json.data || [];

                // Fetch full details for each job if not provided
                // For now, let's assume rawSuggestions might NOT have details like title, company
                // But typically AI suggestions work better if we show the details.
                // I'll try to fetch details for each jobId to populate the cards.
                const detailedJobs = await Promise.all(rawSuggestions.map(async (s: any) => {
                    try {
                        const jobRes = await fetch(`${apiUrl}/api/v1/jobs/${s.jobId}`);
                        if (jobRes.ok) {
                            const jobJson = await jobRes.json();
                            const jobData = jobJson.data;
                            return {
                                ...s,
                                id: s.jobId.toString(),
                                title: jobData.title,
                                companyName: jobData.company?.name,
                                logoUrl: jobData.company?.logoUrl,
                                location: jobData.location?.name,
                                salary: formatSalary(jobData.salaryMin, jobData.salaryMax),
                                postedDaysAgo: calculateDaysAgo(jobData.created_at),
                                created_at: jobData.created_at
                            };
                        }
                    } catch (e) {
                        return s;
                    }
                    return s;
                }));

                setSuggestedJobs(detailedJobs.filter(j => j.title)); // Only show valid completions
            }
        } catch (error) {
            console.error("Failed to fetch suggestions", error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const calculateDaysAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatSalary = (min: any, max: any) => {
        const minNum = parseFloat(min);
        const maxNum = parseFloat(max);
        if ((!min || isNaN(minNum) || minNum === 0) && (!max || isNaN(maxNum) || maxNum === 0)) return 'Thỏa thuận';
        const formatNumber = (num: number) => {
            if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
            return num.toLocaleString('vi-VN');
        };
        if (minNum > 0 && maxNum > 0) return `${formatNumber(minNum)} - ${formatNumber(maxNum)} VND`;
        if (minNum > 0) return `Từ ${formatNumber(minNum)} VND`;
        if (maxNum > 0) return `Đến ${formatNumber(maxNum)} VND`;
        return 'Thỏa thuận';
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error("Chỉ chấp nhận file PDF");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Dung lượng file tối đa là 5MB");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/resumes`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                toast.success("Tải lên CV thành công");
                fetchResumes();
            } else {
                const error = await response.json().catch(() => ({}));
                toast.error(error.message || "Tải lên CV thất bại");
            }
        } catch (error) {
            console.error("Error uploading resume:", error);
            toast.error("Lỗi hệ thống khi tải lên");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Bạn có chắc chắn muốn xóa CV này?")) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/resumes/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success("Xóa CV thành công");
                setResumes(prev => prev.filter(r => r.id !== id));
            } else {
                toast.error("Xóa CV thất bại");
            }
        } catch (error) {
            console.error("Error deleting resume:", error);
            toast.error("Lỗi hệ thống khi xóa");
        }
    };

    const handleSetPrimary = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/resumes/${id}/set-main`, {
                method: 'PATCH'
            });

            if (response.ok) {
                toast.success("Đã đặt làm CV chính");
                setResumes(prev => prev.map(r => ({
                    ...r,
                    isPrimary: r.id === id
                })));
            } else {
                toast.error("Không thể đặt làm CV chính");
            }
        } catch (error) {
            console.error("Error setting primary resume:", error);
            toast.error("Lỗi hệ thống");
        }
    };

    const handleViewResume = async (resume: Resume) => {
        setViewingResume(resume);
        setModalLoading(true);

        let fileUrl = resume.url || resume.fileUrl;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            // If we don't have the URL yet, fetch it from the detail endpoint
            if (!fileUrl) {
                const response = await fetchWithAuth(`${apiUrl}/api/v1/resumes/${resume.id}`);
                if (response.ok) {
                    const json = await response.json();
                    fileUrl = json.data?.fileUrl || json.data?.url;
                }
            }

            if (fileUrl) {
                try {
                    // Fetch the file as a blob to bypass Content-Disposition: attachment
                    const response = await fetch(fileUrl);
                    if (response.ok) {
                        const blob = await response.blob();
                        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                        const blobUrl = URL.createObjectURL(pdfBlob);
                        setSelectedResumeUrl(blobUrl);
                    } else {
                        // If fetch fails (CORS or other), fall back to direct URL
                        setSelectedResumeUrl(fileUrl);
                    }
                } catch (fetchError) {
                    console.error("Failed to fetch blob, falling back to direct URL", fetchError);
                    setSelectedResumeUrl(fileUrl);
                }
            } else {
                toast.error("Không thể lấy chi tiết CV");
            }
        } catch (error) {
            console.error("Error fetching resume detail:", error);
            toast.error("Lỗi khi mở CV");
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        if (selectedResumeUrl && selectedResumeUrl.startsWith('blob:')) {
            URL.revokeObjectURL(selectedResumeUrl);
        }
        setSelectedResumeUrl(null);
        setViewingResume(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-28 pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-charcoal mb-2">Quản lý Hồ sơ & CV</h1>
                            <p className="text-gray-500">Tải lên và quản lý các bản CV của bạn để ứng tuyển nhanh chóng.</p>
                        </div>
                        <button
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                            {uploading ? "Đang tải lên..." : "Tải lên CV mới"}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf"
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : resumes.length > 0 ? (
                            resumes.map((resume) => (
                                <div
                                    key={resume.id}
                                    onClick={() => handleViewResume(resume)}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{resume.fileName || "CV_Ung_Tuyen.pdf"}</h3>
                                            <p className="text-sm text-gray-500">Ngày tải lên: {new Date(resume.created_at).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleSetPrimary(resume.id, e)}
                                            className={`p-3 rounded-xl transition-all ${resume.isPrimary ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                            title={resume.isPrimary ? "CV Chính" : "Đặt làm CV chính"}
                                        >
                                            <Star size={20} fill={resume.isPrimary ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleViewResume(resume); }}
                                            className="p-3 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                                            title="Xem CV"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteResume(resume.id, e)}
                                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Xóa CV"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-300">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                    <FileText size={40} />
                                </div>
                                <h2 className="text-xl font-bold text-charcoal mb-2">Chưa có CV nào được tải lên</h2>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Tải lên bản CV tốt nhất của bạn dưới định dạng PDF để bắt đầu ứng tuyển các công việc hấp dẫn.</p>
                                <button
                                    onClick={handleUploadClick}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Tải lên ngay bây giờ
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-12">
                        <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
                            <button
                                onClick={() => setActiveTab('suggestions')}
                                className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'suggestions' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles size={20} />
                                    Việc làm gợi ý cho bạn
                                </div>
                                {activeTab === 'suggestions' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'info' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Lưu ý khi tải CV
                                </div>
                                {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
                            </button>
                        </div>

                        {activeTab === 'info' ? (
                            <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">i</div>
                                    Các quy định và hướng dẫn:
                                </h4>
                                <ul className="text-gray-700 space-y-3">
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                                        <span>Chỉ chấp nhận định dạng file <b>.pdf</b> để đảm bảo định dạng văn bản ổn định nhất.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                                        <span>Dung lượng file không vượt quá <b>5MB</b> để tối ưu hóa tốc độ tải lên và xử lý.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                                        <span>Tối đa bạn có thể lưu trữ <b>5 CV</b> trong kho hồ sơ cá nhân.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                                        <span>Giới hạn tải lên tối đa <b>2 CV/ngày</b> để tránh tình trạng spam hệ thống.</span>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {loadingSuggestions ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl"></div>
                                        ))}
                                    </div>
                                ) : suggestedJobs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {suggestedJobs.map((job) => (
                                            <div key={job.id} className="relative group">
                                                <div className="absolute -top-3 -right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                    <Sparkles size={12} />
                                                    {job.match_score}% Phù hợp
                                                </div>
                                                <JobCard
                                                    id={job.id}
                                                    title={job.title}
                                                    companyId=""
                                                    companyName={job.companyName}
                                                    logoUrl={job.logoUrl}
                                                    location={job.location}
                                                    salary={job.salary}
                                                    tags={[]}
                                                    postedDaysAgo={job.postedDaysAgo}
                                                />
                                                <div className="mt-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm group-hover:border-primary/30 transition-all">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Sparkles size={14} className="text-primary" />
                                                        Tại sao gợi ý:
                                                    </p>
                                                    <p className="text-sm text-gray-600 italic leading-relaxed">
                                                        "{job.reason}"
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Sparkles size={30} />
                                        </div>
                                        <h3 className="font-bold text-charcoal mb-2">Chưa có gợi ý phù hợp</h3>
                                        <p className="text-gray-500">Hãy tải lên CV mới để Stitch AI giúp bạn tìm kiếm những cơ hội công việc tốt nhất.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Resume Viewer Modal */}
            {selectedResumeUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
                        <div className="bg-white px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{viewingResume?.fileName || "Xem chi tiết CV"}</h3>
                                    <p className="text-xs text-gray-500">Hệ thống StitchRecruit</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-grow bg-gray-100 relative">
                            {modalLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                                    <p className="text-gray-500 animate-pulse">Đang chuẩn bị bản xem trước...</p>
                                </div>
                            ) : null}
                            <iframe
                                src={selectedResumeUrl}
                                className="w-full h-full border-none"
                                title="Resume Viewer"
                            ></iframe>

                            {/* Fallback button overlay always visible for best UX */}
                            <div className="absolute top-4 right-4 z-10 flex gap-2">
                                <a
                                    href={selectedResumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                                >
                                    Mở trong tab mới
                                    <Eye size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
