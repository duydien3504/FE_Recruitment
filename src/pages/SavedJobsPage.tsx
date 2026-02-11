
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import { fetchWithAuth } from '../utils/auth';

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
    isSaved: boolean;
}

export default function SavedJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSavedJobs = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs`);
            if (response.ok) {
                const json = await response.json();

                // The API returns an array of items where job info is inside 'jobPost'
                // Based on the image provided in user request
                const mappedJobs = (json.data || []).map((item: any) => ({
                    jobPostId: item.jobPostId,
                    title: item.jobPost?.jobTitle || item.jobPost?.title,
                    company: {
                        companyId: item.jobPost?.company?.companyId || '',
                        name: item.jobPost?.company?.companyName || item.jobPost?.company?.name || 'Unknown',
                        logoUrl: item.jobPost?.company?.logo || item.jobPost?.company?.logoUrl || 'https://via.placeholder.com/150'
                    },
                    location: {
                        name: item.jobPost?.location?.name || 'Unknown'
                    },
                    salaryMin: item.jobPost?.salaryMin || '0',
                    salaryMax: item.jobPost?.salaryMax || '0',
                    created_at: item.jobPost?.created_at || item.createdAt,
                    isSaved: true // These are all saved jobs
                }));

                setJobs(mappedJobs);
            }
        } catch (error) {
            console.error("Failed to fetch saved jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedJobs();
    }, []);

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

    const calculateDaysAgo = (dateString: string) => {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-charcoal antialiased flex flex-col">
            <Header />

            <main className="flex-grow pt-28 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-charcoal mb-2">Việc làm đã lưu</h1>
                        <p className="text-gray-500">Xem và quản lý các cơ hội nghề nghiệp bạn đã quan tâm.</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : jobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.jobPostId}
                                    id={job.jobPostId.toString()}
                                    title={job.title}
                                    companyId={job.company.companyId}
                                    companyName={job.company.name}
                                    logoUrl={job.company.logoUrl}
                                    location={job.location.name}
                                    salary={formatSalary(job.salaryMin, job.salaryMax)}
                                    tags={[]}
                                    postedDaysAgo={calculateDaysAgo(job.created_at)}
                                    isSaved={true}
                                    onToggleUnsave={fetchSavedJobs}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-charcoal mb-2">Chưa có việc làm nào được lưu</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">Lưu lại những công việc hấp dẫn để xem lại sau và không bỏ lỡ cơ hội.</p>
                            <a
                                href="/jobs"
                                className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
                            >
                                Khám phá việc làm ngay
                            </a>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
