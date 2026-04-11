import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Building2,
    BarChart3,
    Settings,
    LogOut,
    Search,
    Bell,
    TrendingUp,
    FileText,
    MoreHorizontal,
    MessageSquare,
    Send,
    Paperclip,
    Smile,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { fetchWithAuth } from '../utils/auth';

interface DashboardStats {
    total_candidates: number;
    total_employers: number;
    total_job_posts: number;
    total_applications: number;
    new_users: number;
    new_jobs: number;
}

interface User {
    userId: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    status: string;
    avatarUrl: string | null;
    createdAt: string;
    roleName: string;
    companyId?: string;
}

interface UserDetail extends User {
    address: string;
    bio: string;
    gender: string;
    dateOfBirth: string;
}

interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    link?: string;
}

interface Conversation {
    conversationsId: number;
    userId: string;
    companyId: string;
    lastMessageAt: string;
    created_at: string;
    user?: {
        userId: string;
        fullName: string;
        avatarUrl: string | null;
        roleName?: string;
    };
    company?: {
        companyId: string;
        name: string;
        logoUrl: string | null;
    };
}

interface Message {
    messageId: number;
    conversationsId: number;
    senderId: string;
    content: string;
    createdAt: string;
}

interface Company {
    companyId: string;
    userId: string;
    name: string;
    email: string;
    phoneNumber: string;
    addressDetail: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    description: string | null;
    status: string;
    created_at: string;
    createdAt?: string;
}

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState('Overview');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [analyticsData, setAnalyticsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // User Management State
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userFilters, setUserFilters] = useState({
        keyword: '',
        role: '',
        status: ''
    });
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [jobFilters, setJobFilters] = useState({
        status: '',
        keyword: ''
    });

    // Metadata Management State (Categories, Locations, Skills)
    const [categories, setCategories] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
    const [metadataType, setMetadataType] = useState<'Category' | 'Location' | 'Skill'>('Category');

    // Notifications State
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsPage, setNotificationsPage] = useState(1);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
    const [totalNotifications, setTotalNotifications] = useState(0);
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

    // Messaging State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedConvRef = useRef<number | null>(null);

    // Fetch User Profile on Mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const response = await fetchWithAuth(`${apiUrl}/api/v1/users/profile`);
                if (response.ok) {
                    const json = await response.json();
                    const userData = json.data;
                    console.log('Current Admin User:', userData);
                    setCurrentUser(userData);
                }
            } catch (error) {
                console.error('Error fetching admin profile:', error);
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        selectedConvRef.current = selectedConversation?.conversationsId || null;
    }, [selectedConversation]);

    // Employer Management State
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [companiesPage, setCompaniesPage] = useState(1);
    const [companiesTotal, setCompaniesTotal] = useState(0);
    const [companiesKeyword, setCompaniesKeyword] = useState('');
    const [companiesStatus, setCompaniesStatus] = useState('');
    const [companiesLimit] = useState(15);

    const safeDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const [statsRes, profileRes, growthRes] = await Promise.all([
                fetchWithAuth(`${apiUrl}/api/v1/admin/stats/dashboard`),
                fetchWithAuth(`${apiUrl}/api/v1/users/profile`),
                fetchWithAuth(`${apiUrl}/api/v1/admin/stats/growth`)
            ]);

            if (statsRes.ok) {
                const json = await statsRes.json();
                setStats(json.data);
            }
            if (profileRes.ok) {
                const json = await profileRes.json();
                setCurrentUser(json.data);
            }
            if (growthRes.ok) {
                const json = await growthRes.json();
                setAnalyticsData(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        setCompaniesLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const queryParams = new URLSearchParams({
                page: companiesPage.toString(),
                limit: companiesLimit.toString()
            });
            if (companiesKeyword) queryParams.append('keyword', companiesKeyword);
            if (companiesStatus) queryParams.append('status', companiesStatus);

            const response = await fetchWithAuth(
                `${apiUrl}/api/v1/companies?${queryParams.toString()}`
            );
            if (response.ok) {
                const json = await response.json();
                console.log('Companies API Response:', json);
                // Depending on the API response structure, usually it's { data: [], total: 0 }
                setCompanies(Array.isArray(json.data) ? json.data : []);
                setCompaniesTotal(json.total || 0);
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
        } finally {
            setCompaniesLoading(false);
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const queryParams = new URLSearchParams();
            if (userFilters.keyword) queryParams.append('keyword', userFilters.keyword);
            if (userFilters.role) queryParams.append('role', userFilters.role);
            if (userFilters.status) queryParams.append('status', userFilters.status);

            const response = await fetchWithAuth(`${apiUrl}/api/v1/admin/users?${queryParams.toString()}`);
            if (response.ok) {
                const json = await response.json();
                setUsers(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    // Metadata Fetch Functions
    const fetchCategories = async () => {
        setMetadataLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/v1/categories`);
            if (response.ok) {
                const json = await response.json();
                setCategories(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setMetadataLoading(false);
        }
    };

    const fetchLocations = async () => {
        setMetadataLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/v1/locations`);
            if (response.ok) {
                const json = await response.json();
                setLocations(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching locations:', err);
        } finally {
            setMetadataLoading(false);
        }
    };

    const fetchSkills = async () => {
        setMetadataLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/skills`);
            if (response.ok) {
                const json = await response.json();
                setSkills(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching skills:', err);
        } finally {
            setMetadataLoading(false);
        }
    };

    // Metadata CRUD Functions
    const handleCreateMetadata = async () => {
        if (!newItemName.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            let endpoint = '';
            if (metadataType === 'Category') endpoint = '/api/v1/admin/categories';
            else if (metadataType === 'Location') endpoint = '/api/v1/admin/locations';
            else if (metadataType === 'Skill') endpoint = '/api/v1/admin/skills';

            const response = await fetchWithAuth(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItemName })
            });

            if (response.ok) {
                toast.success(`${metadataType} created successfully`);
                setNewItemName('');
                setIsMetadataModalOpen(false);
                if (metadataType === 'Category') fetchCategories();
                else if (metadataType === 'Location') fetchLocations();
                else if (metadataType === 'Skill') fetchSkills();
            } else {
                toast.error(`Failed to create ${metadataType}`);
            }
        } catch (error) {
            console.error('Error creating metadata:', error);
            toast.error('An error occurred');
        }
    };

    const handleUpdateMetadata = async () => {
        if (!editingItem || !newItemName.trim()) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            let endpoint = '';
            let id = '';

            if (metadataType === 'Category') {
                endpoint = '/api/v1/admin/categories';
                id = editingItem.categoryId;
            } else if (metadataType === 'Location') {
                endpoint = '/api/v1/admin/locations';
                id = editingItem.locationId;
            } else if (metadataType === 'Skill') {
                endpoint = '/api/v1/admin/skills';
                id = editingItem.skillId;
            }

            const response = await fetchWithAuth(`${apiUrl}${endpoint}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newItemName })
            });

            if (response.ok) {
                toast.success(`${metadataType} updated successfully`);
                setNewItemName('');
                setEditingItem(null);
                setIsMetadataModalOpen(false);
                if (metadataType === 'Category') fetchCategories();
                else if (metadataType === 'Location') fetchLocations();
                else if (metadataType === 'Skill') fetchSkills();
            } else {
                toast.error(`Failed to update ${metadataType}`);
            }
        } catch (error) {
            console.error('Error updating metadata:', error);
            toast.error('An error occurred');
        }
    };

    const handleDeleteMetadata = async (item: any) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            let endpoint = '';
            let id = '';

            if (metadataType === 'Category') {
                endpoint = '/api/v1/admin/categories';
                id = item.categoryId;
            } else if (metadataType === 'Location') {
                endpoint = '/api/v1/admin/locations';
                id = item.locationId;
            } else if (metadataType === 'Skill') {
                endpoint = '/api/v1/admin/skills';
                id = item.skillId;
            }

            const response = await fetchWithAuth(`${apiUrl}${endpoint}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success(`${metadataType} deleted successfully`);
                if (metadataType === 'Category') fetchCategories();
                else if (metadataType === 'Location') fetchLocations();
                else if (metadataType === 'Skill') fetchSkills();
            } else {
                toast.error(`Failed to delete ${metadataType}`);
            }
        } catch (error) {
            console.error('Error deleting metadata:', error);
            toast.error('An error occurred');
        }
    };

    const openMetadataModal = (type: 'Category' | 'Location' | 'Skill', item?: any) => {
        setMetadataType(type);
        setEditingItem(item || null);
        setNewItemName(item ? item.name : '');
        setIsMetadataModalOpen(true);
    };

    const fetchJobsAdmin = async () => {
        setJobsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const queryParams = new URLSearchParams();
            if (jobFilters.status) queryParams.append('status', jobFilters.status);
            if (jobFilters.keyword) queryParams.append('keyword', jobFilters.keyword);

            const response = await fetchWithAuth(`${apiUrl}/api/v1/admin/jobs?${queryParams.toString()}`);
            if (response.ok) {
                const json = await response.json();
                // Handle both: {data: [...]} and {data: {content: [...]}} response shapes
                const rawData = json.data;
                const jobsArray = Array.isArray(rawData)
                    ? rawData
                    : Array.isArray(rawData?.content)
                    ? rawData.content
                    : Array.isArray(rawData?.data)
                    ? rawData.data
                    : [];
                setJobs(jobsArray);
            }
        } catch (err) {
            console.error('Error fetching admin jobs:', err);
        } finally {
            setJobsLoading(false);
        }
    };

    const handleApproveJob = async (jobId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/admin/jobs/${jobId}/approve`, {
                method: 'PATCH'
            });
            if (response.ok) {
                toast.success('Duyệt tin tuyển dụng thành công!');
                fetchJobsAdmin();
            } else {
                toast.error('Duyệt tin thất bại.');
            }
        } catch (err) {
            console.error('Error approving job:', err);
        }
    };

    const handleRejectJob = async (jobId: string) => {
        const reason = window.prompt('Nhập lý do từ chối:');
        if (reason === null) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/admin/jobs/${jobId}/reject`, {
                method: 'PATCH',
                body: JSON.stringify({ reason })
            });
            if (response.ok) {
                toast.success('Đã từ chối tin tuyển dụng.');
                fetchJobsAdmin();
            } else {
                toast.error('Từ chối tin thất bại.');
            }
        } catch (err) {
            console.error('Error rejecting job:', err);
        }
    };

    const fetchUserDetails = async (id: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/admin/users/${id}`);
            if (response.ok) {
                const json = await response.json();
                setSelectedUser(json.data);
                setShowUserModal(true);
            }
        } catch (err) {
            console.error('Error fetching user details:', err);
        }
    };

    const handleUpdateStatus = async (userId: string, status: string) => {
        setUpdatingStatus(userId);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/admin/users/${userId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                toast.success(`Cập nhật trạng thái thành ${status} thành công!`);
                fetchUsers();
                if (selectedUser?.userId === userId) {
                    fetchUserDetails(userId);
                }
            } else {
                toast.error('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const fetchNotifications = async (page: number, append = false) => {
        if (notificationsLoading) return;
        setNotificationsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications?page=${page}&limit=20`);
            if (response.ok) {
                const json = await response.json();
                const newNotifications = json.data || [];
                if (append) {
                    setNotifications(prev => [...prev, ...newNotifications]);
                } else {
                    setNotifications(newNotifications);
                }
                setHasMoreNotifications(newNotifications.length === 20);
                // Assume unread count comes from somewhere or calculate from first page
                if (page === 1) {
                    const unread = newNotifications.filter((n: any) => !n.isRead).length;
                    setUnreadCount(unread > 0 ? unread : 0);
                    // If backend provides meta for total unread, use it here
                }
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const handleLoadMoreNotifications = () => {
        const nextPage = notificationsPage + 1;
        setNotificationsPage(nextPage);
        fetchNotifications(nextPage, true);
    };

    const markAsRead = async (id: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications/${id}/read`, { method: 'PATCH' });
            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const fetchConversations = async () => {
        setConversationsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations`);
            if (response.ok) {
                const json = await response.json();
                console.log('Admin list conversations:', JSON.stringify(json.data[0] || {}, null, 2));
                setConversations(Array.isArray(json.data) ? json.data : []);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Fetch conversations failed:', response.status, errorData);
                if (response.status === 403) {
                    toast.error('Bạn không có quyền truy cập hội thoại (403)');
                }
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setConversationsLoading(false);
        }
    };

    const fetchMessages = async (conversationId: number) => {
        setMessagesLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations/${conversationId}/messages`);
            if (response.ok) {
                const json = await response.json();
                setMessages(Array.isArray(json.data) ? json.data : []);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const content = newMessage;
        setNewMessage('');

        if (!currentUser) {
            console.error('Current user not loaded yet');
            toast.error('Vui lòng đợi tải thông tin người dùng...');
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const conversationId = Number(selectedConversation.conversationsId);

            console.log('Debugging 403:', {
                currentUserId: currentUser.userId,
                currentUserCompanyId: currentUser.companyId,
                conversationUserId: selectedConversation.userId,
                conversationCompanyId: selectedConversation.companyId,
                isParticipant:
                    String(currentUser.userId) === String(selectedConversation.userId) ||
                    (currentUser.companyId && String(currentUser.companyId) === String(selectedConversation.companyId))
            });

            const response = await fetchWithAuth(`${apiUrl}/api/v1/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    conversationId,
                    content
                })
            });

            if (response.ok) {
                console.log('Admin message sent successfully');
                // Fetch messages again to update UI immediately
                fetchMessages(conversationId);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Admin send message failed:', response.status, errorData);
                toast.error(`Gửi tin nhắn thất bại: ${errorData.message || response.status}. Details: ${JSON.stringify(errorData)}`);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error('Lỗi hệ thống khi gửi tin nhắn');
        }
    };

    const handleStartChat = async ({ userId, companyId }: { userId?: string, companyId?: string }) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            // Check if conversation already exists in local state
            const existing = conversations.find(c =>
                (userId && String(c.userId) === String(userId)) ||
                (companyId && String(c.companyId) === String(companyId))
            );

            if (existing) {
                setSelectedConversation(existing);
                fetchMessages(existing.conversationsId);
                setActiveTab('Message');
                return;
            }

            const body = userId
                ? { receiverUserId: userId }
                : { receiverCompanyId: companyId };

            console.log('Starting chat with body:', body);

            const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const json = await response.json();
                const conv = json.data;
                // Update conversations list if not already there
                if (conv) {
                    setConversations(prev => {
                        if (prev.some(c => c.conversationsId === conv.conversationsId)) return prev;
                        return [conv, ...prev];
                    });
                    setSelectedConversation(conv);
                    fetchMessages(conv.conversationsId);
                    setActiveTab('Message');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Start chat failed:', response.status, errorData);
                toast.error(errorData.message || 'Không thể bắt đầu cuộc trò chuyện');
            }
        } catch (err) {
            console.error('Error starting chat:', err);
            toast.error('Lỗi hệ thống');
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const socket = io(apiUrl, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('join_user_room', currentUser.userId);
        });

        socket.on('receive_message', (data: any) => {
            try {
                // Determine if data is the message object itself or wrapper
                const msg = data.messageId ? data : data; // Adjust based on backend emission
                console.log('Socket Receive Message:', msg, 'Current Chat:', selectedConvRef.current);

                // Update Messages if viewing the conversation
                if (selectedConvRef.current && String(msg.conversationId || msg.conversationsId) === String(selectedConvRef.current)) {
                    setMessages(prev => {
                        if (prev.some(m => m.messageId === msg.messageId)) return prev;
                        return [...prev, msg];
                    });
                    scrollToBottom();
                }

                // Update Conversation List (Last Message)
                setConversations(prev => prev.map(c =>
                    String(c.conversationsId) === String(msg.conversationId || msg.conversationsId)
                        ? { ...c, lastMessageAt: msg.createdAt }
                        : c
                ));

                // Optional: Show toast if not in chat
                if (!selectedConvRef.current || String(msg.conversationId || msg.conversationsId) !== String(selectedConvRef.current)) {
                    // Could show toast here
                }
            } catch (err) {
                console.error('Error handling socket message:', err);
            }
        });

        socket.on('new_notification', (data: any) => {
            const newNotif = data as AppNotification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(`Thông báo mới: ${newNotif.title}`, {
                description: newNotif.message
            });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUser]);

    // Polling fallback for messages
    useEffect(() => {
        if (activeTab !== 'Message') return;

        const pollInterval = setInterval(() => {
            fetchConversations();
            if (selectedConvRef.current) {
                const refreshMessages = async () => {
                    try {
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                        const response = await fetchWithAuth(`${apiUrl}/api/v1/conversations/${selectedConvRef.current}/messages`);
                        if (response.ok) {
                            const json = await response.json();
                            const messageList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                            setMessages(prev => {
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
        if (activeTab === 'Overview') {
            fetchStats();
        } else if (activeTab === 'User Management') {
            fetchUsers();
        } else if (activeTab === 'Message') {
            fetchConversations();
        } else if (activeTab === 'Employer Management') {
            fetchCompanies();
        } else if (activeTab === 'Jobs Management') {
            fetchJobsAdmin();
        } else if (activeTab === 'Categories') {
            fetchCategories();
            setMetadataType('Category');
        } else if (activeTab === 'Locations') {
            fetchLocations();
            setMetadataType('Location');
        } else if (activeTab === 'Skills') {
            fetchSkills();
            setMetadataType('Skill');
        }
    }, [activeTab, userFilters, companiesPage, companiesKeyword, companiesStatus, jobFilters]);

    const sidebarItems = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'User Management', icon: Users },
        { name: 'Employer Management', icon: Building2 },
        { name: 'Message', icon: MessageSquare },
        { name: 'Jobs Management', icon: Briefcase },
        { name: 'Categories', icon: LayoutDashboard },
        { name: 'Locations', icon: Building2 },
        { name: 'Skills', icon: TrendingUp },
        { name: 'Analytics', icon: BarChart3 },
        { name: 'System Settings', icon: Settings },
    ];

    const chartData = analyticsData.length > 0 ? analyticsData : [
        { name: 'Mon', users: 0, jobs: 0 },
        { name: 'Tue', users: 0, jobs: 0 },
        { name: 'Wed', users: 0, jobs: 0 },
        { name: 'Thu', users: 0, jobs: 0 },
        { name: 'Fri', users: 0, jobs: 0 },
        { name: 'Sat', users: 0, jobs: 0 },
        { name: 'Sun', users: 0, jobs: 0 },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900 overflow-hidden relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Briefcase size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-black tracking-tight text-slate-800 uppercase">Recruit<span className="text-blue-600">Admin</span></span>
                        </div>
                        <button
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="space-y-2">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => {
                                    setActiveTab(item.name);
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.name
                                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                            >
                                <item.icon size={18} className={activeTab === item.name ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span className="text-sm font-bold whitespace-nowrap">{item.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-slate-100">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                    <div className="mt-8 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-black">
                            AD
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-slate-800 truncate">Admin User</span>
                            <span className="text-[11px] text-slate-400 uppercase font-black tracking-widest leading-none">Master Access</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto h-full scroll-smooth">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="relative hidden md:block w-72 lg:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                placeholder="Search data, candidates, companies..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-11 pr-5 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all ${showNotifications ? 'bg-slate-100' : ''}`}
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white text-[10px] font-black text-white flex items-center justify-center animate-in zoom-in duration-300">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setShowNotifications(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-4 w-[280px] sm:w-[400px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-30 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 sm:p-6 pb-2 flex items-center justify-between">
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Thông báo</h3>
                                            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>

                                        <div className="px-6 py-4 flex gap-2">
                                            <button
                                                onClick={() => setNotificationFilter('all')}
                                                className={`px-4 py-2 rounded-full text-sm font-black transition-all ${notificationFilter === 'all'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                onClick={() => setNotificationFilter('unread')}
                                                className={`px-4 py-2 rounded-full text-sm font-black transition-all ${notificationFilter === 'unread'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                Chưa đọc
                                            </button>
                                        </div>

                                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar pb-4 px-2">
                                            {(notificationFilter === 'all' ? notifications : notifications.filter(n => !n.isRead)).length > 0 ? (
                                                <div className="space-y-1">
                                                    {/* Grouping Logic */}
                                                    {(() => {
                                                        const filtered = (notificationFilter === 'all' ? notifications : notifications.filter(n => !n.isRead)) || [];
                                                        const todayNotifs = filtered.filter(n => n.createdAt && isToday(new Date(n.createdAt)));
                                                        const earlierNotifs = filtered.filter(n => !n.createdAt || !isToday(new Date(n.createdAt)));

                                                        const renderItem = (notif: AppNotification) => (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => markAsRead(notif.id)}
                                                                className="relative p-4 hover:bg-slate-100/50 rounded-2xl transition-all cursor-pointer flex gap-4 group"
                                                            >
                                                                <div className="relative flex-shrink-0">
                                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${notif.isRead ? 'bg-slate-100' : 'bg-blue-50'}`}>
                                                                        {/* Mock Avatar or Type Icon */}
                                                                        <div className={`w-full h-full rounded-full flex items-center justify-center font-black text-lg ${notif.isRead ? 'text-slate-400' : 'text-blue-600'}`}>
                                                                            {notif.title?.charAt(0) || 'N'}
                                                                        </div>
                                                                    </div>
                                                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${notif.isRead ? 'bg-slate-400' : 'bg-blue-600'}`}>
                                                                        <Bell size={12} className="text-white fill-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0 pr-4">
                                                                    <p className="text-sm font-medium text-slate-800 leading-snug">
                                                                        <span className="font-black text-slate-900 mr-1">{notif.title || 'Thông báo'}</span>
                                                                        {notif.message || ''}
                                                                    </p>
                                                                    <p className={`text-[13px] mt-1 font-bold ${!notif.isRead ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: false, locale: vi }) : 'Vừa xong'}
                                                                    </p>
                                                                </div>
                                                                {!notif.isRead && (
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-200"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );

                                                        return (
                                                            <>
                                                                {todayNotifs.length > 0 && (
                                                                    <div className="px-4 py-3">
                                                                        <h4 className="text-[17px] font-black text-slate-900">Hôm nay</h4>
                                                                        <div className="mt-2 space-y-1">
                                                                            {todayNotifs.map(renderItem)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {earlierNotifs.length > 0 && (
                                                                    <div className="px-4 py-3">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="text-[17px] font-black text-slate-900">Trước đó</h4>
                                                                            <button className="text-sm font-bold text-blue-600 hover:underline">Xem tất cả</button>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {earlierNotifs.map(renderItem)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                        <Bell size={32} className="text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Không có thông báo nào</p>
                                                </div>
                                            )}

                                            {hasMoreNotifications && (
                                                <div className="px-4 mt-2">
                                                    <button
                                                        onClick={handleLoadMoreNotifications}
                                                        disabled={notificationsLoading}
                                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-xl transition-all uppercase tracking-tight disabled:opacity-50"
                                                    >
                                                        {notificationsLoading ? 'Đang tải...' : 'Xem thông báo trước đó'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-10 pb-20">
                    {activeTab === 'Overview' ? (
                        <>
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase leading-tight">Dashboard Overview</h1>
                                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-1 sm:mt-3">Platform management and growth analytics.</p>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
                                {[
                                    { label: 'Total Candidates', value: stats?.total_candidates || 0, icon: Users, color: 'blue' },
                                    { label: 'Active Jobs', value: stats?.total_job_posts || 0, icon: Briefcase, color: 'emerald' },
                                    { label: 'Employers', value: stats?.total_employers || 0, icon: Building2, color: 'purple' },
                                    { label: 'Applications', value: stats?.total_applications || 0, icon: FileText, color: 'amber' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-sm hover:border-blue-300 transition-all group cursor-default">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`p-3.5 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                                <stat.icon size={24} />
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-500 font-black text-xs bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                                <TrendingUp size={12} /> Live
                                            </div>
                                        </div>
                                        <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">{stat.label}</h3>
                                        <p className="text-4xl font-black text-slate-900 tracking-tight">
                                            {loading ? '...' : stat.value.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Growth Performance - Expanded to full width */}
                            <div className="w-full bg-white p-6 lg:p-10 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-xl lg:text-2xl font-black uppercase text-slate-900 tracking-tight">Growth Performance</h3>
                                        <p className="text-sm lg:text-base text-slate-400 font-medium mt-2">New user registrations and job postings tracking per week.</p>
                                    </div>
                                    <div className="flex items-center gap-8 bg-slate-50 px-6 py-4 rounded-2xl">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>
                                            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Users Growth</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 shadow-sm"></div>
                                            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Jobs Postings</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[450px] w-full px-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 900 }}
                                                dy={20}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                                                dx={-10}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                                                itemStyle={{ fontSize: '13px', fontWeight: 'bold', paddingTop: '8px' }}
                                                labelStyle={{ fontSize: '14px', fontWeight: 'black', marginBottom: '8px', color: '#0f172a' }}
                                            />
                                            <Area
                                                name="Registrations"
                                                type="monotone"
                                                dataKey="users"
                                                stroke="#2563EB"
                                                strokeWidth={5}
                                                fillOpacity={1}
                                                fill="url(#colorUser)"
                                                animationDuration={1500}
                                            />
                                            <Area
                                                name="Jobs Created"
                                                type="monotone"
                                                dataKey="jobs"
                                                stroke="#e2e8f0"
                                                strokeWidth={4}
                                                fillOpacity={0}
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'User Management' ? (
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">User Management</h1>
                                <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-1 sm:mt-3">Manage all platform users, roles and access status.</p>
                            </div>

                            {/* Filters */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Search User</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Name or email..."
                                            value={userFilters.keyword}
                                            onChange={(e) => setUserFilters({ ...userFilters, keyword: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Role</label>
                                    <select
                                        value={userFilters.role}
                                        onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="EMPLOYER">Employer</option>
                                        <option value="CANDIDATE">Candidate</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select
                                        value={userFilters.status}
                                        onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Banned">Banned</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setUserFilters({ keyword: '', role: '', status: '' })}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* User Table */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                {usersLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading users...</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">User Information</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Joined Date</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {users.map((user) => (
                                                    <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => fetchUserDetails(user.userId)}>
                                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:border-blue-200 transition-all">
                                                                    {user.avatarUrl ? (
                                                                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-lg">
                                                                            {user.fullName.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{user.fullName}</span>
                                                                    <span className="text-xs text-slate-400 font-medium truncate">{user.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.roleName === 'ADMIN' ? 'bg-purple-50 text-purple-600' : user.roleName === 'EMPLOYER' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {user.roleName}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : user.status === 'Inactive' ? 'bg-slate-400' : 'bg-red-500'
                                                                    }`}></div>
                                                                <span className={`text-[11px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'text-emerald-600' : user.status === 'Inactive' ? 'text-slate-500' : 'text-red-600'
                                                                    }`}>
                                                                    {user.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-500 tracking-tight">
                                                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleStartChat({ userId: user.userId, companyId: user.companyId })}
                                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                    title="Nhắn tin"
                                                                >
                                                                    <MessageSquare size={18} />
                                                                </button>
                                                                <div className="relative inline-block group/status">
                                                                    <button
                                                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                        title="Cập nhật trạng thái"
                                                                    >
                                                                        <Settings size={18} />
                                                                    </button>
                                                                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 min-w-[140px] opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-20">
                                                                        {['Active', 'Inactive', 'Banned'].map(st => (
                                                                            <button
                                                                                key={st}
                                                                                onClick={() => handleUpdateStatus(user.userId, st)}
                                                                                className={`w-full text-left px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-slate-50 ${user.status === st ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}
                                                                            >
                                                                                {st}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {users.length === 0 && (
                                            <div className="py-20 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No users found match your filters.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'Message' ? (
                        <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)] flex bg-white rounded-[30px] sm:rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Conversations List */}
                            <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 border-r border-slate-100 flex-col`}>
                                <div className="p-8 border-b border-slate-100">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        Messages
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">{conversations.length}</span>
                                    </h2>
                                    <div className="relative mt-6">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                    {conversationsLoading ? (
                                        <div className="py-10 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        </div>
                                    ) : (Array.isArray(conversations) && conversations.length > 0) ? (
                                        <div className="space-y-1">
                                            {conversations.map((conv) => (
                                                <div
                                                    key={conv.conversationsId}
                                                    onClick={() => {
                                                        setSelectedConversation(conv);
                                                        fetchMessages(conv.conversationsId);
                                                    }}
                                                    className={`p-4 rounded-[24px] cursor-pointer transition-all flex gap-4 items-center group ${selectedConversation?.conversationsId === conv.conversationsId
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                        : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                                        {conv.user?.avatarUrl || conv.company?.logoUrl ? (
                                                            <img src={conv.user?.avatarUrl || conv.company?.logoUrl || ''} alt={conv.user?.fullName || conv.company?.name || 'User'} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center font-black text-lg ${selectedConversation?.conversationsId === conv.conversationsId ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                                                {(conv.user?.fullName || conv.company?.name || 'U').charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <h3 className={`font-black tracking-tight truncate ${selectedConversation?.conversationsId === conv.conversationsId ? 'text-white' : 'text-slate-900'}`}>
                                                                {conv.user?.fullName || conv.company?.name || 'User'}
                                                            </h3>
                                                            <span className={`text-[10px] font-bold whitespace-nowrap ml-2 ${selectedConversation?.conversationsId === conv.conversationsId ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                {(() => {
                                                                    const date = safeDate(conv.lastMessageAt);
                                                                    return date ? formatDistanceToNow(date, { addSuffix: false, locale: vi }) : '';
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs truncate font-medium ${selectedConversation?.conversationsId === conv.conversationsId ? 'text-blue-50' : 'text-slate-500'}`}>
                                                            Click to view chat
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center px-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                <MessageSquare size={24} className="text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No conversations found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50/30`}>
                                {selectedConversation ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 sm:p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <button
                                                    onClick={() => setSelectedConversation(null)}
                                                    className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-slate-50 overflow-hidden">
                                                    {selectedConversation.user?.avatarUrl || selectedConversation.company?.logoUrl ? (
                                                        <img src={selectedConversation.user?.avatarUrl || selectedConversation.company?.logoUrl || ''} alt={selectedConversation.user?.fullName || selectedConversation.company?.name || 'User'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black">
                                                            {(selectedConversation.user?.fullName || selectedConversation.company?.name || 'U').charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 tracking-tight">{selectedConversation.user?.fullName || selectedConversation.company?.name || 'User'}</h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active now</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                                    <Settings size={20} />
                                                </button>
                                                <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Messages Section */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                                            {messagesLoading ? (
                                                <div className="flex justify-center py-20">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                            ) : (Array.isArray(messages) && messages.length > 0) ? (
                                                messages.map((msg, idx) => {
                                                    const isMe = msg.senderId === currentUser?.userId;
                                                    return (
                                                        <div key={msg.messageId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                            <div className={`max-w-[70%] group ${isMe ? 'text-right' : 'text-left'}`}>
                                                                <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-[24px] sm:rounded-[30px] font-medium text-sm shadow-sm ${isMe
                                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                                                    }`}>
                                                                    {msg.content}
                                                                </div>
                                                                <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {(() => {
                                                                        const date = safeDate(msg.createdAt);
                                                                        return date ? formatDistanceToNow(date, { addSuffix: true, locale: vi }) : 'Vừa xong';
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Start a new conversation</p>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input Section */}
                                        <div className="p-4 sm:p-6 lg:p-8 bg-white border-t border-slate-100">
                                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                                                <div className="hidden sm:flex items-center gap-2">
                                                    <button type="button" className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                                        <Paperclip size={20} />
                                                    </button>
                                                    <button type="button" className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                                        <Smile size={20} />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type your message here..."
                                                    className="flex-1 bg-slate-50 border-none rounded-[24px] py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newMessage.trim()}
                                                    className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex-shrink-0"
                                                >
                                                    <Send size={20} className="sm:size-[22px] ml-1" />
                                                </button>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                                        <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mb-6 border border-blue-100 shadow-inner">
                                            <MessageSquare size={40} className="text-blue-600" />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Select a chat</h2>
                                        <p className="text-slate-400 max-w-xs mx-auto mt-4 font-medium">Choose a conversation from the left to start messaging with candidates or employers.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'Employer Management' ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">Employer Management</h1>
                                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-1 sm:mt-3">Manage companies, organizations and business profiles.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-slate-900 leading-none">{companiesTotal}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Companies</div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Search Companies</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Company name, email..."
                                            value={companiesKeyword}
                                            onChange={(e) => {
                                                setCompaniesKeyword(e.target.value);
                                                setCompaniesPage(1);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select
                                        value={companiesStatus}
                                        onChange={(e) => {
                                            setCompaniesStatus(e.target.value);
                                            setCompaniesPage(1);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none"
                                    >
                                        <option value="">All Status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="PENDING">Pending</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        setCompaniesKeyword('');
                                        setCompaniesStatus('');
                                        setCompaniesPage(1);
                                    }}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Companies Table */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                                {companiesLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading companies...</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Company Info</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Address</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Established</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {companies
                                                    .filter(c => !companiesStatus || c.status?.toUpperCase() === companiesStatus)
                                                    .map((company) => (
                                                        <tr key={company.companyId} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:border-blue-200 transition-all">
                                                                        {company.logoUrl ? (
                                                                            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-lg">
                                                                                {(company.name || 'C').charAt(0)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="font-bold text-slate-900 truncate">{company.name}</span>
                                                                        <span className="text-xs text-slate-400 font-medium truncate">{company.websiteUrl || 'No website'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-700">{company.email}</span>
                                                                    <span className="text-xs text-slate-400">{company.phoneNumber}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <p className="text-sm font-medium text-slate-600 max-w-[200px] truncate">{company.addressDetail || 'No address'}</p>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${company.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-500' : company.status?.toUpperCase() === 'INACTIVE' ? 'bg-slate-400' : 'bg-amber-500'
                                                                        }`}></div>
                                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${company.status?.toUpperCase() === 'ACTIVE' ? 'text-emerald-600' : company.status?.toUpperCase() === 'INACTIVE' ? 'text-slate-500' : 'text-amber-600'
                                                                        }`}>
                                                                        {company.status || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-sm font-bold text-slate-500 tracking-tight">
                                                                {(() => {
                                                                    const d = safeDate(company.created_at) || safeDate(company.createdAt as any);
                                                                    return d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A';
                                                                })()}
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleStartChat({ userId: company.userId })}
                                                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                        title="Nhắn tin với doanh nghiệp"
                                                                    >
                                                                        <MessageSquare size={18} />
                                                                    </button>
                                                                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                                        <Settings size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>

                                        {companies.length === 0 && !companiesLoading && (
                                            <div className="py-20 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No companies found.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {companiesTotal > companiesLimit && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <button
                                        onClick={() => setCompaniesPage(p => Math.max(1, p - 1))}
                                        disabled={companiesPage === 1}
                                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all font-black text-xs uppercase"
                                    >
                                        Prev
                                    </button>
                                    <div className="px-4 text-sm font-black text-slate-400">
                                        Page <span className="text-blue-600">{companiesPage}</span> of {Math.ceil(companiesTotal / companiesLimit)}
                                    </div>
                                    <button
                                        onClick={() => setCompaniesPage(p => Math.min(Math.ceil(companiesTotal / companiesLimit), p + 1))}
                                        disabled={companiesPage >= Math.ceil(companiesTotal / companiesLimit)}
                                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all font-black text-xs uppercase"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'Jobs Management' ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">Jobs Management</h1>
                                <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-1 sm:mt-3">Review and manage job postings from employers.</p>
                            </div>

                            {/* Filters */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Search Jobs</label>
                                    <input
                                        type="text"
                                        placeholder="Job title, company..."
                                        value={jobFilters.keyword}
                                        onChange={(e) => setJobFilters({ ...jobFilters, keyword: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select
                                        value={jobFilters.status}
                                        onChange={(e) => setJobFilters({ ...jobFilters, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Expired">Expired</option>
                                    </select>
                                </div>
                            </div>

                            {/* Jobs Table */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                                {jobsLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading jobs...</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Job Information</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Company</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Closing Date</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {jobs.map((job) => (
                                                    <tr key={job.jobPostId} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{job.title}</span>
                                                                <span className="text-xs text-slate-400 font-medium truncate">{job.location?.name} • {job.jobType}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-600">{job.company?.name}</td>
                                                        <td className="px-8 py-5">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                                                job.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                                    'bg-red-50 text-red-600'
                                                                }`}>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-500 tracking-tight">
                                                            {new Date(job.closingDate).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {job.status === 'Pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleApproveJob(job.jobPostId)}
                                                                            className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRejectJob(job.jobPostId)}
                                                                            className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => window.open(`/jobs/${job.jobPostId}`, '_blank')}
                                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                >
                                                                    <LayoutDashboard size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {jobs.length === 0 && (
                                            <div className="py-20 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No jobs found matching your filters.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : ['Categories', 'Locations', 'Skills'].includes(activeTab) ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">{activeTab}</h1>
                                    <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-medium mt-1 sm:mt-3">Manage system {activeTab.toLowerCase()}.</p>
                                </div>
                                <button
                                    onClick={() => openMetadataModal(activeTab.slice(0, -1) as any)}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                                >
                                    <TrendingUp size={18} />
                                    <span>Add New {activeTab.slice(0, -1)}</span>
                                </button>
                            </div>

                            {/* Metadata Table */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                                {metadataLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading {activeTab.toLowerCase()}...</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                                                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {(activeTab === 'Categories' ? categories : activeTab === 'Locations' ? locations : skills).map((item) => (
                                                    <tr key={item.categoryId || item.locationId || item.skillId} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-500">
                                                            #{item.categoryId || item.locationId || item.skillId}
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => openMetadataModal(activeTab.slice(0, -1) as any, item)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                >
                                                                    <Settings size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMetadata(item)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                >
                                                                    <LogOut size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(activeTab === 'Categories' ? categories : activeTab === 'Locations' ? locations : skills).length === 0 && (
                                            <div className="py-20 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No {activeTab.toLowerCase()} found.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Metadata Modal */}
                            {isMetadataModalOpen && (
                                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                            <h3 className="text-xl font-black tracking-tight text-slate-900">
                                                {editingItem ? `Edit ${metadataType}` : `Add New ${metadataType}`}
                                            </h3>
                                            <button
                                                onClick={() => setIsMetadataModalOpen(false)}
                                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Name</label>
                                                <input
                                                    type="text"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900"
                                                    placeholder={`Enter ${metadataType.toLowerCase()} name...`}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => setIsMetadataModalOpen(false)}
                                                className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={editingItem ? handleUpdateMetadata : handleCreateMetadata}
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
                                            >
                                                {editingItem ? 'Save Changes' : 'Create Item'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-40">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-900 uppercase">{activeTab}</h2>
                                <p className="text-slate-400 mt-2">Section under development.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Detail Modal */}
                {
                    showUserModal && selectedUser && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                            <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-lg"
                                    >
                                        ✕
                                    </button>
                                    <div className="absolute -bottom-12 left-10">
                                        <div className="w-28 h-28 rounded-[32px] bg-white p-1.5 shadow-xl">
                                            <div className="w-full h-full rounded-[26px] bg-slate-100 overflow-hidden flex items-center justify-center">
                                                {selectedUser.avatarUrl ? (
                                                    <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-4xl font-black text-blue-600">{selectedUser.fullName.charAt(0)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-16 px-10 pb-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{selectedUser.fullName}</h2>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                                    {selectedUser.roleName}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {selectedUser.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Joined Since</span>
                                            <span className="font-bold text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100">
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email Contact</span>
                                                <p className="font-bold text-slate-800">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number</span>
                                                <p className="font-bold text-slate-800">{selectedUser.phoneNumber || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Gender / DOB</span>
                                                <p className="font-bold text-slate-800">{selectedUser.gender || 'Unknown'} • {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Full Address</span>
                                                <p className="font-bold text-slate-800 leading-relaxed">{selectedUser.address || 'No address updated'}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">User Biography</span>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed italic line-clamp-3">"{selectedUser.bio || 'This user has not written anything yet.'}"</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-4 pt-2">
                                        <button
                                            onClick={() => handleUpdateStatus(selectedUser.userId, selectedUser.status === 'Active' ? 'Inactive' : 'Active')}
                                            disabled={updatingStatus === selectedUser.userId}
                                            className={`flex-1 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg ${selectedUser.status === 'Active'
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                                                }`}
                                        >
                                            {selectedUser.status === 'Active' ? 'Deactivate Account' : 'Reactivate Account'}
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedUser.userId, 'Banned')}
                                            disabled={updatingStatus === selectedUser.userId}
                                            className="flex-1 py-4 bg-red-50 text-red-600 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-100"
                                        >
                                            Ban This User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
