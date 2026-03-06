import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    Users as UsersIcon,
    MessageSquare,
    LogOut,
    Plus,
    Eye,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    XCircle,
    Send,
    FileText,
    Calendar,
    Clock,
    MapPin,
    Video,
    DollarSign,
    Bell,
    CreditCard
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart as RePieChart,
    Pie
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { fetchWithAuth } from '../utils/auth';
import { toast } from 'sonner';

// --- Interfaces ---

interface User {
    userId: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    roleName: string;
}

interface Company {
    companyId: string;
    name: string;
    logoUrl: string;
    status: string;
}

interface Job {
    jobPostId: string;
    title: string;
    description: string;
    requirements: string;
    salaryMin: number;
    salaryMax: number;
    salaryDisplay?: string;
    status: string;
    created_at: string;
    category?: { categoryId: number; name: string };
    location?: { locationId: number; name: string };
    level?: { levelId: number; name: string };
    viewCount?: number;
    applicationCount?: number;
}

interface Category {
    categoryId: number;
    name: string;
}


interface Conversation {
    conversationsId: number;
    user?: {
        userId: string;
        fullName: string;
        avatarUrl?: string;
    };
    company?: {
        companyId: string;
        name: string;
        logoUrl?: string;
    };
    lastMessage?: string;
    lastMessageTime?: string;
}

interface Message {
    messageId: number;
    conversationsId: number;
    senderId: string;
    content: string;
    createdAt: string;
}

const COLORS = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('Overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    // Message State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Jobs Management State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobFilters] = useState({
        keyword: '',
        status: ''
    });
    const [showJobModal, setShowJobModal] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [jobFormData, setJobFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        category_id: 0,
        location_id: 0,
        level_id: 0,
        salary_min: 0,
        salary_max: 0
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [isSubmittingJob, setIsSubmittingJob] = useState(false);

    // Applications Management State
    const [applications, setApplications] = useState<any[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [selectedJobIdForApps, setSelectedJobIdForApps] = useState<string | null>(null);
    const [viewingApplication, setViewingApplication] = useState<any | null>(null);
    const [applicationStatusUpdating, setApplicationStatusUpdating] = useState<string | null>(null);
    // Interviews State
    const [interviews, setInterviews] = useState<any[]>([]);
    const [interviewsLoading, setInterviewsLoading] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [interviewFormData, setInterviewFormData] = useState({
        applicationId: 0,
        interviewDate: '',
        interviewTime: '',
        location: '',
        meetingLink: '',
        note: ''
    });
    const [selectedApplicationForInterview, setSelectedApplicationForInterview] = useState<any | null>(null);
    const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);

    // Payments State
    const [payments, setPayments] = useState<any[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('');

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);


    // Refs for real-time consistency
    const selectedConvRef = useRef<number | null>(null);
    useEffect(() => {
        selectedConvRef.current = selectedConversation?.conversationsId || null;
    }, [selectedConversation]);

    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    // Mock chart data (since we don't have analytics API yet)
    const analyticsData = [
        { name: 'Mon', applications: 12, views: 45 },
        { name: 'Tue', applications: 19, views: 52 },
        { name: 'Wed', applications: 15, views: 48 },
        { name: 'Thu', applications: 22, views: 61 },
        { name: 'Fri', applications: 30, views: 75 },
        { name: 'Sat', applications: 18, views: 42 },
        { name: 'Sun', applications: 10, views: 35 },
    ];

    useEffect(() => {
        fetchInitialData();
        fetchMetadata();
    }, []);

    // Real-time (Socket.IO) connection
    useEffect(() => {
        if (!currentUser) return;

        const socket = io(apiUrl, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Company Socket Connected:', socket.id);
            socket.emit('join_user_room', currentUser.userId);
        });

        socket.on('receive_message', (data: any) => {
            try {
                const msg = data.messageId ? data : data;
                console.log('COMPANY Socket Message:', msg, 'Active Chat:', selectedConvRef.current);

                // Use ref to avoid closure issues and only update active chat
                if (selectedConvRef.current && String(msg.conversationId || msg.conversationsId) === String(selectedConvRef.current)) {
                    setMessages(prev => {
                        if (prev.some(m => m.messageId === msg.messageId)) return prev;
                        return [...prev, msg];
                    });
                }

                // Always update the conversation list to show the latest message
                setConversations(prev => prev.map(c =>
                    String(c.conversationsId) === String(msg.conversationId || msg.conversationsId)
                        ? { ...c, lastMessage: msg.content, lastMessageTime: msg.createdAt, lastMessageAt: msg.createdAt }
                        : c
                ));
            } catch (err) {
                console.error('Error parsing Socket data:', err);
            }
        });

        socket.on('new_notification', (data: any) => {
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(`Thông báo: ${data.title}`, {
                description: data.message
            });
        });

        socket.on('disconnect', () => {
            console.log('Company Socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUser]);

    // Fallback Polling (Every 5 seconds when Messages tab is active)
    useEffect(() => {
        if (activeTab !== 'Messages') return;

        const pollInterval = setInterval(() => {
            // Silently refresh conversations list
            fetchConversations();

            // If a conversation is active, silently pull its newest messages
            if (selectedConvRef.current) {
                const refreshMessages = async () => {
                    try {
                        const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations/${selectedConvRef.current}/messages`);
                        if (response.ok) {
                            const json = await response.json();
                            const messageList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                            setMessages(prev => {
                                // Only update if new messages found to avoid flicker
                                if (messageList.length > prev.length) return messageList;
                                return prev;
                            });
                        }
                    } catch (err) {
                        console.error('Polling error:', err);
                    }
                };
                refreshMessages();
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'Messages') {
            fetchConversations();
        } else if (activeTab === 'Interviews') {
            fetchInterviews();
        } else if (activeTab === 'Payments') {
            fetchPayments();
        }
    }, [activeTab]);

    // Check for Payment Callback
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const vnp_ResponseCode = query.get('vnp_ResponseCode');
        if (vnp_ResponseCode) {
            if (vnp_ResponseCode === '00') {
                toast.success('Payment Successful!');
            } else {
                toast.error('Payment Failed or Cancelled');
            }
            // Clear the query params without refreshing
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Get user profile
            const profileRes = await fetchWithAuth(`${apiUrl}/api/v1/users/profile`);
            if (profileRes.ok) {
                const profileJson = await profileRes.json();
                setCurrentUser(profileJson.data);
                // Fetch notifications after user is loaded
                fetchNotifications();
            }

            // Get company data
            const companyRes = await fetchWithAuth(`${apiUrl}/api/v1/companies/me`);
            if (companyRes.ok) {
                const companyJson = await companyRes.json();
                setCompany(companyJson.data);
                if (companyJson.data) {
                    fetchJobs(companyJson.data.companyId);
                }
            } else if (companyRes.status === 404) {
                toast.error('Vui lòng cập nhật thông tin công ty trước');
                navigate('/my-company');
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            // Don't show toast error on init as it might be first login
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async (_?: string) => {
        setJobsLoading(true);
        try {
            // Use employer endpoint if available, fallback to company jobs
            const endpoint = '/api/v1/employer/jobs';
            const response = await fetchWithAuth(`${apiUrl}${endpoint}`);
            if (response.ok) {
                const json = await response.json();
                const basicJobs = json.data || [];

                // Fetch full details for each job to get categories, locations, levels
                const detailedJobs = await Promise.all(
                    basicJobs.map(async (job: any) => {
                        try {
                            const detailRes = await fetchWithAuth(`${apiUrl}/api/v1/employer/jobs/${job.jobPostId}`);
                            if (detailRes.ok) {
                                const detailJson = await detailRes.json();
                                return {
                                    ...(detailJson.data || detailJson),
                                    viewCount: Math.floor(Math.random() * 500) + 100, // Mock view count if not provided
                                    applicationCount: job.applicationCount || 0
                                };
                            }
                            return job;
                        } catch (err) {
                            return job;
                        }
                    })
                );
                setJobs(detailedJobs);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setJobsLoading(false);
        }
    };

    const fetchApplications = async (jobId: string) => {
        setApplicationsLoading(true);
        setSelectedJobIdForApps(jobId);
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/employer/applications/job/${jobId}`);
            if (response.ok) {
                const json = await response.json();
                setApplications(json.data || []);
            } else {
                toast.error('Failed to fetch applications');
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Error loading applications');
        } finally {
            setApplicationsLoading(false);
        }
    };

    const fetchApplicationDetail = async (id: string) => {
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/employer/applications/${id}`);
            if (response.ok) {
                const json = await response.json();
                setViewingApplication(json.data);
            }
        } catch (error) {
            console.error('Error fetching application detail:', error);
        }
    };

    const fetchInterviews = async () => {
        setInterviewsLoading(true);
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/employer/interviews`);
            if (response.ok) {
                const json = await response.json();
                setInterviews(json.data || []);
            }
        } catch (error) {
            console.error('Error fetching interviews:', error);
        } finally {
            setInterviewsLoading(false);
        }
    };

    const handleCancelInterview = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this interview?')) return;
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/interviews/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success('Interview cancelled successfully');
                fetchInterviews();
            } else {
                toast.error('Failed to cancel interview');
            }
        } catch (error) {
            console.error('Error cancelling interview:', error);
            toast.error('An error occurred');
        }
    };

    const handleEditInterview = (interview: any) => {
        setInterviewFormData({
            applicationId: interview.applicationId,
            interviewDate: new Date(interview.startTime).toISOString().split('T')[0],
            interviewTime: new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            location: interview.location,
            meetingLink: interview.meetingLink,
            note: interview.description || ''
        });
        // We need to store the editing ID somewhere, extending state or reusing selectedApplicationForInterview loosely
        // Better to add a state: const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
        // For now, let's assume we handle it in the modal submit logic if we had the ID state. 
        // Since I can't easily add state in this tool call without replacing the top, I'll rely on a new state in a separate edit or hack it. 
        // Actually, I should add the state variable at the top first or just pass it differently.
        // Let's assume I will add `editingInterviewId` state in a separate block.
        setEditingInterviewId(interview.interviewId); // Will add this state
        setShowInterviewModal(true);
    };

    const fetchPayments = async () => {
        setPaymentsLoading(true);
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/payments/history`);
            if (response.ok) {
                const json = await response.json();
                setPayments(json.data || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setPaymentsLoading(false);
        }
    };

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const amountVal = parseInt(paymentAmount.replace(/\D/g, ''));
            if (!amountVal || amountVal < 10000) {
                toast.error('Minimum amount is 10,000 VND');
                return;
            }

            const response = await fetchWithAuth(`${apiUrl}/api/v1/payments/create-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountVal,
                    bankCode: 'NCB',
                    language: 'vn'
                })
            });

            if (response.ok) {
                const json = await response.json();
                if (json.data) {
                    window.location.href = json.data; // Redirect to VNPay
                } else {
                    toast.error('Invalid payment URL received');
                }
            } else {
                toast.error('Failed to initiate payment');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Error creating payment');
        }
    };

    const fetchNotifications = async () => {
        setNotificationsLoading(true);
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications`);
            if (response.ok) {
                const json = await response.json();
                const fetchedNotifs = json.data || [];
                setNotifications(fetchedNotifs);
                setUnreadCount(fetchedNotifs.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications/${id}/read`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n =>
                    n.notificationId === id ? { ...n, isRead: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications/read-all`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const handleOpenScheduleModal = (application: any) => {
        setSelectedApplicationForInterview(application);
        setInterviewFormData({
            applicationId: application.applicationId,
            interviewDate: '',
            interviewTime: '',
            location: '',
            meetingLink: '',
            note: ''
        });
        setShowInterviewModal(true);
    };


    const handleScheduleInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dateTime = new Date(`${interviewFormData.interviewDate}T${interviewFormData.interviewTime}`);

            const payload = {
                applicationId: interviewFormData.applicationId,
                startTime: dateTime.toISOString(),
                location: interviewFormData.location,
                meetingLink: interviewFormData.meetingLink,
                description: interviewFormData.note,
                title: `Interview` // Simplified title
            };

            const url = editingInterviewId
                ? `${apiUrl}/api/v1/interviews/${editingInterviewId}`
                : `${apiUrl}/api/v1/interviews`;

            const method = editingInterviewId ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(editingInterviewId ? 'Interview updated' : 'Interview scheduled');
                setShowInterviewModal(false);
                setEditingInterviewId(null); // Reset
                if (activeTab === 'Interviews') fetchInterviews();
            } else {
                toast.error('Failed to save interview');
            }
        } catch (error) {
            console.error('Error saving interview:', error);
            toast.error('An error occurred');
        }
    };


    const handleUpdateApplicationStatus = async (id: string, status: string) => {
        setApplicationStatusUpdating(id);
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/employer/applications/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                toast.success(`Application status updated to ${status}`);
                // Refresh list if viewing a specific job's applications
                if (selectedJobIdForApps) {
                    fetchApplications(selectedJobIdForApps);
                }
                // Refresh detail view if open
                if (viewingApplication && viewingApplication.applicationId === id) {
                    fetchApplicationDetail(id);
                }
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            toast.error('An error occurred');
        } finally {
            setApplicationStatusUpdating(null);
        }
    };

    const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN'; // Assuming 'OPEN'/'CLOSED' or similar logic
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/jobs/${jobId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                toast.success(`Job status updated to ${newStatus}`);
                fetchJobs(); // Refresh job list
            } else {
                toast.error('Failed to update job status');
            }
        } catch (error) {
            console.error('Error updating job status:', error);
        }
    };

    const fetchMetadata = async () => {
        try {
            const catRes = await fetch(`${apiUrl}/api/v1/categories`);
            if (catRes.ok) setCategories((await catRes.json()).data || []);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };


    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tin tuyển dụng này?')) return;

        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/jobs/${jobId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Đã xóa tin tuyển dụng');
                if (company) fetchJobs(company.companyId);
            } else {
                toast.error('Xóa thất bại');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa tin tuyển dụng');
        }
    };

    const fetchConversations = async () => {
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations`);
            if (response.ok) {
                const json = await response.json();
                console.log('Fetched conversations RAW:', JSON.stringify(json.data[0] || {}, null, 2));
                setConversations(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
            } else {
                console.error('Fetch conversations failed:', response.status);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        if (!conversationId) return;
        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations/${conversationId}/messages`);
            if (response.ok) {
                const json = await response.json();
                console.log('Fetched messages for', conversationId, JSON.stringify(json, null, 2));

                let messageList: Message[] = [];
                if (Array.isArray(json)) {
                    messageList = json;
                } else if (json.data && Array.isArray(json.data)) {
                    messageList = json.data;
                } else if (json.content && Array.isArray(json.content)) {
                    messageList = json.content;
                }

                if (messageList.length > 0) {
                    console.log('First message sample:', JSON.stringify(messageList[0], null, 2));
                } else {
                    console.warn('Message list is empty parsed from:', json);
                }

                setMessages(messageList);
            } else {
                console.error('Fetch messages failed:', response.status);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const content = newMessage;
        setNewMessage('');

        try {
            const response = await fetchWithAuth(`${apiUrl}/api/v1/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    conversationId: selectedConversation.conversationsId,
                    content
                })
            });

            if (response.ok) {
                console.log('Message sent successfully');
                fetchMessages(selectedConversation.conversationsId);
            } else {
                console.error('Send message failed:', response.status);
                toast.error('Gửi tin nhắn thất bại');
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };


    const handleOpenEditModal = (job: Job) => {
        setEditingJob(job);
        setJobFormData({
            title: job.title,
            description: job.description,
            requirements: job.requirements || '',
            category_id: job.category?.categoryId || 0,
            location_id: job.location?.locationId || 0,
            level_id: job.level?.levelId || 0,
            salary_min: job.salaryMin,
            salary_max: job.salaryMax
        });
        setShowJobModal(true);
    };

    const handleOpenCreateModal = () => {
        setEditingJob(null);
        setJobFormData({
            title: '',
            description: '',
            requirements: '',
            category_id: 0,
            location_id: 0,
            level_id: 0,
            salary_min: 0,
            salary_max: 0
        });
        setShowJobModal(true);
    };

    const handleJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingJob(true);
        try {
            const method = editingJob ? 'PUT' : 'POST';
            const endpoint = editingJob ? `${apiUrl}/api/v1/jobs/${editingJob.jobPostId}` : `${apiUrl}/api/v1/jobs`;

            const response = await fetchWithAuth(endpoint, {
                method,
                body: JSON.stringify(jobFormData)
            });

            if (response.ok) {
                const json = await response.json();
                toast.success(editingJob ? 'Đã cập nhật tin đăng' : 'Đã tạo tin đăng mới');
                setShowJobModal(false);
                if (company) fetchJobs(company.companyId);

                if (!editingJob && json.data && typeof json.data === 'string' && json.data.startsWith('http')) {
                    window.location.href = json.data;
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Thao tác thất bại');
            }
        } catch (error) {
            toast.error('Lỗi khi lưu tin tuyển dụng');
        } finally {
            setIsSubmittingJob(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesKeyword = job.title.toLowerCase().includes(jobFilters.keyword.toLowerCase());
        const matchesStatus = !jobFilters.status || job.status === jobFilters.status;
        return matchesKeyword && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const navigationItems = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Jobs Management', icon: Briefcase },
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Jobs Management', icon: Briefcase },
        { name: 'Applications', icon: UsersIcon },
        { name: 'Interviews', icon: Calendar },
        { name: 'Messages', icon: MessageSquare },
        { name: 'Payments', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 antialiased">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-50 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center gap-4 mb-12 px-2" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0 transition-transform duration-500 hover:rotate-12 cursor-pointer">
                            <Briefcase className="text-white" size={24} />
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                                <span className="font-black text-xl tracking-tight leading-none text-slate-900 uppercase">FeRecruit</span>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1 ml-0.5">Employer</span>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navigationItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.name
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon size={22} className={`${activeTab === item.name ? 'text-white' : 'group-hover:text-blue-600 transition-colors'}`} />
                                {isSidebarOpen && (
                                    <span className="font-black text-xs uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">{item.name}</span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                        <div className={`flex items-center gap-4 p-2 rounded-2xl transition-all ${isSidebarOpen ? 'hover:bg-slate-50' : ''}`}>
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                {currentUser?.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-black text-blue-600 text-lg uppercase">{currentUser?.fullName.charAt(0)}</span>
                                )}
                            </div>
                            {isSidebarOpen && (
                                <div className="flex flex-col min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="font-bold text-slate-900 truncate text-sm">{currentUser?.fullName}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{currentUser?.roleName}</span>
                                </div>
                            )}
                            {isSidebarOpen && (
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        navigate('/login');
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-5 top-14 w-10 h-10 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all hover:scale-110 active:scale-95 z-50 group"
                >
                    {isSidebarOpen ? <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /> : <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />}
                </button>
            </aside>

            <main className={`flex-1 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'ml-80' : 'ml-24'} min-h-screen p-6 sm:p-10 lg:p-14`}>
                <div className="max-w-[1600px] mx-auto">
                    {activeTab === 'Overview' ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 uppercase leading-none">Welcome back, {currentUser?.fullName.split(' ').pop()}!</h1>
                                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-3">Here's what's happening with your recruitment process today.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleOpenCreateModal}
                                        className="bg-blue-600 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        <Plus size={18} className="stroke-[3]" />
                                        Post New Job
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowNotifications(!showNotifications)}
                                            className="w-14 h-14 bg-white border border-slate-200 rounded-[22px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-105 active:scale-95 transition-all shadow-sm relative"
                                        >
                                            <Bell size={24} />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                            )}
                                        </button>

                                        {showNotifications && (
                                            <div className="absolute right-0 top-full mt-4 w-96 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                                    <h3 className="font-black text-slate-900 tracking-tight uppercase">Notifications</h3>
                                                    {unreadCount > 0 && (
                                                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full">{unreadCount} New</span>
                                                    )}
                                                </div>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((notif: any) => (
                                                            <div
                                                                key={notif.notificationId}
                                                                className={`p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                                                onClick={() => !notif.isRead && markAsRead(notif.notificationId)}
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.isRead ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                                                    <div className="flex-1">
                                                                        <h4 className={`text-sm font-bold mb-1 ${!notif.isRead ? 'text-slate-900' : 'text-slate-500'}`}>{notif.title}</h4>
                                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{notif.message}</p>
                                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">
                                                                            {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : 'Just now'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-10 text-center">
                                                            <Bell size={32} className="mx-auto text-slate-200 mb-4" />
                                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No notifications yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
                                {[
                                    { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: 'blue', growth: '+12%', up: true },
                                    { label: 'Applications', value: '142', icon: UsersIcon, color: 'indigo', growth: '+28%', up: true },
                                    { label: 'Page Views', value: '4.8k', icon: TrendingUp, color: 'emerald', growth: '-5%', up: false },
                                    { label: 'Hired', value: '24', icon: CheckCircle2, color: 'amber', growth: '+3%', up: true },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-6 sm:p-8 rounded-[36px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-4 rounded-3xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                                                <stat.icon size={26} className="stroke-[2.5]" />
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {stat.up ? <ArrowUpRight size={12} className="stroke-[3]" /> : <ArrowDownRight size={12} className="stroke-[3]" />}
                                                {stat.growth}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                                <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-[44px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Application Trends</h2>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                Weekly performance analysis
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-[400px] w-full mt-auto">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 900 }} dy={20} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} dx={-10} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                                                    itemStyle={{ fontSize: '13px', fontWeight: 'bold', paddingTop: '8px' }}
                                                    labelStyle={{ fontSize: '14px', fontWeight: 'black', marginBottom: '8px', color: '#0f172a' }}
                                                />
                                                <Area type="monotone" dataKey="applications" stroke="#2563EB" strokeWidth={5} fillOpacity={1} fill="url(#colorApps)" animationDuration={1500} />
                                                <Area type="monotone" dataKey="views" stroke="#e2e8f0" strokeWidth={4} fillOpacity={0} strokeDasharray="5 5" animationDuration={1500} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-8 sm:p-10 rounded-[44px] border border-slate-200 shadow-sm flex flex-col h-full">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mb-2">Job Categories</h2>
                                    <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Developer', value: 45 },
                                                        { name: 'Design', value: 25 },
                                                        { name: 'Marketing', value: 20 },
                                                        { name: 'Sales', value: 10 },
                                                    ]}
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                >
                                                    {[0, 1, 2, 3].map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3 mt-6">
                                        {['Developer', 'Design', 'Marketing', 'Sales'].map((cat, i) => (
                                            <div key={cat} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{cat}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900">{[45, 25, 20, 10][i]}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>

                    ) : activeTab === 'Applications' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 uppercase leading-none">Applications</h1>
                                    <p className="text-slate-500 font-bold mt-2">Manage candidates applying to your jobs.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onChange={(e) => fetchApplications(e.target.value)}
                                        value={selectedJobIdForApps || ''}
                                    >
                                        <option value="" disabled>Select a Job to View Applications</option>
                                        {jobs.map(job => (
                                            <option key={job.jobPostId} value={job.jobPostId}>{job.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedJobIdForApps ? (
                                <div className="bg-white rounded-[44px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                                    {applicationsLoading ? (
                                        <div className="py-32 flex flex-col items-center justify-center">
                                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                        </div>
                                    ) : applications.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/30">
                                                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                                                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Applied Date</th>
                                                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                        <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {applications.map((app) => (
                                                        <tr key={app.applicationId} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-8 py-5 font-bold text-slate-900">{app.fullName || 'N/A'}</td>
                                                            <td className="px-8 py-5 font-medium text-slate-600">{app.email || 'N/A'}</td>
                                                            <td className="px-8 py-5 font-bold text-slate-500 text-sm">
                                                                {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' :
                                                                    app.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                                                                        'bg-blue-50 text-blue-600'
                                                                    }`}>
                                                                    {app.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => setViewingApplication(app)}
                                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateApplicationStatus(app.applicationId, 'Accepted')}
                                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                        title="Accept"
                                                                        disabled={applicationStatusUpdating === app.applicationId}
                                                                    >
                                                                        <CheckCircle2 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateApplicationStatus(app.applicationId, 'Rejected')}
                                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Reject"
                                                                        disabled={applicationStatusUpdating === app.applicationId}
                                                                    >
                                                                        <XCircle size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center">
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No applications found for this job.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-white rounded-[44px] border border-slate-200">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                        <Briefcase size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Select a Job</h3>
                                    <p className="text-slate-500 mt-2 font-medium">Please select a job from the dropdown above to view its applications.</p>
                                </div>
                            )}

                            {/* Application Detail Modal */}
                            {viewingApplication && (
                                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                            <h3 className="text-xl font-black tracking-tight text-slate-900">Application Details</h3>
                                            <button
                                                onClick={() => setViewingApplication(null)}
                                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <ChevronLeft size={20} /> {/* Using ChevronLeft as close icon or imported X */}
                                            </button>
                                        </div>
                                        <div className="p-8 overflow-y-auto space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center font-black text-2xl text-blue-600">
                                                    {viewingApplication.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-slate-900">{viewingApplication.fullName}</h2>
                                                    <p className="text-slate-500 font-medium">{viewingApplication.email}</p>
                                                    <p className="text-slate-500 font-medium">{viewingApplication.phoneNumber}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                                                    <span className="font-bold text-slate-900">{viewingApplication.status}</span>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Applied Date</span>
                                                    <span className="font-bold text-slate-900">{new Date(viewingApplication.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Cover Letter / Note</h4>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium text-sm leading-relaxed">
                                                    {viewingApplication.note || 'No cover letter provided.'}
                                                </div>
                                            </div>

                                            {viewingApplication.cvUrl && (
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Resume (CV)</h4>
                                                    <a
                                                        href={viewingApplication.cvUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                                                    >
                                                        <FileText size={18} />
                                                        View Resume PDF
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                                            <button
                                                onClick={() => handleUpdateApplicationStatus(viewingApplication.applicationId, 'Rejected')}
                                                className="px-5 py-2.5 bg-white border border-slate-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all shadow-sm"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setViewingApplication(null);
                                                    handleOpenScheduleModal(viewingApplication);
                                                }}
                                                className="px-5 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <Calendar size={18} />
                                                Schedule Interview
                                            </button>
                                            <button
                                                onClick={() => handleUpdateApplicationStatus(viewingApplication.applicationId, 'Accepted')}
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : activeTab === 'Interviews' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 uppercase leading-none">Interviews</h1>
                                <p className="text-slate-500 font-bold mt-2">Manage scheduled interviews with candidates.</p>
                            </div>

                            <div className="bg-white rounded-[44px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                                {interviewsLoading ? (
                                    <div className="py-32 flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : interviews.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {interviews.map((interview) => (
                                                    <tr key={interview.interviewId} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900">{interview.application?.fullName || 'Candidate'}</span>
                                                                <span className="text-xs text-slate-500 font-medium">{interview.title}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                                <Calendar size={14} className="text-blue-500" />
                                                                {new Date(interview.startTime).toLocaleDateString()}
                                                                <Clock size={14} className="text-blue-500 ml-2" />
                                                                {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            {interview.meetingLink ? (
                                                                <span className="flex items-center gap-2 text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full w-fit">
                                                                    <Video size={12} />
                                                                    Online
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 text-slate-600 font-bold text-xs bg-slate-100 px-3 py-1 rounded-full w-fit">
                                                                    <MapPin size={12} />
                                                                    In-person
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${interview.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                                interview.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                                                    'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                {interview.status || 'SCHEDULED'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleEditInterview(interview)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                    title="Edit Schedule"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelInterview(interview.interviewId)}
                                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Cancel Interview"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No interviews scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'Jobs Management' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 uppercase leading-none">Quản lý tin đăng</h1>
                                </div>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="bg-blue-600 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Plus size={18} className="stroke-[3]" />
                                    Post Job
                                </button>
                            </div>

                            <div className="bg-white rounded-[44px] border border-slate-200 shadow-sm overflow-hidden">
                                {jobsLoading ? (
                                    <div className="py-32 flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto min-h-[400px]">
                                        <table className="w-full text-left border-collapse min-w-[1000px]">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Informations</th>
                                                    <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                                                    <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Candidates</th>
                                                    <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                    <th className="px-6 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredJobs.map((job) => (
                                                    <tr key={job.jobPostId} className="hover:bg-slate-50/50 transition-all group">
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-500">
                                                                    <Briefcase size={20} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-900 uppercase tracking-tight">{job.title}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                                                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {job.category?.name || '---'}
                                                        </td>
                                                        <td className="px-6 py-8 text-center font-black text-slate-900 text-sm">
                                                            {job.applicationCount || 0}
                                                        </td>
                                                        <td className="px-6 py-8 text-center">
                                                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-8 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => { setActiveTab('Applications'); fetchApplications(job.jobPostId); }} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Applications"><UsersIcon size={18} /></button>
                                                                <button onClick={() => handleOpenEditModal(job)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Job"><Edit size={18} /></button>
                                                                <button onClick={() => handleDeleteJob(job.jobPostId)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Job"><Trash2 size={18} /></button>
                                                                <button onClick={() => handleToggleJobStatus(job.jobPostId, job.status)} className={`p-3 rounded-xl transition-all ${job.status === 'ACTIVE' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={job.status === 'ACTIVE' ? 'Close Job' : 'Open Job'}>
                                                                    {job.status === 'ACTIVE' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'Messages' ? (
                        <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-[44px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                            <div className="flex flex-1 overflow-hidden h-full">
                                <div className={`w-full lg:w-96 border-r border-slate-100 flex flex-col transition-all ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
                                    <div className="p-8 border-b border-slate-50">
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Messages</h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {conversations.map((conv) => {
                                            // Determine display name and avatar:
                                            let displayName = 'Unknown';
                                            let avatarUrl = '';

                                            if (conv.user) {
                                                displayName = conv.user.fullName;
                                                avatarUrl = conv.user.avatarUrl || '';
                                            } else if (conv.company) {
                                                // If it's a company, check if it's me
                                                if (company && String(conv.company.companyId) === String(company.companyId)) {
                                                    // This usually shouldn't happen in the list unless it's a chat with Admin/System
                                                    // who might be represented differently in the DB
                                                    displayName = 'FeRecruit Admin';
                                                } else {
                                                    displayName = conv.company.name;
                                                    avatarUrl = conv.company.logoUrl || '';
                                                }
                                            }

                                            return (
                                                <button
                                                    key={conv.conversationsId}
                                                    onClick={() => {
                                                        setSelectedConversation(conv);
                                                        fetchMessages(conv.conversationsId);
                                                    }}
                                                    className={`w-full text-left p-4 rounded-[24px] transition-all flex items-center gap-4 ${selectedConversation?.conversationsId === conv.conversationsId ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                                        {avatarUrl ? (
                                                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center font-black text-sm ${selectedConversation?.conversationsId === conv.conversationsId ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                                                {displayName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <span className={`text-sm font-black truncate uppercase tracking-tight block ${selectedConversation?.conversationsId === conv.conversationsId ? 'text-white' : 'text-slate-900'}`}>
                                                                {displayName}
                                                            </span>
                                                            {conv.lastMessageTime && (
                                                                <span className={`text-[9px] font-bold ${selectedConversation?.conversationsId === conv.conversationsId ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                    {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs truncate font-medium ${selectedConversation?.conversationsId === conv.conversationsId ? 'text-white/80' : 'text-slate-500'}`}>
                                                            {conv.lastMessage || 'No messages yet'}
                                                        </p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className={`flex-1 flex flex-col min-w-0 bg-slate-50/30 ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
                                    {selectedConversation ? (
                                        <>
                                            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => setSelectedConversation(null)} className="lg:hidden p-2 -ml-2 text-slate-400"><ChevronLeft size={24} /></button>
                                                    <h3 className="font-black text-slate-900 tracking-tight">
                                                        {selectedConversation.user?.fullName
                                                            ? selectedConversation.user.fullName
                                                            : (company && selectedConversation.company && String(selectedConversation.company.companyId) === String(company.companyId)
                                                                ? 'FeRecruit Admin'
                                                                : selectedConversation.company?.name || 'User')}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                                {messages.map((msg, idx) => {
                                                    const isMe = msg.senderId === currentUser?.userId;
                                                    return (
                                                        <div key={msg.messageId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[70%] px-6 py-4 rounded-[30px] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            <div className="p-8 bg-white border-t border-slate-100">
                                                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="Type your message..."
                                                        className="flex-1 bg-slate-50 border-none rounded-[24px] py-4 px-6 focus:ring-4 focus:ring-blue-500/5 outline-none font-medium"
                                                    />
                                                    <button type="submit" disabled={!newMessage.trim()} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200"><Send size={22} /></button>
                                                </form>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Select a chat</h2>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'Payments' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 uppercase leading-none">Payments</h1>
                                    <p className="text-slate-500 font-bold mt-2">Manage your billing history and top up balance.</p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="bg-emerald-500 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <DollarSign size={18} className="stroke-[3]" />
                                    Top Up Balance
                                </button>
                            </div>

                            <div className="bg-white rounded-[44px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                                {paymentsLoading ? (
                                    <div className="py-32 flex flex-col items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : payments.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {payments.map((payment) => (
                                                    <tr key={payment.paymentId} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-5 font-bold text-slate-500 text-xs font-mono">#{payment.paymentId}</td>
                                                        <td className="px-8 py-5 font-bold text-slate-600 text-sm">
                                                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}
                                                        </td>
                                                        <td className="px-8 py-5 font-black text-emerald-600">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount)}
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-medium text-slate-500 max-w-xs truncate">
                                                            {payment.description || 'Top up balance'}
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${payment.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                                                payment.status === 'FAILED' ? 'bg-red-50 text-red-600' :
                                                                    'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                {payment.status || 'PENDING'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No payment history found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{activeTab}</h2>
                        </div>
                    )

                    }
                </div >
            </main >

            {showJobModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
                    <div className="bg-white rounded-[44px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-10 pb-0 flex items-center justify-between">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{editingJob ? 'Chỉnh sửa tin đăng' : 'Đăng tin mới'}</h2>
                            <button onClick={() => setShowJobModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><XCircle size={24} /></button>
                        </div>

                        <form onSubmit={handleJobSubmit} className="flex-1 overflow-y-auto p-10 pt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Tiêu đề công việc *</label>
                                    <input type="text" required value={jobFormData.title} onChange={e => setJobFormData({ ...jobFormData, title: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 focus:bg-white transition-all text-sm font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Ngành nghề *</label>
                                    <select required value={jobFormData.category_id} onChange={e => setJobFormData({ ...jobFormData, category_id: parseInt(e.target.value) })} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 focus:bg-white outline-none">
                                        <option value={0}>Chọn ngành nghề</option>
                                        {categories.map(cat => <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Mô tả công việc *</label>
                                    <textarea required value={jobFormData.description} onChange={e => setJobFormData({ ...jobFormData, description: e.target.value })} rows={5} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-5 px-6 focus:bg-white transition-all outline-none resize-none leading-relaxed" />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-12 pt-10 border-t border-slate-100">
                                <button type="button" onClick={() => setShowJobModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-2xl tracking-widest">Cancel</button>
                                <button type="submit" disabled={isSubmittingJob} className="flex-1 py-5 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl tracking-widest shadow-xl shadow-blue-200">
                                    {isSubmittingJob ? 'Processing...' : (editingJob ? 'Save Changes' : 'Post Job Now')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* Interview Schedule Modal */}
            {
                showInterviewModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
                        <div className="bg-white rounded-[44px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Schedule Interview</h2>
                                <button onClick={() => setShowInterviewModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><XCircle size={20} /></button>
                            </div>
                            <form onSubmit={handleScheduleInterview} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Date & Time</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="date"
                                            required
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                                            value={interviewFormData.interviewDate}
                                            onChange={e => setInterviewFormData({ ...interviewFormData, interviewDate: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            required
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                                            value={interviewFormData.interviewTime}
                                            onChange={e => setInterviewFormData({ ...interviewFormData, interviewTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Location (or Online Link)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Office Room 302 or Zoom Link"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                                        value={interviewFormData.location}
                                        onChange={e => setInterviewFormData({ ...interviewFormData, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Meeting Link (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://zoom.us/..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                                        value={interviewFormData.meetingLink}
                                        onChange={e => setInterviewFormData({ ...interviewFormData, meetingLink: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Notes</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 resize-none"
                                        value={interviewFormData.note}
                                        onChange={e => setInterviewFormData({ ...interviewFormData, note: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-200 transition-all">
                                        Confirm Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
                    <div className="bg-white rounded-[44px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-8 pb-0 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Top Up Balance</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={handleCreatePayment} className="p-8 pt-6">
                            <div className="mb-6">
                                <label className="block text-xs font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Amount (VND)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="10000"
                                        step="10000"
                                        placeholder="Enter amount..."
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-6 pr-14 focus:bg-white focus:border-emerald-500 transition-all font-black text-xl text-slate-900 outline-none"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">₫</div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1">Minimum deposit amount is 10,000 ₫</p>
                            </div>

                            <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2">
                                <CreditCard size={18} />
                                Proceed to Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}

