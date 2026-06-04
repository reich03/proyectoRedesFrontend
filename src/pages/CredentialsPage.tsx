import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, KeyRound, Eye, EyeOff, Copy, Trash2, Edit2, Globe, Lock } from 'lucide-react'
import { credentialsApi } from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'

const ENV_COLORS: Record<string,string> = {
  production: 'bg-red-400/10 text-red-400',
  staging: 'bg-amber-400/10 text-amber-400',
  development: 'bg-emerald-400/10 text-emerald-400',
  local: 'bg-zinc-700 text-zinc-400',
}

const empty = { name: '', type: 'env', environment: 'development', url: '', username: '', password: '', apiKey: '', notes: '', isSecret: false }

export default function CredentialsPage() {
  const { id } = useParams<{ id: string }>()
  const [creds, setCreds] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => { if (id) load() }, [id])
  const load = async () => { const data = await credentialsApi.getByProject(id!); setCreds(data) }

  const toggleReveal = (id: string) => {
    setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name required')
    if (editing) {
      await credentialsApi.update(editing.id, form)
      toast.success('Updated')
    } else {
      await credentialsApi.create({ ...form, projectId: id })
      toast.success('Credential saved')
    }
    setOpen(false); setEditing(null); setForm(empty); load()
  }

  const handleEdit = (c: any) => { setEditing(c); setForm(c); setOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete credential?')) return
    await credentialsApi.delete(id)
    toast.success('Deleted')
    load()
  }

  const grouped = creds.reduce((acc: any, c) => {
    const env = c.environment || 'other'
    acc[env] = acc[env] || []
    acc[env].push(c)
    return acc
  }, {})

  return (
    <div>
      <PageHeader title="Credentials & Environments" description="Store API keys, passwords, and environment configs securely"
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setForm(empty); setOpen(true) }}><Plus size={14}/>Add credential</button>}/>
      <div className="p-6 space-y-6">
        {creds.length === 0 ? (
          <EmptyState icon={KeyRound} title="No credentials yet" description="Store API keys, passwords, and environment configs"
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14}/>Add credential</button>}/>
        ) : (
          Object.entries(grouped).map(([env, items]: [string, any]) => (
            <div key={env}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${ENV_COLORS[env] || ENV_COLORS.local}`}>{env}</span>
                <span className="text-xs text-zinc-600">{items.length} items</span>
              </div>
              <div className="card divide-y divide-zinc-800">
                {items.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/20 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      {c.type === 'url' ? <Globe size={14} className="text-zinc-400"/> : <Lock size={14} className="text-zinc-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-200">{c.name}</span>
                        {c.isSecret && <Lock size={10} className="text-zinc-600"/>}
                      </div>
                      {c.url && <p className="text-xs text-blue-400 font-mono mb-1 truncate">{c.url}</p>}
                      {c.username && <p className="text-xs text-zinc-500 mb-1">User: <span className="text-zinc-300 font-mono">{c.username}</span></p>}
                      {c.password && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-zinc-500">Pass: </span>
                          <span className="text-xs font-mono text-zinc-300">{revealed.has(c.id+'-pw') ? c.password : '••••••••'}</span>
                          <button onClick={() => toggleReveal(c.id+'-pw')} className="text-zinc-600 hover:text-zinc-400"><Eye size={11}/></button>
                          <button onClick={() => copy(c.password)} className="text-zinc-600 hover:text-zinc-400"><Copy size={11}/></button>
                        </div>
                      )}
                      {c.apiKey && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">API Key: </span>
                          <span className="text-xs font-mono text-zinc-300">{revealed.has(c.id+'-key') ? c.apiKey : c.apiKey.slice(0,8)+'...'}</span>
                          <button onClick={() => toggleReveal(c.id+'-key')} className="text-zinc-600 hover:text-zinc-400"><Eye size={11}/></button>
                          <button onClick={() => copy(c.apiKey)} className="text-zinc-600 hover:text-zinc-400"><Copy size={11}/></button>
                        </div>
                      )}
                      {c.notes && <p className="text-xs text-zinc-600 mt-1">{c.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn-ghost p-1.5" onClick={() => handleEdit(c)}><Edit2 size={12}/></button>
                      <button className="btn-danger p-1.5" onClick={() => handleDelete(c.id)}><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); setForm(empty) }} title={editing ? 'Edit Credential' : 'Add Credential'} size="md">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input className="input" placeholder="Database prod" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            </div>
            <div>
              <label className="label">Environment</label>
              <select className="input" value={form.environment} onChange={e=>setForm({...form,environment:e.target.value})}>
                {['development','staging','production','local'].map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {['env','api_key','database','service','url','other'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.isSecret} onChange={e=>setForm({...form,isSecret:e.target.checked})}/>
                <span className="text-xs text-zinc-400">Mark as secret</span>
              </label>
            </div>
          </div>
          <div><label className="label">URL</label><input className="input" placeholder="https://..." value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Username</label><input className="input" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></div>
            <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
          </div>
          <div><label className="label">API Key</label><input className="input font-mono text-xs" value={form.apiKey} onChange={e=>setForm({...form,apiKey:e.target.value})}/></div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={()=>{setOpen(false);setEditing(null);setForm(empty)}}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add credential'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
