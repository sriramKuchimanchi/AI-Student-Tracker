import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
  RadialLinearScale, Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { ArrowLeft, Brain, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import api from '../api';
import { Student, PerformanceRow, MarkWithDetails } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
  RadialLinearScale, Filler
);

const renderMarkdown = (text: string): string => {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.9rem;font-weight:700;color:#1e293b;margin:1.25rem 0 0.4rem;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1rem;font-weight:700;color:#1e293b;margin:1.25rem 0 0.5rem;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.1rem;font-weight:700;color:#1e293b;margin:1rem 0 0.5rem;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#1e293b;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:0.5rem;margin:0.3rem 0;"><span style="color:#3d74f5;font-weight:600;min-width:1.2rem;">$1.</span><span>$2</span></div>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:0.5rem;margin:0.3rem 0;"><span style="color:#3d74f5;font-weight:700;min-width:1rem;">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:0.6rem;"></div>')
    .replace(/\n/g, ' ');
};

const getOverallGrade = (performance: PerformanceRow[]): string => {
  if (performance.length === 0) return '—';
  const hasFailure = performance.some(p => parseFloat(p.percentage) < 40);
  if (hasFailure) return 'F';
  const avg = performance.reduce((sum, p) => sum + parseFloat(p.percentage), 0) / performance.length;
  if (avg >= 85) return 'A+';
  if (avg >= 70) return 'A';
  if (avg >= 55) return 'B';
  return 'C';
};

export default function Performance() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [performance, setPerformance] = useState<PerformanceRow[]>([]);
  const [allMarks, setAllMarks] = useState<MarkWithDetails[]>([]);
  const [suggestions, setSuggestions] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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

  const weakSubjects = performance.filter(p => parseFloat(p.percentage) < 40);
  const overallAvg =
    performance.length > 0
      ? (performance.reduce((sum, p) => sum + parseFloat(p.percentage), 0) / performance.length).toFixed(1)
      : '0';
  const overallGrade = getOverallGrade(performance);

  const barData = {
    labels: performance.map(p => p.subject_name),
    datasets: [{
      label: 'Average %',
      data: performance.map(p => parseFloat(p.percentage)),
      backgroundColor: performance.map(p =>
        parseFloat(p.percentage) < 40 ? 'rgba(239,68,68,0.7)' :
        parseFloat(p.percentage) < 70 ? 'rgba(245,158,11,0.7)' :
        'rgba(34,197,94,0.7)'
      ),
      borderRadius: 8,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'DM Sans' } } },
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans' } } },
    },
  };

  const radarData = {
    labels: performance.map(p => p.subject_name),
    datasets: [{
      label: 'Performance %',
      data: performance.map(p => parseFloat(p.percentage)),
      backgroundColor: 'rgba(61,116,245,0.15)',
      borderColor: 'rgba(61,116,245,0.8)',
      pointBackgroundColor: 'rgba(61,116,245,1)',
      borderWidth: 2,
    }],
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true, max: 100,
        ticks: { stepSize: 25, font: { family: 'DM Sans', size: 10 } },
        pointLabels: { font: { family: 'DM Sans', size: 11 } },
      },
    },
    plugins: { legend: { display: false } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
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
        <div style={{ flex: 1 }}>
          <h1 className="page-header">{student.name}</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.125rem' }}>
            Class {student.class}{student.section && ` — ${student.section}`} · Roll {student.roll_number}
          </p>
        </div>
        <button onClick={() => navigate(`/report/${studentId}`)} className="btn-secondary">
          <FileText size={14} /> Parent Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Overall Average', value: `${overallAvg}%`, color: '#1e293b' },
          { label: 'Overall Grade', value: overallGrade, color: overallGrade === 'F' ? '#dc2626' : overallGrade === 'C' ? '#d97706' : overallGrade === 'B' ? '#2563eb' : '#16a34a' },
          { label: 'Weak Subjects', value: String(weakSubjects.length), color: weakSubjects.length > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Exams Taken', value: String([...new Set(allMarks.map(m => m.exam_name))].length), color: '#1e293b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{label}</p>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '2rem', color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {weakSubjects.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '1rem', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', background: '#fee2e2', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={14} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#b91c1c' }}>Weak Subject Alert — Grade set to F</p>
            <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
              {student.name} is scoring below 40% in: <strong>{weakSubjects.map(w => w.subject_name).join(', ')}</strong>.
              A student must pass all subjects to receive a passing grade.
            </p>
          </div>
        </div>
      )}

      {performance.length === 0 ? (
        <div className="card p-12 text-center">
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No marks data yet. Go to Marks Entry to add marks for this student.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card p-6">
              <h3 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={15} color="#94a3b8" /> Subject-wise Performance
              </h3>
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="card p-6">
              <h3 style={{ fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>Performance Radar</h3>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div className="card overflow-hidden mb-6">
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: 600, color: '#1e293b' }}>Subject-wise Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Subject', 'Avg Marks', 'Percentage', 'Exams', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {performance.map(p => {
                  const pct = parseFloat(p.percentage);
                  return (
                    <tr key={p.subject_name} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500, color: '#1e293b' }}>{p.subject_name}</td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b' }}>{p.average_marks}/{p.max_marks}</td>
                      <td style={{ padding: '0.75rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '9999px', background: pct < 40 ? '#f87171' : pct < 70 ? '#fbbf24' : '#4ade80' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#475569' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b' }}>{p.exam_count}</td>
                      <td style={{ padding: '0.75rem 1.5rem' }}>
                        {pct < 40 ? <span className="badge-weak">Weak</span> :
                         pct < 70 ? <span className="badge-ok">Average</span> :
                         <span className="badge-good">Good</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '28px', height: '28px', background: '#dce6ff', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={13} color="#3d74f5" />
                </div>
                <h3 style={{ fontWeight: 600, color: '#1e293b' }}>AI Improvement Suggestions</h3>
                <span style={{ fontSize: '0.7rem', background: '#f0f4ff', color: '#3d74f5', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 500 }}>
                  Groq AI
                </span>
              </div>
              <button onClick={getAISuggestions} disabled={loadingAI} className="btn-primary">
                <Brain size={13} />
                {loadingAI ? 'Generating...' : suggestions ? 'Regenerate' : 'Generate Suggestions'}
              </button>
            </div>

            {loadingAI && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 0', color: '#64748b' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid #6b9aff', borderTopColor: 'transparent', borderRadius: '9999px', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem' }}>AI is analysing {student.name}'s performance...</span>
              </div>
            )}

            {suggestions && !loadingAI && (
              <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: '#334155', lineHeight: 1.7, border: '1px solid #e2e8f0' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(suggestions) }}
              />
            )}

            {!suggestions && !loadingAI && (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                Click "Generate Suggestions" to get personalised AI-powered study recommendations.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}