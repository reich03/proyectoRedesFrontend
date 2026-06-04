import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Shield, Code2, Eye, Trash2 } from 'lucide-react';
import { projectsApi, usersApi } from '../lib/api';
import { ProjectMember, User } from '../types';
import clsx from 'clsx';

const ROLES = [
  { id: 'admin',  label: 'Admin',     icon: Shield, color: 'text-violet-400 bg-violet-500/10' },
  { id: 'dev',    label: 'Developer', icon: Code2,  color: 'text-blue-400 bg-blue-500/10' },
  { id: 'viewer', label: 'Viewer',    icon: Eye,    color: 'text-zinc-400 bg-zinc-500/10' },
];

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers]   = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ userId: '', role: 'dev' });

  const load = async () => {
    const [m, u] = await Promise.all([projectsApi.getMembers(id!), usersApi.getAll()]);
    setMembers(m);
    setAllUsers(u);
  };

  useEffect(() => { if (id) load(); }, [id]);

  const addMember = async () => {
    if (!form.userId) return;
    await projectsApi.addMember(id!, form);
    setShowAdd(false);
    setForm({ userId: '', role: 'dev' });
    load();
  };

  const remove = async (userId: string) => {
    if (!confirm('Remove member?')) return;
    await projectsApi.removeMember(id!, userId);
    load();
  };

  const available = allUsers.filter(u => !members.find(m => m.userId === u.id));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Members</h1>
          <p className="text-zinc-500 text-sm mt-1">{members.length} members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={15} /> Add Member
        </button>
      </div>

      <div className="card divide-y divide-zinc-800">
        {members.length === 0 ? (
          <div className="p-12 text-center"><p className="text-zinc-500">No members yet</p></div>
        ) : members.map(m => {
          const role = ROLES.find(r => r.id === m.role) || ROLES[1];
          const Icon = role.icon;
          return (
            <div key={m.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm font-medium text-white">
                  {m.user?.name?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.user?.name}</p>
                  <p className="text-xs text-zinc-500">{m.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={clsx('badge flex items-center gap-1.5', role.color)}>
                  <Icon size={11} />{role.label}
                </span>
                <span className="text-xs text-zinc-600">Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                <button onClick={() => remove(m.userId)} className="opacity-0 group-hover:opacity-100 btn-danger p-1.5 transition-opacity">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-semibold mb-5">Add Member</h2>
            {available.length === 0 ? (
              <p className="text-zinc-500 text-sm mb-4">All users are already members. Go to Users and create more first.</p>
            ) : (
              <div className="space-y-3">
                <select className="input" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
                  <option value="">Select user</option>
                  {available.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <div>
                  <label className="text-xs text-zinc-500 mb-2 block">Role</label>
                  <div className="flex gap-2">
                    {ROLES.map(r => (
                      <button key={r.id} onClick={() => setForm(f => ({ ...f, role: r.id }))}
                        className={clsx('flex-1 py-2 rounded-lg text-xs border transition-colors',
                          form.role === r.id
                            ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                            : 'border-zinc-700 text-zinc-500 hover:border-zinc-600')}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1">Cancel</button>
              {available.length > 0 && <button onClick={addMember} className="btn-primary flex-1">Add</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
