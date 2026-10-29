import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, Cloud, Settings, Menu, X,
  Search, Plus, Edit2, Trash2, ChevronDown, RefreshCw, Loader2,
  Database, Server, Activity, TrendingUp, BookOpen, UserCheck, Filter
} from 'lucide-react';
import { getStudents, addStudent, updateStudent, deleteStudent, getStats, getStatus } from './api';
import StudentModal from './StudentModal';
import DeleteModal from './DeleteModal';
import { useToast, ToastContainer } from './Toast';

const ALL_COURSES = [
  'All Courses','Computer Science','Information Technology','Electronics Engineering',
  'Mechanical Engineering','Civil Engineering','Business Administration',
  'Data Science','Artificial Intelligence','Cybersecurity','Cloud Computing'
];

// ── Avatar colour map ─────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#7c3aed','#0891b2','#059669','#d97706','#db2777','#2563eb'];
function avatarColor(name) { let h = 0; for (const c of name) h = (h*31 + c.charCodeAt(0)) % AVATAR_COLORS.length; return AVATAR_COLORS[h]; }
function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2); }
function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }

export default function App() {
  const [page, setPage] = useState('dashboard'); // dashboard | students
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [studRes, statRes, statusRes] = await Promise.all([
        getStudents(),
        getStats(),
        getStatus(),
      ]);
      setStudents(studRes.data.students || []);
      setStats(statRes.data);
      setStatus(statusRes.data);
    } catch (err) {
      addToast('Failed to load data from server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filtered students
  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchC = courseFilter === 'All Courses' || s.course === courseFilter;
    return matchQ && matchC;
  });

  const handleAdd = async (form) => {
    await addStudent(form);
    setAddOpen(false);
    addToast('Student registered successfully! 🎉', 'success');
    fetchAll();
  };

  const handleEdit = async (form) => {
    await updateStudent(editTarget.id, form);
    setEditTarget(null);
    addToast('Student updated successfully!', 'success');
    fetchAll();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      setDeleteTarget(null);
      addToast('Student deleted.', 'success');
      fetchAll();
    } catch {
      addToast('Failed to delete student.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--navy)' }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} page={page} setPage={setPage} onClose={() => setSidebarOpen(false)} status={status} />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topnav */}
        <TopNav onMenuClick={() => setSidebarOpen(o => !o)} page={page} onRefresh={fetchAll} loading={loading} />

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {page === 'dashboard' && (
            <DashboardPage stats={stats} students={students} loading={loading}
              onAddStudent={() => setAddOpen(true)}
              onViewAll={() => setPage('students')} />
          )}
          {page === 'students' && (
            <StudentsPage
              students={filtered} loading={loading}
              search={search} setSearch={setSearch}
              courseFilter={courseFilter} setCourseFilter={setCourseFilter}
              onAdd={() => setAddOpen(true)}
              onEdit={s => setEditTarget(s)}
              onDelete={s => setDeleteTarget(s)}
            />
          )}
          {page === 'cloud' && <CloudPage status={status} />}
        </main>
      </div>

      {/* Modals */}
      {addOpen && <StudentModal onClose={() => setAddOpen(false)} onSave={handleAdd} />}
      {editTarget && <StudentModal student={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}
      {deleteTarget && <DeleteModal student={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ open, page, setPage, onClose, status }) {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'students',  icon: <Users size={18} />,           label: 'Students' },
    { id: 'cloud',     icon: <Cloud size={18} />,           label: 'Cloud & AWS' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40,
          display: 'block'
        }} />
      )}
      <aside style={{
        width: 260,
        background: 'linear-gradient(180deg, #12152a 0%, #0f172a 100%)',
        borderRight: '1px solid rgba(148,163,184,0.08)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        top: 0, left: 0, height: '100vh',
        transform: window.innerWidth < 768 ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s ease',
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <img src="/assets/logo.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display='none'; }} />
              <GraduationCap size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>CampusCloud</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Smart Student Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Menu</div>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); onClose(); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, marginBottom: 4, border: 'none', cursor: 'pointer',
              background: page === item.id ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(109,40,217,0.15))' : 'transparent',
              color: page === item.id ? '#c4b5fd' : '#64748b',
              fontWeight: page === item.id ? 600 : 400, fontSize: 14, textAlign: 'left',
              borderLeft: page === item.id ? '2px solid #7c3aed' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mode badge */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
          <div className={`badge ${status?.db_mode === 'aws' && status?.aws_connected ? 'badge-green' : 'badge-amber'}`}
            style={{ width: '100%', justifyContent: 'center', padding: '8px 12px' }}>
            <Database size={11} style={{ marginRight: 5 }} />
            {status?.db_mode === 'aws' && status?.aws_connected ? 'AWS DynamoDB' : status?.db_mode === 'aws' ? 'AWS (disconnected)' : 'Local SQLite'}
          </div>
          <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 8 }}>CampusCloud v1.0.0</div>
        </div>
      </aside>
    </>
  );
}

// ── Top Navigation ────────────────────────────────────────────────────────────
function TopNav({ onMenuClick, page, onRefresh, loading }) {
  const pageTitle = { dashboard: 'Dashboard', students: 'Student Records', cloud: 'Cloud & AWS Architecture' };
  return (
    <header style={{
      height: 64, flexShrink: 0,
      background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(148,163,184,0.08)',
      display: 'flex', alignItems: 'center', paddingInline: 20, gap: 16,
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 8 }}>
        <Menu size={20} />
      </button>
      <h1 style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#fff' }}>{pageTitle[page]}</h1>
      <button onClick={onRefresh} disabled={loading} style={{
        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 8, padding: '7px 14px', color: '#c4b5fd', cursor: 'pointer',
        fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
      }}>
        <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        Refresh
      </button>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700
      }}>A</div>
    </header>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
function DashboardPage({ stats, students, loading, onAddStudent, onViewAll }) {
  const statCards = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: <Users size={20} />, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)' },
    { label: 'Active Courses', value: stats?.total_courses ?? 0,  icon: <BookOpen size={20} />, color: '#0891b2', bg: 'rgba(8,145,178,0.1)', border: 'rgba(8,145,178,0.2)' },
    { label: 'Registrations', value: stats?.total_students ?? 0,  icon: <UserCheck size={20} />, color: '#059669', bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.2)' },
    { label: 'Cloud Status',  value: loading ? '—' : 'Active',    icon: <Activity size={20} />, color: '#d97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.2)' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <HeroSection onAddStudent={onAddStudent} />

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((c, i) => (
          <div key={i} className="glass-card" style={{ padding: 20, border: `1px solid ${c.border}`, transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.label}</div>
              <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: 8, color: c.color }}>{c.icon}</div>
            </div>
            {loading ? <div className="spinner" /> : (
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Registrations</h2>
          <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>View All →</button>
        </div>
        {loading ? <LoadingRows /> : students.length === 0 ? <EmptyState onAdd={onAddStudent} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {students.slice(0,5).map(s => (
              <StudentRow key={s.id} student={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection({ onAddStudent }) {
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 28, position: 'relative', minHeight: 200 }}>
      <img src="/assets/campus_hero.png" alt="University Campus"
        style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
        onError={e => { e.target.style.display = 'none'; }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(88,28,235,0.55) 100%)',
        display: 'flex', alignItems: 'center', padding: '32px 36px', gap: 24
      }}>
        <div style={{ flex: 1 }}>
          <div className="badge badge-violet" style={{ marginBottom: 14, display: 'inline-flex' }}>
            <TrendingUp size={10} style={{ marginRight: 5 }} />
            Cloud-Powered Education
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
            <span className="gradient-text">Your Campus. Connected.</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 420, lineHeight: 1.6, marginBottom: 20 }}>
            Manage student records, track enrollments, and harness AWS cloud infrastructure — all from one modern portal.
          </p>
          <button onClick={onAddStudent} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14
          }}>
            <Plus size={16} /> Register Student
          </button>
        </div>
        <img src="/assets/cloud_infra.png" alt="Cloud infrastructure"
          style={{ width: 160, height: 140, objectFit: 'contain', opacity: 0.85, flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none'; }} />
      </div>
    </div>
  );
}

// ── Students Page ─────────────────────────────────────────────────────────────
function StudentsPage({ students, loading, search, setSearch, courseFilter, setCourseFilter, onAdd, onEdit, onDelete }) {
  const [showCourseFilter, setShowCourseFilter] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or email…"
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#fff', fontSize: 14, outline: 'none'
            }} />
        </div>
        {/* Course filter */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowCourseFilter(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', background: 'rgba(30,41,59,0.8)',
            border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10, color: '#94a3b8',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap'
          }}>
            <Filter size={14} />
            {courseFilter}
            <ChevronDown size={14} />
          </button>
          {showCourseFilter && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 100, width: 220,
              background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10,
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)', overflow: 'hidden'
            }}>
              {['All Courses','Computer Science','Information Technology','Electronics Engineering','Mechanical Engineering',
                'Business Administration','Data Science','Artificial Intelligence','Cybersecurity','Cloud Computing'].map(c => (
                <button key={c} onClick={() => { setCourseFilter(c); setShowCourseFilter(false); }} style={{
                  display: 'block', width: '100%', padding: '10px 16px', background: 'none',
                  border: 'none', color: courseFilter === c ? '#c4b5fd' : '#94a3b8',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  fontWeight: courseFilter === c ? 600 : 400,
                  background: courseFilter === c ? 'rgba(124,58,237,0.1)' : 'transparent'
                }}>{c}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onAdd} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10,
          color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap'
        }}>
          <Plus size={15} /> Add Student
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                {['Student','Student ID','Email','Course','Registered','Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center' }}><LoadingRows /></td></tr>}
              {!loading && students.length === 0 && (
                <tr><td colSpan={6}><EmptyState onAdd={onAdd} /></td></tr>
              )}
              {!loading && students.map((s, i) => (
                <tr key={s.id} className="animate-fade-in" style={{
                  borderBottom: '1px solid rgba(148,163,184,0.06)',
                  transition: 'background 0.15s',
                  animationDelay: `${i * 0.04}s`
                }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(124,58,237,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {/* Name + avatar */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: `${avatarColor(s.name)}22`, border: `2px solid ${avatarColor(s.name)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: avatarColor(s.name)
                      }}>{initials(s.name)}</div>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-violet">{s.student_id}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 13 }}>{s.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-blue">{s.course}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 12 }}>{formatDate(s.created_at)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionBtn onClick={() => onEdit(s)} color="#7c3aed" icon={<Edit2 size={13} />} />
                      <ActionBtn onClick={() => onDelete(s)} color="#ef4444" icon={<Trash2 size={13} />} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(148,163,184,0.06)', fontSize: 12, color: '#475569' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cloud Page ────────────────────────────────────────────────────────────────
function CloudPage({ status }) {
  const awsItems = [
    { label: 'EC2 Instance', desc: 'Flask + Gunicorn on Ubuntu', icon: <Server size={18} />, color: '#f59e0b' },
    { label: 'DynamoDB', desc: 'Serverless NoSQL student store', icon: <Database size={18} />, color: '#38bdf8' },
    { label: 'CloudWatch', desc: 'CPU utilisation monitoring', icon: <Activity size={18} />, color: '#34d399' },
    { label: 'Auto Scaling', desc: 'Target-tracking CPU policy', icon: <TrendingUp size={18} />, color: '#c4b5fd' },
  ];
  return (
    <div className="animate-fade-in">
      {/* Header image */}
      <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
        <img src="/assets/cloud_infra.png" alt="Cloud infrastructure"
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', opacity: 0.8 }}
          onError={e => { e.target.style.display = 'none'; }} />
        <div style={{
          position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(49,46,129,0.7))',
          display: 'flex', alignItems: 'center', padding: '28px 36px'
        }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>AWS Cloud Architecture</h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>CampusCloud is deployed on Amazon Web Services with auto-scaling and monitoring built-in.</p>
          </div>
        </div>
      </div>

      {/* Current mode */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: status?.db_mode === 'aws' && status?.aws_connected ? '#10b981' : '#f59e0b',
          boxShadow: `0 0 0 4px ${status?.db_mode === 'aws' && status?.aws_connected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
        }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {status?.db_mode === 'aws' && status?.aws_connected ? 'Running on AWS DynamoDB' : status?.db_mode === 'aws' ? 'AWS Mode — DynamoDB not reachable' : 'Running in Local Mode (SQLite)'}
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            {status?.db_mode === 'aws' ? 'Set DB_MODE=aws in .env and ensure DynamoDB table exists' : 'Set DB_MODE=aws and AWS credentials via IAM Role to enable cloud mode'}
          </div>
        </div>
      </div>

      {/* Architecture cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        {awsItems.map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: 20 }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform='none'}
            style={{ padding: 20, background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 16, transition: 'transform 0.2s' }}>
            <div style={{ color: item.color, marginBottom: 12 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.label}</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Deployment steps */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Deployment Guide</h3>
        {[
          { n: 1, title: 'Launch EC2 Instance', cmd: '# Choose Amazon Linux 2 or Ubuntu 22.04 t3.micro' },
          { n: 2, title: 'Clone & Install', cmd: 'pip install -r backend/requirements.txt' },
          { n: 3, title: 'Set DB_MODE=aws in /etc/environment', cmd: 'export DB_MODE=aws\nexport DYNAMO_TABLE=campus_students\nexport AWS_REGION=us-east-1' },
          { n: 4, title: 'Attach IAM Role with DynamoDB + CloudWatch permissions', cmd: '# AmazonDynamoDBFullAccess + CloudWatchAgentServerPolicy' },
          { n: 5, title: 'Run with Gunicorn + Nginx', cmd: 'gunicorn -w 4 -b 0.0.0.0:5000 app:app' },
        ].map(step => (
          <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>{step.n}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{step.title}</div>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#94a3b8', overflowX: 'auto' }}><code>{step.cmd}</code></pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StudentRow({ student }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${avatarColor(student.name)}22`, border: `2px solid ${avatarColor(student.name)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: avatarColor(student.name)
      }}>{initials(student.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{student.name}</div>
        <div style={{ color: '#64748b', fontSize: 12 }}>{student.email}</div>
      </div>
      <span className="badge badge-blue" style={{ flexShrink: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.course}</span>
      <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>{formatDate(student.created_at)}</span>
    </div>
  );
}

function ActionBtn({ onClick, color, icon }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}18`, border: `1px solid ${color}30`,
      borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color,
      display: 'flex', alignItems: 'center', transition: 'all 0.15s'
    }}
      onMouseEnter={e => { e.currentTarget.style.background=`${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background=`${color}18`; }}>
      {icon}
    </button>
  );
}

function LoadingRows() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(148,163,184,0.08)', animation: 'pulse-glow 1.5s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: '40%', borderRadius: 4, background: 'rgba(148,163,184,0.08)', marginBottom: 8 }} />
            <div style={{ height: 10, width: '60%', borderRadius: 4, background: 'rgba(148,163,184,0.05)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <img src="/assets/student_avatar.png" alt="No students"
        style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 16, opacity: 0.6 }}
        onError={e => { e.target.style.display='none'; }} />
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No students yet</div>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Add your first student to get started.</p>
      <button onClick={onAdd} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px',
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10,
        color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13
      }}><Plus size={14} /> Add First Student</button>
    </div>
  );
}
