import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';
import { fetchWithAuth } from '../utils/auth';

interface UserProfile {
    userId: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    gender: string;
    avatar: string;
    role: string;
    status: string;
    createdAt: string;
    bio: string;
}

interface Skill {
    skillId: number;
    name: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Edit profile states
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        fullName: '',
        phone: '',
        address: '',
        bio: '',
        dateOfBirth: ''
    });
    const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Change password modal states
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Skills states
    const [skills, setSkills] = useState<Skill[]>([]);
    const [showAddSkillsModal, setShowAddSkillsModal] = useState(false);
    const [allAvailableSkills, setAllAvailableSkills] = useState<Skill[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
    const [addSkillsLoading, setAddSkillsLoading] = useState(false);
    const [fetchingAllSkills, setFetchingAllSkills] = useState(false);

    // Company Registration states
    const [showCompanyRegModal, setShowCompanyRegModal] = useState(false);
    const [companyData, setCompanyData] = useState({
        tax_code: '',
        company_name: '',
        address: '',
        phone: ''
    });
    const [companyRegLoading, setCompanyRegLoading] = useState(false);
    const [companyRegSuccess, setCompanyRegSuccess] = useState(false);
    const [companyRegError, setCompanyRegError] = useState('');
    const [hasCompany, setHasCompany] = useState(false);

    // Candidate Interviews State
    const [interviews, setInterviews] = useState<any[]>([]);
    const [interviewsLoading, setInterviewsLoading] = useState(false);

    useEffect(() => {
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
        fetchCandidateInterviews();
    }, []);

    const fetchCandidateInterviews = async () => {
        setInterviewsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/candidate/interviews`);
            if (response.ok) {
                const json = await response.json();
                setInterviews(json.data || []);
            }
        } catch (error) {
            console.error("Error fetching interviews:", error);
        } finally {
            setInterviewsLoading(false);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            // Fetch profile and skills in parallel
            const [profileRes, skillsRes] = await Promise.all([
                fetchWithAuth(`${apiUrl}/api/v1/users/profile`),
                fetchWithAuth(`${apiUrl}/api/v1/users/skills`)
            ]);

            if (!profileRes.ok) throw new Error('Failed to fetch profile');

            const profileJson = await profileRes.json();
            setProfile(profileJson.data);

            if (skillsRes.ok) {
                const skillsJson = await skillsRes.json();
                setSkills(skillsJson.data || []);
            }
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Could not load profile');
            if (err.message.includes('token')) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [navigate]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getRoleDisplay = (role: string) => {
        const roleMap: { [key: string]: string } = {
            'seeker': 'Người tìm việc',
            'candidate': 'Người tìm việc',
            'employer': 'Nhà tuyển dụng',
            'admin': 'Quản trị viên'
        };
        return roleMap[role?.toLowerCase()] || role || 'Chưa xác định';
    };

    const isActive = (status: string) => {
        return status?.toLowerCase() === 'active';
    };

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 800;
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                            } else {
                                reject(new Error('Nén ảnh thất bại'));
                            }
                        },
                        'image/jpeg',
                        0.8
                    );
                };
                img.onerror = () => reject(new Error('Không thể đọc file ảnh'));
            };
            reader.onerror = () => reject(new Error('Không thể đọc file'));
        });
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Chỉ chấp nhận file ảnh JPG, JPEG, PNG');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Kích thước file quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB');
            return;
        }

        setAvatarUploading(true);
        try {
            const compressedFile = await compressImage(file);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const formData = new FormData();
            formData.append('file', compressedFile);

            const response = await fetchWithAuth(`${apiUrl}/api/v1/users/avatar`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload ảnh thất bại');

            await fetchAllData();
            toast.success('Cập nhật ảnh đại diện thành công!');
        } catch (err: any) {
            toast.error(err.message || 'Đã xảy ra lỗi khi upload ảnh');
        } finally {
            setAvatarUploading(false);
            event.target.value = '';
        }
    };

    const handleStartEditing = () => {
        if (profile) {
            setEditData({
                fullName: profile.fullName || '',
                phone: profile.phone || '',
                address: profile.address || '',
                bio: profile.bio || '',
                dateOfBirth: profile.dateOfBirth?.split('T')[0] || ''
            });
            setIsEditing(true);
        }
    };

    const handleSaveProfile = async () => {
        setProfileUpdateLoading(true);
        try {
            const payload: any = {
                fullName: editData.fullName,
                phone: editData.phone,
                address: editData.address,
                bio: editData.bio
            };
            if (editData.dateOfBirth) payload.dateOfBirth = editData.dateOfBirth;

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/users/profile`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Cập nhật hồ sơ thất bại');

            await fetchAllData();
            toast.success('Cập nhật hồ sơ thành công!');
            setIsEditing(false);
        } catch (err: any) {
            toast.error(err.message || 'Đã xảy ra lỗi khi cập nhật hồ sơ');
        } finally {
            setProfileUpdateLoading(false);
        }
    };

    const handleSaveSkills = async () => {
        if (selectedSkillIds.length === 0) {
            alert('Vui lòng chọn ít nhất một kỹ năng');
            return;
        }

        setAddSkillsLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/users/skills`, {
                method: 'POST',
                body: JSON.stringify({ skillIds: selectedSkillIds }),
            });

            if (response.ok) {
                // Refresh both user profile and their current skills
                await fetchAllData();
                setShowAddSkillsModal(false);
                setSelectedSkillIds([]);
                toast.success('Cập nhật kỹ năng thành công!');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể lưu kỹ năng');
            }
        } catch (err: any) {
            toast.error(err.message || 'Đã xảy ra lỗi khi lưu kỹ năng');
        } finally {
            setAddSkillsLoading(false);
        }
    };

    const fetchAvailableSkills = async () => {
        setFetchingAllSkills(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/skills`);
            if (response.ok) {
                const data = await response.json();
                setAllAvailableSkills(data.data || []);

                // Pre-select skills that the user already has
                setSelectedSkillIds(skills.map(s => s.skillId));
            }
        } catch (err) {
            console.error('Error fetching all skills:', err);
        } finally {
            setFetchingAllSkills(false);
        }
    };

    const toggleSkillSelection = (skillId: number) => {
        setSelectedSkillIds(prev =>
            prev.includes(skillId)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId]
        );
    };

    const handleDeleteSkill = async (skillId: number, skillName: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa kỹ năng "${skillName}"?`)) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/users/skills/${skillId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchAllData();
                toast.success(`Đã xóa kỹ năng ${skillName}`);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể xóa kỹ năng');
            }
        } catch (err: any) {
            toast.error(err.message || 'Đã xảy ra lỗi khi xóa kỹ năng');
        }
    };

    const handleCompanyRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setCompanyRegError('');
        setCompanyRegLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/users/upgrade-employer`, {
                method: 'POST',
                body: JSON.stringify(companyData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Đăng ký doanh nghiệp thất bại');
            }

            setCompanyRegSuccess(true);
            setCompanyData({
                tax_code: '',
                company_name: '',
                address: '',
                phone: ''
            });

            // Close modal after 3 seconds
            setTimeout(() => {
                setShowCompanyRegModal(false);
                setCompanyRegSuccess(false);
            }, 3000);
        } catch (err: any) {
            setCompanyRegError(err.message || 'Đã xảy ra lỗi khi đăng ký doanh nghiệp');
        } finally {
            setCompanyRegLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/users/change-password`, {
                method: 'PATCH',
                body: JSON.stringify(passwordData),
            });
            if (!response.ok) throw new Error('Đổi mật khẩu thất bại');
            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({ oldPassword: '', newPassword: '' });
            setShowChangePasswordModal(false);
        } catch (err: any) {
            toast.error(err.message || 'Đã xảy ra lỗi');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-20">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">Không thể tải thông tin</h2>
                        <p className="text-gray-500">{error || 'Vui lòng thử lại sau.'}</p>
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
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-charcoal">Hồ sơ cá nhân</h1>
                        <p className="text-gray-600 mt-2">Quản lý thông tin cá nhân của bạn</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex flex-col items-center">
                                    <div className="relative group">
                                        <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                        <div onClick={() => document.getElementById('avatar-upload')?.click()} className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-primary/10 cursor-pointer relative">
                                            {profile.avatar ? <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">{profile.fullName?.charAt(0).toUpperCase()}</div>}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                {avatarUploading ? <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div> : <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                            </div>
                                        </div>
                                    </div>
                                    <h2 className="mt-4 text-xl font-bold text-charcoal">{profile.fullName}</h2>
                                    <p className="text-sm text-gray-500">{profile.email}</p>
                                    <div className="mt-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isActive(profile.status) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isActive(profile.status) ? 'Đang hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </div>
                                    <button onClick={() => setShowChangePasswordModal(true)} className="mt-6 w-full py-2.5 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all">Đổi mật khẩu</button>
                                    <button onClick={isEditing ? handleSaveProfile : handleStartEditing} disabled={profileUpdateLoading} className="mt-3 w-full py-2.5 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all">{isEditing ? 'Lưu' : 'Chỉnh sửa hồ sơ'}</button>

                                    {profile.role?.toLowerCase() === 'admin' && (
                                        <button
                                            onClick={() => navigate('/admin/dashboard')}
                                            className="mt-3 w-full py-2.5 bg-slate-100 text-slate-800 font-bold rounded-full hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm border border-slate-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Dashboard Admin
                                        </button>
                                    )}

                                    {hasCompany && (
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="mt-3 w-full py-2.5 px-4 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-sm flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            Dashboard Tuyển dụng
                                        </button>
                                    )}

                                    {!hasCompany && ['seeker', 'candidate'].includes(profile.role?.toLowerCase() || '') && (
                                        <button
                                            onClick={() => setShowCompanyRegModal(true)}
                                            className="mt-3 w-full py-2.5 px-4 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-sm flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            Đăng ký doanh nghiệp
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6">
                                <h3 className="text-lg font-bold mb-4">Tài khoản</h3>
                                <div className="space-y-3 text-sm">
                                    <div><p className="text-gray-500">Vai trò</p><p className="font-semibold">{getRoleDisplay(profile.role)}</p></div>
                                    <div><p className="text-gray-500">Ngày tạo</p><p className="font-semibold">{formatDate(profile.createdAt)}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-6">Thông tin chi tiết</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-2">Họ và tên</label>
                                            <input type="text" disabled={!isEditing} value={isEditing ? editData.fullName : profile.fullName} onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} className={`w-full px-4 py-3 rounded-lg border ${isEditing ? 'bg-white' : 'bg-gray-50 font-semibold'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-2">Email</label>
                                            <input type="email" disabled value={profile.email} className="w-full px-4 py-3 bg-gray-50 rounded-lg border font-semibold" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-2">Số điện thoại</label>
                                        <input type="text" disabled={!isEditing} value={isEditing ? editData.phone : profile.phone || 'Chưa cập nhật'} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className={`w-full px-4 py-3 rounded-lg border ${isEditing ? 'bg-white' : 'bg-gray-50 font-semibold'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-2">Địa chỉ</label>
                                        <input type="text" disabled={!isEditing} value={isEditing ? editData.address : profile.address || 'Chưa cập nhật'} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className={`w-full px-4 py-3 rounded-lg border ${isEditing ? 'bg-white' : 'bg-gray-50 font-semibold'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-2">Giới thiệu</label>
                                        <textarea disabled={!isEditing} value={isEditing ? editData.bio : profile.bio || 'Chưa cập nhật'} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={4} className={`w-full px-4 py-3 rounded-lg border resize-none ${isEditing ? 'bg-white' : 'bg-gray-50 font-semibold'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    Lịch phỏng vấn của bạn
                                </h2>

                                {interviewsLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    </div>
                                ) : interviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {interviews.map((interview: any) => (
                                            <div key={interview.interviewId} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{interview.title || 'Phỏng vấn'}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {new Date(interview.startTime).toLocaleDateString('vi-VN')} - {new Date(interview.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {interview.meetingLink ? (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Online Meeting</span>
                                                        ) : (
                                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">{interview.location || 'Tại văn phòng'}</span>
                                                        )}
                                                        <span className={`text-xs px-2 py-1 rounded font-medium ${interview.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                            interview.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {interview.status || 'SCHEDULED'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {interview.meetingLink && (
                                                    <a
                                                        href={interview.meetingLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors text-center shadow-sm shadow-blue-200"
                                                    >
                                                        Tham gia ngay
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500">Bạn chưa có lịch phỏng vấn nào sắp tới.</p>
                                    </div>
                                )}
                            </div>

                            {/* Skills Section */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Kỹ năng</h3>
                                    <button
                                        onClick={() => {
                                            setShowAddSkillsModal(true);
                                            fetchAvailableSkills();
                                        }}
                                        className="text-primary font-semibold text-sm hover:text-blue-700 transition-colors flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Thêm kỹ năng
                                    </button>
                                </div>
                                {skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map(s => (
                                            <div key={s.skillId} className="group relative flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full font-medium text-sm border border-primary/20 hover:bg-primary/15 transition-all">
                                                {s.name}
                                                <button
                                                    onClick={() => handleDeleteSkill(s.skillId, s.name)}
                                                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-0.5"
                                                    title={`Xóa ${s.name}`}
                                                >
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed text-gray-500">Chưa có kỹ năng nào</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
                        <button onClick={() => setShowChangePasswordModal(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                        <h3 className="text-2xl font-bold mb-6">Đổi mật khẩu</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
                            <div>
                                <label className="block text-sm mb-1">Mật khẩu cũ</label>
                                <input type="password" required value={passwordData.oldPassword} onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Mật khẩu mới</label>
                                <input type="password" required value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <button type="submit" disabled={passwordLoading} className="w-full py-3 bg-primary text-white font-bold rounded-full">{passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
                        </form>
                    </div>
                </div>
            )}
            <Footer />

            {/* Add Skills Modal */}
            {showAddSkillsModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
                        <button
                            onClick={() => !addSkillsLoading && setShowAddSkillsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-charcoal transition-colors"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-bold mb-2">Cập nhật kỹ năng</h3>
                        <p className="text-gray-500 text-sm mb-6">Chọn các kỹ năng phù hợp với hồ sơ của bạn</p>

                        {fetchingAllSkills ? (
                            <div className="py-12 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="mt-3 text-sm text-gray-500">Đang tải danh sách kỹ năng...</p>
                            </div>
                        ) : (
                            <>
                                <div className="max-h-60 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                                    <div className="flex flex-wrap gap-2">
                                        {allAvailableSkills.map(skill => (
                                            <button
                                                key={skill.skillId}
                                                onClick={() => toggleSkillSelection(skill.skillId)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedSkillIds.includes(skill.skillId)
                                                    ? 'bg-primary text-white border-primary shadow-md'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                                                    }`}
                                            >
                                                {skill.name}
                                            </button>
                                        ))}
                                    </div>
                                    {allAvailableSkills.length === 0 && (
                                        <p className="text-center text-gray-500 py-4">Không có kỹ năng nào khả dụng</p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowAddSkillsModal(false)}
                                        className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSaveSkills}
                                        disabled={addSkillsLoading}
                                        className={`flex-2 py-3 px-8 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center ${addSkillsLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {addSkillsLoading ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                Đang lưu...
                                            </>
                                        ) : 'Lưu kỹ năng'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Company Registration Modal */}
            {showCompanyRegModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
                        <button
                            onClick={() => !companyRegLoading && setShowCompanyRegModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-charcoal transition-colors"
                        >
                            ✕
                        </button>

                        <h3 className="text-2xl font-bold mb-2 text-charcoal">Đăng ký doanh nghiệp</h3>
                        <p className="text-gray-500 text-sm mb-6">Nâng cấp tài khoản của bạn lên Nhà tuyển dụng</p>

                        {companyRegSuccess ? (
                            <div className="py-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h4>
                                <p className="text-gray-600">Hồ sơ của bạn đang được xem xét. Vui lòng đợi duyệt.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCompanyRegistration} className="space-y-4">
                                {companyRegError && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                        {companyRegError}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên doanh nghiệp</label>
                                    <input
                                        type="text"
                                        required
                                        value={companyData.company_name}
                                        onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Tên công ty đầy đủ"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế / Mã doanh nghiệp</label>
                                    <input
                                        type="text"
                                        required
                                        value={companyData.tax_code}
                                        onChange={(e) => setCompanyData({ ...companyData, tax_code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Ví dụ: 0123456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ doanh nghiệp</label>
                                    <input
                                        type="text"
                                        required
                                        value={companyData.address}
                                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Địa chỉ trụ sở"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
                                    <input
                                        type="tel"
                                        required
                                        value={companyData.phone}
                                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Số điện thoại công ty"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={companyRegLoading}
                                    className={`w-full py-3 mt-4 bg-primary text-white font-bold rounded-full hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center ${companyRegLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {companyRegLoading ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Đang xử lý...
                                        </>
                                    ) : 'Đăng ký'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
