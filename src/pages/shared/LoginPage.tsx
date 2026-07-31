import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { fetchCurrentUserAccountStatus, fetchCurrentUserRole } from '../../lib/supabaseData';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (!supabase) {
        throw new Error('Thiếu cấu hình Supabase.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      const user = data.user;
      if (!user) throw new Error('Không lấy được thông tin tài khoản.');

      const role = await fetchCurrentUserRole(user.id, user.email);
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'lecturer') navigate('/lecturer/year-report', { replace: true });
      else {
        const accountStatus = await fetchCurrentUserAccountStatus(user.id, user.email);
        await supabase.auth.signOut({ scope: 'local' });
        if (accountStatus === 'pending') {
          throw new Error('Tài khoản của bạn đang chờ duyệt. Vui lòng liên hệ quản trị viên để được kích hoạt.');
        }
        if (accountStatus === 'inactive') {
          throw new Error('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.');
        }
        navigate('/shared/error', { replace: true });
      }
    } catch (e: any) {
      setError(e.message || 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout" id="main-content" tabIndex={-1}>
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title" className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Đăng nhập bằng email công vụ để truy cập hệ thống.</p>

        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void handleLogin(); }}>
          <div className="field">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input className="input" id="email" type="email" placeholder="name@university.edu.vn" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="password">Mật khẩu <span className="required">*</span></label>
            <input className="input" id="password" type="password" placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            <Link className="btn btn-secondary" to="/shared/change-password">Đổi mật khẩu</Link>
          </div>

          {error ? <p className="field-error" role="alert">{error}</p> : null}
        </form>

        <div className="auth-footer">
          <span className="auth-footer-text">Chưa có tài khoản?</span>
          <Link className="btn btn-tertiary" to="/shared/register">Đăng ký tài khoản</Link>
        </div>
      </section>
    </main>
  );
}
