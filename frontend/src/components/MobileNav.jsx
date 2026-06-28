import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Scan' },
  { to: '/history', icon: History, label: 'History' },
];

export default function MobileNav() {
  const { logout } = useAuth();

  return (
    <nav className="mobile-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}>
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button 
        onClick={logout}
        className="mobile-nav-item" 
        style={{ background: 'none', border: 'none' }}
      >
        <LogOut size={18} />
        <span>Exit</span>
      </button>
    </nav>
  );
}
