import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

type PaymentType = 'job' | 'employer_upgrade' | 'unknown';

export default function PaymentSuccessPage() {
    const location = useLocation();
    const [status, setStatus] = useState<'success' | 'fail' | 'loading'>('loading');
    const [jobId, setJobId] = useState<string | null>(null);
    const [paymentType, setPaymentType] = useState<PaymentType>('unknown');

    useEffect(() => {
        const params = new URLSearchParams(location.search);

        // MoMo callback params
        const momoResultCode = params.get('resultCode');
        const momoOrderId = params.get('orderId');

        // VNPay callback params
        const vnpResponseCode = params.get('vnp_ResponseCode');
        const vnpTxnRef = params.get('vnp_TxnRef');

        if (momoResultCode !== null) {
            // MoMo payment (employer upgrade)
            setPaymentType('employer_upgrade');
            setJobId(momoOrderId);
            setStatus(momoResultCode === '0' ? 'success' : 'fail');
        } else {
            // VNPay payment (job posting)
            setPaymentType('job');
            const id = params.get('jobId') || vnpTxnRef;
            setJobId(id);
            setStatus(vnpResponseCode === '00' || !vnpResponseCode ? 'success' : 'fail');
        }
    }, [location]);

    const isEmployerUpgrade = paymentType === 'employer_upgrade';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center">
                    {status === 'loading' ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : status === 'success' ? (
                        <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
                            {isEmployerUpgrade ? (
                                <p className="text-gray-500 mb-8">
                                    Tài khoản của bạn đã được nâng cấp lên Nhà tuyển dụng. Bạn có thể bắt đầu đăng tin tuyển dụng ngay bây giờ.
                                </p>
                            ) : (
                                <p className="text-gray-500 mb-8">
                                    Tin tuyển dụng {jobId ? `#${jobId}` : ''} của bạn đã được đăng tải và sẵn sàng tiếp cận ứng viên.
                                </p>
                            )}
                            <div className="flex flex-col gap-3">
                                {isEmployerUpgrade ? (
                                    <>
                                        <Link to="/my-company" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">
                                            Quản lý doanh nghiệp
                                        </Link>
                                        <Link to="/profile" className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                            Về trang cá nhân
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/my-company" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">
                                            Quản lý tuyển dụng
                                        </Link>
                                        <Link to="/" className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                            Về trang chủ
                                        </Link>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
                            <p className="text-gray-500 mb-8">
                                Giao dịch không thành công hoặc đã bị hủy. Vui lòng thử lại.
                            </p>
                            {isEmployerUpgrade ? (
                                <Link to="/profile" className="w-full block py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                    Quay lại trang cá nhân
                                </Link>
                            ) : (
                                <Link to="/my-company" className="w-full block py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                    Quay lại
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
