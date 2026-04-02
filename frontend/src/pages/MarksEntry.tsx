import { useEffect, useState } from 'react';
import { ClipboardList, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { Student, Exam, MarkWithDetails, MarkEntry } from '../types';

type MarksMap = Record<string, string>;

export default function MarksEntry() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [marks, setMarks] = useState<MarksMap>({});
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    api.get<Student[]>('/students').then(r => setStudents(r.data)).catch(console.error);
    api.get<Exam[]>('/exams').then(r => setExams(r.data)).catch(console.error);
  }, []);

  const selectedStudent_ = students.find(s => s.id === parseInt(selectedStudent));
  const filteredExams = selectedStudent_
    ? exams.filter(e => e.class === selectedStudent_.class)
    : [];

  const currentExam = exams.find(e => e.id === parseInt(selectedExam));
  const subjectNames: string[] = currentExam?.subjects
    ? currentExam.subjects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (!selectedStudent || !selectedExam || subjectNames.length === 0) return;
    api.get<MarkWithDetails[]>(`/marks/student/${selectedStudent}`)
      .then(r => {
        const existing: MarksMap = {};
        r.data.forEach(m => {
          if (m.exam_id === parseInt(selectedExam)) {
            existing[m.subject_name] = String(m.marks_obtained);
          }
        });
        setMarks(existing);
      })
      .catch(console.error);
  }, [selectedStudent, selectedExam]);

  const handleStudentChange = (val: string): void => {
    setSelectedStudent(val);
    setSelectedExam('');
    setMarks({});
  };

  const handleExamChange = (val: string): void => {
    setSelectedExam(val);
    setMarks({});
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedStudent || !selectedExam || !currentExam) {
      toast.error('Please select a student and exam');
      return;
    }
    const marksArray: MarkEntry[] = subjectNames.map(name => ({
      subject_name: name,
      marks_obtained: parseInt(marks[name] ?? '0'),
    }));
    const invalid = marksArray.some(
      m => m.marks_obtained < 0 || m.marks_obtained > currentExam.max_marks
    );
    if (invalid) {
      toast.error(`Marks must be between 0 and ${currentExam.max_marks}`);
      return;
    }
    setSaving(true);
    try {
      await api.post('/marks/bulk', {
        student_id: parseInt(selectedStudent),
        exam_id: parseInt(selectedExam),
        marks: marksArray,
      });
      toast.success('Marks saved successfully');
    } catch {
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const getPercentage = (obtained: string, max: number): number | null => {
    if (obtained === '') return null;
    return Math.round((parseInt(obtained) / max) * 100);
  };

  const getBadge = (pct: number | null): JSX.Element | null => {
    if (pct === null) return null;
    if (pct < 40) return <span className="badge-weak">Weak</span>;
    if (pct < 70) return <span className="badge-ok">Average</span>;
    return <span className="badge-good">Good</span>;
  };

  const showTable = selectedStudent && selectedExam && subjectNames.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-header">Marks Entry</h1>
        <p className="text-slate-500 text-sm mt-1">Enter subject-wise marks for each student and exam</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Select Student *</label>
            <select
              className="input"
              value={selectedStudent}
              onChange={e => handleStudentChange(e.target.value)}
            >
              <option value="">— Choose a student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Roll: {s.roll_number} · Class {s.class})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Select Exam *</label>
            <select
              className="input"
              value={selectedExam}
              onChange={e => handleExamChange(e.target.value)}
              disabled={!selectedStudent || filteredExams.length === 0}
            >
              <option value="">— Choose an exam —</option>
              {filteredExams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name}{e.exam_date
                    ? ` (${new Date(e.exam_date).toLocaleDateString('en-IN')})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedStudent && filteredExams.length === 0 && (
          <p className="text-xs text-amber-600 mt-3">
            No exams found for Class {selectedStudent_?.class}. Create one in the Examinations page first.
          </p>
        )}

        {selectedExam && subjectNames.length === 0 && (
          <p className="text-xs text-amber-600 mt-3">
            This exam has no subjects defined. Edit it in the Examinations page to add subjects.
          </p>
        )}
      </div>

      {showTable && currentExam && (
        <div className="card overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Subject Marks</h2>
              <span className="text-xs text-slate-400">— {currentExam.name}</span>
            </div>
            <span className="text-xs text-slate-400">
              {subjectNames.length} subjects · Max {currentExam.max_marks} marks each
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Max Marks</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Marks Obtained</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Percentage</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {subjectNames.map(subject => {
                const val = marks[subject] ?? '';
                const pct = getPercentage(val, currentExam.max_marks);
                return (
                  <tr key={subject} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">{subject}</td>
                    <td className="px-6 py-3 text-slate-500">{currentExam.max_marks}</td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min={0}
                        max={currentExam.max_marks}
                        className="input w-28 text-center"
                        placeholder="0"
                        value={val}
                        onChange={e => setMarks({ ...marks, [subject]: e.target.value })}
                      />
                    </td>
                    <td className="px-6 py-3">
                      {pct !== null && (
                        <div className="flex items-center gap-2">
                          <div
                            style={{ width: '96px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                borderRadius: '9999px',
                                backgroundColor: pct < 40 ? '#f87171' : pct < 70 ? '#fbbf24' : '#4ade80',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#475569' }}>{pct}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">{getBadge(pct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-surface-200 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save size={14} />
              {saving ? 'Saving...' : 'Save All Marks'}
            </button>
          </div>
        </div>
      )}

      {!selectedStudent && (
        <div className="card p-12 text-center">
          <div
            style={{
              width: '48px', height: '48px', backgroundColor: '#f1f5f9',
              borderRadius: '1rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 0.75rem',
            }}
          >
            <ClipboardList size={20} color="#94a3b8" />
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Select a student to begin entering marks.
          </p>
        </div>
      )}

      {selectedStudent && !selectedExam && filteredExams.length > 0 && (
        <div className="card p-12 text-center">
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Please select an exam to enter marks.
          </p>
        </div>
      )}
    </div>
  );
}