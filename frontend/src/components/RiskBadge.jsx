import { AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react';

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    icon: ShieldCheck,
    className: 'badge-safe',
    barColor: 'var(--neon-green)',
    barWidth: '30%',
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertTriangle,
    className: 'badge-medium',
    barColor: 'var(--neon-yellow)',
    barWidth: '60%',
  },
  high: {
    label: 'High Risk',
    icon: ShieldAlert,
    className: 'badge-fraud',
    barColor: 'var(--neon-red)',
    barWidth: '95%',
  },
};

export default function RiskBadge({ risk }) {
  const config = RISK_CONFIG[risk] || RISK_CONFIG.low;
  const Icon = config.icon;

  return (
    <div>
      <span className={config.className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '100px' }}>
        <Icon size={13} />
        {config.label}
      </span>

      {/* Risk bar */}
      <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <TrendingUp size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <div style={{
          flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)',
          borderRadius: '100px', overflow: 'hidden',
        }}>
          <div style={{
            width: config.barWidth,
            height: '100%',
            background: config.barColor,
            borderRadius: '100px',
            transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: `0 0 8px ${config.barColor}`,
          }} />
        </div>
      </div>
    </div>
  );
}
