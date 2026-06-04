import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, KeyRound, Eye, EyeOff, Copy, Trash2, Edit2, Globe, Lock, Shield } from 'lucide-react'
import { credentialsApi } from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'

const ENV_COLORS: Record<string, string> = {
  production:  'bg-red-400/10 text-red-400',
  staging:     'bg-amber-400/10 text-amber-400',
  development: 'bg-emerald-400/10 text-emerald-400',
  testing:     'bg-blue-400/10 text-blue-400',
  local:       'bg-zinc-700 text-zinc-400',
}

const TYPE_ICONS: Record<string, any> = {
  url: Globe, api_key: Shield, secret: Lock, database: Lock, env: KeyRound, other: KeyRound,
}

const EMPTY = { label: '', type: 'env', environment: 'development', value: '', notes: '' }

export default function CredentialsPage() {
  const { id } = useParams<{ id: string }>()
  const [creds, setCreds]     = useState<any[]>([])
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]       = useState(EMPTY)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => { if (id) load() }, [id])

  const load = async () => {
    try {
      const data = await credentialsApi.getByProject(id!)
      setCreds(Array.isArray(data) ? data : [])
    } catch { setCreds([]) }
  }

  const toggleReveal = (credId: string) =>
    setRevealed(prev => { const n = new Set(prev); n.has(credId) ? n.delete(credId) : n.add(credId); return n })

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const handleSave = async () => {
    if (!form.label.trim()) return toast.error('Label is required')
    if (!form.value.trim()) return toast.error('Value is required')
    try {
      if (editing) {
        await credentialsApi.update(editing.id, form)
        toast.success('Updated')
      } else {
        await credentialsApi.create({ ...form, projectId: id })
        toast.success('Credential saved')
      }
      setOpen(false); setEditing(null); setForm(EMPTY); load()
    } catch { toast.error('Failed to save') }
  }

  const handleEdit = (c: any) => {
    setEditing(c)
    setForm({ label: c.label, type: c.type, environment: c.environment || 'development', value: c.value, notes: c.notes || '' })
    setOpen(true)
  }

  const handleDelete = async (credId: string) => {
    if (!confirm('Delete this credential?')) return
    try {
      await credentialsApi.delete(credId)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const grouped = creds.reduce((acc: any, c) => {
    const env = c.environment || 'other'
    acc[env] = acc[env] || []
    acc[env].push(c)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Credentials & Environments"
        description="Store API keys, passwords, and environment configs securely"
        actions={
          <button className="btn-primary flex items-center gap-2"
            onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true) }}>
            <Plus size={14} /> Add credential
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {creds.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No credentials yet"
            description="Store API keys, passwords, and environment configs"
            action={
              <button className="btn-primary flex items-center gap-2" onClick={() => setOpen(true)}>
                <Plus size={14} /> Add credential
              </button>
            }
          />
        ) : (
          Object.entries(grouped).map(([env, items]: [string, any]) => (
            <div key={env}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${ENV_COLORS[env] || ENV_COLORS.local}`}>{env}</span>
                <span className="text-xs text-zinc-600">{items.length} item{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="card divide-y divide-zinc-800">
                {items.map((c: any) => {
                  const Icon = TYPE_ICONS[c.type] || KeyRound
                  const isRevealed = revealed.has(c.id)
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/20 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-zinc-200">{c.label}</span>
                          <span className="badge text-xs bg-zinc-800 text-zinc-400">{c.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                            {isRevealed ? c.value : '••••••••••••'}
                          </span>
                          <button onClick={() => toggleReveal(c.id)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                            {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button onClick={() => copy(c.value)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                            <Copy size={11} />
                          </button>
                        </div>
                        {c.notes && <p className="text-xs text-zinc-600 mt-1">{c.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn-ghost p-1.5" onClick={() => handleEdit(c)}><Edit2 size={12} /></button>
                        <button className="btn-danger p-1.5" onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); setForm(EMPTY) }}
        title={editing ? 'Edit Credential' : 'Add Credential'}
        size="md"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Label *</label>
              <input className="input" placeholder="e.g. Database prod"
                value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['env', 'api_key', 'url', 'secret', 'database', 'other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Environment</label>
            <select className="input" value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}>
              {['development', 'staging', 'production', 'testing', 'local'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Value *</label>
            <input className="input font-mono text-xs" placeholder="The secret value"
              value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="Optional description"
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => { setOpen(false); setEditing(null); setForm(EMPTY) }}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{editing ? 'Save changes' : 'Add credential'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
