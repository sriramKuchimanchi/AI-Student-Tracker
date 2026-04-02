import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, BarChart3, FileText, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { Student, ClassWithSections } from '../types';

type StudentForm = Omit<Student, 'id' | 'created_at'>;

const emptyForm: StudentForm = {
  name: '',
  roll_number: '',
  class: '',
  section: '',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchStudents = (): void => {
    api.get<Student[]>('/students').then(r => setStudents(r.data)).catch(console.error);
  };

  useEffect(() => {
    fetchStudents();
    api.get<ClassWithSections[]>('/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  const selectedClassObj = classes.find(c => c.name === form.class);
  const availableSections = selectedClassObj?.sections ?? [];

  const openAdd = (): void => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s: Student): void => {
    setForm({
      name: s.name,
      roll_number: s.roll_number,
      class: s.class,
      section: s.section,
      parent_name: s.parent_name,
      parent_email: s.parent_email,
      parent_phone: s.parent_phone,
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleClassChange = (className: string): void => {
    setForm(prev => ({ ...prev, class: className, section: '' }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.name || !form.roll_number || !form.class) {
      toast.error('Name, roll number and class are required');
      return;
    }
    setLoading(true);
    try {
      if (editingId !== null) {
        await api.put(`/students/${editingId}`, form);
        toast.success('Student updated');
      } else {
        await api.post('/students', form);
        toast.success('Student added');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string): Promise<void> => {
    if (!window.confirm(`Delete ${name}? This will remove all their marks too.`)) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Could not delete student');
    }
  };

  const filtered = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-header">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage student profiles and parent information</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={14} /> Add Student
        </button>
      </div>

      <div className="card mb-4">
        <div className="p-4 flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll No</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Class</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parent</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  {search ? 'No students match your search.' : 'No students added yet.'}
                </td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-brand-600 text-xs font-bold">{s.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{s.roll_number}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {s.class}{s.section && ` — ${s.section}`}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{s.parent_name || '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/performance/${s.id}`)}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                      >
                        <BarChart3 size={12} /> Analysis
                      </button>
                      <button
                        onClick={() => navigate(`/report/${s.id}`)}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                      >
                        <FileText size={12} /> Report
                      </button>
                      <button onClick={() => openEdit(s)} className="btn-secondary py-1.5 px-2.5 text-xs">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="btn-danger py-1.5 px-2.5 text-xs"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 50, padding: '1rem',
          }}
        >
          <div style={{
            backgroundColor: '#fff', borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            width: '100%', maxWidth: '32rem',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                {editingId !== null ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                  background: 'transparent', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#64748b',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Student Details
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Ravi Kumar"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Roll Number *</label>
                  <input
                    className="input"
                    placeholder="e.g. 2024001"
                    value={form.roll_number}
                    onChange={e => setForm({ ...form, roll_number: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Class *</label>
                  {classes.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                      No classes found. Add classes in the Classes &amp; Sections page first.
                    </p>
                  ) : (
                    <select
                      className="input"
                      value={form.class}
                      onChange={e => handleClassChange(e.target.value)}
                    >
                      <option value="">Select class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="label">Section</label>
                  <select
                    className="input"
                    value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })}
                    disabled={!form.class || availableSections.length === 0}
                  >
                    <option value="">
                      {!form.class
                        ? 'Select class first'
                        : availableSections.length === 0
                        ? 'No sections available'
                        : 'Select section'}
                    </option>
                    {availableSections.map(sec => (
                      <option key={sec.id} value={sec.name}>{sec.name}</option>
                    ))}
                  </select>
                  {form.class && availableSections.length === 0 && (
                    <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                      Add sections to {form.class} in Classes &amp; Sections.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Parent / Guardian Details
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="label">Parent Name</label>
                    <input
                      className="input"
                      placeholder="e.g. Suresh Kumar"
                      value={form.parent_name}
                      onChange={e => setForm({ ...form, parent_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      className="input"
                      placeholder="e.g. 9876543210"
                      value={form.parent_phone}
                      onChange={e => setForm({ ...form, parent_phone: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="e.g. parent@email.com"
                      value={form.parent_email}
                      onChange={e => setForm({ ...form, parent_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
            }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : editingId !== null ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}