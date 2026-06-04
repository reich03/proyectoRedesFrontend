import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Play, CheckCircle, Pause, Calendar, Target, BarChart2, Trash2 } from 'lucide-react';
import { sprintsApi, projectsApi } from '../lib/api';
import { Sprint, ProjectStats } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  planning: 'bg-zinc-500/10 text-zinc-400',
  active:   'bg-emerald-500/10 text-emerald-400',
  review:   'bg-amber-500/10 text-amber-400',
  done:     'bg-blue-500/10 text-blue-400',
};
const STATUS_ICONS: Record<string, any> = { planning: Calendar, active: Play, review: Pause, done: CheckCircle };

export default function SprintsPage() {
  const { id } = useParams<{ id: string }>();
  const [sprints, setSprints]       = useState<Sprint[]>([]);
  const [selected, setSelected]     = useState<Sprint | null>(null);
  const [timeline, setTimeline]     = useState<any[]>([]);
  const [stats, setStats]           = useState<ProjectStats | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ name: '', goal: '', startDate: '', endDate: '' });

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    const [s, st] = await Promise.all([sprintsApi.getByProject(id!), projectsApi.getStats(id!)]);
    setSprints(s);
    setStats(st);
    if (s.length > 0 && !selected) {
      const active = s.find((x: Sprint) => x.status === 'active') || s[0];
      await selectSprint(active);
    }
  };

  const selectSprint = async (s: Sprint) => {
    setSelected(s);
    const t = await sprintsApi.getTimeline(s.id);
    setTimeline(t);
  };

  const create = async () => {
    if (!form.name.trim()) return;
    await sprintsApi.create({ ...form, projectId: id });
    setShowCreate(false);
    setForm({ name: '', goal: '', startDate: '', endDate: '' });
    load();
  };

  const changeStatus = async (s: Sprint, status: string) => {
    await sprintsApi.update(s.id, { status });
    load();
  };

  const deleteSprint = async (s: Sprint) => {
    if (!confirm(`Delete sprint "${s.name}"?`)) return;
    await sprintsApi.delete(s.id);
    setSelected(null);
    load();
  };

  const totalTasks = selected?.tasks?.length ?? 0;
  const doneTasks  = selected?.tasks?.filter(t => t.status === 'done').length ?? 0;
  const successRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Sprints</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Sprint
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sprint list */}
        <div className="space-y-2">
          {sprints.length === 0 ? (
            <div className="card p-8 text-center"><p className="text-zinc-500 text-sm">No sprints yet</p></div>
          ) : sprints.map(s => {
            const Icon = STATUS_ICONS[s.status] || Calendar;
            return (
              <div key={s.id} onClick={() => selectSprint(s)}
                className={clsx('card p-4 cursor-pointer transition-all hover:border-zinc-700 group',
                  selected?.id === s.id && 'border-violet-500/50 bg-violet-500/5')}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={STATUS_STYLES[s.status]?.split(' ')[1]} />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <span className={clsx('badge text-xs', STATUS_STYLES[s.status])}>{s.status}</span>
                </div>
                {s.goal && <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{s.goal}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-zinc-600">{s.startDate || '–'} → {s.endDate || '–'}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {s.status === 'planning' && (
                      <button onClick={e => { e.stopPropagation(); changeStatus(s, 'active'); }}
                        className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20">Start</button>
                    )}
                    {s.status === 'active' && (
                      <button onClick={e => { e.stopPropagation(); changeStatus(s, 'review'); }}
                        className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/20">Review</button>
                    )}
                    {s.status === 'review' && (
                      <button onClick={e => { e.stopPropagation(); changeStatus(s, 'done'); }}
                        className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20">Done</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteSprint(s); }}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total tasks', value: totalTasks,      icon: Target },
                  { label: 'Done',        value: doneTasks,       icon: CheckCircle },
                  { label: 'Success rate',value: `${successRate}%`, icon: BarChart2 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className="text-violet-400" />
                      <span className="text-xs text-zinc-500">{label}</span>
                    </div>
                    <p className="text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <BarChart2 size={14} className="text-violet-400" /> Day-by-day timeline
                </h3>
                {timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="done"       stackId="1" stroke="#10b981" fill="#10b98120" name="Done" />
                      <Area type="monotone" dataKey="inProgress" stackId="1" stroke="#3b82f6" fill="#3b82f620" name="In Progress" />
                      <Area type="monotone" dataKey="todo"       stackId="1" stroke="#71717a" fill="#71717a20" name="Todo" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
                    Set start &amp; end dates to see the timeline
                  </div>
                )}
              </div>

              {selected.tasks && selected.tasks.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-medium mb-3">Tasks in this sprint</h3>
                  <div className="space-y-2">
                    {selected.tasks.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                        <span className="text-sm text-zinc-300">{t.title}</span>
                        <div className="flex items-center gap-2">
                          {t.assignee && <span className="text-xs text-zinc-500">{t.assignee.name}</span>}
                          <span className={clsx('badge text-xs',
                            t.status === 'done'        ? 'bg-emerald-500/10 text-emerald-400' :
                            t.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                            t.status === 'review'      ? 'bg-amber-500/10 text-amber-400' :
                            'bg-zinc-500/10 text-zinc-400')}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-16 text-center"><p className="text-zinc-500">Select a sprint to see details</p></div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-semibold mb-5">New Sprint</h2>
            <div className="space-y-3">
              <input className="input" placeholder="Sprint name (e.g. Sprint 1)" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              <textarea className="input resize-none h-20" placeholder="Sprint goal"
                value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Start date</label>
                  <input type="date" className="input" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">End date</label>
                  <input type="date" className="input" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={create} className="btn-primary flex-1">Create Sprint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
