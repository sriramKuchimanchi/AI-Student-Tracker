import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const rules = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Passwords match', pass: password === confirmPassword && confirmPassword.length > 0 },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Reset failed. The link may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #1e3a8a, #3d74f5)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <GraduationCap size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#0f172a', margin: 0 }}>EduTrack</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.3rem' }}>AI Student Progress Tracker</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '2rem' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', background: '#f0fdf4', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle size={28} color="#16a34a" />
              </div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', margin: '0 0 0.75rem' }}>Password reset!</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/signin')}
                style={{
                  width: '100%', padding: '0.65rem', background: '#3d74f5',
                  color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 600,
                  fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', margin: '0 0 0.375rem' }}>Set a new password</h2>
              <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
                Choose a strong password for your EduTrack account.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: '2.75rem' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                {(password || confirmPassword) && (
                  <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {rules.map(r => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {r.pass
                          ? <CheckCircle size={13} color="#16a34a" />
                          : <XCircle size={13} color="#cbd5e1" />
                        }
                        <span style={{ fontSize: '0.75rem', color: r.pass ? '#16a34a' : '#94a3b8' }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '0.65rem', background: loading ? '#93aff8' : '#3d74f5',
                    color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 600,
                    fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif', transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.825rem', color: '#64748b', marginTop: '1.5rem' }}>
                Remember your password?{' '}
                <Link to="/signin" style={{ color: '#3d74f5', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}