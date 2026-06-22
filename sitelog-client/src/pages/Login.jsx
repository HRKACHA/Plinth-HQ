import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Check, Chrome, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PlinthLogo from '../components/common/PlinthLogo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function Login() {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Handle OAuth callback and email verification redirects
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const provider = searchParams.get('provider');
    const verified = searchParams.get('verified');
    const oauthError = searchParams.get('error');

    if (accessToken && provider === 'google') {
      loginWithToken(accessToken).then(() => {
        navigate('/dashboard');
      }).catch(err => {
        setError('Failed to fetch user data after Google sign-in.');
      });
      return;
    }

    if (verified === 'success') {
      setSuccess('Email verified successfully! You can now sign in.');
    } else if (verified === 'expired') {
      setError('Verification link has expired. Please request a new one.');
    }

    if (oauthError) {
      const messages = {
        oauth_csrf: 'OAuth security check failed. Please try again.',
        oauth_denied: 'Google sign-in was cancelled.',
        oauth_token: 'Failed to authenticate with Google. Please try again.',
        oauth_no_email: 'No email found in your Google account.',
        oauth_failed: 'Google sign-in failed. Please try again.',
      };
      setError(messages[oauthError] || 'Sign-in failed. Please try again.');
    }
  }, [searchParams, navigate, loginWithToken]);

  // Email validation on blur
  const handleEmailBlur = () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen bg-transparent relative z-10">
      <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex relative overflow-hidden backdrop-blur-sm"
        style={{ background: 'linear-gradient(135deg, rgba(10,12,16,0.6) 0%, rgba(17,24,39,0.6) 50%, rgba(13,17,23,0.6) 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Subtle blue glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(66,133,244,0.06)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(66,133,244,0.04)' }} />

        <div className="relative z-10">
          <Link to="/">
            <PlinthLogo size="sm" />
          </Link>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="font-display text-4xl font-bold text-white tracking-tight leading-tight">Welcome back to your site command center.</h2>
          <p className="mt-6 text-lg text-white/70 leading-relaxed">
            Monitor projects, review daily logs, track budgets, and keep owners informed — all from one powerful platform.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/20 font-mono uppercase tracking-widest">PlinthHQ Enterprise v2.0</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 sm:px-12 backdrop-blur-md relative overflow-hidden" style={{ background: 'rgba(13,15,20,0.5)' }}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(66,133,244,0.03) 0%, transparent 70%)' }} />

        <div className="w-full max-w-md animate-slideUp relative z-10 mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to website
          </Link>
          <div className="card shadow-elevated p-8 sm:p-10">
            <div className="lg:hidden mb-8 flex justify-center">
              <PlinthLogo size="md" />
            </div>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-navy tracking-tight">Sign in</h1>
              <p className="mt-2 text-base text-muted">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-orange hover:text-orange-light transition-colors">Create one</Link>
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-white font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-md mb-6"
              style={{ background: 'rgba(16,18,24,0.12)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(18px)' }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-4 text-muted font-medium" style={{ background: 'rgb(var(--color-card))' }}>or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {success && (
                <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success animate-fadeIn">
                  <Check className="h-5 w-5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger animate-fadeIn">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-orange" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`input-field pl-11 py-3 text-base ${emailError ? 'border-danger focus:ring-danger/20' : ''}`}
                    placeholder="priya@plinthhq.in"
                    required
                  />
                </div>
                {emailError && <p className="mt-1 text-xs text-danger">{emailError}</p>}
              </div>
              <div>
                <div className="mb-1.5 flex justify-between items-center">
                  <label className="block text-sm font-semibold text-navy">Password</label>
                  <a href="#" className="text-xs font-medium text-muted hover:text-orange transition">Forgot password?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-orange" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-11 py-3 text-base" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-accent w-full py-3.5 text-base mt-4">
                {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
