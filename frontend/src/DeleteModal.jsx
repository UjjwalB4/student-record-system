import { AlertTriangle, Loader2, X } from 'lucide-react';

export default function DeleteModal({ student, onClose, onConfirm, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 32, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Student</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>
          Are you sure you want to delete <strong style={{ color: '#fff' }}>{student?.name}</strong>?
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontWeight: 500, fontSize: 14
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            padding: '10px 24px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600,
            fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
          }}>
            {loading && <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />}
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
