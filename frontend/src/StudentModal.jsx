import { useState } from 'react';
import { X, User, Hash, Mail, BookOpen, Loader2 } from 'lucide-react';

const COURSES = [
  'Computer Science', 'Information Technology', 'Electronics Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Data Science', 'Artificial Intelligence', 'Cybersecurity', 'Cloud Computing'
];

const EMPTY_FORM = { name: '', student_id: '', email: '', course: '' };

export default function StudentModal({ student, onClose, onSave }) {
  const isEdit = Boolean(student);
  const [form, setForm] = useState(student ? {
    name: student.name, student_id: student.student_id,
    email: student.email, course: student.course
  } : EMPTY_FORM);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      await onSave(form);
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.error || 'Something went wrong.'];
      setErrors(msgs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 520, padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {isEdit ? 'Edit Student' : 'Register New Student'}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              {isEdit ? 'Update student information below' : 'Fill in the details to add a student'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(148,163,184,0.1)', border: 'none', borderRadius: 8,
            padding: 8, cursor: 'pointer', color: '#94a3b8', display: 'flex'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            {errors.map((e, i) => <p key={i} style={{ color: '#fca5a5', fontSize: 13 }}>• {e}</p>)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <Field icon={<User size={15} />} label="Full Name" name="name" type="text"
            placeholder="e.g. Priya Sharma" value={form.name} onChange={handleChange} />
          {/* Student ID */}
          <Field icon={<Hash size={15} />} label="Student ID" name="student_id" type="text"
            placeholder="e.g. CS2024001" value={form.student_id} onChange={handleChange} />
          {/* Email */}
          <Field icon={<Mail size={15} />} label="Email Address" name="email" type="email"
            placeholder="e.g. priya@university.edu" value={form.email} onChange={handleChange} />
          {/* Course */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={15} /> Course</span>
            </label>
            <select name="course" value={form.course} onChange={handleChange} required style={{
              width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10, color: '#fff',
              fontSize: 14, outline: 'none', cursor: 'pointer'
            }}>
              <option value="" disabled>Select a course…</option>
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontWeight: 500, fontSize: 14
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '10px 24px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600,
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
            }}>
              {saving && <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />}
              {saving ? 'Saving…' : (isEdit ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, label, name, type, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {label}</span>
      </label>
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} required style={{
        width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10, color: '#fff',
        fontSize: 14, outline: 'none',
      }} />
    </div>
  );
}
