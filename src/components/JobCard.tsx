
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../utils/auth';

interface JobCardProps {
    id: string;
    title: string;
    companyId: string;
    companyName: string;
    logoUrl: string;
    location: string;
    salary: string;
    tags: string[];
    postedDaysAgo: number;
    isSaved?: boolean;
    onToggleUnsave?: () => void;
}

export default function JobCard({ id, title, companyId, companyName, logoUrl, location, salary, tags, postedDaysAgo, isSaved = false, onToggleUnsave }: JobCardProps) {
    const [saving, setSaving] = useState(false);
    const [isSavedLocal, setIsSavedLocal] = useState(isSaved);

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (saving) return;

        setSaving(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            if (isSavedLocal) {
                // Unsave
                const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setIsSavedLocal(false);
                    toast.success(' Đã bỏ lưu công việc');
                    if (onToggleUnsave) onToggleUnsave();
                } else {
                    const error = await response.json().catch(() => ({}));
                    toast.error(error.message || 'Lỗi khi bỏ lưu công việc');
                }
            } else {
                // Save
                const response = await fetchWithAuth(`${apiUrl}/api/v1/saved-jobs`, {
                    method: 'POST',
                    body: JSON.stringify({ jobPostId: parseInt(id) })
                });

                if (response.ok) {
                    setIsSavedLocal(true);
                    toast.success('Đã lưu công việc vào danh sách yêu thích');
                } else {
                    const error = await response.json().catch(() => ({}));
                    toast.error(error.message || 'Lỗi khi lưu công việc');
                }
            }
        } catch (error) {
            console.error('Error toggling save job:', error);
            toast.error('Vui lòng đăng nhập để thực hiện');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 hover:border-primary/30 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                    <Link to={`/companies/${companyId}`} className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center p-2 border border-gray-100 hover:border-primary/50 transition-colors">
                        <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
                    </Link>
                    <div>
                        <h3 className="font-bold text-lg text-charcoal group-hover:text-primary transition-colors line-clamp-1">
                            <Link to={`/jobs/${id}`}>{title}</Link>
                        </h3>
                        <Link to={`/companies/${companyId}`} className="text-gray-500 text-sm hover:text-primary transition-colors">{companyName}</Link>
                    </div>
                </div>
                <button
                    onClick={handleToggleSave}
                    disabled={saving}
                    className={`${isSavedLocal ? 'text-primary' : 'text-gray-400'} hover:text-primary transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isSavedLocal ? "Bỏ lưu" : "Lưu công việc"}
                >
                    <svg
                        className="w-6 h-6"
                        fill={isSavedLocal ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, index) => (
                    <span key={index} className="bg-gray-50 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md border border-gray-100">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {location}
                    </span>
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {salary}
                    </span>
                </div>
                <span>{postedDaysAgo > 0 ? `${postedDaysAgo} ngày trước` : 'Hôm nay'}</span>
            </div>
        </div>
    );
}
