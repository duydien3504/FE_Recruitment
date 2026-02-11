
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';


export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hasCompany, setHasCompany] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        // Check for user info in localStorage or sessionStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser) {
                    setIsLoggedIn(true);
                    setUser(parsedUser);

                    // Check if user has company if they are employer or candidate
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
            } catch (error) {
                console.error("Failed to parse user data:", error);
                // Clear invalid data
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
            }
        }
    }, []);

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
                        <Link to="/" className="text-2xl font-bold text-charcoal tracking-tighter">
                            Stitch<span className="text-primary">Recruit</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <Link to="/jobs" className="text-charcoal hover:text-primary font-medium transition-colors">Việc làm</Link>
                        <Link to="/companies" className="text-charcoal hover:text-primary font-medium transition-colors">Công ty</Link>
                        <Link to="/resumes" className="text-charcoal hover:text-primary font-medium transition-colors">Hồ sơ & CV</Link>
                        <a href="#" className="text-charcoal hover:text-primary font-medium transition-colors">Blog</a>
                    </nav>

                    {/* Desktop CTA / User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isLoggedIn ? (
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
