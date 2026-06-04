import { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Mail } from 'lucide-react';
import { usersApi } from '../lib/api';
import { User } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'member' });

  const load = async () => setUsers(await usersApi.getAll());
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    await usersApi.create(form);
    setShowCreate(false);
    setForm({ name: '', email: '', role: 'member' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete user?')) return;
    await usersApi.delete(id);
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-zinc-500 text-sm mt-1">{users.length} users registered</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New User
        </button>
      </div>

      <div className="card divide-y divide-zinc-800">
        {users.length === 0 ? (
          <div className="p-16 text-center"><Users size={40} className="text-zinc-700 mx-auto mb-4" /><p className="text-zinc-500">No users yet</p></div>
        ) : users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-sm font-medium text-white">
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-zinc-500 flex items-center gap-1"><Mail size={10} />{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge bg-zinc-500/10 text-zinc-400 text-xs">{u.role}</span>
              <span className="text-xs text-zinc-600">{new Date(u.createdAt).toLocaleDateString()}</span>
              <button onClick={() => remove(u.id)} className="opacity-0 group-hover:opacity-100 btn-danger p-1.5 transition-opacity"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-semibold mb-5">New User</h2>
            <div className="space-y-3">
              <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              <input className="input" placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="member">Member</option><option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={create} className="btn-primary flex-1">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
