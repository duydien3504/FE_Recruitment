import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchWithAuth } from '../utils/auth';

interface Company {
    companyId: string;
    userId: string;
    name: string;
    taxCode: string;
    logoUrl: string;
    backgroundUrl: string;
    websiteUrl: string;
    scale: string;
    description: string;
    addressDetail: string;
    phoneNumber: string;
    status: string;
    isDeleted: boolean;
    created_at: string;
}

interface Category {
    categoryId: number;
    name: string;
}

interface Location {
    locationId: number;
    name: string;
}

interface Level {
    levelId: number;
    name: string;
}

interface Job {
    jobPostId: string;
    title: string;
    description: string;
    salaryMin: number;
    salaryMax: number;
    salaryDisplay?: string;
    status: string;
    category?: { name: string };
    location?: { name: string };
    level?: { name: string };
}

export default function MyCompanyPage() {
    const [company, setCompany] = useState<Company | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        phone_number: '',
        description: '',
        scale: '',
        website_url: '',
        address_detail: ''
    });

    // Post Job State
    const [showPostJobModal, setShowPostJobModal] = useState(false);
    const [postJobLoading, setPostJobLoading] = useState(false);
    const [postJobData, setPostJobData] = useState({
        title: '',
        description: '',
        requirements: '',
        category_id: 0,
        location_id: 0,
        level_id: 0,
        salary_min: 0,
        salary_max: 0,
        job_type: 'fulltime',
        experience_required: '',
        quantity: 1
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);

    const navigate = useNavigate();

    const fetchCompanyData = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/companies/me`);

            if (response.ok) {
                const json = await response.json();
                setCompany(json.data);
                if (json.data) {
                    setEditData({
                        name: json.data.name || '',
                        phone_number: json.data.phoneNumber || '',
                        description: json.data.description || '',
                        scale: json.data.scale || '',
                        website_url: json.data.websiteUrl || '',
                        address_detail: json.data.addressDetail || ''
                    });
                    // Fetch jobs for this company
                    fetchJobs(json.data.companyId);
                }
            } else {
                if (response.status === 404) {
                    setError('Bạn chưa có thông tin công ty.');
                } else {
                    throw new Error('Không thể tải thông tin công ty');
                }
            }
        } catch (err: any) {
            console.error('Error fetching company:', err);
            setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async (companyId: string) => {
        setJobsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/companies/${companyId}/jobs`);
            if (response.ok) {
                const json = await response.json();
                const basicJobs = json.data || [];

                // Fetch full details for each job as requested
                const detailedJobs = await Promise.all(
                    basicJobs.map(async (job: any) => {
                        try {
                            const detailRes = await fetchWithAuth(`${apiUrl}/api/v1/jobs/${job.jobPostId}`);
                            if (detailRes.ok) {
                                const detailJson = await detailRes.json();
                                return detailJson.data || detailJson;
                            }
                            return job;
                        } catch (err) {
                            return job;
                        }
                    })
                );

                setJobs(detailedJobs);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setJobsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
        fetchMetadata();

        // Check for payment return
        const urlParams = new URLSearchParams(window.location.search);
        const vnpResponseCode = urlParams.get('vnp_ResponseCode');
        if (vnpResponseCode === '00') {
            alert('Đăng tin tuyển dụng và thanh toán thành công!');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (vnpResponseCode) {
            alert('Thanh toán thất bại hoặc bị hủy.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchMetadata = async () => {
        try {
            let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            if (!apiUrl.startsWith('http')) {
                apiUrl = `http://${apiUrl}`;
            }

            console.log('Fetching metadata from:', apiUrl);

            const [catRes, locRes, levRes] = await Promise.all([
                fetch(`${apiUrl}/api/v1/categories`),
                fetch(`${apiUrl}/api/v1/locations`),
                fetch(`${apiUrl}/api/v1/levels`)
            ]);

            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(Array.isArray(catData) ? catData : catData.data || []);
            } else {
                console.error('Failed to fetch categories:', catRes.status);
            }

            if (locRes.ok) {
                const locData = await locRes.json();
                setLocations(Array.isArray(locData) ? locData : locData.data || []);
            } else {
                console.error('Failed to fetch locations:', locRes.status);
            }

            if (levRes.ok) {
                const levData = await levRes.json();
                console.log('Levels Data:', levData);
                setLevels(Array.isArray(levData) ? levData : levData.data || []);
            } else {
                console.error('Failed to fetch levels:', levRes.status, levRes.statusText);
                console.error('Levels URL tried:', `${apiUrl}/api/v1/levels`);
            }
        } catch (error) {
            console.error("Error fetching metadata", error);
        }
    };

    const handlePostJob = async (e: React.FormEvent) => {
        e.preventDefault();
        setPostJobLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            // Validate
            if (!postJobData.category_id || !postJobData.location_id || !postJobData.level_id) {
                throw new Error('Vui lòng chọn đầy đủ danh mục, địa điểm và cấp bậc');
            }
            if (!postJobData.experience_required) {
                throw new Error('Vui lòng chọn kinh nghiệm yêu cầu');
            }

            const payload = {
                title: postJobData.title,
                description: postJobData.description,
                requirements: postJobData.requirements,
                category_id: postJobData.category_id,
                location_id: postJobData.location_id,
                level_id: postJobData.level_id,
                salary_min: postJobData.salary_min,
                salary_max: postJobData.salary_max,
                job_type: postJobData.job_type,
                experience_required: postJobData.experience_required,
                quantity: postJobData.quantity
            };

            console.log('Submitting job payload:', payload);

            const response = await fetchWithAuth(`${apiUrl}/api/v1/jobs`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const jsonResponse = await response.json();
                console.log('Post Job Response:', jsonResponse);

                let redirectUrl = '';

                // Check different potential locations for the payment URL
                if (typeof jsonResponse.data === 'string') {
                    redirectUrl = jsonResponse.data;
                } else if (jsonResponse.data && typeof jsonResponse.data === 'object') {
                    // Start checking properties inside data object if it is an object
                    if (jsonResponse.data.paymentUrl) {
                        redirectUrl = jsonResponse.data.paymentUrl;
                    } else if (jsonResponse.data.url) {
                        redirectUrl = jsonResponse.data.url;
                    }
                } else if (typeof jsonResponse === 'string' && jsonResponse.startsWith('http')) {
                    redirectUrl = jsonResponse;
                } else if (jsonResponse.paymentUrl) {
                    redirectUrl = jsonResponse.paymentUrl;
                }

                if (redirectUrl && redirectUrl.startsWith('http')) {
                    console.log('Redirecting to:', redirectUrl);
                    window.location.href = redirectUrl;
                } else {
                    console.warn('No valid payment URL found in response:', jsonResponse);
                    alert('Đăng tin thành công! Vui lòng kiểm tra email để thanh toán nếu cần.');
                    setShowPostJobModal(false);
                    fetchCompanyData();
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Post job error response:', errorData);
                throw new Error(errorData.message || `Lỗi ${response.status}: Đăng tin thất bại`);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setPostJobLoading(false);
        }
    };

    const handleUpdateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/companies/me`, {
                method: 'PUT',
                body: JSON.stringify(editData)
            });

            if (response.ok) {
                await fetchCompanyData();
                setShowEditModal(false);
                alert('Cập nhật thông tin công ty thành công!');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Cập nhật thất bại');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const endpoint = type === 'logo' ? '/api/v1/companies/logo' : '/api/v1/companies/background';

            const response = await fetchWithAuth(`${apiUrl}${endpoint}`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Tải ảnh lên thất bại');
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            alert('Có lỗi xảy ra khi tải ảnh lên');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thông báo</h2>
                        <p className="text-gray-500 mb-6">{error || 'Không tìm thấy thông tin công ty.'}</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full py-3 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all"
                        >
                            Quay lại trang cá nhân
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-20">
                {/* Subtle Banner Area */}
                <div
                    className="h-64 md:h-80 w-full relative overflow-hidden bg-gray-100 group cursor-pointer"
                    onClick={() => document.getElementById('background-upload')?.click()}
                    title="Nhấp để thay đổi ảnh bìa"
                >
                    <input
                        type="file"
                        id="background-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'background')}
                    />
                    <img
                        src={company.backgroundUrl || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"}
                        alt="Background"
                        className="w-full h-full object-cover opacity-60 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white/90"></div>
                    <div className="absolute inset-0 backdrop-blur-[1px]"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <div className="bg-white/90 p-3 rounded-full shadow-lg">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
                    {/* Main Info Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                        <div
                            className="w-40 h-40 bg-white rounded-3xl border shadow-lg flex items-center justify-center p-4 -mt-20 md:-mt-24 overflow-hidden bg-white relative group cursor-pointer"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            title="Nhấp để thay đổi logo"
                        >
                            <input
                                type="file"
                                id="logo-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'logo')}
                            />
                            <img
                                src={company.logoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                                alt={company.name}
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-grow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-3xl font-extrabold text-charcoal">{company.name}</h1>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${company.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {company.status === 'Active' ? 'Đang hoạt động' : 'Chờ duyệt'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all border border-primary/20 flex items-center gap-2 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all border border-primary/20 flex items-center gap-2 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Chỉnh sửa hồ sơ
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-500 mb-6 text-lg max-w-3xl leading-relaxed">{company.description}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm text-gray-600">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <span className="font-medium">{company.addressDetail}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                    </div>
                                    <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors underline decoration-primary/30">{(company.websiteUrl || '').replace(/^https?:\/\//, '')}</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <span className="font-medium">{company.scale} nhân viên</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <span className="font-medium">{company.phoneNumber}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </div>
                                    <span className="font-medium">MST: {company.taxCode}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className="font-medium">Tham gia từ: {company.created_at ? new Date(company.created_at).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Company Details */}
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-2xl font-bold text-charcoal mb-6 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                                    Giới thiệu công ty
                                </h2>
                                <div className="prose prose-blue max-w-none text-gray-600 leading-loose text-lg whitespace-pre-line">
                                    {company.description}
                                </div>
                            </section>

                            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-charcoal flex items-center gap-3">
                                        <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                                        Vị trí tuyển dụng
                                    </h2>
                                    {jobs.length > 0 && (
                                        <span className="bg-green-50 text-green-600 px-4 py-1 rounded-full text-sm font-bold">
                                            {jobs.length} vị trí đang mở
                                        </span>
                                    )}
                                </div>

                                {jobsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : jobs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {jobs.map((job) => (
                                            <div
                                                key={job.jobPostId}
                                                className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-primary/20 hover:shadow-lg transition-all group relative cursor-pointer"
                                                onClick={() => navigate(`/jobs/${job.jobPostId}`)}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="font-bold text-xl text-charcoal group-hover:text-primary transition-colors line-clamp-1 pr-4">{job.title}</h3>
                                                    <span className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-tight ${job.status === 'Active' ? 'bg-green-50 text-green-500 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                                                        {job.status === 'Active' ? 'ĐANG TUYỂN' : 'CHỜ DUYỆT'}
                                                    </span>
                                                </div>

                                                <div className="mb-6 flex gap-1 items-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <p className="text-blue-500 font-extrabold text-lg">
                                                        {job.salaryDisplay || `${Number(job.salaryMin || 0).toLocaleString('vi-VN')} - ${Number(job.salaryMax || 0).toLocaleString('vi-VN')} VND`}
                                                    </p>
                                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 font-medium">Chưa có vị trí tuyển dụng nào đang mở.</p>
                                        <button
                                            onClick={() => setShowPostJobModal(true)}
                                            className="mt-4 text-primary font-bold hover:underline"
                                        >
                                            Đăng tin tuyển dụng ngay
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar Info */}
                        <aside className="space-y-6">
                            <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-charcoal mb-6">Thông tin bổ sung</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Mã doanh nghiệp</p>
                                        <p className="font-bold text-charcoal">{company.taxCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Quy mô</p>
                                        <p className="font-bold text-charcoal">{company.scale} nhân viên</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Trạng thái hồ sơ</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${company.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                                            <p className={`font-bold ${company.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {company.status === 'Active' ? 'Đã kích hoạt' : 'Đang chờ duyệt'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-primary rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-4">Quản lý tuyển dụng</h3>
                                    <p className="text-white/80 text-sm mb-6 leading-relaxed">Đăng tin tuyển dụng mới và quản lý các ứng viên tiềm năng một cách chuyên nghiệp.</p>
                                    <button
                                        onClick={() => setShowPostJobModal(true)}
                                        className="w-full py-3 bg-white text-primary font-bold rounded-full hover:bg-gray-100 transition-all shadow-md"
                                    >
                                        Đăng tin ngay
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Edit Company Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => !editLoading && setShowEditModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-charcoal transition-colors text-xl"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-bold mb-6 text-charcoal flex items-center gap-3">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            Chỉnh sửa hồ sơ công ty
                        </h3>

                        <form onSubmit={handleUpdateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên công ty</label>
                                <input
                                    type="text"
                                    required
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                                <input
                                    type="tel"
                                    required
                                    value={editData.phone_number}
                                    onChange={e => setEditData({ ...editData, phone_number: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Quy mô (VD: 100-500)</label>
                                <input
                                    type="text"
                                    required
                                    value={editData.scale}
                                    onChange={e => setEditData({ ...editData, scale: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Website URL</label>
                                <input
                                    type="url"
                                    required
                                    value={editData.website_url}
                                    onChange={e => setEditData({ ...editData, website_url: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ chi tiết</label>
                                <input
                                    type="text"
                                    required
                                    value={editData.address_detail}
                                    onChange={e => setEditData({ ...editData, address_detail: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả công ty</label>
                                <textarea
                                    required
                                    value={editData.description}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 py-3 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center disabled:opacity-70"
                                >
                                    {editLoading ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Đang lưu...
                                        </>
                                    ) : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Post Job Modal */}
            {showPostJobModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-4xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => !postJobLoading && setShowPostJobModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-charcoal transition-colors text-xl"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-bold mb-6 text-charcoal flex items-center gap-3">
                            <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                            Đăng tin tuyển dụng mới
                        </h3>

                        <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề công việc <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={postJobData.title}
                                    onChange={e => setPostJobData({ ...postJobData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="VD: Senior ReactJS Developer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mức lương tối thiểu (VND)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={postJobData.salary_min}
                                    onChange={e => setPostJobData({ ...postJobData, salary_min: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mức lương tối đa (VND)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={postJobData.salary_max}
                                    onChange={e => setPostJobData({ ...postJobData, salary_max: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục nghề nghiệp <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={postJobData.category_id || 0}
                                    onChange={e => setPostJobData({ ...postJobData, category_id: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value={0}>-- Chọn danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Địa điểm làm việc <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={postJobData.location_id || 0}
                                    onChange={e => setPostJobData({ ...postJobData, location_id: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value={0}>-- Chọn địa điểm --</option>
                                    {locations.map(loc => (
                                        <option key={loc.locationId} value={loc.locationId}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>


                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hình thức làm việc <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={postJobData.job_type}
                                    onChange={e => setPostJobData({ ...postJobData, job_type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value="fulltime">Toàn thời gian (Full-time)</option>
                                    <option value="parttime">Bán thời gian (Part-time)</option>
                                    <option value="remote">Làm từ xa (Remote)</option>
                                    <option value="hybrid">Kết hợp (Hybrid)</option>
                                    <option value="internship">Thực tập (Internship)</option>
                                    <option value="freelance">Freelance</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Kinh nghiệm yêu cầu <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={postJobData.experience_required}
                                    onChange={e => setPostJobData({ ...postJobData, experience_required: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value="">-- Chọn kinh nghiệm --</option>
                                    <option value="Không yêu cầu">Không yêu cầu</option>
                                    <option value="Dưới 1 năm">Dưới 1 năm</option>
                                    <option value="1 năm">1 năm</option>
                                    <option value="2 năm">2 năm</option>
                                    <option value="3 năm">3 năm</option>
                                    <option value="4 năm">4 năm</option>
                                    <option value="5 năm">5 năm</option>
                                    <option value="Trên 5 năm">Trên 5 năm</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng tuyển <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={postJobData.quantity}
                                    onChange={e => setPostJobData({ ...postJobData, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cấp bậc <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={postJobData.level_id || 0}
                                    onChange={e => setPostJobData({ ...postJobData, level_id: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value={0}>-- Chọn cấp bậc --</option>
                                    {levels.map(lvl => (
                                        <option key={lvl.levelId} value={lvl.levelId}>{lvl.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả công việc <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows={5}
                                    value={postJobData.description}
                                    onChange={e => setPostJobData({ ...postJobData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    placeholder="Mô tả chi tiết về trách nhiệm, quyền hạn..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Yêu cầu ứng viên <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows={5}
                                    value={postJobData.requirements}
                                    onChange={e => setPostJobData({ ...postJobData, requirements: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    placeholder="Kỹ năng, kinh nghiệm, bằng cấp..."
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPostJobModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={postJobLoading}
                                    className="flex-1 py-3 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center disabled:opacity-70"
                                >
                                    {postJobLoading ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Đang xử lý...
                                        </>
                                    ) : 'Đăng ký & Thanh toán'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <Footer />
        </div>
    );
}
