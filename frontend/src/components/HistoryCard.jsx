import { Clock, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';

function formatTime(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryCard({ item, onDelete }) {
  const isFraud = item.result === 'FRAUD';
  const riskColor = item.risk === 'high' ? 'var(--danger)' : item.risk === 'medium' ? 'var(--warning)' : 'var(--accent)';
  const badgeClass = isFraud ? 'badge badge-fraud' : 'badge badge-safe';

  return (
    <div className="card" style={{ borderLeft: `3px solid ${isFraud ? 'var(--danger)' : 'var(--accent)'}` }}>
      <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Metadata badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span className={badgeClass}>{item.result}</span>
            {item.risk && (
              <span className={item.risk === 'high' ? 'badge badge-critical' : item.risk === 'medium' ? 'badge-high' : 'badge-safe'}>
                {item.risk} RISK
              </span>
            )}
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: riskColor,
              }}
            >
              {item.score}% RISK SCORE
            </span>
          </div>

          {/* Message Preview */}
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: '0.35rem',
            }}
          >
            {item.message}
          </p>

          {/* Footer Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            <Clock size={11} />
            <span>{formatTime(item.timestamp)}</span>
            {item.messageType && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  padding: '0 0.3rem',
                  borderRadius: '3px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {item.messageType}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            style={{
              background: 'rgba(255,77,106,0.06)',
              border: '1px solid rgba(255,77,106,0.15)',
              borderRadius: '6px',
              padding: '0.35rem 0.55rem',
              cursor: 'pointer',
              color: 'rgba(255,77,106,0.8)',
              fontSize: '0.72rem',
              transition: 'all 0.15s ease',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--danger-dim)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,77,106,0.06)';
              e.currentTarget.style.color = 'rgba(255,77,106,0.8)';
            }}
          >
            <Trash2 size={12} style={{ display: 'inline', marginRight: '4px', marginTop: '-2px' }} /> DELETE
          </button>
        )}
      </div>
    </div>
  );
}
