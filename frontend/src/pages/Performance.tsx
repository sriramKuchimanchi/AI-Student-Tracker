import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
  RadialLinearScale, Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { ArrowLeft, Brain, AlertTriangle, TrendingUp, FileText, Mail, CheckCircle, X } from 'lucide-react';
import api from '../api';
import { Student, PerformanceRow, MarkWithDetails } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
  RadialLinearScale, Filler
);

interface ExamSubjectResult {
  examName: string;
  examDate: string | null;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  passed: boolean;
}
interface ExamResult {
  examName: string;
  examDate: string | null;
  subjects: ExamSubjectResult[];
  examPassed: boolean;
}

function buildExamResults(marks: MarkWithDetails[]): ExamResult[] {
  const map = new Map<string, ExamResult>();
  for (const m of marks) {
    if (!map.has(m.exam_name)) {
      map.set(m.exam_name, {
        examName: m.exam_name,
        examDate: m.exam_date,
        subjects: [],
        examPassed: true,
      });
    }
    const exam = map.get(m.exam_name)!;
    const pct = (m.marks_obtained / m.max_marks) * 100;
    const passed = pct >= 40;
    exam.subjects.push({
      examName: m.exam_name,
      examDate: m.exam_date,
      subjectName: m.subject_name,
      marksObtained: m.marks_obtained,
      maxMarks: m.max_marks,
      percentage: pct,
      passed,
    });
    if (!passed) exam.examPassed = false;
  }
  return Array.from(map.values());
}

export default function Performance() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [performance, setPerformance] = useState<PerformanceRow[]>([]);
  const [allMarks, setAllMarks] = useState<MarkWithDetails[]>([]);
  const [suggestions, setSuggestions] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string>('');

  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      api.get<Student>(`/students/${studentId}`),
      api.get<PerformanceRow[]>(`/marks/performance/${studentId}`),
      api.get<MarkWithDetails[]>(`/marks/student/${studentId}`),
    ])
      .then(([s, p, m]) => {
        setStudent(s.data);
        setPerformance(p.data);
        setAllMarks(m.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const getAISuggestions = async (): Promise<void> => {
    setLoadingAI(true);
    setSuggestions('');
    try {
      const res = await api.post<{ suggestions: string }>(`/ai/suggestions/${studentId}`);
      setSuggestions(res.data.suggestions);
    } catch {
      setSuggestions('Could not load suggestions. Please check your Groq API key in the backend .env file.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleShareEmail = async (): Promise<void> => {
    if (!student?.parent_email) {
      setEmailStatus('error');
      setEmailMessage('No parent email address found for this student.');
      return;
    }

    setSendingEmail(true);
    setEmailStatus('idle');
    setEmailMessage('');

    try {
      const examResults = buildExamResults(allMarks);
      const overallAvgNum =
        performance.length > 0
          ? (
              performance.reduce((sum, p) => sum + parseFloat(p.percentage), 0) /
              performance.length
            ).toFixed(1)
          : '0';

      const weakSubjects = performance
        .filter(p => parseFloat(p.percentage) < 40)
        .map(p => p.subject_name);

      const avg = parseFloat(overallAvgNum);
      let grade = 'A+';
      if (avg < 40) grade = 'F';
      else if (avg < 55) grade = 'C';
      else if (avg < 70) grade = 'B';
      else if (avg < 85) grade = 'A';

      const subjectRows = performance
        .map(
          p =>
            `• ${p.subject_name}: ${p.average_marks}/${p.max_marks} (${parseFloat(p.percentage).toFixed(1)}%) — ${
              parseFloat(p.percentage) >= 40 ? 'Pass' : 'FAIL'
            }`
        )
        .join('\n');

      const examSummary = examResults
        .map(
          e =>
            `Exam: ${e.examName}${e.examDate ? ` (${new Date(e.examDate).toLocaleDateString('en-IN')})` : ''} — ${
              e.examPassed ? 'PASSED' : 'FAILED (one or more subjects below 40%)'
            }\n` +
            e.subjects
              .map(s => `  - ${s.subjectName}: ${s.marksObtained}/${s.maxMarks} (${s.percentage.toFixed(1)}%)`)
              .join('\n')
        )
        .join('\n\n');

      const emailBody = `Dear ${student.parent_name || 'Parent/Guardian'},

We are sharing the academic progress report for your child ${student.name} (Roll No: ${student.roll_number}, Class ${student.class}${student.section ? ' - ' + student.section : ''}).

OVERALL PERFORMANCE SUMMARY
────────────────────────────
Overall Average: ${overallAvgNum}%
Grade: ${grade}
Exams Taken: ${examResults.length}
Weak Subjects (below 40%): ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'None — performing well in all subjects!'}

SUBJECT-WISE AVERAGE PERFORMANCE
──────────────────────────────────
${subjectRows}

EXAM-WISE BREAKDOWN
────────────────────
${examSummary}

${
  weakSubjects.length > 0
    ? `⚠ AREAS REQUIRING ATTENTION\n${student.name} is currently scoring below 40% in: ${weakSubjects.join(', ')}. We strongly recommend additional support and focused study in these areas.\n`
    : `✓ ${student.name} is performing well in all subjects. Keep up the great work!\n`
}

Please log in to EduTrack to view the full detailed report and charts.

Warm regards,
EduTrack — AI Student Progress Tracker`;

      const subject = `Progress Report: ${student.name} — ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;

      await api.post('/reports/send-email', {
        to: student.parent_email,
        subject,
        body: emailBody,
        student_id: studentId,
      });

      setEmailStatus('success');
      setEmailMessage(`Report sent successfully to ${student.parent_email}`);
    } catch (err: unknown) {
      const examResults = buildExamResults(allMarks);
      const overallAvgNum =
        performance.length > 0
          ? (
              performance.reduce((sum, p) => sum + parseFloat(p.percentage), 0) /
              performance.length
            ).toFixed(1)
          : '0';
      const weakSubjects = performance
        .filter(p => parseFloat(p.percentage) < 40)
        .map(p => p.subject_name);
      const avg = parseFloat(overallAvgNum);
      let grade = 'A+';
      if (avg < 40) grade = 'F';
      else if (avg < 55) grade = 'C';
      else if (avg < 70) grade = 'B';
      else if (avg < 85) grade = 'A';

      const subjectRows = performance
        .map(p => `• ${p.subject_name}: ${p.average_marks}/${p.max_marks} (${parseFloat(p.percentage).toFixed(1)}%) — ${parseFloat(p.percentage) >= 40 ? 'Pass' : 'FAIL'}`)
        .join('\n');

      const examSummary = examResults
        .map(e =>
          `Exam: ${e.examName}${e.examDate ? ` (${new Date(e.examDate).toLocaleDateString('en-IN')})` : ''} — ${e.examPassed ? 'PASSED' : 'FAILED'}\n` +
          e.subjects.map(s => `  - ${s.subjectName}: ${s.marksObtained}/${s.maxMarks} (${s.percentage.toFixed(1)}%)`).join('\n')
        )
        .join('\n\n');

      const bodyText = `Dear ${student.parent_name || 'Parent/Guardian'},\n\nProgress report for ${student.name} (Roll: ${student.roll_number}, Class ${student.class}${student.section ? '-' + student.section : ''}).\n\nOverall Average: ${overallAvgNum}% | Grade: ${grade}\nWeak Subjects: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'None'}\n\nSUBJECT AVERAGES:\n${subjectRows}\n\nEXAM BREAKDOWN:\n${examSummary}\n\nRegards,\nEduTrack`;

      const mailtoUrl = `mailto:${student.parent_email}?subject=${encodeURIComponent(`Progress Report: ${student.name} — ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`)}&body=${encodeURIComponent(bodyText)}`;
      window.open(mailtoUrl);
      setEmailStatus('success');
      setEmailMessage(`Email client opened for ${student.parent_email}. If it didn't open, add a /api/reports/send-email backend route.`);
    } finally {
      setSendingEmail(false);
    }
  };

  const examResults = buildExamResults(allMarks);

  const weakSubjects = performance.filter(p => parseFloat(p.percentage) < 40);
  const overallAvg =
    performance.length > 0
      ? (
          performance.reduce((sum, p) => sum + parseFloat(p.percentage), 0) /
          performance.length
        ).toFixed(1)
      : '0';

  const barData = {
    labels: performance.map(p => p.subject_name),
    datasets: [
      {
        label: 'Average %',
        data: performance.map(p => parseFloat(p.percentage)),
        backgroundColor: performance.map(p =>
          parseFloat(p.percentage) < 40
            ? 'rgba(239,68,68,0.7)'
            : parseFloat(p.percentage) < 70
            ? 'rgba(245,158,11,0.7)'
            : 'rgba(34,197,94,0.7)'
        ),
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'DM Sans' } },
      },
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans' } } },
    },
  };

  const radarData = {
    labels: performance.map(p => p.subject_name),
    datasets: [
      {
        label: 'Performance %',
        data: performance.map(p => parseFloat(p.percentage)),
        backgroundColor: 'rgba(61,116,245,0.15)',
        borderColor: 'rgba(61,116,245,0.8)',
        pointBackgroundColor: 'rgba(61,116,245,1)',
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 25, font: { family: 'DM Sans', size: 10 } },
        pointLabels: { font: { family: 'DM Sans', size: 11 } },
      },
    },
    plugins: { legend: { display: false } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center text-slate-400 mt-20">Student not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/students')} className="btn-secondary py-2 px-3">
          <ArrowLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="page-header">{student.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Class {student.class}{student.section} · Roll {student.roll_number}
          </p>
        </div>
        {student.parent_email && (
          <button
            onClick={handleShareEmail}
            disabled={sendingEmail}
            className="btn-secondary"
          >
            <Mail size={14} />
            {sendingEmail ? 'Sending...' : 'Share with Parent'}
          </button>
        )}
        <button onClick={() => navigate(`/report/${studentId}`)} className="btn-secondary">
          <FileText size={14} /> Parent Report
        </button>
      </div>

      {emailStatus !== 'idle' && (
        <div
          className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${
            emailStatus === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {emailStatus === 'success' ? (
            <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          )}
          <p className={`text-sm flex-1 ${emailStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {emailMessage}
          </p>
          <button
            onClick={() => setEmailStatus('idle')}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!student.parent_email && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            No parent email on file. Add one in the Students page to enable email sharing.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Overall Average</p>
          <p className="font-display font-bold text-3xl text-slate-900">{overallAvg}%</p>
          <div className="w-full h-1.5 bg-surface-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                parseFloat(overallAvg) < 40
                  ? 'bg-red-400'
                  : parseFloat(overallAvg) < 70
                  ? 'bg-amber-400'
                  : 'bg-green-400'
              }`}
              style={{ width: `${overallAvg}%` }}
            />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Weak Subjects</p>
          <p className="font-display font-bold text-3xl text-red-500">{weakSubjects.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            {weakSubjects.length === 0
              ? 'No weak subjects!'
              : weakSubjects.map(w => w.subject_name).join(', ')}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Exams Taken</p>
          <p className="font-display font-bold text-3xl text-slate-900">{examResults.length}</p>
          <p className="text-xs text-slate-400 mt-1">{allMarks.length} total mark entries</p>
        </div>
      </div>

      {weakSubjects.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">Weak Subject Alert</p>
            <p className="text-xs text-red-500 mt-0.5">
              {student.name} is scoring below 40% in:{' '}
              <strong>{weakSubjects.map(w => w.subject_name).join(', ')}</strong>. Immediate attention recommended.
            </p>
          </div>
        </div>
      )}

      {performance.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm">
            No marks data yet. Go to Marks Entry to add marks for this student.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-slate-400" /> Subject-wise Performance (Average)
              </h3>
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Performance Radar</h3>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div className="card overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Exam-wise Result</h3>
              <span className="text-xs text-slate-400">
                An exam is PASSED only when ALL subjects ≥ 40%
              </span>
            </div>
            <div className="divide-y divide-surface-100">
              {examResults.map(exam => (
                <div key={exam.examName} className="px-6 py-4">

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{exam.examName}</p>
                      {exam.examDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(exam.examDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        exam.examPassed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {exam.examPassed ? '✓ PASSED' : '✗ FAILED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {exam.subjects.map(subj => (
                      <div
                        key={subj.subjectName}
                        className={`rounded-xl px-3 py-2.5 border ${
                          subj.passed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-600 truncate">{subj.subjectName}</p>
                        <p className={`text-sm font-bold mt-0.5 ${subj.passed ? 'text-green-700' : 'text-red-700'}`}>
                          {subj.marksObtained}/{subj.maxMarks}
                          <span className="text-xs font-medium ml-1">({subj.percentage.toFixed(0)}%)</span>
                        </p>
                        <p className={`text-xs mt-0.5 ${subj.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {subj.passed ? 'Pass' : 'Fail'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-surface-200">
              <h3 className="font-semibold text-slate-800">Subject-wise Average Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Marks</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Percentage</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Exams</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {performance.map(p => {
                  const pct = parseFloat(p.percentage);
                  return (
                    <tr key={p.subject_name} className="hover:bg-surface-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-800">{p.subject_name}</td>
                      <td className="px-6 py-3 text-slate-500">{p.average_marks}/{p.max_marks}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct < 40 ? 'bg-red-400' : pct < 70 ? 'bg-amber-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{p.exam_count}</td>
                      <td className="px-6 py-3">
                        {pct < 40 ? (
                          <span className="badge-weak">Weak</span>
                        ) : pct < 70 ? (
                          <span className="badge-ok">Average</span>
                        ) : (
                          <span className="badge-good">Good</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AI Suggestions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Brain size={13} className="text-brand-600" />
                </div>
                <h3 className="font-semibold text-slate-800">AI Improvement Suggestions</h3>
                <span className="text-xs bg-brand-50 text-brand-500 px-2 py-0.5 rounded-full font-medium">
                  Groq AI
                </span>
              </div>
              <button onClick={getAISuggestions} disabled={loadingAI} className="btn-primary">
                <Brain size={13} />
                {loadingAI ? 'Generating...' : suggestions ? 'Regenerate' : 'Generate Suggestions'}
              </button>
            </div>

            {loadingAI && (
              <div className="flex items-center gap-3 py-6 text-slate-500">
                <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-sm">AI is analyzing {student.name}'s performance...</span>
              </div>
            )}

            {suggestions && !loadingAI && (
              <div className="bg-surface-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {suggestions}
              </div>
            )}

            {!suggestions && !loadingAI && (
              <p className="text-slate-400 text-sm text-center py-6">
                Click "Generate Suggestions" to get personalized AI-powered study recommendations.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}