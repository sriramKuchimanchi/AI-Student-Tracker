import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
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
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', background: '#f0fdf4', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Mail size={24} color="#16a34a" />
              </div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', margin: '0 0 0.75rem' }}>Check your email</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
                If an account exists for <strong style={{ color: '#1e293b' }}>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#3d74f5', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', margin: '0 0 0.375rem' }}>Forgot your password?</h2>
              <p style={{ color: '#64748b', fontSize: '0.825rem', margin: '0 0 1.75rem', lineHeight: 1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
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