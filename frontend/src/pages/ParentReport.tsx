import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../api';
import { ParentReport as ParentReportType, PerformanceRow } from '../types';

const getSubjectGrade = (pct: number): string => {
  if (pct >= 85) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 55) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
};

const gradeColor = (grade: string): string => {
  if (grade === 'A+' || grade === 'A') return '#16a34a';
  if (grade === 'B') return '#2563eb';
  if (grade === 'C') return '#d97706';
  return '#dc2626';
};

const pctBarColor = (pct: number): string => {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
};

export default function ParentReport() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ParentReportType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!studentId) return;
    api.get<ParentReportType>(`/reports/parent/${studentId}`)
      .then(r => setReport(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!report) {
    return <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '5rem' }}>Report not found</p>;
  }

  const { student, performance, summary } = report;
  const exams = [...new Set(report.marks.map(m => m.exam_name))];
  const overallGrade = summary.grade;
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="print:hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(`/performance/${studentId}`)} className="btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-header">Parent Progress Report</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.125rem' }}>Shareable progress summary for parents / guardians</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div id="report" style={{ maxWidth: '720px', margin: '0 auto', background: '#fff', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3d74f5 100%)', padding: '2rem 2.5rem', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>EduTrack</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.2rem' }}>AI Student Progress Tracker</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress Report</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.2rem' }}>{date}</p>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.65rem', opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</p>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginTop: '0.2rem' }}>{student.name}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '0.2rem' }}>
                Roll No: {student.roll_number} &nbsp;·&nbsp; {student.class}{student.section ? ` — ${student.section}` : ''}
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '1rem 1.5rem', textAlign: 'center', backdropFilter: 'blur(8px)',
            }}>
              <p style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall Grade</p>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '2.5rem', lineHeight: 1, marginTop: '0.3rem',
                color: overallGrade === 'F' ? '#fca5a5' : overallGrade === 'C' ? '#fde68a' : '#bbf7d0' }}>
                {overallGrade}
              </p>
              <p style={{ fontSize: '0.7rem', opacity: 0.65, marginTop: '0.3rem' }}>{summary.total_average}% avg</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem 2.5rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Student Information
              </p>
              {[
                { label: 'Full Name', value: student.name },
                { label: 'Roll Number', value: student.roll_number },
                { label: 'Class', value: `${student.class}${student.section ? ` — ${student.section}` : ''}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                Parent / Guardian
              </p>
              {[
                { label: 'Name', value: student.parent_name || '—' },
                { label: 'Phone', value: student.parent_phone || '—' },
                { label: 'Email', value: student.parent_email || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
            {[
              { label: 'Overall Grade', value: overallGrade, valueColor: gradeColor(overallGrade), bg: '#f8fafc' },
              { label: 'Average Score', value: `${summary.total_average}%`, valueColor: '#1e293b', bg: '#f8fafc' },
              { label: 'Exams Taken', value: String(summary.total_exams), valueColor: '#1e293b', bg: '#f8fafc' },
              { label: 'Weak Subjects', value: String(summary.weak_subjects.length), valueColor: summary.weak_subjects.length > 0 ? '#dc2626' : '#16a34a', bg: '#f8fafc' },
            ].map(({ label, value, valueColor, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: valueColor, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>{label}</p>
              </div>
            ))}
          </div>

          {summary.weak_subjects.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>⚠️</span>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c' }}>Areas Requiring Attention</p>
                <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem' }}>
                  {student.name} is scoring below 40% in: <strong>{summary.weak_subjects.join(', ')}</strong>.
                  {' '}A student must pass all subjects to receive a passing grade.
                </p>
              </div>
            </div>
          )}

          {summary.weak_subjects.length === 0 && performance.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>✅</span>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d' }}>Performing Well</p>
                <p style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.25rem' }}>
                  {student.name} is passing all subjects. Keep up the excellent work!
                </p>
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Subject-wise Performance
          </p>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</th>
                  {exams.map(e => (
                    <th key={e} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 600, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e}</th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 600, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Average</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 600, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 600, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p: PerformanceRow, idx: number) => {
                  const pct = parseFloat(p.percentage);
                  const g = getSubjectGrade(pct);
                  return (
                    <tr key={p.subject_name} style={{ borderTop: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>{p.subject_name}</td>
                      {exams.map(examName => {
                        const entry = report.marks.find(m => m.subject_name === p.subject_name && m.exam_name === examName);
                        return (
                          <td key={examName} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: '#475569' }}>
                            {entry ? `${entry.marks_obtained}/${p.max_marks}` : '—'}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>
                        {p.average_marks}/{p.max_marks}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pctBarColor(pct), borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', minWidth: '32px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>
                        <span style={{
                          fontWeight: 700, fontSize: '0.85rem', color: gradeColor(g),
                          background: g === 'F' ? '#fef2f2' : g === 'C' ? '#fffbeb' : g === 'B' ? '#eff6ff' : '#f0fdf4',
                          padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
                        }}>{g}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>This report was generated by EduTrack · AI Student Progress Tracker</p>
            <p style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '0.2rem' }}>Powered by Groq llama-3.1-8b-instant</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report, #report * { visibility: visible !important; }
          #report {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}