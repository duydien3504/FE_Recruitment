
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-charcoal antialiased">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 lg:pb-32 lg:pt-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-12 lg:px-8">
                            {/* Text Content */}
                            <div className="lg:col-span-6 lg:pt-4">
                                <div className="mb-6 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 pr-4">
                                    <span className="mr-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold uppercase text-white">Mới</span>
                                    <span className="text-sm font-medium text-primary">Nền tảng tuyển dụng 4.0 đã sẵn sàng</span>
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl lg:text-6xl mb-6 leading-tight">
                                    Kể câu chuyện <br className="hidden lg:block" />
                                    <span className="text-primary">sự nghiệp của bạn</span>
                                </h1>
                                <p className="mt-4 text-lg text-gray-600 max-w-lg mb-8 leading-relaxed">
                                    StitchRecruit không chỉ là nơi tìm việc. Đó là nơi bạn xây dựng thương hiệu cá nhân, kết nối với những nhà tuyển dụng hàng đầu và viết tiếp chương thành công trong sự nghiệp.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a href="#" className="inline-flex justify-center items-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                                        Khám phá cơ hội ngay
                                    </a>
                                    <a href="#" className="inline-flex justify-center items-center px-8 py-4 border border-gray-200 text-base font-medium rounded-full text-charcoal bg-white hover:bg-gray-50 shadow-sm transition-all duration-300">
                                        Tìm hiểu thêm
                                    </a>
                                </div>
                                <div className="mt-10 flex items-center gap-x-6">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                                        <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                                        <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" alt="" />
                                        <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Được tin dùng bởi 10,000+ nhân sự</span>
                                </div>
                            </div>

                            {/* Image/Visual Content */}
                            <div className="relative mt-12 sm:mt-16 lg:col-span-6 lg:mt-0 lg:flex lg:items-center">
                                <div className="relative mx-auto w-full rounded-2xl shadow-2xl lg:max-w-md overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 ease-in-out">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10 pointer-events-none mix-blend-multiply"></div>
                                    <img
                                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
                                        alt="Team collaboration"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Float Card 1 */}
                                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3 z-20 animate-fade-in-up md:bottom-12 md:-left-12">
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-semibold uppercase">Trạng thái</p>
                                        <p className="font-bold text-gray-800">Đã nhận Offer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 hidden lg:block">
                        <div className="h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 -ml-24 -mb-24 hidden lg:block">
                        <div className="h-80 w-80 rounded-full bg-purple-500/5 blur-3xl"></div>
                    </div>
                </section>

                {/* Feature/Intro Section */}
                <section className="py-16 sm:py-24 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-base font-semibold tracking-wide text-primary uppercase">Tính năng nổi bật</h2>
                            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-charcoal sm:text-4xl">
                                Tất cả công cụ bạn cần để thành công
                            </p>
                            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                                Chúng tôi cung cấp hệ sinh thái toàn diện giúp bạn không chỉ tìm việc mà còn phát triển sự nghiệp bền vững.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="relative p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-primary mb-6">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-charcoal mb-3">CV Chuyên Nghiệp</h3>
                                <p className="text-gray-500">Tạo CV ấn tượng chỉ trong vài phút với các mẫu thiết kế chuẩn ATS, giúp bạn vượt qua vòng lọc hồ sơ dễ dàng.</p>
                            </div>

                            {/* Feature 2 */}
                            <div className="relative p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-charcoal mb-3">Kết Nối Nhanh</h3>
                                <p className="text-gray-500">Hệ thống gợi ý việc làm thông minh dựa trên AI giúp bạn tiếp cận những cơ hội phù hợp nhất với kỹ năng của mình.</p>
                            </div>

                            {/* Feature 3 */}
                            <div className="relative p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-charcoal mb-3">Thương Hiệu Cá Nhân</h3>
                                <p className="text-gray-500">Xây dựng hồ sơ năng lực trực tuyến (Portfolio) để showcase các dự án và thành tựu của bạn một cách trực quan.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Candidate Journey Section */}
                <section className="py-16 sm:py-24 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="lg:grid lg:grid-cols-2 lg:gap-24 lg:items-center">
                            <div>
                                <h2 className="text-3xl font-extrabold text-charcoal sm:text-4xl mb-6">
                                    Hành trình sự nghiệp <br />
                                    <span className="text-primary">được cá nhân hóa</span>
                                </h2>
                                <p className="text-lg text-gray-500 mb-8">
                                    Chúng tôi đồng hành cùng bạn từ những bước đi đầu tiên cho đến khi đạt được đỉnh cao sự nghiệp. Mọi cột mốc đều được ghi nhận và hỗ trợ.
                                </p>

                                <div className="space-y-8">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                                                <span className="font-bold text-lg">1</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg leading-6 font-medium text-charcoal">Khám phá bản thân</h3>
                                            <p className="mt-2 text-base text-gray-500">Các bài trắc nghiệm tính cách và năng lực giúp bạn định hướng nghề nghiệp rõ ràng.</p>
                                        </div>
                                    </div>

                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                                                <span className="font-bold text-lg">2</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg leading-6 font-medium text-charcoal">Ứng tuyển thông minh</h3>
                                            <p className="mt-2 text-base text-gray-500">Nộp hồ sơ cho hàng ngàn công ty chỉ với 1 cú click. Theo dõi trạng thái hồ sơ real-time.</p>
                                        </div>
                                    </div>

                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                                                <span className="font-bold text-lg">3</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg leading-6 font-medium text-charcoal">Phát triển kỹ năng</h3>
                                            <p className="mt-2 text-base text-gray-500">Truy cập khoá học và tài liệu chuyên sâu để nâng cao năng lực cạnh tranh.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 lg:mt-0 relative">
                                <div className="mx-auto w-full rounded-2xl shadow-xl overflow-hidden bg-gray-100 aspect-w-4 aspect-h-3">
                                    <img
                                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1288&q=80"
                                        alt="Candidate journey"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="bg-primary/5 py-16">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl font-bold text-charcoal mb-4">Sẵn sàng cho bước ngoặt mới?</h2>
                        <p className="text-gray-600 mb-8 text-lg">Tham gia cộng đồng hơn 5 triệu ứng viên đang tìm kiếm thành công cùng StitchRecruit.</p>
                        <a href="#" className="inline-block px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-blue-600 transition-colors">
                            Đăng ký ngay - Miễn phí
                        </a>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
