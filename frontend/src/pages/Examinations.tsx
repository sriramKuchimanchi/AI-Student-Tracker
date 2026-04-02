import { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { Exam, ClassWithSections } from '../types';

interface ExamForm {
  name: string;
  class: string;
  section: string;
  exam_date: string;
  subjects: string;
  max_marks: string;
}

const emptyForm: ExamForm = {
  name: '',
  class: '',
  section: '',
  exam_date: '',
  subjects: '',
  max_marks: '100',
};

export default function Examinations() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchExams = (): void => {
    api.get<Exam[]>('/exams').then(r => setExams(r.data)).catch(console.error);
  };

  useEffect(() => {
    fetchExams();
    api.get<ClassWithSections[]>('/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  const selectedClass = classes.find(c => c.name === form.class);

  const handleSubmit = async (): Promise<void> => {
    if (!form.name.trim() || !form.class) {
      toast.error('Exam name and class are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/exams', {
        name: form.name.trim(),
        class: form.class,
        section: form.section || null,
        exam_date: form.exam_date || null,
        subjects: form.subjects.trim(),
        max_marks: parseInt(form.max_marks) || 100,
      });
      toast.success('Examination created');
      setForm(emptyForm);
      setShowForm(false);
      fetchExams();
    } catch {
      toast.error('Could not create examination');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string): Promise<void> => {
    if (!window.confirm(`Delete "${name}"? All marks for this exam will also be removed.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Examination deleted');
      fetchExams();
    } catch {
      toast.error('Could not delete examination');
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const subjectList = (subjects: string): string[] =>
    subjects ? subjects.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-header">Examinations</h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage examinations for your classes</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus size={14} /> Create Exam
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-5">New Examination</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Exam Name *</label>
              <input
                className="input"
                placeholder="e.g., Final Examination"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.exam_date}
                onChange={e => setForm({ ...form, exam_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Class *</label>
              <select
                className="input"
                value={form.class}
                onChange={e => setForm({ ...form, class: e.target.value, section: '' })}
              >
                <option value="">Select class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select
                className="input"
                value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value })}
                disabled={!form.class || !selectedClass || selectedClass.sections.length === 0}
              >
                <option value="">All sections</option>
                {selectedClass?.sections.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Max Marks per Subject</label>
              <input
                type="number"
                className="input"
                min={1}
                value={form.max_marks}
                onChange={e => setForm({ ...form, max_marks: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Subjects (comma-separated)</label>
              <input
                className="input"
                placeholder="Mathematics, Science, English"
                value={form.subjects}
                onChange={e => setForm({ ...form, subjects: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Examination'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-2">
          <BookOpen size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800">All Examinations</h2>
          <span className="ml-auto text-xs text-slate-400">{exams.length} total</span>
        </div>

        {exams.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen size={20} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No examinations yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Exam Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Class</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subjects</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Max Marks</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {exams.map(exam => (
                <tr key={exam.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{exam.name}</td>
                  <td className="px-6 py-3 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(exam.exam_date)}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{exam.class}</td>
                  <td className="px-6 py-3 text-slate-500">{exam.section || 'All'}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {subjectList(exam.subjects).length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        subjectList(exam.subjects).map(s => (
                          <span key={s} className="bg-brand-50 text-brand-600 text-xs px-2 py-0.5 rounded-full font-medium">
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{exam.max_marks}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(exam.id, exam.name)}
                      className="btn-danger py-1.5 px-2.5 text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}