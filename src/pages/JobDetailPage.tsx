
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { fetchWithAuth, getAccessToken } from '../utils/auth';
import { X, FileText, CheckCircle2, ChevronRight, Loader2, MessageCircle, Send } from 'lucide-react';
import '../styles/chat.css';

interface Resume {
    id: string;
    resumesId: string;
    fileName: string;
    fileUrl: string;
}

interface JobDetail {
    jobPostId: number;
    title: string;
    description: string;
    requirements: string;
    salaryMin: string;
    salaryMax: string;
    salaryDisplay?: string;
    created_at: string;
    expiredAt?: string;
    company: {
        companyId: string;
        name: string;
        logoUrl: string;
        scale?: string;
        description?: string;
        websiteUrl?: string;
        addressDetail?: string;
    };
    location: {
        name: string;
    };
    category?: {
        name: string;
    };
    level?: {
        name: string;
    };
    skills?: Array<{ name: string }>;
    isSaved?: boolean;
}

export default function JobDetailPage() {
    const { id } = useParams();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [coverLetter, setCoverLetter] = useState('');
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const [saving, setSaving] = useState(false);
    // ── Chat state ───────────────────────────────────────────
    const [showChat, setShowChat] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatSending, setChatSending] = useState(false);
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    // Tính năng mobile detection bằng JS
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 500);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 500);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const checkIsSaved = async () => {
        const token = getAccessToken();
        if (!token || !id) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs`);
            if (response.ok) {
                const json = await response.json();
                const isSaved = (json.data || []).some((item: any) => item.jobPostId === parseInt(id));
                if (isSaved) {
                    setJob(prev => prev ? { ...prev, isSaved: true } : null);
                }
            }
        } catch (error) {
            console.error("Failed to check saved status", error);
        }
    };

    const handleToggleSave = async () => {
        if (!job) return;

        setSaving(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            if (job.isSaved) {
                // Unsave
                const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs/${job.jobPostId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setJob(prev => prev ? { ...prev, isSaved: false } : null);
                    toast.success(' Đã bỏ lưu công việc');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    toast.error(errorData.message || 'Lỗi khi bỏ lưu công việc');
                }
            } else {
                // Save
                const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs`, {
                    method: 'POST',
                    body: JSON.stringify({ jobPostId: job.jobPostId })
                });

                if (response.ok) {
                    setJob(prev => prev ? { ...prev, isSaved: true } : null);
                    toast.success('Đã lưu công việc vào danh sách yêu thích');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    toast.error(errorData.message || 'Lỗi khi lưu công việc');
                }
            }
        } catch (error) {
            console.error('Error toggling save job:', error);
            toast.error('Vui lòng đăng nhập để thực hiện');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const fetchJobDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

                // Use fetchWithAuth for automatic token refresh
                const response = await fetchWithAuth(`${apiUrl}/api/v1/jobs/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch job details');
                }

                const data = await response.json();
                console.log('Job data received:', {
                    salaryMin: data.data?.salaryMin,
                    salaryMax: data.data?.salaryMax,
                    salaryDisplay: data.data?.salaryDisplay
                });
                setJob(data.data || data);
            } catch (err: any) {
                console.error("Error fetching job:", err);
                setError(err.message || 'Could not load job details');
            } finally {
                setLoading(false);
            }
        };

        checkIsSaved();
        checkApplicationStatus();
        fetchJobDetail();
    }, [id]);

    // ── Chat helpers ─────────────────────────────────────────
    /**
     * Mở / bắt đầu cuộc trò chuyện với nhà tuyển dụng.
     * API POST /api/v1/conversations sẽ trả về conversationId (hoặc tìm conv đã tồn tại).
     */
    const handleOpenChat = async () => {
        const token = getAccessToken();
        if (!token) {
            toast.error('Vui lòng đăng nhập để nhắn tin');
            return;
        }
        if (!job) return;
        setShowChat(true);
        // Lấy userId nếu chưa có
        if (!currentUserId) {
            try {
                const profileRes = await fetchWithAuth(`${apiUrl}/api/v1/users/profile`);
                if (profileRes.ok) {
                    const profileJson = await profileRes.json();
                    setCurrentUserId(profileJson.data?.userId || null);
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
            }
        }
        // Nếu đã có conv rồi thì chỉ mở lại
        if (activeConvId) {
            fetchChatMessages(activeConvId);
            return;
        }
        setChatLoading(true);
        try {
            const body: Record<string, string> = {
                companyId: job.company.companyId
            };
            const res = await fetchWithAuth(`${apiUrl}/api/v1/conversations`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const json = await res.json();
                const convId = json.data?.conversationsId || json.data?.conversationId || json.conversationsId;
                if (convId) {
                    setActiveConvId(convId);
                    await fetchChatMessages(convId);
                }
            } else {
                // Nếu conv đã tồn tại, thử lấy danh sách conversations để tìm
                const listRes = await fetchWithAuth(`${apiUrl}/api/v1/conversations`);
                if (listRes.ok) {
                    const listJson = await listRes.json();
                    const existing = (listJson.data || []).find(
                        (c: any) => c.company && String(c.company.companyId) === String(job.company.companyId)
                    );
                    if (existing) {
                        setActiveConvId(existing.conversationsId);
                        await fetchChatMessages(existing.conversationsId);
                    }
                }
            }
        } catch (err) {
            console.error('Error opening chat:', err);
            toast.error('Không thể mở cuộc trò chuyện');
        } finally {
            setChatLoading(false);
        }
    };

    const fetchChatMessages = async (convId: number) => {
        try {
            const res = await fetchWithAuth(`${apiUrl}/api/v1/conversations/${convId}/messages`);
            if (res.ok) {
                const json = await res.json();
                const list = Array.isArray(json) ? json : (json.data || json.content || []);
                setChatMessages(list);
            }
        } catch (err) {
            console.error('Error fetching chat messages:', err);
        }
    };

    const handleSendChatMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !activeConvId || chatSending) return;
        const content = chatInput.trim();
        setChatInput('');
        setChatSending(true);
        try {
            const res = await fetchWithAuth(`${apiUrl}/api/v1/messages`, {
                method: 'POST',
                body: JSON.stringify({ conversationId: activeConvId, content })
            });
            if (res.ok) {
                await fetchChatMessages(activeConvId);
            } else {
                toast.error('Gửi tin nhắn thất bại');
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setChatSending(false);
        }
    };

    // Polling mỗi 5s khi chat đang mở
    useEffect(() => {
        if (showChat && activeConvId) {
            chatPollRef.current = setInterval(() => fetchChatMessages(activeConvId), 5000);
        }
        return () => {
            if (chatPollRef.current) clearInterval(chatPollRef.current);
        };
    }, [showChat, activeConvId]);

    // Scroll xuống cuối khi có tin mới
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const checkApplicationStatus = async () => {
        const token = getAccessToken();
        if (!token || !id) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/applications/status/${id}`);
            if (response.ok) {
                const json = await response.json();
                if (json.data?.hasApplied) {
                    setHasApplied(true);
                }
            }
        } catch (error) {
            console.error("Failed to check application status", error);
        }
    };

    const fetchUserResumes = async () => {
        setLoadingResumes(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/resumes`);
            if (response.ok) {
                const json = await response.json();
                const mappedResumes = (json.data || []).map((r: any) => ({
                    ...r,
                    id: r.id || r.resumesId || r.resumeId,
                    resumesId: r.resumesId || r.id || r.resumeId
                }));
                setResumes(mappedResumes);
                if (mappedResumes.length > 0) {
                    setSelectedResumeId(mappedResumes[0].resumesId);
                }
            }
        } catch (error) {
            console.error("Failed to fetch resumes", error);
        } finally {
            setLoadingResumes(false);
        }
    };

    const handleApplyClick = () => {
        const token = getAccessToken();
        if (!token) {
            toast.error("Vui lòng đăng nhập để ứng tuyển");
            return;
        }
        if (hasApplied) {
            toast.info("Bạn đã ứng tuyển công việc này rồi");
            return;
        }
        setShowApplyModal(true);
        fetchUserResumes();
    };

    const handleSubmitApplication = async () => {
        if (!selectedResumeId) {
            toast.error("Vui lòng chọn hoặc tải lên CV của bạn");
            return;
        }

        setApplying(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/applications`, {
                method: 'POST',
                body: JSON.stringify({
                    jobPostId: parseInt(id!),
                    resumesId: parseInt(selectedResumeId),
                    cover_letter: coverLetter
                })
            });

            if (response.ok) {
                toast.success("Ứng tuyển thành công! Nhà tuyển dụng sẽ xem hồ sơ của bạn sớm.");
                setHasApplied(true);
                setShowApplyModal(false);
            } else {
                const errJson = await response.json();
                toast.error(errJson.message || "Ứng tuyển thất bại. Vui lòng thử lại sau.");
            }
        } catch (error) {
            console.error("Error applying:", error);
            toast.error("Lỗi hệ thống khi gửi đơn ứng tuyển");
        } finally {
            setApplying(false);
        }
    };

    const calculateDaysAgo = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} ngày trước` : 'Hôm nay';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatSalary = (min: string, max: string) => {
        // Log to debug
        console.log('formatSalary called with:', { min, max, salaryDisplay: job?.salaryDisplay });

        const minNum = parseFloat(min);
        const maxNum = parseFloat(max);

        const formatNumber = (num: number) => {
            if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
            return num.toLocaleString('vi-VN');
        };

        // If we have both min and max values, format and display them
        if (minNum > 0 && maxNum > 0) {
            return `${formatNumber(minNum)} - ${formatNumber(maxNum)} VND`;
        }
        // If we have only min
        if (minNum > 0) {
            return `Từ ${formatNumber(minNum)} VND`;
        }
        // If we have only max
        if (maxNum > 0) {
            return `Đến ${formatNumber(maxNum)} VND`;
        }

        // If no salary values, use salaryDisplay from API or default
        return job?.salaryDisplay || 'Thỏa thuận';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy việc làm</h2>
                        <p className="text-gray-500">{error || 'Công việc này có thể đã bị xóa hoặc không còn tồn tại.'}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-20 pb-16">
                {/* Job Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-4">
                                    <img src={job.company?.logoUrl || 'https://via.placeholder.com/150'} alt={job.company?.name} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-charcoal mb-2">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <Link to={`/companies/${job.company?.companyId}`} className="font-medium text-primary hover:underline cursor-pointer">{job.company?.name}</Link>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {job.location?.name}
                                        </span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {calculateDaysAgo(job.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleApplyClick}
                                    disabled={hasApplied}
                                    className={`flex-1 sm:flex-none justify-center px-8 py-3 font-bold rounded-full shadow-lg transition-all ${hasApplied
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
                                            : 'bg-primary text-white hover:bg-blue-600 hover:shadow-blue-200 active:scale-95'
                                        }`}
                                >
                                    {hasApplied ? (
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 size={18} />
                                            Đã ứng tuyển
                                        </span>
                                    ) : (
                                        "Ứng tuyển ngay"
                                    )}
                                </button>
                                {/* ── Nút Nhắn tin ── */}
                                <button
                                    id="job-chat-btn"
                                    onClick={handleOpenChat}
                                    className="chat-btn flex-1 sm:flex-none justify-center"
                                >
                                    <MessageCircle size={18} />
                                    Nhắn tin
                                </button>
                                <button
                                    onClick={handleToggleSave}
                                    disabled={saving}
                                    className={`flex-1 sm:flex-none justify-center px-4 py-3 border font-medium rounded-full transition-colors shadow-sm ${job.isSaved
                                        ? 'bg-primary text-white border-primary border-primary'
                                        : 'bg-white text-charcoal border-gray-200 hover:bg-gray-50'
                                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? 'Đang xử lý...' : job.isSaved ? 'Đã lưu' : 'Lưu tin'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h2 className="text-xl font-bold text-charcoal mb-4">Chi tiết công việc</h2>
                                <div className="space-y-4 text-gray-600 leading-relaxed whitespace-pre-line">
                                    <p>{job.description}</p>
                                </div>
                            </section>

                            <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h2 className="text-xl font-bold text-charcoal mb-4">Yêu cầu công việc</h2>
                                <div className="space-y-3 text-gray-600 whitespace-pre-line">
                                    {job.requirements}
                                </div>
                            </section>

                            {job.skills && job.skills.length > 0 && (
                                <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                    <h2 className="text-xl font-bold text-charcoal mb-4">Kỹ năng yêu cầu</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                                            >
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-charcoal mb-4">Thông tin chung</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Mức lương</p>
                                        <p className="font-semibold text-green-600">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Địa điểm</p>
                                        <p className="font-semibold text-charcoal">{job.location?.name}</p>
                                    </div>
                                    {job.category && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Lĩnh vực</p>
                                            <p className="font-semibold text-charcoal">{job.category.name}</p>
                                        </div>
                                    )}
                                    {job.level && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Cấp bậc</p>
                                            <p className="font-semibold text-charcoal">{job.level.name}</p>
                                        </div>
                                    )}
                                    {job.expiredAt && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Hạn nộp hồ sơ</p>
                                            <p className="font-semibold text-red-600">{formatDate(job.expiredAt)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-charcoal mb-4">Về công ty</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <Link to={`/companies/${job.company?.companyId}`}>
                                        <img src={job.company?.logoUrl || 'https://via.placeholder.com/150'} alt={job.company?.name} className="w-12 h-12 object-contain" />
                                    </Link>
                                    <div>
                                        <Link to={`/companies/${job.company?.companyId}`}>
                                            <h4 className="font-bold text-charcoal hover:text-primary transition-colors">{job.company?.name}</h4>
                                        </Link>
                                        {job.company?.scale && (
                                            <p className="text-sm text-gray-500">Quy mô: {job.company.scale} nhân viên</p>
                                        )}
                                    </div>
                                </div>
                                {job.company?.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{job.company.description}</p>
                                )}
                                {job.company?.addressDetail && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                                        <p className="text-sm text-gray-700">{job.company.addressDetail}</p>
                                    </div>
                                )}
                                {job.company?.websiteUrl && (
                                    <a
                                        href={job.company.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline mb-4 block"
                                    >
                                        {job.company.websiteUrl}
                                    </a>
                                )}
                                <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                    Theo dõi công ty
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />

            {/* ── Chat Popup — render qua Portal lên document.body ──
                Lý do: Header có backdrop-blur-sm tạo stacking context riêng,
                nếu chat nằm trong cùng parent thì z-index: 9999 bị trap.
                Portal đưa chat ra ngoài mọi stacking context → luôn ở trên cùng.
            */}
            {showChat && job && ReactDOM.createPortal(
                <div
                    className={`chat-overlay ${isMobile ? 'is-mobile' : ''}`}
                    id="job-chat-overlay"
                    onClick={(e) => {
                        // Đóng chat khi click backdrop (chỉ trên mobile)
                        if (e.target === e.currentTarget && isMobile) setShowChat(false);
                    }}
                >
                    <div className="chat-box" id="job-chat-box">
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-row">
                                {job.company?.logoUrl ? (
                                    <img
                                        src={job.company.logoUrl}
                                        alt={job.company.name}
                                        className="chat-header-avatar"
                                    />
                                ) : (
                                    <div className="chat-header-avatar-fallback">
                                        {job.company?.name?.charAt(0) || 'C'}
                                    </div>
                                )}
                                <div className="chat-header-info">
                                    <div className="chat-header-name">{job.company?.name}</div>
                                    <div className="chat-header-sub">Nhà tuyển dụng · {job.title}</div>
                                </div>
                                <button
                                    id="job-chat-close-btn"
                                    className="chat-close-btn"
                                    onClick={() => setShowChat(false)}
                                    aria-label="Đóng chat"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        {chatLoading ? (
                            <div className="chat-loading">
                                <div className="chat-spinner" />
                            </div>
                        ) : !getAccessToken() ? (
                            <div className="chat-login-prompt">
                                <p>Bạn cần đăng nhập để nhắn tin với nhà tuyển dụng.</p>
                                <Link to="/login">Đăng nhập ngay</Link>
                            </div>
                        ) : (
                            <>
                                <div className="chat-messages">
                                    {chatMessages.length === 0 ? (
                                        <div className="chat-messages-empty">
                                            <MessageCircle size={40} />
                                            <p>Bắt đầu cuộc trò chuyện</p>
                                            <span>Gửi tin nhắn đến {job.company?.name}</span>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg: any, idx: number) => {
                                            const isMe = currentUserId
                                                ? String(msg.senderId) === String(currentUserId)
                                                : false;
                                            const time = msg.createdAt
                                                ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                                : '';
                                            return (
                                                <div key={msg.messageId || idx} className={`chat-msg-row ${isMe ? 'me' : 'them'}`}>
                                                    <div className="chat-bubble">
                                                        {msg.content}
                                                        {time && <span className="chat-bubble-time">{time}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <form className="chat-input-area" onSubmit={handleSendChatMessage}>
                                    <input
                                        id="job-chat-input"
                                        className="chat-input"
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        disabled={chatSending}
                                        autoComplete="off"
                                    />
                                    <button
                                        id="job-chat-send-btn"
                                        type="submit"
                                        className="chat-send-btn"
                                        disabled={!chatInput.trim() || chatSending}
                                        aria-label="Gửi tin nhắn"
                                    >
                                        {chatSending
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Send size={16} />}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Application Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !applying && setShowApplyModal(false)}></div>
                    <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-300">
                        <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Nộp đơn ứng tuyển</h3>
                                <p className="text-gray-500 text-sm mt-1">{job.title}</p>
                            </div>
                            <button
                                onClick={() => !applying && setShowApplyModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Resume Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Chọn CV ứng tuyển</label>
                                    <Link to="/resumes" target="_blank" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                        Quản lý CV
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>

                                {loadingResumes ? (
                                    <div className="h-32 bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="animate-spin text-primary" size={24} />
                                        <p className="text-sm text-gray-500">Đang tải danh sách CV của bạn...</p>
                                    </div>
                                ) : resumes.length > 0 ? (
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {resumes.map((resume) => (
                                            <div
                                                key={resume.resumesId}
                                                onClick={() => setSelectedResumeId(resume.resumesId)}
                                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedResumeId === resume.resumesId
                                                        ? 'border-primary bg-blue-50/50'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedResumeId === resume.resumesId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className={`font-bold text-sm truncate ${selectedResumeId === resume.resumesId ? 'text-primary' : 'text-gray-700'}`}>
                                                        {resume.fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">PDF Document</p>
                                                </div>
                                                {selectedResumeId === resume.resumesId && <CheckCircle2 className="text-primary" size={20} />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                        <p className="text-sm text-red-600 mb-4">Bạn chưa có CV nào trong hệ thống.</p>
                                        <Link
                                            to="/resumes"
                                            className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all inline-block"
                                        >
                                            Tải CV lên ngay
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Cover Letter */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Thư giới thiệu (Không bắt buộc)</label>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Viết một đoạn ngắn giới thiệu bản thân và lý do bạn phù hợp với công việc này..."
                                    className="w-full h-32 px-4 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-gray-700"
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => !applying && setShowApplyModal(false)}
                                disabled={applying}
                                className="flex-1 px-8 py-3 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmitApplication}
                                disabled={applying || resumes.length === 0}
                                className="flex-1 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-blue-600 shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {applying ? <Loader2 className="animate-spin" size={20} /> : null}
                                {applying ? "Đang gửi đơn..." : "Xác nhận ứng tuyển"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

