import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import JobListingPage from './pages/JobListingPage';
import JobDetailPage from './pages/JobDetailPage';
import CompanyDetailPage from './pages/CompanyProfilePage';
import CompanyListingPage from './pages/CompanyListingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MyCompanyPage from './pages/MyCompanyPage';
import ProfilePage from './pages/ProfilePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SavedJobsPage from './pages/SavedJobsPage';
import ResumesPage from './pages/ResumesPage';
import ApplicationsPage from './pages/ApplicationsPage';
import DashboardPage from './pages/DashboardPage';
import CreateCVPage from './pages/CreateCVPage';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobListingPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/companies" element={<CompanyListingPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
        <Route path="/my-company" element={<MyCompanyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/saved-jobs" element={<SavedJobsPage />} />
        <Route path="/resumes" element={<ResumesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/create-cv" element={<CreateCVPage />} />
      </Routes>
    </Router>
  );
}

export default App;
