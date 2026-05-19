
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { Bell, MoreHorizontal } from 'lucide-react';


export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hasCompany, setHasCompany] = useState(false);
    const navigate = useNavigate();

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');


    useEffect(() => {
        // Check for user info in localStorage or sessionStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser) {
                    setIsLoggedIn(true);
                    setUser(parsedUser);

                    // Only check company for employer role
                    if (parsedUser.role?.toLowerCase() === 'employer' || parsedUser.roleName?.toLowerCase() === 'employer') {
                        const checkCompany = async () => {
                            try {
                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                                const response = await fetchWithAuth(`${apiUrl}/api/v1/companies/me`);
                                if (response.ok) {
                                    setHasCompany(true);
                                }
                            } catch (err) {
                                console.error("Error checking company status:", err);
                            }
                        };
                        checkCompany();
                    }
                }
            } catch (error) {
                console.error("Failed to parse user data:", error);
                // Clear invalid data
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
            }
        }
    }, []);

    const userRole = user?.roleName?.toUpperCase() || user?.role?.toUpperCase() || 'USER';
    const isCandidate = userRole === 'USER' || userRole === 'CANDIDATE';

    useEffect(() => {
        if (!isLoggedIn || !user || !isCandidate) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
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

        fetchNotifications();

        const socket = io(apiUrl, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            socket.emit('join_user_room', user.userId);
        });

        socket.on('new_notification', (data: any) => {
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(`Thông báo: ${data.title || 'Mới'}`, {
                description: data.message
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [isLoggedIn, user]);

    const markAsRead = async (notif: any) => {
        const id = notif.notificationId || notif.id;
        if (!id || notif.isRead) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications/${id}/read`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => {
                    const nId = n.notificationId || n.id;
                    return nId === id ? { ...n, isRead: true } : n;
                }));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/notifications/read-all`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
                toast.success('Đã đánh dấu tất cả là đã đọc');
            }
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const getDisplayName = (fullName?: any) => {
        if (!fullName) return 'User';
        const strName = String(fullName);
        const words = strName.trim().split(/\s+/);
        if (words.length > 4) {
            // Return last 2 words if name has more than 4 words
            return words.slice(-2).join(' ');
        }
        return strName;
    };

    const getInitial = (fullName?: any) => {
        if (!fullName) return 'U';
        const strName = String(fullName);
        const words = strName.trim().split(/\s+/);
        // Get first letter of last word (usually the last name)
        if (words.length > 0 && words[words.length - 1]) {
            return words[words.length - 1].charAt(0).toUpperCase();
        }
        return 'U';
    };

    const handleLogout = () => {
        // Clear token cookie
        document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Clear all auth data from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Clear all auth data from sessionStorage
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');

        setIsLoggedIn(false);
        setUser(null);
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-black text-slate-800 tracking-tighter flex items-center">
                            <div className="w-8 h-8 bg-primary rounded-lg mr-2 flex items-center justify-center text-white text-xs">SR</div>
                            Stitch<span className="text-primary">Recruit</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-6 items-center">
                        <Link to="/jobs" className="text-slate-600 hover:text-primary font-semibold text-sm transition-colors flex items-center">Việc làm <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg></Link>
                        <Link to="/resumes" className="text-slate-600 hover:text-primary font-semibold text-sm transition-colors flex items-center">Quản lý CV <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg></Link>
                        <Link to="/create-cv" className="text-slate-600 hover:text-primary font-semibold text-sm transition-colors flex items-center">Tạo CV <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg></Link>
                        <Link to="/companies" className="text-slate-600 hover:text-primary font-semibold text-sm transition-colors">Công ty</Link>
                    </nav>

                    {/* Desktop CTA / User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isLoggedIn ? (
                            <div className="flex items-center space-x-4">
                                {/* Notifications Bell - Only for Candidates */}
                                {isCandidate && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className={`relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all ${showNotifications ? 'bg-slate-100' : ''}`}
                                    >
                                        <Bell size={22} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-black text-white flex items-center justify-center">
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
                                            <div className="absolute right-0 mt-4 w-[360px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-30 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                                <div className="p-4 sm:p-5 pb-2 flex items-center justify-between">
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Thông báo</h3>
                                                    <button onClick={handleMarkAllRead} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Đánh dấu tất cả là đã đọc">
                                                        <MoreHorizontal size={20} />
                                                    </button>
                                                </div>

                                                <div className="px-5 py-2 flex gap-2">
                                                    <button
                                                        onClick={() => setNotificationFilter('all')}
                                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${notificationFilter === 'all'
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        Tất cả
                                                    </button>
                                                    <button
                                                        onClick={() => setNotificationFilter('unread')}
                                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${notificationFilter === 'unread'
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        Chưa đọc
                                                    </button>
                                                </div>

                                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pb-4 px-2 mt-2">
                                                    {notificationsLoading ? (
                                                        <div className="py-10 text-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                                        </div>
                                                    ) : (notificationFilter === 'all' ? notifications : notifications.filter(n => !n.isRead)).length > 0 ? (
                                                        <div className="space-y-1">
                                                            {(() => {
                                                                const filtered = (notificationFilter === 'all' ? notifications : notifications.filter(n => !n.isRead)) || [];
                                                                return filtered.map((notif: any) => (
                                                                    <div
                                                                        key={notif.notificationId || notif.id}
                                                                        onClick={() => markAsRead(notif)}
                                                                        className="relative p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer flex gap-3 group"
                                                                    >
                                                                        <div className="relative flex-shrink-0">
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${notif.isRead ? 'bg-slate-100' : 'bg-primary/10'}`}>
                                                                                <div className={`w-full h-full rounded-full flex items-center justify-center font-black text-sm ${notif.isRead ? 'text-slate-400' : 'text-primary'}`}>
                                                                                    {notif.title?.charAt(0) || 'N'}
                                                                                </div>
                                                                            </div>
                                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${notif.isRead ? 'bg-slate-400' : 'bg-primary'}`}>
                                                                                <Bell size={8} className="text-white fill-white" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0 pr-2">
                                                                            <p className="text-[13px] font-medium text-slate-800 leading-snug">
                                                                                <span className="font-black text-slate-900 mr-1">{notif.title || 'Thông báo'}</span>
                                                                                {notif.message || ''}
                                                                            </p>
                                                                            <p className={`text-[11px] mt-1 font-bold ${!notif.isRead ? 'text-primary' : 'text-slate-400'}`}>
                                                                                {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi }) : 'Vừa xong'}
                                                                            </p>
                                                                        </div>
                                                                        {!notif.isRead && (
                                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                                                <div className="w-2 h-2 bg-primary rounded-full shadow-sm shadow-primary/40"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center">
                                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-100">
                                                                <Bell size={20} className="text-slate-300" />
                                                            </div>
                                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Không có thông báo nào</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                )}
                                
                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center space-x-2 focus:outline-none"
                                    >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                        {getInitial(user?.fullName)}
                                    </div>
                                    <span className="text-charcoal font-medium hidden lg:block">{getDisplayName(user?.fullName)}</span>
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-fade-in-up origin-top-right">
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName(user?.fullName)}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Hồ sơ cá nhân</Link>
                                        {hasCompany && (
                                            <>
                                                <Link to="/my-company" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Hồ sơ công ty</Link>
                                            </>
                                        )}
                                        <Link to="/applications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Việc làm đã ứng tuyển</Link>
                                        <Link to="/saved-jobs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Việc làm đã lưu</Link>
                                        <div className="border-t border-gray-50 mt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-charcoal hover:text-primary font-medium px-4 py-2 transition-colors">Đăng nhập</Link>
                                <Link to="/register" className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md">
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-charcoal hover:text-primary focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-lg">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link to="/jobs" className="block px-3 py-2 text-base font-medium text-charcoal hover:text-primary hover:bg-gray-50 rounded-md">Việc làm</Link>
                        <Link to="/companies" className="block px-3 py-2 text-base font-medium text-charcoal hover:text-primary hover:bg-gray-50 rounded-md">Công ty</Link>
                        <Link to="/resumes" className="block px-3 py-2 text-base font-medium text-charcoal hover:text-primary hover:bg-gray-50 rounded-md">Hồ sơ & CV</Link>
                        <Link to="/create-cv" className="block px-3 py-2 text-base font-medium text-charcoal hover:text-primary hover:bg-gray-50 rounded-md">Tạo CV</Link>
                        <a href="#" className="block px-3 py-2 text-base font-medium text-charcoal hover:text-primary hover:bg-gray-50 rounded-md">Blog</a>

                        <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
                            {isLoggedIn ? (
                                <>
                                    <div className="px-4 py-2 flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                            {getInitial(user?.fullName)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-charcoal">{getDisplayName(user?.fullName)}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link to="/profile" className="block px-4 py-2 text-charcoal hover:bg-gray-50 rounded-md">Hồ sơ cá nhân</Link>
                                    {hasCompany && (
                                        <>
                                            <Link to="/dashboard" className="block px-4 py-2 text-charcoal hover:bg-gray-50 rounded-md">Dashboard tuyển dụng</Link>
                                            <Link to="/my-company" className="block px-4 py-2 text-charcoal hover:bg-gray-50 rounded-md">Hồ sơ công ty</Link>
                                        </>
                                    )}
                                    <Link to="/applications" className="block px-4 py-2 text-charcoal hover:bg-gray-50 rounded-md">Việc làm đã ứng tuyển</Link>
                                    <Link to="/saved-jobs" className="block px-4 py-2 text-charcoal hover:bg-gray-50 rounded-md">Việc làm đã lưu</Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="block w-full text-center px-4 py-2 text-charcoal font-medium hover:bg-gray-50 rounded-md">Đăng nhập</Link>
                                    <Link to="/register" className="block w-full text-center px-4 py-3 bg-primary text-white font-semibold rounded-full shadow-sm">Tạo CV ngay</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
