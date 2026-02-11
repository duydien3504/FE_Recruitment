
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import { fetchWithAuth, getAccessToken } from '../utils/auth';

interface Job {
    jobPostId: number;
    title: string;
    company: {
        companyId: string;
        name: string;
        logoUrl: string;
    };
    location: {
        name: string;
    };
    salaryMin: string;
    salaryMax: string;
    created_at: string;
    isSaved?: boolean;
}

interface Location {
    id: number;
    locationId?: number;
    name: string;
    city?: string;
}

interface Category {
    categoryId: number;
    name: string;
}

export default function JobListingPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedType, setSelectedType] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const [jobs, setJobs] = useState<Job[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());

    // Fetch Saved Job IDs
    const fetchSavedJobs = async () => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs`);
            if (response.ok) {
                const json = await response.json();
                const savedIds = new Set<number>((json.data || []).map((item: any) => item.jobPostId));
                setSavedJobIds(savedIds);
            }
        } catch (error) {
            console.error("Failed to fetch saved jobs", error);
        }
    };

    // Fetch Locations
    useEffect(() => {
        fetchSavedJobs();
        const fetchLocations = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const response = await fetch(`${apiUrl}/api/v1/locations`);
                if (response.ok) {
                    const data = await response.json();
                    setLocations(Array.isArray(data) ? data : data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch locations", error);
            }
        };
        const fetchCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const response = await fetch(`${apiUrl}/api/v1/categories`);
                if (response.ok) {
                    const data = await response.json();
                    setCategories(Array.isArray(data) ? data : data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchLocations();
        fetchCategories();
    }, []);

    // Fetch Jobs
    const fetchJobs = async (page = 1) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const params = new URLSearchParams();
            if (searchTerm) params.append('keyword', searchTerm);
            if (selectedLocation) params.append('location_id', selectedLocation);
            if (selectedCategory) params.append('category_id', selectedCategory);

            params.append('page', page.toString());
            params.append('limit', ITEMS_PER_PAGE.toString());

            const response = await fetch(`${apiUrl}/api/v1/jobs?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const jobList = data.data || [];

                // Map jobs and set isSaved based on savedJobIds
                const jobsWithSavedStatus = jobList.map((job: Job) => ({
                    ...job,
                    isSaved: savedJobIds.has(job.jobPostId)
                }));

                setJobs(jobsWithSavedStatus);

                // Handle pagination from response
                // Assuming API returns 'totalPages' or 'total' (count of items)
                if (data.totalPages) {
                    setTotalPages(data.totalPages);
                } else if (data.total) { // If distinct total items count is returned
                    setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
                } else if (data.pagination && data.pagination.totalPages) {
                    setTotalPages(data.pagination.totalPages);
                } else {
                    // Fallback: If we assume 1 page if no metadata (or implement dynamic load-more logic later)
                    // For now, if we get less than limit, we know it's the end.
                    // But to show "Page 1 of X", we need total.
                    // If API doesn't return total, we might just show "Next" until data.length < limit.
                    // Let's set a default or try to infer.
                    setTotalPages(data.totalPages || 1); // defaulting to 1 or value from API if exists
                }
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and fetch on page change
    useEffect(() => {
        fetchJobs(currentPage);
    }, [currentPage, savedJobIds]);

    const handleSearch = () => {
        setCurrentPage(1); // Reset to page 1
        fetchJobs(1);
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLocation(e.target.value);
        // We might want to auto-search or just wait for search button.
        // Based on UI with "Tìm kiếm" button, usually we wait. 
        // But if we want it reactive, un-comment below:
        // setCurrentPage(1);
        // fetchJobs(1); 
    };

    const calculateDaysAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatSalary = (min: string, max: string) => {
        const minNum = parseFloat(min);
        const maxNum = parseFloat(max);

        if ((!min || isNaN(minNum) || minNum === 0) && (!max || isNaN(maxNum) || maxNum === 0)) {
            return 'Thỏa thuận';
        }

        const formatNumber = (num: number) => {
            if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
            return num.toLocaleString('vi-VN');
        };

        if (minNum > 0 && maxNum > 0) {
            return `${formatNumber(minNum)} - ${formatNumber(maxNum)} VND`;
        }
        if (minNum > 0) {
            return `Từ ${formatNumber(minNum)} VND`;
        }
        if (maxNum > 0) {
            return `Đến ${formatNumber(maxNum)} VND`;
        }
        return 'Thỏa thuận';
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-20">
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <h1 className="text-3xl font-bold text-charcoal mb-6">Tìm kiếm việc làm mơ ước</h1>

                        {/* Search Bar */}
                        <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm md:items-center">
                            <div className="flex-1 flex items-center px-4 py-2">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Chức danh, từ khóa hoặc công ty..."
                                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                            <div className="flex-1 flex items-center px-4 py-2">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.25b-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2M3 12l18 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <select
                                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 appearance-none cursor-pointer"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">Tất cả ngành nghề</option>
                                    {categories.map((cat) => (
                                        <option key={cat.categoryId} value={cat.categoryId}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                            <div className="flex-1 flex items-center px-4 py-2">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <select
                                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 appearance-none cursor-pointer"
                                    value={selectedLocation}
                                    onChange={handleLocationChange}
                                >
                                    <option value="">Tất cả địa điểm</option>
                                    {locations.map((loc) => (
                                        <option key={loc.locationId || loc.id} value={loc.locationId || loc.id}>
                                            {loc.city || loc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="bg-primary text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                            >
                                Tìm kiếm
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            {['All', 'Full-time', 'Part-time', 'Remote', 'Internship'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${selectedType === type ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-charcoal">Đề xuất việc làm <span className="text-gray-400 font-normal text-base ml-2">({jobs.length} kết quả)</span></h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sắp xếp theo:</span>
                            <select className="text-sm border-none bg-transparent font-medium text-charcoal outline-none cursor-pointer focus:text-primary">
                                <option>Mới nhất</option>
                                <option>Lương cao nhất</option>
                                <option>Phù hợp nhất</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.jobPostId}
                                    id={job.jobPostId.toString()}
                                    title={job.title}
                                    companyId={job.company?.companyId || ''}
                                    companyName={job.company?.name || 'Unknown Company'}
                                    logoUrl={job.company?.logoUrl || 'https://via.placeholder.com/150'}
                                    location={job.location?.name || 'Unknown Location'}
                                    salary={formatSalary(job.salaryMin, job.salaryMax)}
                                    tags={[]}
                                    postedDaysAgo={calculateDaysAgo(job.created_at)}
                                    isSaved={job.isSaved}
                                />
                            ))}
                            {jobs.length === 0 && (
                                <div className="col-span-3 text-center py-20 text-gray-500">
                                    Không tìm thấy việc làm nào phù hợp.
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && jobs.length > 0 && totalPages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-charcoal hover:bg-gray-50 hover:text-primary'}`}
                            >
                                Trước
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Simple Number Display */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, _i) => {
                                    // Logic to show window of pages around current page could be complex.
                                    // Simple version: Show 1..5 or just current page.
                                    // Let's implement a dynamic window if needed, or just 1, 2, 3 ... 
                                    // For now, let's just show Page X of Y to keep it clean given I'm replacing a block.
                                    // Or better:
                                    return null;
                                })}
                                <span className="text-sm font-medium text-gray-600">
                                    Trang {currentPage} / {totalPages}
                                </span>
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${currentPage === totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-charcoal hover:bg-gray-50 hover:text-primary'}`}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
