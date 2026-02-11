import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { fetchWithAuth } from '../utils/auth';

interface JobPost {
    jobPostId: number;
    title: string;
    description: string;
    salaryMin: string;
    salaryMax: string;
    expiredAt: string;
    created_at: string;
    locationId: number;
}

interface CompanyDetail {
    companyId: string;
    name: string;
    taxCode: string;
    logoUrl: string;
    backgroundUrl: string;
    websiteUrl: string;
    scale: string;
    description: string;
    addressDetail: string;
    phoneNumber: string;
    jobPosts: JobPost[];
}

export default function CompanyProfilePage() {
    const { id } = useParams();
    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCompanyDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const response = await fetchWithAuth(`${apiUrl}/api/v1/companies/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch company details');
                }

                const json = await response.json();
                setCompany(json.data);
            } catch (err: any) {
                console.error("Error fetching company details:", err);
                setError(err.message || 'Could not load company info');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyDetail();
    }, [id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatSalary = (min: string, max: string) => {
        const minNum = parseFloat(min);
        const maxNum = parseFloat(max);

        const formatNumber = (num: number) => {
            if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
            return num.toLocaleString('vi-VN');
        };

        if (minNum > 0 && maxNum > 0) return `${formatNumber(minNum)} - ${formatNumber(maxNum)} VND`;
        return 'Thỏa thuận';
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
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy công ty</h2>
                        <p className="text-gray-500">{error || 'Công ty này không tồn tại.'}</p>
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
                {/* Cover Image */}
                <div className="h-64 md:h-80 w-full relative">
                    <img
                        src={company.backgroundUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"}
                        alt="Office"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl border-4 border-white shadow-md flex items-center justify-center p-4 -mt-16 md:-mt-20">
                            <img src={company.logoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt={company.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h1 className="text-3xl font-bold text-charcoal mb-2">{company.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {company.addressDetail}
                                </span>
                                {company.websiteUrl && (
                                    <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                        {company.websiteUrl.replace(/https?:\/\//, '')}
                                    </a>
                                )}
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    {company.scale} nhân viên
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <button className="px-6 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-blue-600 transition-colors shadow-sm">
                                + Theo dõi
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h2 className="text-xl font-bold text-charcoal mb-4">Giới thiệu công ty</h2>
                                <div className="space-y-4 text-gray-600 leading-relaxed whitespace-pre-line">
                                    {company.description}
                                </div>
                            </section>

                            <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h2 className="text-xl font-bold text-charcoal mb-4">Tuyển dụng đang mở</h2>
                                <div className="space-y-4">
                                    {company.jobPosts && company.jobPosts.length > 0 ? (
                                        company.jobPosts.map((job) => (
                                            <div key={job.jobPostId} className="border border-gray-100 rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/30 gap-4">
                                                <div>
                                                    <Link to={`/jobs/${job.jobPostId}`} className="font-bold text-charcoal text-lg hover:text-primary transition-colors">{job.title}</Link>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                        <span className="text-green-600 font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span>Hạn nộp: {formatDate(job.expiredAt)}</span>
                                                    </div>
                                                </div>
                                                <Link to={`/jobs/${job.jobPostId}`} className="text-primary font-bold text-sm bg-white border border-primary/20 px-6 py-2 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm">Xem chi tiết</Link>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 italic">
                                            Hiện tại công ty chưa có vị trí tuyển dụng mới.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-6">
                            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-charcoal mb-4">Thông tin liên lạc</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                                        <p className="text-charcoal font-medium">{company.phoneNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Mã số thuế</p>
                                        <p className="text-charcoal font-medium">{company.taxCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                                        <p className="text-gray-600 text-sm">{company.addressDetail}</p>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-charcoal mb-4">Phúc lợi</h3>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        Bảo hiểm sức khỏe toàn diện
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        Lương thưởng tháng 13
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        Du lịch công ty hàng năm
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        Cơ hội thăng tiến rõ ràng
                                    </li>
                                </ul>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
