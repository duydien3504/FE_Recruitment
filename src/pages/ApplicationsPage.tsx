
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchWithAuth } from '../utils/auth';
import { toast } from 'sonner';
import {
    Briefcase,
    Calendar,
    Clock,
    ChevronRight,
    FileText,
    MapPin,
    Building2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    MonitorIcon,
    MapIcon,
    History,
    X,
    Eye,
    Download
} from 'lucide-react';

interface Application {
    applicationId: number;
    status: string;
    coverletter: string;
    created_at: string;
    jobPost: {
        jobPostId: number;
        title: string;
        company: {
            name: string;
            logoUrl: string;
        };
        location: {
            name: string;
        };
    };
}

interface ApplicationDetail extends Application {
    jobPost: {
        jobPostId: number;
        title: string;
        description: string;
        requirements: string;
        company: {
            name: string;
            logoUrl: string;
        };
        location: {
            name: string;
        };
    };
    resume: {
        fileName: string;
        fileUrl: string;
    };
}

interface Interview {
    interviewId: number;
    interviewTime: string;
    type: string;
    location: string | null;
    meetingLink: string | null;
    note: string | null;
    status: string;
    application: {
        jobPost: {
            jobPostId: number;
            title: string;
            companyId: string;
            company: {
                companyId: string;
                name: string;
                logoUrl: string;
                addressDetail: string;
            }
        }
    }
}

export default function ApplicationsPage() {
    const [activeTab, setActiveTab] = useState<'history' | 'interviews'>('history');
    const [applications, setApplications] = useState<Application[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/candidate/applications`);
            if (response.ok) {
                const json = await response.json();
                setApplications(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch applications", error);
            toast.error("Không thể tải lịch sử ứng tuyển");
        } finally {
            setLoading(false);
        }
    };

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/candidate/interviews`);
            if (response.ok) {
                const json = await response.json();
                setInterviews(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch interviews", error);
            toast.error("Không thể tải lịch phỏng vấn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchApplications();
        } else {
            fetchInterviews();
        }
    }, [activeTab]);

    const handleViewDetail = async (id: number) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/candidate/applications/${id}`);
            if (response.ok) {
                const json = await response.json();
                setSelectedApplication(json.data);
            } else {
                toast.error("Không thể tải chi tiết ứng tuyển");
            }
        } catch (error) {
            console.error("Error fetching application detail:", error);
            toast.error("Lỗi hệ thống khi tải chi tiết");
        }
    };

    const handlePreviewCV = async (fileUrl: string, fileName: string) => {
        setPreviewLoading(true);
        setIsPreviewOpen(true);
        try {
            // Use fetch with auth to get the file as a blob
            // This bypasses Content-Disposition: attachment headers
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            setPreviewUrl(url);
        } catch (error) {
            console.error("Failed to preview CV", error);
            toast.error("Không thể mở bản xem trước. Bạn có thể tải trực tiếp file.");
            // Fallback: open in new tab
            window.open(fileUrl, '_blank');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleDownloadCV = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const closePreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setIsPreviewOpen(false);
    };

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Clock size={14} />, label: 'Đang chờ' };
            case 'REVIEWING':
                return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Loader2 size={14} className="animate-spin" />, label: 'Đang xem xét' };
            case 'ACCEPTED':
            case 'APPROVED':
                return { bg: 'bg-green-50', text: 'text-green-600', icon: <CheckCircle2 size={14} />, label: 'Đã chấp nhận' };
            case 'REJECTED':
                return { bg: 'bg-red-50', text: 'text-red-600', icon: <XCircle size={14} />, label: ' Đã từ chối' };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-600', icon: <AlertCircle size={14} />, label: status };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-28 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-charcoal mb-2">Việc làm đã ứng tuyển</h1>
                        <p className="text-gray-500">Theo dõi trạng thái các đơn ứng tuyển và lịch phỏng vấn của bạn.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-8 border-b border-gray-200 mb-8">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'history' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <div className="flex items-center gap-2">
                                <History size={20} />
                                Lịch sử ứng tuyển
                            </div>
                            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('interviews')}
                            className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'interviews' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={20} />
                                Cuộc hẹn phỏng vấn
                            </div>
                            {activeTab === 'interviews' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                                <p className="text-gray-500">Đang tải dữ liệu...</p>
                            </div>
                        ) : activeTab === 'history' ? (
                            applications.length > 0 ? (
                                applications.map((app) => (
                                    <div
                                        key={app.applicationId}
                                        onClick={() => handleViewDetail(app.applicationId)}
                                        className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2">
                                                <img src={app.jobPost.company.logoUrl} alt={app.jobPost.company.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-lg">{app.jobPost.title}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1"><Building2 size={14} /> {app.jobPost.company.name}</span>
                                                    <span className="flex items-center gap-1"><MapPin size={14} /> {app.jobPost.location.name}</span>
                                                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(app.created_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${getStatusStyle(app.status).bg} ${getStatusStyle(app.status).text}`}>
                                                {getStatusStyle(app.status).icon}
                                                {getStatusStyle(app.status).label}
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-300">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <Briefcase size={40} />
                                    </div>
                                    <h2 className="text-xl font-bold text-charcoal mb-2">Bạn chưa ứng tuyển công việc nào</h2>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Khám phá hàng ngàn cơ hội việc làm hấp dẫn và bắt đầu sự nghiệp của bạn ngay hôm nay.</p>
                                    <button
                                        onClick={() => window.location.href = '/jobs'}
                                        className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
                                    >
                                        Tìm việc ngay
                                    </button>
                                </div>
                            )
                        ) : (
                            interviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {interviews.map((interview) => (
                                        <div key={interview.interviewId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-primary">
                                            <div className="p-6">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                        <img src={interview.application?.jobPost?.company?.logoUrl || '/placeholder.png'} alt={interview.application?.jobPost?.company?.name || 'Company'} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 line-clamp-1">Phỏng vấn {interview.type || ''}</h4>
                                                        <p className="text-xs text-gray-500">{interview.application?.jobPost?.company?.name || 'Công ty'} • {interview.application?.jobPost?.title || 'Vị trí ứng tuyển'}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                            <Calendar size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Thời gian</p>
                                                            <p className="text-sm font-bold text-gray-700">
                                                                {interview.interviewTime ? new Date(interview.interviewTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Chưa cập nhật'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{interview.interviewTime ? new Date(interview.interviewTime).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                                                            {interview.type?.toUpperCase() === 'ONLINE' ? <MonitorIcon size={16} /> : <MapIcon size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Hình thức & Địa điểm</p>
                                                            <p className="text-sm font-bold text-gray-700">{interview.type?.toUpperCase() === 'ONLINE' ? 'Phỏng vấn Online' : 'Phỏng vấn Offline'}</p>
                                                            <p className="text-xs text-gray-500 line-clamp-1">{interview.location || 'Chưa cập nhật'}</p>
                                                        </div>
                                                    </div>

                                                    {interview.note && (
                                                        <div className="flex items-start gap-3 mt-2">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                                                                <FileText size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ghi chú</p>
                                                                <p className="text-sm font-medium text-gray-700">{interview.note}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                        {interview.status || 'SCHEDULED'}
                                                    </div>
                                                    {interview.type?.toUpperCase() === 'ONLINE' && interview.meetingLink && (
                                                        <a
                                                            href={interview.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            Tham gia họp
                                                            <ChevronRight size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-300">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <Calendar size={40} />
                                    </div>
                                    <h2 className="text-xl font-bold text-charcoal mb-2">Chưa có lịch phỏng vấn nào</h2>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Lịch phỏng vấn sẽ xuất hiện tại đây sau khi nhà tuyển dụng chấp nhận đơn ứng tuyển của bạn.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>

            {/* Application Detail Modal */}
            {selectedApplication && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedApplication(null)}></div>
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300 flex flex-col">
                        <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl p-2 border border-gray-100">
                                    <img src={selectedApplication.jobPost.company.logoUrl} alt={selectedApplication.jobPost.company.name} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedApplication.jobPost.title}</h3>
                                    <p className="text-gray-500 text-sm">{selectedApplication.jobPost.company.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${getStatusStyle(selectedApplication.status).bg} ${getStatusStyle(selectedApplication.status).text}`}>
                                    {getStatusStyle(selectedApplication.status).icon}
                                    {getStatusStyle(selectedApplication.status).label}
                                </div>
                                <button
                                    onClick={() => setSelectedApplication(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-8">
                                    <section>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thư giới thiệu</h4>
                                        <div className="bg-gray-50 p-6 rounded-2xl italic text-gray-700 leading-relaxed border border-gray-100">
                                            "{selectedApplication.coverletter || 'Không có thư giới thiệu'}"
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Chi tiết công việc</h4>
                                        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line bg-white border border-gray-100 p-6 rounded-2xl">
                                            {selectedApplication.jobPost.description}
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Yêu cầu công việc</h4>
                                        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line bg-white border border-gray-100 p-6 rounded-2xl">
                                            {selectedApplication.jobPost.requirements}
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                        <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">CV đã nộp</h4>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-white text-red-500 rounded-lg flex items-center justify-center shadow-sm">
                                                <FileText size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{selectedApplication.resume.fileName}</p>
                                                <p className="text-xs text-gray-500">Bản PDF</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePreviewCV(selectedApplication.resume.fileUrl, selectedApplication.resume.fileName)}
                                            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md shadow-blue-100"
                                        >
                                            <Eye size={16} />
                                            Xem CV trực tiếp
                                        </button>
                                    </section>

                                    <section className="bg-white p-6 rounded-2xl border border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin bổ sung</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Địa điểm</p>
                                                    <p className="text-sm font-medium text-gray-700">{selectedApplication.jobPost.location.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Thời gian nộp</p>
                                                    <p className="text-sm font-medium text-gray-700">{new Date(selectedApplication.created_at).toLocaleString('vi-VN')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
            {/* PDF Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-charcoal/90 backdrop-blur-md animate-in fade-in duration-300" onClick={closePreview}></div>
                    <div className="relative bg-white w-full max-w-5xl h-full sm:h-[95vh] sm:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300 flex flex-col">
                        {/* Preview Header */}
                        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-900 truncate">{selectedApplication?.resume.fileName}</h3>
                                    <p className="text-xs text-gray-500">Xem trước tài liệu</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {previewUrl && (
                                    <button
                                        onClick={() => handleDownloadCV(previewUrl, selectedApplication?.resume.fileName || 'resume.pdf')}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all"
                                    >
                                        <Download size={18} />
                                        <span>Tải về</span>
                                    </button>
                                )}
                                <button
                                    onClick={closePreview}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-grow bg-gray-100 relative overflow-hidden">
                            {previewLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 z-20">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                    <p className="text-gray-600 font-medium">Đang chuẩn bị bản xem trước...</p>
                                </div>
                            ) : null}

                            {previewUrl ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title="CV Preview"
                                ></iframe>
                            ) : !previewLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                    <AlertCircle size={48} className="text-amber-500 mb-4" />
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">Không thể hiển thị bản xem trước</h4>
                                    <p className="text-gray-500 mb-6 max-w-md">Chúng tôi gặp sự cố khi hiển thị file PDF này trực tiếp. Bạn vẫn có thể tải về để xem máy tính.</p>
                                    <a
                                        href={selectedApplication?.resume.fileUrl}
                                        download
                                        className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
                                    >
                                        Tải CV về máy
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

