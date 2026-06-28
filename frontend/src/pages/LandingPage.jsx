import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Zap, Lock, TrendingUp, ChevronRight,
  MessageSquare, Sun, Moon, AlertTriangle, Monitor,
  ShieldAlert, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

/* ── Fake threat data for background animation ── */
const FAKE_ALERTS = [
  { type: 'sms',   icon: '💬', label: 'SMS',      color: '#dc2626', title: 'OTP Scam',       body: 'Your SBI OTP is 847291. URGENT verify now: bit.ly/sbi-verify' },
  { type: 'call',  icon: '📞', label: 'CALL',     color: '#d97706', title: 'Phishing Call',   body: 'Unknown: "Your Amazon order cancelled. Call 1800-XXX-XXXX now."' },
  { type: 'email', icon: '📧', label: 'EMAIL',    color: '#dc2626', title: 'Phishing Email',  body: 'PayPal: Your account limited! Click here to restore access →' },
  { type: 'sms',   icon: '💬', label: 'SMS',      color: '#dc2626', title: 'Bank Fraud',      body: 'HDFC: Account blocked. Update KYC: hdfc-update.xyz/kyc' },
  { type: 'wa',    icon: '📱', label: 'WHATSAPP', color: '#16a34a', title: 'Safe Message',    body: 'Hey! Meeting rescheduled to Tuesday 3PM. See you there!' },
  { type: 'email', icon: '📧', label: 'EMAIL',    color: '#dc2626', title: 'Lottery Scam',    body: 'Congrats! You won ₹50 Lakh. Claim now: free-lottery.co/claim' },
  { type: 'sms',   icon: '💬', label: 'SMS',      color: '#dc2626', title: 'Crypto Fraud',    body: 'Double your Bitcoin! Send 0.1 BTC → Get 0.2 BTC back. Limited!' },
  { type: 'call',  icon: '📞', label: 'CALL',     color: '#d97706', title: 'IRS Scam',        body: 'IRS: Final warning! Pay ₹5000 or face arrest. Call back now.' },
  { type: 'email', icon: '📧', label: 'EMAIL',    color: '#d97706', title: 'Suspicious',      body: 'Your Netflix subscription failed. Update payment: nflx-pay.site' },
  { type: 'wa',    icon: '📱', label: 'WHATSAPP', color: '#dc2626', title: 'Chain Scam',      body: 'Forward to 10 people and get ₹1000 Paytm cash! 100% genuine!' },
];

/* ── Placeholder simulator inputs ── */
const SIMULATOR_STRINGS = [
  'URGENT: Your parcel is pending delivery. Click to confirm address: post-office-redirection.xyz/track',
  'Dear Customer, your credit card rewards points (₹7,890) will expire today. Claim instantly at: points-hdfc.xyz',
  'Hi mom, my phone broke. This is my new temporary WhatsApp number. Please transfer ₹10,000 to my friend UPI immediately.',
  'Verify your Netflix billing details within 24 hours to prevent account suspension: netflix-security-check.com'
];

const STATS = [
  { value: '99.2%', label: 'Detection Rate',  icon: TrendingUp },
  { value: '2M+',   label: 'Scans Completed', icon: MessageSquare },
  { value: '500ms', label: 'Avg Response',    icon: Zap },
  { value: 'AES-256', label: 'Encryption',    icon: Lock },
];

const FEATURES = [
  { icon: Shield,       title: 'AI-Powered Detection',  desc: 'NLP engine trained on millions of real scam patterns.' },
  { icon: Zap,          title: 'Instant Analysis',      desc: 'Results in under 500ms with full confidence scoring.' },
  { icon: Lock,         title: 'Privacy First',         desc: 'Messages analyzed in memory — never stored without consent.' },
  { icon: TrendingUp,   title: 'Detailed Reports',      desc: 'Understand exactly why a message was flagged.' },
];

/* ── Single floating alert card component ── */
function FloatingAlert({ alert, style }) {
  const isFraud = alert.color === '#dc2626' || alert.color === '#d97706';
  return (
    <div className="floating-card-alert" style={{
      position: 'absolute',
      ...style,
      background: 'var(--bg-surface)',
      border: `1px solid ${isFraud ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}`,
      borderRadius: '10px',
      padding: '0.6rem 0.85rem',
      maxWidth: '220px',
      minWidth: '180px',
      boxShadow: `0 4px 20px ${isFraud ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)'}`,
      backdropFilter: 'blur(12px)',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.75rem' }}>{alert.icon}</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.55rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: alert.color,
            textTransform: 'uppercase',
          }}>{alert.label}</span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.55rem',
          padding: '0.1rem 0.35rem',
          borderRadius: '3px',
          fontWeight: 700,
          background: isFraud ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)',
          color: alert.color,
          letterSpacing: '0.08em',
        }}>
          {isFraud ? '⚠ FRAUD' : '✓ SAFE'}
        </span>
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
        {alert.title}
      </div>
      <div style={{
        fontSize: '0.65rem', color: 'var(--text-muted)',
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        lineHeight: 1.4,
      }}>
        {alert.body}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [message, setMessage]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [theme, setTheme]           = useState(localStorage.getItem('theme') || 'light');
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [liveCounter, setLiveCounter] = useState(148291);
  const [placeholderText, setPlaceholderText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  /* Slider To Unlock States */
  const [sliderVal, setSliderVal] = useState(0);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const sliderRef = useRef(null);

  /* Cipher/Decryption text animation states */
  const [decryptedText, setDecryptedText] = useState('');
  const [cipherIntervalActive, setCipherIntervalActive] = useState(false);

  /* Wobble/Alert active state */
  const [shouldWobble, setShouldWobble] = useState(false);

  const { user }    = useAuth();
  const navigate    = useNavigate();
  const inputRef    = useRef(null);
  const alertIdRef  = useRef(0);

  /* Theme persistence */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  /* Threat counter increment */
  useEffect(() => {
    const counterTimer = setInterval(() => {
      setLiveCounter(prev => prev + Math.floor(Math.random() * 4) + 1);
    }, 2200);
    return () => clearInterval(counterTimer);
  }, []);

  /* Placeholder typing */
  useEffect(() => {
    let stringIndex = 0;
    let charIndex = 0;
    let currentString = SIMULATOR_STRINGS[stringIndex];
    let typingSpeed = 50;
    let deleteSpeed = 25;
    let delayBetween = 2500;
    let delayBeforeDelete = 3500;
    let active = true;

    const runTypingFlow = () => {
      if (!active) return;
      if (isTyping) {
        if (charIndex < currentString.length) {
          setPlaceholderText(currentString.substring(0, charIndex + 1));
          charIndex++;
          setTimeout(runTypingFlow, typingSpeed);
        } else {
          setTimeout(() => {
            setIsTyping(false);
            setTimeout(runTypingFlow, deleteSpeed);
          }, delayBeforeDelete);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(currentString.substring(0, charIndex - 1));
          charIndex--;
          setTimeout(runTypingFlow, deleteSpeed);
        } else {
          stringIndex = (stringIndex + 1) % SIMULATOR_STRINGS.length;
          currentString = SIMULATOR_STRINGS[stringIndex];
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(runTypingFlow, typingSpeed);
          }, delayBetween);
        }
      }
    };

    const startTimeout = setTimeout(runTypingFlow, 1000);
    return () => {
      active = false;
      clearTimeout(startTimeout);
    };
  }, [isTyping]);

  /* Alerts spawn */
  useEffect(() => {
    const seed = [
      { id: alertIdRef.current++, ...FAKE_ALERTS[0], pos: { top: '12%', left: '4%' },  anim: 'alertSlideRight' },
      { id: alertIdRef.current++, ...FAKE_ALERTS[2], pos: { top: '20%', right: '4%' }, anim: 'alertSlideLeft' },
      { id: alertIdRef.current++, ...FAKE_ALERTS[5], pos: { top: '60%', left: '3%' },  anim: 'alertSlideRight' },
      { id: alertIdRef.current++, ...FAKE_ALERTS[7], pos: { top: '70%', right: '3%' }, anim: 'alertSlideLeft' },
    ];
    setVisibleAlerts(seed);

    const timer = setInterval(() => {
      const alert = FAKE_ALERTS[alertIdRef.current % FAKE_ALERTS.length];
      const side  = alertIdRef.current % 2 === 0 ? 'left' : 'right';
      const topPct = 10 + (alertIdRef.current % 6) * 14;
      const newAlert = {
        id: alertIdRef.current,
        ...alert,
        pos: side === 'left' ? { top: `${topPct}%`, left: '3%' } : { top: `${topPct}%`, right: '3%' },
        anim: side === 'left' ? 'alertSlideRight' : 'alertSlideLeft',
      };
      alertIdRef.current++;
      setVisibleAlerts((prev) => {
        const next = [...prev, newAlert];
        return next.slice(-6);
      });
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  /* Slider drag event handlers */
  const handleMouseDown = () => setIsSliderActive(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isSliderActive || !sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let val = ((clientX - rect.left) / rect.width) * 100;
      if (val < 0) val = 0;
      if (val > 100) val = 100;
      setSliderVal(val);

      if (val >= 98) {
        setIsSliderActive(false);
        setSliderVal(100);
        triggerAnalysisFromSlider();
      }
    };

    const handleMouseUp = () => {
      if (!isSliderActive) return;
      setIsSliderActive(false);
      if (sliderVal < 98) {
        // Reset back to left
        let resetVal = sliderVal;
        const interval = setInterval(() => {
          resetVal -= 8;
          if (resetVal <= 0) {
            resetVal = 0;
            clearInterval(interval);
          }
          setSliderVal(resetVal);
        }, 15);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isSliderActive, sliderVal]);

  const triggerAnalysisFromSlider = async () => {
    const textToAnalyze = message.trim() || placeholderText.trim();
    if (!textToAnalyze || textToAnalyze.length < 5) {
      toast.error('Please enter a message to analyze');
      setSliderVal(0);
      return;
    }
    if (user) { navigate('/dashboard', { state: { prefillMessage: textToAnalyze } }); return; }
    
    setLoading(true);
    setQuickResult(null);
    setDecryptedText('');
    setShouldWobble(false);

    try {
      const { data } = await axios.post('/api/analyze', { message: textToAnalyze });
      setQuickResult(data);
      triggerDecryptionCipherAnimation(data.explanation, data.result === 'FRAUD');
    } catch {
      toast.error('Analysis failed. Make sure the backend is running.');
      setSliderVal(0);
    } finally {
      setLoading(false);
    }
  };

  /* Cipher/Decryption text animation reveal */
  const triggerDecryptionCipherAnimation = (finalText, fraudResult) => {
    setCipherIntervalActive(true);
    let iteration = 0;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789$#@%!&';
    
    const interval = setInterval(() => {
      setDecryptedText(prev => {
        return finalText
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return finalText[index];
            }
            if (char === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
      });

      iteration += Math.ceil(finalText.length / 25);
      if (iteration >= finalText.length) {
        setDecryptedText(finalText);
        setCipherIntervalActive(false);
        clearInterval(interval);
        
        // Reset slider back
        setSliderVal(0);
        
        // Trigger wobble if fraud detected
        if (fraudResult) {
          setShouldWobble(true);
          setTimeout(() => setShouldWobble(false), 900);
        }
      }
    }, 45);
  };

  const isFraud = quickResult?.result === 'FRAUD';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Advanced Landing-Page-Specific Custom CSS & Animations Injected ── */}
      <style>{`
        @keyframes alertSlideRight {
          0%   { opacity: 0; transform: translateX(-40px) scale(0.94); }
          15%  { opacity: 1; transform: translateX(0)     scale(1); }
          80%  { opacity: 1; transform: translateX(0)     scale(1); }
          100% { opacity: 0; transform: translateX(-20px) scale(0.96); }
        }
        @keyframes alertSlideLeft {
          0%   { opacity: 0; transform: translateX(40px)  scale(0.94); }
          15%  { opacity: 1; transform: translateX(0)     scale(1); }
          80%  { opacity: 1; transform: translateX(0)     scale(1); }
          100% { opacity: 0; transform: translateX(20px)  scale(0.96); }
        }
        @keyframes radarExpand {
          0%   { transform: translate(-50%, -50%) scale(0.45); opacity: 0.28; }
          100% { transform: translate(-50%, -50%) scale(1.6);  opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.8; }
        }
        /* Lock pointer warning hover target animation */
        @keyframes targetLockBorder {
          0%, 100% { border-color: rgba(220,38,38,0.25); outline: 2px solid transparent; }
          50%      { border-color: #dc2626; outline: 2px solid rgba(220,38,38,0.15); }
        }
        .suspicious-target-locked {
          animation: targetLockBorder 1.2s infinite;
          background: var(--danger-bg) !important;
          color: var(--danger) !important;
          cursor: crosshair;
        }
        /* Haptic Wobble Alert Animation */
        @keyframes alertWobble {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-6px) rotate(-0.5deg); }
          30%, 60%, 90% { transform: translateX(6px) rotate(0.5deg); }
        }
        .wobble-alert-panel {
          animation: alertWobble 0.75s ease-in-out;
        }
        .floating-card-alert {
          animation: float 4s ease-in-out infinite;
        }
        .radar-pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1px solid var(--accent);
          pointer-events: none;
          transform: translate(-50%, -50%);
        }
      `}</style>

      {/* ── Grid Background ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(var(--border-light) 1px, transparent 1px),
          linear-gradient(90deg, var(--border-light) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
        animation: 'gridPulse 6s ease-in-out infinite',
      }} />

      {/* ── Radar Sweep Background Pulses ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="radar-pulse-ring" style={{ width: '400px', height: '400px', animation: 'radarExpand 7s cubic-bezier(0.1, 0.8, 0.3, 1) infinite' }} />
        <div className="radar-pulse-ring" style={{ width: '400px', height: '400px', animation: 'radarExpand 7s cubic-bezier(0.1, 0.8, 0.3, 1) 2.5s infinite' }} />
      </div>

      {/* ── Floating Background Alerts ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        {visibleAlerts.map((a) => (
          <FloatingAlert
            key={a.id}
            alert={a}
            style={{
              ...a.pos,
              animation: `${a.anim} 6s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            }}
          />
        ))}
      </div>

      {/* ── Glow orbs ── */}
      <div style={{ position: 'fixed', top: '-5%', left: '10%', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: '5%', right: '8%',  width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />

      {/* ══════════════════════
          NAVBAR
      ══════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.75rem', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px var(--accent-glow)' }}>
            <Shield size={15} color="#fff" />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            FRAUD<span style={{ color: 'var(--accent)' }}>SHIELD</span>
          </span>
        </div>

        {/* Nav right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '6px 8px', transition: 'all 0.2s', gap: '4px', fontSize: '0.72rem', fontFamily: 'JetBrains Mono' }}>
            {theme === 'light' ? <><Moon size={13} /> Dark</> : <><Sun size={13} /> Light</>}
          </button>

          {user ? (
            <button className="btn-new-scan" onClick={() => navigate('/dashboard')}>
              Dashboard <ChevronRight size={12} style={{ display: 'inline' }} />
            </button>
          ) : (
            <>
              <Link to="/auth" className="btn-secondary" style={{ padding: '0.42rem 1rem', fontSize: '0.78rem', textDecoration: 'none' }}>
                Sign In
              </Link>
              <Link to="/auth" className="btn-primary" style={{ padding: '0.42rem 1rem', fontSize: '0.78rem', textDecoration: 'none' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════════════
          HERO SECTION
      ══════════════════════ */}
      <section style={{
        position: 'relative', zIndex: 10,
        paddingTop: '110px', paddingBottom: '40px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '110px 1.5rem 40px',
      }}>
        {/* Live Threat Counter Ticker */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
          borderRadius: '99px', padding: '0.35rem 0.95rem', marginBottom: '1.25rem',
          fontSize: '0.72rem', fontFamily: 'JetBrains Mono', fontWeight: 600,
          color: 'var(--danger)', letterSpacing: '0.08em',
        }}>
          <span className="status-dot animate-blink" style={{ width: 6, height: 6, background: 'var(--danger)' }} />
          TOTAL SCAMS DETECTED TODAY: {liveCounter.toLocaleString()}
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
          fontWeight: 800, lineHeight: 1.1, marginBottom: '0.9rem',
          color: 'var(--text-primary)', letterSpacing: '-0.03em',
          maxWidth: '820px',
        }}>
          Stop Scams Before They{' '}
          <span style={{
            color: 'var(--accent)',
            position: 'relative',
            display: 'inline-block',
          }}>
            Stop You
          </span>
        </h1>

        <p style={{
          fontSize: '1rem', color: 'var(--text-secondary)',
          maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.65,
        }}>
          Paste any suspicious SMS, WhatsApp, email, or call script and our AI will
          identify fraud patterns, phishing links, and social engineering in under a second.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button className="btn-primary"
            onClick={() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            style={{ fontSize: '0.82rem', padding: '0.65rem 1.5rem' }}>
            <Shield size={14} /> Try Free Scan
          </button>
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.65rem 1.5rem' }}>
              Create Free Account
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', width: '100%', maxWidth: '700px' }}>
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'default' }}>
              <Icon size={16} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════
          LIVE SCAN BOX
      ══════════════════════ */}
      <section ref={inputRef} style={{ position: 'relative', zIndex: 10, maxWidth: '700px', margin: '0 auto', padding: '0 1.5rem 60px' }}>
        <div className={`card ${shouldWobble ? 'wobble-alert-panel' : ''}`} style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="card-header">
            <div className="panel-label">
              <Monitor size={12} /> Live Scan Terminal
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}>
              ● SYSTEM ONLINE
            </span>
          </div>

          <div style={{ padding: '1rem 1rem 0' }}>
            <textarea className="msg-textarea" rows={5} value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={placeholderText || 'Paste any suspicious message, OTP scam, phishing email...'} />
          </div>

          {/* Quick load examples */}
          <div style={{ padding: '0.25rem 1rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setMessage('URGENT: Your SBI account has been blocked due to KYC failure. Click here to verify immediately: https://sbi-update.xyz/kyc or your account will be permanently suspended.')}
              className="badge badge-fraud" style={{ cursor: 'pointer' }}>💬 Load SMS Scam</button>
            <button onClick={() => setMessage('Congratulations! You have won a Free iPhone 15. Claim now at apple-free-gift.xyz before 24 hours or the offer expires!')}
              className="badge badge-fraud" style={{ cursor: 'pointer' }}>📧 Load Email Scam</button>
            <button onClick={() => setMessage('Hi! Your Amazon order #114-2938471 has been shipped and will arrive by Friday. Track at amazon.com/orders')}
              className="badge badge-safe" style={{ cursor: 'pointer' }}>✓ Load Safe Message</button>
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              {message.length || placeholderText.length}/5000
            </span>
          </div>

          {/* 🖲️ Slide to Secure Scan Bar */}
          <div style={{ padding: '1.2rem 1rem', borderTop: '1px solid var(--border)' }}>
            <div ref={sliderRef} style={{
              position: 'relative',
              width: '100%',
              height: '46px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: '23px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}>
              {/* Slider Track Progress Fill */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${sliderVal}%`,
                background: 'var(--accent-light)',
                borderRadius: '23px 0 0 23px',
                pointerEvents: 'none',
              }} />

              {/* Slider Text Helper */}
              <span style={{
                position: 'relative',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: isSliderActive ? 'var(--accent)' : 'var(--text-secondary)',
                opacity: 1 - sliderVal / 120,
                pointerEvents: 'none',
              }}>
                {loading ? 'ANALYZING THREATS...' : '>>> SLIDE TO SECURE SCAN >>>'}
              </span>

              {/* Slider Drag Handle Knob */}
              <div
                onTouchStart={handleMouseDown}
                onMouseDown={handleMouseDown}
                style={{
                  position: 'absolute',
                  left: `calc(${sliderVal}% - 42px + ${42 * (1 - sliderVal/100)}px)`,
                  width: '42px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 2px 8px var(--accent-glow)',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: isSliderActive ? 'none' : 'left 0.15s ease-out',
                }}
              >
                <Zap size={14} className={loading ? 'animate-blink' : ''} />
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {quickResult && (
          <div className="card animate-fade-in-up" style={{ marginTop: '1rem', borderLeft: `3px solid ${isFraud ? 'var(--danger)' : 'var(--success)'}` }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={isFraud ? 'badge badge-fraud' : 'badge badge-safe'}>{quickResult.result}</span>
                  <span className={quickResult.risk === 'high' ? 'badge badge-critical' : quickResult.risk === 'medium' ? 'badge badge-medium' : 'badge badge-safe'}>{quickResult.risk} risk</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 800, color: isFraud ? 'var(--danger)' : 'var(--success)' }}>
                  {quickResult.score}%
                </span>
              </div>
              
              {/* 🔏 Decryption Cipher Reveal Output */}
              <p style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontFamily: cipherIntervalActive ? 'JetBrains Mono, monospace' : 'inherit',
                letterSpacing: cipherIntervalActive ? '0.02em' : 'normal'
              }}>
                {decryptedText}
              </p>
              
              {/* 🔗 Suspicious target locked layout */}
              {isFraud && (
                <div className="suspicious-target-locked" style={{
                  marginTop: '0.75rem', padding: '0.65rem 0.85rem',
                  borderRadius: '7px',
                  display: 'flex', gap: '0.65rem',
                  border: '1px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>
                    TARGET SCAM DETECTED. DO NOT click external links or send verification codes.
                  </span>
                </div>
              )}

              <button className="btn-primary" style={{ marginTop: '0.85rem', width: '100%', justifyContent: 'center', fontSize: '0.75rem' }} onClick={() => navigate('/auth')}>
                Sign up to save scan history →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════
          FEATURES
      ══════════════════════ */}
      <section style={{ maxWidth: '940px', margin: '0 auto', padding: '0 1.5rem 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="mono-accent" style={{ marginBottom: '0.5rem' }}>Why FRAUDSHIELD</div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Built for Real Threat Protection
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={16} /></div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════
          FOOTER
      ══════════════════════ */}
      <footer style={{ textAlign: 'center', padding: '2rem 1.5rem', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifySpace: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 20, height: 20, borderRadius: '5px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={11} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>FRAUDSHIELD</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          © {new Date().getFullYear()} FRAUDSHIELD — ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
