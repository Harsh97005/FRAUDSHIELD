import { useState } from 'react';
import { Send, Trash2, MessageSquare, Smartphone, Mail } from 'lucide-react';

const MESSAGE_TYPES = [
  { id: 'sms', label: 'SMS', icon: Smartphone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'email', label: 'Email', icon: Mail },
];

const EXAMPLE_MESSAGES = {
  fraud: `URGENT: Your bank account has been suspended! Click here to verify your identity immediately: http://bit.ly/verify-now. Enter your OTP to reactivate. Do not ignore this message or your account will be closed within 24 hours. Call us now: +1-800-FAKE-BANK`,
  safe: `Hi! Your Amazon order #123-456789 has been shipped. Your package is expected to arrive on Tuesday, July 2nd. Track your shipment at amazon.com/orders. Thank you for your purchase!`,
};

export default function MessageInput({ onAnalyze, loading }) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('sms');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim().length < 5) return;
    onAnalyze(message, messageType);
  };

  const loadExample = (type) => {
    setMessage(EXAMPLE_MESSAGES[type]);
  };

  return (
    <div className="glass-card p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <MessageSquare size={16} style={{ color: 'var(--neon-blue)' }} />
        </div>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>
            Analyze Message
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Paste any suspicious message below
          </p>
        </div>
      </div>

      {/* Message Type Selector */}
      <div className="flex gap-2 mb-4">
        {MESSAGE_TYPES.map(({ id, label, icon: Icon }) => (
          <button key={id}
            onClick={() => setMessageType(id)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: messageType === id ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
              background: messageType === id ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: messageType === id ? 'var(--neon-blue)' : 'var(--text-muted)',
            }}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <textarea
            className="textarea-field"
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Paste your ${messageType} message here...\n\nExample: "Your bank account has been suspended! Click here to verify..."`}
            disabled={loading}
          />
          {message && (
            <button type="button"
              onClick={() => setMessage('')}
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px', padding: '0.3rem', cursor: 'pointer',
                color: 'var(--text-muted)', transition: 'all 0.2s ease',
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--neon-red)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {message.length} / 5000 characters
        </div>

        {/* Example loaders */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try example:</span>
          <button type="button" onClick={() => loadExample('fraud')}
            className="badge-fraud" style={{ cursor: 'pointer', fontSize: '0.7rem' }}>
            Scam Message
          </button>
          <button type="button" onClick={() => loadExample('safe')}
            className="badge-safe" style={{ cursor: 'pointer', fontSize: '0.7rem' }}>
            Safe Message
          </button>
        </div>

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={loading || message.trim().length < 5}
          style={{
            opacity: (loading || message.trim().length < 5) ? 0.5 : 1,
            cursor: (loading || message.trim().length < 5) ? 'not-allowed' : 'pointer',
          }}>
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin-slow"
                style={{ borderTopColor: '#fff', borderRightColor: 'rgba(255,255,255,0.3)' }} />
              Analyzing...
            </>
          ) : (
            <>
              <Send size={17} />
              Analyze Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
