import { Shield, Cpu, Scan } from 'lucide-react';

export default function LoadingAnalysis() {
  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center gap-5"
      style={{ minHeight: '300px', textAlign: 'center' }}>

      {/* Animated rings */}
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        {/* Outer pulse ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(0,212,255,0.2)',
          animation: 'spin 3s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '8px', borderRadius: '50%',
          border: '2px solid transparent',
          borderTop: '2px solid var(--neon-blue)',
          borderRight: '2px solid rgba(0,212,255,0.3)',
          animation: 'spin 1.5s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '20px', borderRadius: '50%',
          border: '2px solid transparent',
          borderBottom: '2px solid var(--neon-purple)',
          animation: 'spin 2s linear infinite reverse',
        }} />
        {/* Center icon */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={22} style={{ color: 'var(--neon-blue)', animation: 'blink 1.5s ease-in-out infinite' }} />
        </div>
      </div>

      <div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem' }}>
          Analyzing Message
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Running AI fraud detection engine...
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '280px' }}>
        {[
          { icon: Cpu, label: 'Scanning keywords & patterns' },
          { icon: Scan, label: 'Analyzing URL structures' },
          { icon: Shield, label: 'Calculating risk score' },
        ].map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex items-center gap-3"
            style={{
              padding: '0.5rem 0.75rem', borderRadius: '8px',
              background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)',
              animation: `fadeIn 0.5s ease ${i * 0.2}s both`,
            }}>
            <Icon size={13} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
            <div className="animate-blink" style={{
              marginLeft: 'auto', width: '6px', height: '6px',
              borderRadius: '50%', background: 'var(--neon-green)',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
