import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, Check, CheckCircle, XCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
import { verificationApi, inviteApi } from '../api/index';
import PlinthLogo from '../components/common/PlinthLogo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const ROLE_OPTIONS = [
  { value: 'site_engineer', label: 'Site Engineer (Can view and submit logs)' },
  { value: 'accounts', label: 'Accounts (Can view budget and expenses)' },
  { value: 'owner', label: 'Owner (View-only executive access)' },
  { value: 'project_manager', label: 'Project Manager (Full access)' },
];

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Password strength calculator
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-danger' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-warning' };
  if (score <= 3) return { score: 3, label: 'Medium', color: 'bg-orange' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-success' };
  return { score: 5, label: 'Very Strong', color: 'bg-success' };
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [preferredRole, setPreferredRole] = useState('site_engineer');

  // Invite token verification states
  const [inviteValid, setInviteValid] = useState(null); // null = not checked, true/false
  const [inviteData, setInviteData] = useState(null); // { email, role, roleLabel }
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Verify invite token on mount
  useEffect(() => {
    if (!inviteToken) return;
    setInviteChecking(true);
    inviteApi.verify(inviteToken)
      .then((res) => {
        if (res.valid) {
          setInviteValid(true);
          setInviteData(res.data);
          setEmail(res.data.email);
        } else {
          setInviteValid(false);
          setInviteError(res.message || 'Invalid or expired invite link.');
        }
      })
      .catch((err) => {
        setInviteValid(false);
        setInviteError(err.response?.data?.message || 'This invite link is invalid or has expired. Please ask your admin to send a new invite.');
      })
      .finally(() => setInviteChecking(false));
  }, [inviteToken]);

  // Email validation states
  const [emailError, setEmailError] = useState('');
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Debounced email check
  const debouncedEmail = useDebounce(email, 400);

  useEffect(() => {
    if (!debouncedEmail || !emailRegex.test(debouncedEmail)) {
      setEmailAvailable(null);
      return;
    }

    let cancelled = false;
    setEmailChecking(true);
    verificationApi.checkEmail(debouncedEmail)
      .then((data) => {
        if (!cancelled) {
          setEmailAvailable(data.available);
          if (!data.available) setEmailError(data.reason || 'Email is already registered');
          else setEmailError('');
        }
      })
      .catch(() => { if (!cancelled) setEmailAvailable(null); })
      .finally(() => { if (!cancelled) setEmailChecking(false); });

    return () => { cancelled = true; };
  }, [debouncedEmail]);

  // Real-time email format validation
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !emailRegex.test(val)) {
      setEmailError('Invalid email format');
      setEmailAvailable(null);
    } else {
      setEmailError('');
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (emailAvailable === false) {
      setError('This email is already registered. Please sign in instead.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, inviteToken, inviteToken ? undefined : preferredRole);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = () => {
    const url = new URL(`${API_URL}/auth/google`);
    if (inviteToken) url.searchParams.append('inviteToken', inviteToken);
    window.location.href = url.toString();
  };

  return (
    <div className="flex min-h-screen bg-transparent relative z-10">
      <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex relative overflow-hidden backdrop-blur-sm"
        style={{ background: theme === 'dark' ? 'linear-gradient(135deg, rgba(10,12,16,0.6) 0%, rgba(17,24,39,0.6) 50%, rgba(13,17,23,0.6) 100%)' : 'linear-gradient(135deg, rgba(200,210,240,0.5) 0%, rgba(180,195,230,0.5) 50%, rgba(165,180,220,0.5) 100%)', borderRight: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(120,140,200,0.12)' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none" style={{ background: theme === 'dark' ? 'rgba(66,133,244,0.06)' : 'rgba(100,130,230,0.12)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none" style={{ background: theme === 'dark' ? 'rgba(66,133,244,0.04)' : 'rgba(130,100,230,0.08)' }} />
        
        <div className="relative z-10">
          <Link to="/">
            <PlinthLogo size="sm" />
          </Link>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="font-display text-4xl font-bold text-navy tracking-tight leading-tight">Start managing your construction sites digitally.</h2>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            Join thousands of professionals using PlinthHQ to streamline their construction workflows from foundation to finish.
          </p>
        </div>
        <p className="relative z-10 text-xs text-muted/40 font-mono uppercase tracking-widest">Free Starter plan — 3 projects, 5 users</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 sm:px-12 backdrop-blur-md relative overflow-hidden" style={{ background: theme === 'dark' ? 'rgba(13,15,20,0.5)' : 'rgba(235,240,255,0.4)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: theme === 'dark' ? 'radial-gradient(ellipse at center, rgba(66,133,244,0.03) 0%, transparent 70%)' : 'radial-gradient(ellipse at center, rgba(100,130,230,0.06) 0%, transparent 70%)' }} />
        
        <div className="w-full max-w-md animate-slideUp relative z-10 mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-navy dark:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to website
          </Link>
          <div className="card shadow-elevated p-8 sm:p-10">
            <div className="lg:hidden mb-8 flex justify-center">
              <PlinthLogo size="md" />
            </div>
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-navy tracking-tight">
                {inviteToken ? 'Accept Invitation' : 'Create account'}
              </h1>
              <p className="mt-2 text-base text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-orange hover:text-orange-light transition-colors">Sign in</Link>
              </p>
            </div>

            {/* Invite Token Status */}
            {inviteToken && inviteChecking && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-400 mb-6 animate-fadeIn">
                <Loader2 className="h-5 w-5 animate-spin" /> Verifying invite link...
              </div>
            )}
            {inviteToken && inviteValid === false && (
              <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger mb-6 animate-fadeIn">
                <AlertCircle className="h-5 w-5 shrink-0" /> {inviteError}
              </div>
            )}
            {inviteToken && inviteValid && inviteData && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-6 animate-fadeIn">
                <div className="flex items-center gap-2 text-sm text-emerald-400 mb-1">
                  <Shield className="h-4 w-4" /> You have been invited to join the team
                </div>
                <p className="text-xs text-muted">Your role will be: <span className="text-navy dark:text-white font-medium">{inviteData.roleLabel}</span></p>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-navy font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-md mb-6"
              style={{ background: theme === 'dark' ? 'rgba(16,18,24,0.12)' : 'rgba(235,240,255,0.65)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(120,140,200,0.15)', backdropFilter: 'blur(18px)' }}
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
                <div className="w-full" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(120,140,200,0.12)' }} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-4 text-muted font-medium" style={{ background: 'rgb(var(--color-card))' }}>or register with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger animate-fadeIn">
                  <AlertCircle className="h-5 w-5 shrink-0" /> 
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Full name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-orange" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field !pl-11 py-3 text-base" placeholder="John Doe" required />
                </div>
              </div>

              {/* Email with availability check */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-orange" />
                  <input
                    type="email"
                    value={email}
                    onChange={inviteData ? undefined : handleEmailChange}
                    disabled={!!inviteData}
                    className={`input-field !pl-11 pr-10 py-3 text-base ${inviteData ? 'opacity-60 cursor-not-allowed' : ''} ${emailError ? 'border-danger focus:ring-danger/20' : emailAvailable ? 'border-success focus:ring-success/20' : ''}`}
                    placeholder="john@company.com"
                    required
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {emailChecking && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
                    {!emailChecking && emailAvailable === true && <CheckCircle className="h-4 w-4 text-success" />}
                    {!emailChecking && emailAvailable === false && <XCircle className="h-4 w-4 text-danger" />}
                  </div>
                </div>
                {emailError && <p className="mt-1 text-xs text-danger">{emailError}</p>}
                {emailAvailable && !emailError && <p className="mt-1 text-xs text-success">Email is available ✓</p>}
              </div>

              {/* Role Selector — only for direct registration (no invite token) */}
              {!inviteToken && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Select your role</label>
                    <CustomSelectMenu
                      value={preferredRole}
                      onChange={setPreferredRole}
                      options={ROLE_OPTIONS}
                      placeholder="Select Role"
                      icon={Shield}
                    />
                  <p className="mt-1 text-xs text-muted">Your role determines what you can access on the platform</p>
                </div>
              )}

              {/* Password with strength meter */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-orange" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-11 py-3 text-base" placeholder="Min. 8 characters" required />
                </div>
                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 animate-fadeIn">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${level <= passwordStrength.score ? passwordStrength.color : 'bg-navy/10 dark:bg-white/10'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      passwordStrength.score <= 1 ? 'text-danger' :
                      passwordStrength.score <= 2 ? 'text-warning' :
                      passwordStrength.score <= 3 ? 'text-orange' : 'text-success'
                    }`}>
                      {passwordStrength.label}
                      {passwordStrength.score < 3 && <span className="text-muted font-normal"> — add uppercase, numbers, or symbols</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Confirm password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition group-focus-within:text-orange" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-field !pl-11 py-3 text-base ${confirmPassword && confirmPassword !== password ? 'border-danger' : ''}`}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-xs text-danger">Passwords do not match</p>
                )}
              </div>

              <button type="submit" disabled={submitting || emailAvailable === false} className="btn-accent w-full py-3.5 text-base mt-4">
                {submitting ? 'Creating...' : 'Create Account'} <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
