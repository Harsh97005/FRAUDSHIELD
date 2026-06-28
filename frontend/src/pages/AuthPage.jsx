import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginDemo, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isConfigured) {
      setError('Firebase not configured. Please use Demo Mode below.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password);
      } else {
        await registerWithEmail(form.email, form.password, form.name);
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found with this email'
        : err.code === 'auth/wrong-password' ? 'Incorrect password'
        : err.code === 'auth/email-already-in-use' ? 'Email already registered'
        : err.code === 'auth/invalid-email' ? 'Invalid email address'
        : err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isConfigured) {
      setError('Firebase not configured. Please use Demo Mode below.');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    toast.success('Entered Demo Mode — scan history won\'t be saved');
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid BG */}
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      {/* Glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(0,102,255,0.12) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 animate-float"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              boxShadow: '0 0 30px var(--accent-glow)',
            }}>
            <Shield size={26} color="#fff" />
          </div>
          <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
            FRAUD<span style={{ color: 'var(--accent)' }}>SHIELD</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.35rem' }}>
            Fraud Detection Platform
          </p>
        </div>

        <div className="glass-card p-7">
          {/* Mode Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            padding: '4px', marginBottom: '1.75rem',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {['login', 'register'].map((m) => (
              <button key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  padding: '0.6rem', borderRadius: '7px', fontWeight: 600,
                  fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease',
                  border: 'none',
                  background: mode === m ? 'rgba(0,212,255,0.12)' : 'transparent',
                  color: mode === m ? 'var(--neon-blue)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 0 10px rgba(0,212,255,0.1)' : 'none',
                }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <button className="btn-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {mode === 'register' && (
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input name="name" type="text" className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Full Name"
                  value={form.name} onChange={handleChange} />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input name="email" type="email" className="input-field"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Email address"
                value={form.email} onChange={handleChange} required />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input name="password" type={showPassword ? 'text' : 'password'} className="input-field"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                placeholder="Password"
                value={form.password} onChange={handleChange} required />
              <button type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div style={{
                padding: '0.65rem 0.85rem', borderRadius: '8px',
                background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, justifyContent: 'center' }}>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
