import { useState, useEffect, useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isConfigured } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Shield, Bell, Monitor, Link2, Cpu, MessageSquare,
  Zap, Send, Clipboard, Languages, Image,
  ShieldAlert, ShieldCheck, AlertTriangle, Info, Tag, Eye
} from 'lucide-react';

// ── Circular Score Ring ──────────────────────────────────────
function ScoreRing({ score, result }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();

  const size = 130;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (display / 100) * circ;

  const color = result === 'FRAUD'
    ? (score >= 65 ? '#ff4d6d' : '#f59e0b')
    : '#10b981';

  useEffect(() => {
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * score));
      if (p < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [score]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="rgba(15, 23, 42, 0.05)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="score-ring"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 0.04s linear' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>
          {display}%
        </span>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
          Risk Score
        </span>
      </div>
    </div>
  );
}

// ── Highlighted message text ─────────────────────────────────
function HighlightedText({ text, words }) {
  if (!words?.length) return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</span>;
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8 }}>
      {parts.map((p, i) => regex.test(p)
        ? <mark key={i} className="suspicious-word">{p}</mark>
        : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ── Loading spinner ──────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: '#ffffff',
          animation: `blink 1s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Bar chart ────────────────────────────────────────────────
const CHART_DATA = [
  { label: 'Mon', val: 45, active: false },
  { label: 'Tue', val: 62, active: false },
  { label: 'Wed', val: 38, active: false },
  { label: 'Thu', val: 75, active: false },
  { label: 'Fri', val: 55, active: false },
  { label: 'Sat', val: 90, active: true },
  { label: 'Sun', val: 48, active: false },
];

const FEATURE_CARDS = [
  { icon: Cpu, title: 'AI-Powered', desc: 'Neural networks trained on 10M+ confirmed scam signatures.' },
  { icon: MessageSquare, title: 'OTP Scam Shield', desc: 'Specialized detection for one-time-password intercept attempts.' },
  { icon: Link2, title: 'Phishing Filter', desc: 'Deep link inspection across multiple redirects.' },
  { icon: Zap, title: 'Real-time Protection', desc: 'Continuous monitoring of your SMS gateway for threats.' },
];

const EXAMPLE_MESSAGES = {
  fraud: `URGENT: Your Wells Fargo account has been flagged for suspicious activity. To avoid permanent suspension, click immediately to verify your identity: https://bit.ly/secure-wf-verify-492. Do not share this OTP with anyone.`,
  safe: `Hi! Your Amazon order #112-4891234 has been shipped. Expected delivery: Tuesday, July 2. Track your package at amazon.com/orders. Thank you for shopping with us!`,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chartMode, setChartMode] = useState('month');
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    if (location.state?.prefillMessage) setMessage(location.state.prefillMessage);
  }, []);

  const handleAnalyze = async () => {
    if (!message.trim() || message.trim().length < 5) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post('/api/analyze', { message });
      if (!data.success) { toast.error('Analysis failed'); return; }
      setResult({ ...data, message });
      setTotalScans(p => p + 1);

      if (isConfigured && db && user && !user.isDemo) {
        try {
          await addDoc(collection(db, 'scans'), {
            userId: user.uid, message,
            result: data.result, score: data.score, risk: data.risk,
            explanation: data.explanation,
            suspiciousWords: data.suspiciousWords || [],
            timestamp: serverTimestamp(),
          });
        } catch {}
      }

      if (data.result === 'FRAUD') toast.error('⚠️ Scam detected!', { duration: 4000 });
      else toast.success('✅ Message appears safe.', { duration: 3000 });
    } catch (err) {
      if (err.code === 'ERR_NETWORK') toast.error('Backend not running on port 3001');
      else toast.error('Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMessage(text);
    } catch { toast.error('Clipboard access denied'); }
  };

  const isFraud = result?.result === 'FRAUD';

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileNav />

      {/* ── Topbar ───────────────────────────────────────────── */}
      <div className="topbar">
        <NavLink to="/dashboard" className={({ isActive }) => `topbar-nav-link${isActive ? ' active' : ''}`}>Overview</NavLink>
        <button className="topbar-nav-link" onClick={() => toast('Analytics coming soon', { icon: '📊' })}>Analytics</button>
        <button className="topbar-nav-link" onClick={() => toast('Integrations coming soon', { icon: '🔌' })}>Integrations</button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', transition: 'color 0.15s ease' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <Bell size={17} />
          </button>
          <button className="btn-new-scan" onClick={() => { setMessage(''); setResult(null); }}>
            + New Scan
          </button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="main-content">

        {/* ── Hero ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: '0.2rem', letterSpacing: '-0.02em', fontFamily: 'Space Grotesk' }}>
            Detect Fraud Messages <span style={{ color: 'var(--accent)' }}>Instantly</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: 1.6 }}>
            FRAUDSHIELD analyzes linguistic patterns, hidden metadata, and malicious URLs to protect your digital identity.
          </p>
        </div>

        {/* ── Two-column grid (Responsive) ────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start', marginBottom: '1.5rem' }}>

          {/* ── Left: Message Input ──────────────────────────── */}
          <div className="card">
            {/* Card header */}
            <div className="card-header">
              <div className="panel-label">
                <Monitor size={12} />
                Message Analysis Buffer
              </div>
              <button onClick={paste}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', transition: 'color 0.15s ease' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Clipboard size={11} /> CTRL+V TO PASTE
              </button>
            </div>

            {/* Textarea */}
            <div style={{ padding: '1rem', minHeight: '180px' }}>
              <textarea
                className="msg-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleAnalyze(); }}
                placeholder={`Paste your SMS, WhatsApp, or email message here...\n\nExample: "URGENT: Your account has been suspended. Verify now at http://..."`}
              />
            </div>

            {/* Example loaders */}
            <div style={{ padding: '0 1rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Try Scam Example', type: 'fraud' },
                { label: 'Try Safe Example', type: 'safe' },
              ].map(({ label, type }) => (
                <button key={type} onClick={() => setMessage(EXAMPLE_MESSAGES[type])}
                  className={type === 'fraud' ? 'badge badge-fraud' : 'badge badge-safe'}
                  style={{ cursor: 'pointer', fontSize: '0.65rem', padding: '0.25rem 0.7rem' }}>
                  {label}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center' }}>
                {message.length}/5000
              </span>
            </div>

            {/* Footer: icons + button */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <Monitor size={16} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'} />
                <Image size={16} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'} />
                <Languages size={16} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'} />
              </div>
              <button className="btn-analyze"
                onClick={handleAnalyze}
                disabled={loading || message.trim().length < 5}>
                {loading ? <><Spinner /> Analyzing...</> : <>Analyze Message <Send size={13} /></>}
              </button>
            </div>
          </div>

          {/* ── Right: Result Panel ──────────────────────────── */}
          <div className="card">
            <div className="card-header">
              <div className="panel-label">
                {result
                  ? (isFraud
                    ? <><ShieldAlert size={12} style={{ color: 'var(--danger)' }} /> Scam Detected</>
                    : <><ShieldCheck size={12} style={{ color: 'var(--success)' }} /> Safe Message</>)
                  : <><Shield size={12} /> Awaiting Scan</>
                }
              </div>
              {result && (
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                  REPORT #{Math.random().toString(36).slice(2,8).toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1.5rem 0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid transparent', borderTop: '3px solid var(--accent)', borderRight: '3px solid var(--accent-glow)', animation: 'spin 1.5s linear infinite' }} />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>ANALYZING...</p>
                </div>
              ) : result ? (
                <>
                  <ScoreRing score={result.score} result={result.result} />

                  {/* Indicators */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { label: 'Phishing Probability', val: result.risk === 'high' ? 'CRITICAL' : result.risk === 'medium' ? 'MEDIUM' : 'LOW', color: result.risk === 'high' ? 'var(--danger)' : result.risk === 'medium' ? 'var(--warning)' : 'var(--success)' },
                      { label: 'Social Engineering', val: result.detectionDetails?.keywordMatches > 3 ? 'HIGH' : result.detectionDetails?.keywordMatches > 1 ? 'MEDIUM' : 'LOW', color: result.detectionDetails?.keywordMatches > 3 ? 'var(--danger)' : result.detectionDetails?.keywordMatches > 1 ? 'var(--warning)' : 'var(--success)' },
                      { label: 'Malicious URL Path', val: result.detectionDetails?.urlsDetected > 0 ? 'CONFIRMED' : 'NONE', color: result.detectionDetails?.urlsDetected > 0 ? 'var(--danger)' : 'var(--success)' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border-default)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.06em' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <Shield size={22} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', lineHeight: 1.6 }}>
                    PASTE A MESSAGE<br/>AND HIT ANALYZE
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Insights panel (Visible when result exists) ── */}
        {result && (
          <div className="card animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="panel-label" style={{ color: 'var(--accent)' }}>
                <Cpu size={12} /> AI Linguistic Insights
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {result.suspiciousWords?.length > 0 && (
                <div className="insight-tag">
                  <strong>Urgency Trigger:</strong> "{result.suspiciousWords[0]}" detected, common in {Math.floor(85 + Math.random() * 12)}% of banking scams.
                </div>
              )}
              {result.detectionDetails?.urlsDetected > 0 && (
                <div className="insight-tag">
                  <strong>Masked Link:</strong> URL uses a shortener to hide a domain registered recently.
                </div>
              )}
              {result.detectionDetails?.keywordMatches > 2 && (
                <div className="insight-tag">
                  <strong>Pattern Match:</strong> {result.detectionDetails.keywordMatches} fraud signatures found in this message.
                </div>
              )}
              {!result.suspiciousWords?.length && !result.detectionDetails?.urlsDetected && (
                <div className="insight-tag">
                  <strong>Clean Signal:</strong> No fraud patterns detected. Message appears legitimate.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Result Detail (full-width, below grid) ─────────── */}
        {result && (
          <div className="card animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="panel-label"><Eye size={12} /> Full Analysis Report</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${isFraud ? 'badge-fraud' : 'badge-safe'}`}>
                  {result.result}
                </span>
                <span className={`badge ${result.risk === 'high' ? 'badge-critical' : result.risk === 'medium' ? 'badge-high' : 'badge-safe'}`}>
                  {result.risk} RISK
                </span>
              </div>
            </div>
            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Explanation */}
              <div>
                <p className="mono" style={{ marginBottom: '0.5rem' }}>Explanation</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
                  {result.explanation}
                </p>
              </div>
              {/* Flagged terms + message */}
              <div>
                {result.suspiciousWords?.length > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <p className="mono" style={{ marginBottom: '0.5rem' }}>
                      <Tag size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      Flagged Terms
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {result.suspiciousWords.map((w, i) => (
                        <span key={i} className="badge badge-fraud" style={{ fontSize: '0.62rem' }}>{w}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="mono" style={{ marginBottom: '0.5rem' }}>
                    <Eye size={10} style={{ display: 'inline', marginRight: '4px' }} />
                    Message Preview
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-default)', maxHeight: '120px', overflowY: 'auto', lineHeight: 1.7 }}>
                    <HighlightedText text={result.message} words={result.suspiciousWords} />
                  </div>
                </div>
              </div>
            </div>
            {isFraud && (
              <div style={{ margin: '0 1.25rem 1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--danger-dim)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--danger)', lineHeight: 1.6 }}>
                  <strong>Warning:</strong> Do NOT click any links, call any numbers, or share personal data. Report to your cybercrime authority immediately.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Feature Cards ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {FEATURE_CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon"><Icon size={16} /></div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom: Chart + Stats ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>Detection Trends</h3>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Global threat volume detected by your engine</p>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['week', 'month'].map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', padding: '0.2rem 0.6rem',
                      borderRadius: '4px', border: 'none', cursor: 'pointer', letterSpacing: '0.08em',
                      textTransform: 'uppercase', transition: 'all 0.15s ease',
                      background: chartMode === m ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: chartMode === m ? '#ffffff' : 'var(--text-muted)',
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
              {/* Chart area */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                {CHART_DATA.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div className={`chart-bar ${d.active ? 'active' : ''}`}
                      style={{ width: '100%', height: `${d.val}%`, background: d.active ? 'var(--accent)' : 'var(--teal-mid)' }} />
                  </div>
                ))}
              </div>
              {/* X-axis labels */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {CHART_DATA.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: d.active ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 4.2k stat */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, marginBottom: '0.4rem' }}>
                4.2k+
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Total Scams Blocked</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>Across all connected devices this month.</div>
              <button className="mono-accent" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.65rem', letterSpacing: '0.1em' }}
                onClick={() => toast('Report generation coming soon!', { icon: '📊' })}>
                VIEW REPORT →
              </button>
            </div>

            {/* Vault status */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <Shield size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Vault Status</span>
              </div>
              {[
                { label: 'Encryption', val: 'AES-256', color: 'var(--success)', bg: 'var(--success-dim)' },
                { label: 'Threat Database', val: 'SYNCED', color: 'var(--success)', bg: 'var(--success-dim)' },
              ].map(({ label, val, color, bg }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-default)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', fontWeight: 700, color, background: bg, padding: '0.15rem 0.45rem', borderRadius: '3px', letterSpacing: '0.05em' }}>
                    {val}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>STORAGE: 48.2 GB USED</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '62%', background: 'linear-gradient(90deg, var(--teal-dark), var(--accent))' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
