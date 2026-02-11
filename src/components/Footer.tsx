
export default function Footer() {
    return (
        <footer className="bg-gray-50 pt-16 pb-12 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Column 1: About */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-charcoal tracking-tight">StitchRecruit</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Nền tảng tuyển dụng thông minh giúp kết nối ứng viên tài năng với những cơ hội việc làm tốt nhất. Chúng tôi tin rằng mỗi câu chuyện đều đáng giá.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                {/* LinkedIn Icon Placeholder */}
                                <span className="sr-only">LinkedIn</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                {/* Facebook Icon Placeholder */}
                                <span className="sr-only">Facebook</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: For Candidates */}
                    <div>
                        <h4 className="font-bold text-charcoal mb-6 text-base uppercase tracking-wider">Dành cho Ứng viên</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Việc làm mới nhất</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Tạo CV Online</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Cẩm nang nghề nghiệp</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Công cụ tính lương</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Khám phá công ty</a></li>
                        </ul>
                    </div>

                    {/* Column 3: For Employers */}
                    <div>
                        <h4 className="font-bold text-charcoal mb-6 text-base uppercase tracking-wider">Nhà Tuyển Dụng</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Đăng tin tuyển dụng</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Tìm kiếm nhân tài</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Giải pháp nhân sự</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Báo giá dịch vụ</a></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact/Resources */}
                    <div>
                        <h4 className="font-bold text-charcoal mb-6 text-base uppercase tracking-wider">Hỗ trợ & Liên hệ</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Về chúng tôi</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Liên hệ</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Chính sách bảo mật</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Điều khoản sử dụng</a></li>
                            <li className="pt-2 text-gray-500">Hotline: 1900 1234</li>
                            <li className="text-gray-500">Email: support@stitchrecruit.com</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center bg-gray-50">
                    <p className="text-sm text-gray-500 text-center md:text-left">
                        &copy; {new Date().getFullYear()} StitchRecruit. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-500">
                        <a href="#" className="hover:text-charcoal transition-colors">Privacy</a>
                        <a href="#" className="hover:text-charcoal transition-colors">Terms</a>
                        <a href="#" className="hover:text-charcoal transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
