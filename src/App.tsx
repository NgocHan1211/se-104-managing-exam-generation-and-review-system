import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/admin/A01_Dashboard';
import UserListPage from './pages/admin/A02_UserList';
import UserFormPage from './pages/admin/A03_UserForm';
import { AcademicYearFormPage, AcademicYearListPage } from './pages/admin/A04_A05_AcademicYear';
import { SemesterListPage } from './pages/admin/A06_A07_Semester';
import { ClassListPage } from './pages/admin/A08_A09_ClassManagement';
import SubjectListPage from './pages/admin/A10_SubjectList';
import AdminSemesterFormPage from './pages/admin/AdminSemesterFormPage';
import AdminClassFormPage from './pages/admin/AdminClassFormPage';
import LoginPage from './pages/shared/LoginPage';
import RegisterPage from './pages/shared/RegisterPage';
import ChangePasswordPage from './pages/shared/ChangePasswordPage';
import ErrorNoPermissionPage from './pages/shared/ErrorNoPermissionPage';
import AdminSubjectFormPage from './pages/admin/AdminSubjectFormPage';
import AdminSystemRulesPage from './pages/admin/AdminSystemRulesPage';
import AdminYearReportExportPage from './pages/admin/AdminYearReportExportPage';
import LecturerYearReportPage from './pages/lecturer/LecturerYearReportPage';
import LecturerQuestionBankPage from './pages/lecturer/LecturerQuestionBankPage';
import LecturerQuestionFormPage from './pages/lecturer/LecturerQuestionFormPage';
import LecturerSubjectListPage from './pages/lecturer/LecturerSubjectListPage';
import LecturerSubjectFormPage from './pages/lecturer/LecturerSubjectFormPage';
import LecturerExamListPage from './pages/lecturer/LecturerExamListPage';
import LecturerExamBuilderPage from './pages/lecturer/LecturerExamBuilderPage';
import LecturerExamPreviewPage from './pages/lecturer/LecturerExamPreviewPage';
import LecturerExamExportPage from './pages/lecturer/LecturerExamExportPage';
import LecturerSearchExamPage from './pages/lecturer/LecturerSearchExamPage';
import LecturerGradingPage from './pages/lecturer/LecturerGradingPage';
import LecturerGradingDetailPage from './pages/lecturer/LecturerGradingDetailPage';
import LecturerClassListPage from './pages/lecturer/LecturerClassListPage';
import LecturerClassStudentsPage from './pages/lecturer/LecturerClassStudentsPage';
import LecturerClassFormPage from './pages/lecturer/LecturerClassFormPage';
import { supabase } from './lib/supabaseClient';
import { fetchCurrentUserRole, type AppRole } from './lib/supabaseData';
import LogoutPage from './pages/shared/LogoutPage';

function RouteAccessibilitySupport() {
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.focus();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

function withNavigate<P extends object>(Component: ComponentType<P & { onNavigate: (key: string, path: string) => void }>, props?: P) {
  return function Wrapped() {
    const navigate = useNavigate();
    return <Component {...(props as P)} onNavigate={(_, path) => navigate(path)} />;
  };
}

const DashboardRoute = withNavigate(AdminDashboard);
const UsersRoute = withNavigate(UserListPage);
const UserCreateRoute = withNavigate(UserFormPage as any);
const UserEditRoute = withNavigate(UserFormPage as any);
const YearListRoute = withNavigate(AcademicYearListPage);
const YearCreateRoute = withNavigate(AcademicYearFormPage as any);
const SemesterListRoute = withNavigate(SemesterListPage);
const ClassListRoute = withNavigate(ClassListPage);
const SubjectListRoute = withNavigate(SubjectListPage);

function LoadingRoutePage() {
  return (
    <main className="auth-layout" id="main-content" tabIndex={-1}>
      <section className="auth-card">
        <h1 className="auth-title">Đang kiểm tra phiên đăng nhập...</h1>
      </section>
    </main>
  );
}

function getRoleHome(role: AppRole | null) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'lecturer') return '/lecturer/year-report';
  return '/shared/error';
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let active = true;

    const applySession = async (session: any) => {
      if (!active) return;
      if (!session?.user) {
        setIsAuthenticated(false);
        setRole(null);
        setAuthLoading(false);
        return;
      }

      try {
        const detectedRole = await fetchCurrentUserRole(session.user.id, session.user.email);
        if (!active) return;
        setIsAuthenticated(true);
        setRole(detectedRole);
      } catch {
        if (!active) return;
        setIsAuthenticated(true);
        setRole(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    if (!supabase) {
      setAuthLoading(false);
      return () => {
        active = false;
      };
    }

    void (async () => {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const adminHome = getRoleHome(role);
  const requireAuth = (element: JSX.Element, allow?: AppRole) => {
    if (authLoading) return <LoadingRoutePage />;
    if (!isAuthenticated) return <Navigate to="/shared/login" replace />;
    if (allow && role !== allow) return <Navigate to="/shared/error" replace />;
    return element;
  };

  return (
    <>
      <RouteAccessibilitySupport />
      <Routes>
        <Route path="/" element={<Navigate to={authLoading ? '/shared/login' : isAuthenticated ? adminHome : '/shared/login'} replace />} />
        <Route path="/preview" element={<Navigate to="/shared/login" replace />} />

        <Route path="/shared/login" element={authLoading ? <LoadingRoutePage /> : isAuthenticated ? <Navigate to={adminHome} replace /> : <LoginPage />} />
        <Route path="/shared/logout" element={<LogoutPage />} />
        <Route path="/shared/register" element={<RegisterPage />} />
        <Route path="/shared/change-password" element={<ChangePasswordPage />} />
        <Route path="/shared/error" element={<ErrorNoPermissionPage />} />

        <Route path="/admin/dashboard" element={requireAuth(<DashboardRoute />, 'admin')} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/users" element={requireAuth(<UsersRoute />, 'admin')} />
        <Route path="/admin/users/create" element={requireAuth(<UserCreateRoute />, 'admin')} />
        <Route path="/admin/users/:id/edit" element={requireAuth(<UserEditRoute />, 'admin')} />
        <Route path="/admin/academic-years" element={requireAuth(<YearListRoute />, 'admin')} />
        <Route path="/admin/academic-years/create" element={requireAuth(<YearCreateRoute />, 'admin')} />
        <Route path="/admin/semesters" element={requireAuth(<SemesterListRoute />, 'admin')} />
        <Route path="/admin/semesters/form" element={requireAuth(<AdminSemesterFormPage />, 'admin')} />
        <Route path="/admin/classes" element={requireAuth(<ClassListRoute />, 'admin')} />
        <Route path="/admin/classes/form" element={requireAuth(<AdminClassFormPage />, 'admin')} />
        <Route path="/admin/subjects" element={requireAuth(<SubjectListRoute />, 'admin')} />
        <Route path="/admin/subjects/form" element={requireAuth(<AdminSubjectFormPage />, 'admin')} />
        <Route path="/admin/system-rules" element={requireAuth(<AdminSystemRulesPage />, 'admin')} />
        <Route path="/admin/year-report-export" element={requireAuth(<AdminYearReportExportPage />, 'admin')} />

        <Route path="/lecturer" element={<Navigate to="/lecturer/year-report" replace />} />
        <Route path="/lecturer/classes" element={requireAuth(<LecturerClassListPage />, 'lecturer')} />
        <Route path="/lecturer/classes/create" element={requireAuth(<LecturerClassFormPage />, 'lecturer')} />
        <Route path="/lecturer/classes/:id/edit" element={requireAuth(<LecturerClassFormPage />, 'lecturer')} />
        <Route path="/lecturer/classes/:id/students" element={requireAuth(<LecturerClassStudentsPage />, 'lecturer')} />
        <Route path="/lecturer/year-report" element={requireAuth(<LecturerYearReportPage />, 'lecturer')} />
        <Route path="/lecturer/subjects" element={requireAuth(<LecturerSubjectListPage />, 'lecturer')} />
        <Route path="/lecturer/subjects/form" element={requireAuth(<LecturerSubjectFormPage />, 'lecturer')} />
        <Route path="/lecturer/questions" element={requireAuth(<LecturerQuestionBankPage />, 'lecturer')} />
        <Route path="/lecturer/questions/create" element={requireAuth(<LecturerQuestionFormPage />, 'lecturer')} />
        <Route path="/lecturer/questions/:id/edit" element={requireAuth(<LecturerQuestionFormPage />, 'lecturer')} />
        <Route path="/lecturer/exams" element={requireAuth(<LecturerExamListPage />, 'lecturer')} />
        <Route path="/lecturer/exams/create" element={requireAuth(<LecturerExamBuilderPage />, 'lecturer')} />
        <Route path="/lecturer/exams/:id/edit" element={requireAuth(<LecturerExamBuilderPage />, 'lecturer')} />
        <Route path="/lecturer/exams/:id/preview" element={requireAuth(<LecturerExamPreviewPage />, 'lecturer')} />
        <Route path="/lecturer/exams/:id/export" element={requireAuth(<LecturerExamExportPage />, 'lecturer')} />
        <Route path="/lecturer/search" element={requireAuth(<LecturerSearchExamPage />, 'lecturer')} />
        <Route path="/lecturer/grading" element={requireAuth(<LecturerGradingPage />, 'lecturer')} />
        <Route path="/lecturer/grading/:id" element={requireAuth(<LecturerGradingDetailPage />, 'lecturer')} />

        <Route path="*" element={<Navigate to="/shared/error" replace />} />
      </Routes>
    </>
  );
}
