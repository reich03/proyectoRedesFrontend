import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Zap, Users, GitBranch, Trash2 } from 'lucide-react';
import { projectsApi } from '../lib/api';
import { Project } from '../types';
import clsx from 'clsx';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777', '#0891b2'];
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-blue-500/10 text-blue-400',
  archived: 'bg-zinc-500/10 text-zinc-400',
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try { setProjects(await projectsApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await projectsApi.create(form);
    setShowCreate(false);
    setForm({ name: '', description: '', color: COLORS[0] });
    load();
  };

  const remove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    await projectsApi.delete(id);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderKanban size={40} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No projects yet</p>
          <p className="text-zinc-600 text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
              className="card p-5 cursor-pointer hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-black/20 group animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: p.color || '#7c3aed' }}>
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{p.name}</h3>
                    <span className={clsx('badge mt-1', STATUS_COLORS[p.status] || STATUS_COLORS.active)}>{p.status}</span>
                  </div>
                </div>
                <button onClick={(e) => remove(e, p.id)} className="opacity-0 group-hover:opacity-100 btn-danger p-1.5 transition-opacity">
                  <Trash2 size={13} />
                </button>
              </div>
              {p.description && <p className="text-zinc-500 text-xs mb-4 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><Users size={12} />{p.members?.length ?? 0} members</span>
                <span className="flex items-center gap-1.5"><GitBranch size={12} />{p.sprints?.length ?? 0} sprints</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-semibold mb-5">New Project</h2>
            <div className="space-y-4">
              <input className="input" placeholder="Project name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              <textarea className="input resize-none h-20" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={clsx('w-7 h-7 rounded-full transition-all', form.color === c ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110' : '')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={create} className="btn-primary flex-1">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
