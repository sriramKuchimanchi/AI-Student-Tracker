import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, GraduationCap, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../api';
import { ParentReport as ParentReportType, PerformanceRow } from '../types';

const getGrade = (pct: number): string => {
  if (pct >= 85) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 55) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
};

const gradeColor = (grade: string): string => {
  if (grade === 'A+' || grade === 'A') return 'text-green-600';
  if (grade === 'B') return 'text-brand-600';
  if (grade === 'C') return 'text-amber-600';
  return 'text-red-600';
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center text-slate-400 mt-20">Report not found</div>;
  }

  const { student, performance, summary } = report;
  const overallGrade = getGrade(parseFloat(summary.total_average));
  const exams = [...new Set(report.marks.map(m => m.exam_name))];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8 print:hidden">
        <button onClick={() => navigate(`/performance/${studentId}`)} className="btn-secondary py-2 px-3">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="page-header">Parent Progress Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">Shareable progress summary for parents/guardians</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="card p-10 max-w-3xl mx-auto" id="report">
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-brand-600 text-lg leading-none">EduTrack</p>
              <p className="text-xs text-slate-400 mt-1">AI Student Progress Tracker</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Progress Report</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Student Information</p>
            <div className="space-y-2">
              {[
                { label: 'Name', value: student.name },
                { label: 'Roll Number', value: student.roll_number },
                { label: 'Class', value: `Class ${student.class}${student.section ? ` - ${student.section}` : ''}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Parent / Guardian</p>
            <div className="space-y-2">
              {[
                { label: 'Name', value: student.parent_name || '—' },
                { label: 'Phone', value: student.parent_phone || '—' },
                { label: 'Email', value: student.parent_email || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-50 rounded-2xl p-5 mb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Performance Summary</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Overall Grade', value: overallGrade, color: gradeColor(overallGrade) },
              { label: 'Average Score', value: `${summary.total_average}%`, color: 'text-slate-800' },
              { label: 'Exams Taken', value: String(summary.total_exams), color: 'text-slate-800' },
              {
                label: 'Weak Subjects',
                value: String(summary.weak_subjects.length),
                color: summary.weak_subjects.length > 0 ? 'text-red-500' : 'text-green-500',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`font-display font-bold text-4xl ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {summary.weak_subjects.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Areas Requiring Attention</p>
              <p className="text-xs text-red-500 mt-0.5">
                Your child is currently scoring below 40% in:{' '}
                <strong>{summary.weak_subjects.join(', ')}</strong>. Additional support is recommended.
              </p>
            </div>
          </div>
        )}

        {summary.weak_subjects.length === 0 && performance.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-700">Performing Well</p>
              <p className="text-xs text-green-600 mt-0.5">
                Your child is performing above 40% in all subjects. Keep up the great work!
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Subject-wise Performance</p>
          <table className="w-full text-sm border border-surface-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Subject</th>
                {exams.map(e => (
                  <th key={e} className="text-center px-3 py-3 text-xs font-semibold text-slate-500">{e}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Average</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {performance.map((p: PerformanceRow) => {
                const g = getGrade(parseFloat(p.percentage));
                return (
                  <tr key={p.subject_name} className="hover:bg-surface-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{p.subject_name}</td>
                    {exams.map(examName => {
                      const entry = report.marks.find(
                        m => m.subject_name === p.subject_name && m.exam_name === examName
                      );
                      return (
                        <td key={examName} className="px-3 py-2.5 text-center text-slate-600">
                          {entry ? `${entry.marks_obtained}/${p.max_marks}` : '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-center font-semibold text-slate-700">
                      {p.average_marks}/{p.max_marks}
                    </td>
                    <td className={`px-4 py-2.5 text-center font-bold ${gradeColor(g)}`}>{g}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-surface-200 pt-5 text-center">
          <p className="text-xs text-slate-400">This report was generated by EduTrack · AI Student Progress Tracker</p>
          <p className="text-xs text-slate-300 mt-0.5">Powered by Groq llama-3.1-8b-instant</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report, #report * { visibility: visible; }
          #report { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
        }
      `}</style>
    </div>
  );
}