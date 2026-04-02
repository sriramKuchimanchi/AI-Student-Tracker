import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, BarChart3, AlertTriangle, ArrowRight, LucideIcon } from 'lucide-react';
import api from '../api';
import { Student } from '../types';

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Student[]>('/students')
      .then(r => setStudents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats: StatCard[] = [
    {
      label: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'bg-brand-50 text-brand-500',
    },
    {
      label: 'Profiles Active',
      value: students.length,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-500',
    },
    {
      label: 'Classes Tracked',
      value: [...new Set(students.map(s => s.class))].length,
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-500',
    },
    {
      label: 'With Parent Info',
      value: students.filter(s => s.parent_email).length,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-header">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of student performance across all classes</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={14} />
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Students</h2>
          <button
            onClick={() => navigate('/students')}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No students yet.</p>
            <button onClick={() => navigate('/students')} className="mt-3 btn-primary mx-auto">
              Add First Student
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {students.slice(0, 8).map(student => (
              <div
                key={student.id}
                className="px-6 py-3 flex items-center justify-between hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-600 text-xs font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-400">
                      Roll: {student.roll_number} · Class {student.class}{student.section}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/performance/${student.id}`)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <BarChart3 size={12} />
                    Performance
                  </button>
                  <button
                    onClick={() => navigate(`/report/${student.id}`)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}