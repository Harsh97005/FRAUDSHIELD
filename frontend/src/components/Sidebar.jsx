import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, History, LogOut, Vault, Settings, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history', icon: History, label: 'Scan History' },
  { to: '/history', icon: Vault, label: 'Security Vault', disabled: true },
  { to: '/history', icon: Settings, label: 'Settings', disabled: true },
];

const RECENT_SCANS = [
  { label: 'Urgent Bank...', preview: '"Your account is locked. Please..."', time: '2m ago', fraud: true },
  { label: 'Crypto Gift...', preview: '"Claim your free 0.5 BTC now..."', time: '1h ago', fraud: true },
  { label: 'Meeting Req...', preview: '"Re: Upcoming project sync..."', time: '6h ago', fraud: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Signed out');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="sidebar">
      {/* Logo — click to go home */}
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo" style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
          onMouseOut={e  => e.currentTarget.style.opacity = '1'}>
          <div className="sidebar-logo-icon">
            <Shield size={15} color="var(--accent)" strokeWidth={2.5} />
          </div>
          <span className="sidebar-logo-text">
            FRAUD<span style={{ color: 'var(--accent)' }}>SHIELD</span>
          </span>
        </div>
      </NavLink>

      {/* Nav */}
      <div>
        <div className="sidebar-section-label">Security Engine</div>
        {navItems.map(({ to, icon: Icon, label, disabled }) => (
          <NavLink key={label} to={disabled ? '#' : to}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={({ isActive }) =>
              `sidebar-link${isActive && !disabled ? ' active' : ''}${disabled ? ' opacity-40' : ''}`
            }
            style={{ textDecoration: 'none' }}>
            <Icon size={14} className="sidebar-link-icon" style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Recent Scans */}
      <div style={{ marginTop: '1.25rem', flex: 1, overflow: 'hidden' }}>
        <div className="sidebar-section-label">Recent Scans</div>
        {RECENT_SCANS.map((scan, i) => (
          <div key={i} className="recent-scan-item">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                {scan.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={9} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{scan.time}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scan.preview}
            </p>
          </div>
        ))}
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--teal-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#080c08', flexShrink: 0,
        }}>
          {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName || user?.email?.split('@')[0] || 'Admin_User'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
            <div className="animate-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              System Active
            </span>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', transition: 'color 0.15s ease' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
