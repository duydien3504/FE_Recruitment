import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Company {
    companyId: string;
    name: string;
    logoUrl: string;
    scale: string;
    description: string;
    addressDetail: string;
}

export default function CompanyListingPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const ITEMS_PER_PAGE = 12;

    const fetchCompanies = async (page = 1, keyword = '') => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', ITEMS_PER_PAGE.toString());
            if (keyword) params.append('keyword', keyword);

            const response = await fetch(`${apiUrl}/api/v1/companies?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setCompanies(data.data || []);
                if (data.totalPages) {
                    setTotalPages(data.totalPages);
                } else if (data.total) {
                    setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
                } else {
                    setTotalPages(1);
                }
            }
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies(currentPage, searchTerm);
    }, [currentPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchCompanies(1, searchTerm);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-20">
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <h1 className="text-3xl font-bold text-charcoal mb-6 text-center md:text-left">Khám phá các doanh nghiệp hàng đầu</h1>

                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto md:mx-0 relative flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-grow">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Tìm tên công ty..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
                            >
                                Tìm kiếm
                            </button>
                        </form>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {companies.map((company) => (
                                    <Link
                                        key={company.companyId}
                                        to={`/companies/${company.companyId}`}
                                        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center"
                                    >
                                        <div className="w-24 h-24 rounded-2xl bg-gray-50 p-4 border border-gray-50 group-hover:bg-white group-hover:border-primary/20 transition-all mb-4">
                                            <img
                                                src={company.logoUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                                                alt={company.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <h3 className="font-bold text-lg text-charcoal group-hover:text-primary transition-colors line-clamp-1 mb-2">
                                            {company.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1 justify-center">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {company.scale} nhân viên
                                        </p>
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-6">
                                            {company.description || "Website chuyên về tuyển dụng và việc làm."}
                                        </p>
                                        <div className="mt-auto pt-4 border-t border-gray-50 w-full flex justify-center">
                                            <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 uppercase tracking-wider">
                                                Xem hồ sơ
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {companies.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-charcoal">Không tìm thấy công ty</h3>
                                    <p className="text-gray-500">Thử tìm kiếm với một từ khóa khác bạn nhé!</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="mt-12 flex justify-center items-center gap-4">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-charcoal hover:text-primary hover:border-primary'}`}
                                    >
                                        Trở lại
                                    </button>
                                    <span className="font-bold text-charcoal">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-charcoal hover:text-primary hover:border-primary'}`}
                                    >
                                        Tiếp theo
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
