import { Link, useLocation, useMatch } from 'react-router-dom';
import { LayoutDashboard, Kanban, Users, Key, FileText, Activity, Zap, Sun, Moon, GitBranch, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store';
import clsx from 'clsx';

const NAV_TOP = [
  { to: '/',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users,           label: 'Users' },
];

const PROJECT_NAV = (id: string) => [
  { to: `/projects/${id}`,             icon: Kanban,    label: 'Board',       end: true },
  { to: `/projects/${id}/sprints`,     icon: GitBranch, label: 'Sprints' },
  { to: `/projects/${id}/members`,     icon: Users,     label: 'Members' },
  { to: `/projects/${id}/credentials`, icon: Key,       label: 'Credentials' },
  { to: `/projects/${id}/docs`,        icon: FileText,  label: 'Docs' },
  { to: `/projects/${id}/audit`,       icon: Activity,  label: 'Audit' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const match        = useMatch('/projects/:id/*');
  const id           = match?.params.id;
  const { theme, toggleTheme } = useStore();

  return (
    <aside className="w-56 h-screen bg-zinc-900/80 border-r border-zinc-800 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">ProjectFlow</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_TOP.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}
            className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === to
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800')}>
            <Icon size={15} />{label}
          </Link>
        ))}

        {id && (
          <>
            <div className="pt-3 pb-1">
              <Link to="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3">
                <ChevronLeft size={12} /> Projects
              </Link>
              <p className="text-xs font-medium text-zinc-500 px-3 pt-2 uppercase tracking-wider">Project</p>
            </div>
            {PROJECT_NAV(id).map(({ to, icon: Icon, label, end }) => (
              <Link key={to} to={to}
                className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  (end ? pathname === to : pathname.startsWith(to))
                    ? 'bg-violet-600/20 text-violet-400'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800')}>
                <Icon size={15} />{label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <button onClick={toggleTheme} className="btn-ghost w-full flex items-center gap-2 text-xs">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  );
}
