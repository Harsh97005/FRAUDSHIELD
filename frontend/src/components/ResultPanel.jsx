import { useEffect, useState } from 'react';
import CircularProgress from './CircularProgress';
import RiskBadge from './RiskBadge';
import {
  ShieldCheck, ShieldAlert, AlertCircle, Info,
  Eye, Tag, CheckCircle2, XCircle,
} from 'lucide-react';

// Highlights suspicious words in the message text
function HighlightedText({ text, suspiciousWords }) {
  if (!suspiciousWords || suspiciousWords.length === 0) {
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</span>;
  }

  const escaped = suspiciousWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8 }}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="suspicious-word">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function ResultPanel({ result: analysisResult, message }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [analysisResult]);

  if (!analysisResult) return null;

  const { result, score, risk, explanation, suspiciousWords, detectionDetails } = analysisResult;
  const isFraud = result === 'FRAUD';

  const mainColor = isFraud ? 'var(--neon-red)' : 'var(--neon-green)';
  const resultBg = isFraud ? 'rgba(255,51,102,0.05)' : 'rgba(0,255,136,0.05)';
  const resultBorder = isFraud ? 'rgba(255,51,102,0.25)' : 'rgba(0,255,136,0.25)';

  return (
    <div
      className="glass-card p-6 animate-fade-in-up"
      style={{
        background: resultBg,
        border: `1px solid ${resultBorder}`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>

      {/* ── Top: Verdict ────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <CircularProgress score={score} result={result} />
          <RiskBadge risk={risk} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3 mb-3">
            {isFraud
              ? <ShieldAlert size={28} style={{ color: mainColor, filter: `drop-shadow(0 0 8px ${mainColor})` }} />
              : <ShieldCheck size={28} style={{ color: mainColor, filter: `drop-shadow(0 0 8px ${mainColor})` }} />
            }
            <div>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: '1.75rem', fontWeight: 800,
                color: mainColor, letterSpacing: '0.1em',
                textShadow: `0 0 20px ${mainColor}`,
              }}>
                {result}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {isFraud ? 'This message contains fraud indicators' : 'No significant threats detected'}
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="flex justify-between mb-1">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Level</span>
              <span style={{ fontSize: '0.75rem', color: mainColor, fontWeight: 600 }}>{score}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{
                width: `${score}%`, height: '100%', background: mainColor,
                borderRadius: '100px', transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: `0 0 10px ${mainColor}`,
              }} />
            </div>
          </div>

          {/* Detection stats */}
          {detectionDetails && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Keywords', val: detectionDetails.keywordMatches },
                { label: 'URLs', val: detectionDetails.urlsDetected },
                { label: 'Urgency', val: detectionDetails.urgencyPhrases },
                { label: 'Money', val: detectionDetails.moneyMentions },
              ].map(({ label, val }) => (
                <div key={label} style={{
                  padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.73rem',
                  background: val > 0 ? 'rgba(255,51,102,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${val > 0 ? 'rgba(255,51,102,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  color: val > 0 ? '#ff8fab' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  {val > 0 ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                  {label}: {val}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* ── Explanation ──────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} style={{ color: 'var(--neon-blue)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Analysis Explanation
          </span>
        </div>
        <p style={{
          fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7,
          background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {explanation}
        </p>
      </div>

      {/* ── Suspicious Words ─────────────────────── */}
      {suspiciousWords && suspiciousWords.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={15} style={{ color: 'var(--neon-red)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Flagged Terms ({suspiciousWords.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suspiciousWords.map((word, i) => (
              <span key={i} className="badge-fraud" style={{ fontSize: '0.73rem', padding: '0.25rem 0.7rem' }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Original Message Highlighted ─────────── */}
      {message && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={15} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Message Preview
            </span>
            {suspiciousWords?.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                (suspicious words highlighted)
              </span>
            )}
          </div>
          <div style={{
            padding: '1rem', borderRadius: '10px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--text-secondary)',
            maxHeight: '200px', overflowY: 'auto',
          }}>
            <HighlightedText text={message} suspiciousWords={suspiciousWords} />
          </div>
        </div>
      )}

      {/* ── Warning Banner for FRAUD ─────────────── */}
      {isFraud && (
        <div style={{
          marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: '10px',
          background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        }}>
          <AlertCircle size={18} style={{ color: 'var(--neon-red)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.82rem', color: '#ff8fab', lineHeight: 1.6 }}>
            <strong>⚠️ Warning:</strong> Do NOT click any links, call any numbers, or share personal information from this message. Report it to your local cybercrime authority.
          </p>
        </div>
      )}
    </div>
  );
}
