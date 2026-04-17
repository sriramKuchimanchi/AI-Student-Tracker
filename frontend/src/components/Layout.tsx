import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList,
  GraduationCap, School, BookOpen, LucideIcon, LogOut,
} from 'lucide-react';
import { useAuth } from '../pages/context/AuthContext';


interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: School, label: 'Classes & Sections' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/examinations', icon: BookOpen, label: 'Examinations' },
  { to: '/marks', icon: ClipboardList, label: 'Marks Entry' },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = (): void => {
    signOut();
    navigate('/signin');
  };

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside className="w-60 bg-white border-r border-surface-200 flex flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-surface-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 text-sm leading-none">EduTrack</p>
              <p className="text-xs text-slate-400 mt-0.5">AI Progress Tracker</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:bg-surface-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-surface-200 space-y-3">
          <div className="bg-brand-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-brand-700">AI Powered</p>
            <p className="text-xs text-brand-500 mt-0.5">Groq llama-3.1-8b-instant</p>
          </div>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '0.75rem',
            }}>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#94a3b8', flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}