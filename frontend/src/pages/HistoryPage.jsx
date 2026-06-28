import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, limit } from 'firebase/firestore';
import { db, isConfigured } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import HistoryCard from '../components/HistoryCard';
import { History, RefreshCw, Trash2, ShieldAlert, ShieldCheck, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_HISTORY = [
  {
    id: 'mock-1', message: 'URGENT: Your Wells Fargo account has been flagged for suspicious activity. To avoid permanent suspension, click immediately to verify your identity: https://bit.ly/secure-wf-verify-492. Do not share this OTP with anyone.',
    result: 'FRAUD', score: 92, risk: 'high', messageType: 'sms',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'mock-2', message: 'Hi! Your Amazon order #112-4891234 has been shipped. Expected delivery: Tuesday, July 2. Track your package at amazon.com/orders.',
    result: 'SAFE', score: 8, risk: 'low', messageType: 'email',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'mock-3', message: 'Congratulations! You\'ve won a $500 gift card. Claim your prize now at free-prize.xyz/claim before it expires in 24 hours!',
    result: 'FRAUD', score: 76, risk: 'high', messageType: 'whatsapp',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 'mock-4', message: 'Your OTP is 847291. Valid for 10 minutes. Do NOT share this with anyone. This was requested for your account login.',
    result: 'SAFE', score: 22, risk: 'low', messageType: 'sms',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchScans = async () => {
    setLoading(true);
    if (!isConfigured || !db || user?.isDemo) {
      await new Promise((r) => setTimeout(r, 600));
      setScans(MOCK_HISTORY);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'scans'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setScans(data);
    } catch (err) {
      console.error('Fetch scans error:', err);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [user]);

  const handleDelete = async (id) => {
    if (user?.isDemo) {
      setScans((s) => s.filter((i) => i.id !== id));
      toast.success('Removed from history');
      return;
    }
    try {
      await deleteDoc(doc(db, 'scans', id));
      setScans((s) => s.filter((i) => i.id !== id));
      toast.success('Scan deleted');
    } catch {
      toast.error('Failed to delete scan');
    }
  };

  const filteredScans = scans
    .filter((s) => filter === 'all' || s.result?.toLowerCase() === filter)
    .filter((s) => !search || s.message?.toLowerCase().includes(search.toLowerCase()));

  const fraudCount = scans.filter((s) => s.result === 'FRAUD').length;
  const safeCount = scans.filter((s) => s.result === 'SAFE').length;

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileNav />

      <main className="main-content" style={{ marginTop: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="panel-label" style={{ marginBottom: '0.25rem' }}>
              <History size={12} /> Scan Database
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              Analysis History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
              Showing {filteredScans.length} of {scans.length} historical scans
            </p>
          </div>
          <button className="btn-secondary" onClick={fetchScans}>
            <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} /> Refresh Database
          </button>
        </div>

        {/* Filters & Search */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'fraud', 'safe'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    transition: 'all 0.15s ease',
                    background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                    color: filter === f ? '#080c08' : 'var(--text-muted)',
                  }}
                >
                  {f === 'all' ? 'ALL' : f === 'fraud' ? `FRAUD (${fraudCount})` : `SAFE (${safeCount})`}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '2.25rem', paddingRight: '1rem', fontSize: '0.82rem', height: '32px' }}
                placeholder="Search scans by text patterns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Scanning List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '8px' }} />
            ))}
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <History size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No matches found
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Try adjusting your query or filter parameters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredScans.map((item, i) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <HistoryCard item={item} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
