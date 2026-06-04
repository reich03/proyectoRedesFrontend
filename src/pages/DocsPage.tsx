import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, FileText, Trash2, Edit2, Clock, BookOpen } from 'lucide-react'
import { docsApi } from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { format } from 'date-fns'
import MDEditor from '@uiw/react-md-editor'
import MarkdownPreview from '@uiw/react-markdown-preview'

const TYPE_STYLES: Record<string, string> = {
  note:    'bg-blue-400/10 text-blue-400',
  wiki:    'bg-purple-400/10 text-purple-400',
  runbook: 'bg-amber-400/10 text-amber-400',
  adr:     'bg-emerald-400/10 text-emerald-400',
  design:  'bg-pink-400/10 text-pink-400',
  other:   'bg-zinc-700 text-zinc-400',
}

const EMPTY_FORM = { title: '', content: '', category: 'note' }

export default function DocsPage() {
  const { id } = useParams<{ id: string }>()
  const [docs, setDocs]       = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]       = useState(EMPTY_FORM)

  useEffect(() => { if (id) load() }, [id])

  const load = async () => {
    try {
      const data = await docsApi.getByProject(id!)
      const list = Array.isArray(data) ? data : []
      setDocs(list)
      setSelected((prev: any) => {
        if (prev) return list.find((d: any) => d.id === prev.id) ?? list[0] ?? null
        return list[0] ?? null
      })
    } catch { setDocs([]) }
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title required')
    try {
      if (editing) {
        const updated = await docsApi.update(editing.id, form)
        setDocs(prev => prev.map(d => d.id === editing.id ? updated : d))
        setSelected(updated)
        toast.success('Doc updated')
      } else {
        const created = await docsApi.create({ ...form, projectId: id })
        setDocs(prev => [...prev, created])
        setSelected(created)
        toast.success('Doc created')
      }
      setOpen(false); setEditing(null); setForm(EMPTY_FORM)
    } catch { toast.error('Failed to save') }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete document?')) return
    try {
      await docsApi.delete(docId)
      toast.success('Deleted')
      setDocs(prev => {
        const updated = prev.filter(d => d.id !== docId)
        if (selected?.id === docId) setSelected(updated[0] ?? null)
        return updated
      })
    } catch { toast.error('Failed to delete') }
  }

  const openEdit = (doc: any) => {
    setEditing(doc)
    setForm({ title: doc.title, content: doc.content || '', category: doc.category || 'note' })
    setOpen(true)
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
      {/* ── Sidebar doc list ── */}
      <div className="w-60 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Documents</span>
          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-violet-400 transition-colors"
            title="New document"
            onClick={() => { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }}>
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {docs.map(d => (
            <button key={d.id} onClick={() => setSelected(d)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-zinc-800/50 ${
                selected?.id === d.id ? 'bg-zinc-800/80 border-r-2 border-violet-500' : ''
              }`}>
              <FileText size={12} className={selected?.id === d.id ? 'text-violet-400' : 'text-zinc-600'} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">{d.title}</p>
                <p className="text-xs text-zinc-600 truncate">{d.category || 'note'}</p>
              </div>
            </button>
          ))}
          {docs.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-8">No docs yet</p>
          )}
        </div>
      </div>

      {/* ── Content view ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-semibold text-zinc-100">{selected.title}</h2>
                  <span className={`badge text-xs ${TYPE_STYLES[selected.category] || TYPE_STYLES.other}`}>
                    {selected.category || 'note'}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock size={10} />
                  {selected.updatedAt ? format(new Date(selected.updatedAt), 'MMM d, yyyy') : '–'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost flex items-center gap-1.5 text-xs" onClick={() => openEdit(selected)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn-danger flex items-center gap-1.5 text-xs" onClick={() => handleDelete(selected.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl" data-color-mode="dark">
                {selected.content ? (
                  <MarkdownPreview
                    source={selected.content}
                    style={{ background: 'transparent', color: '#e4e4e7' }}
                    wrapperElement={{ 'data-color-mode': 'dark' } as any}
                  />
                ) : (
                  <p className="text-zinc-600 text-sm italic">No content yet — click Edit to add.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={BookOpen}
              title="Select or create a document"
              description="Your project wiki and notes live here"
              action={
                <button className="btn-primary flex items-center gap-2"
                  onClick={() => { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }}>
                  <Plus size={14} /> New doc
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); setForm(EMPTY_FORM) }}
        title={editing ? 'Edit Document' : 'New Document'}
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input className="input" placeholder="Document title"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {['note', 'wiki', 'runbook', 'adr', 'design', 'other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div data-color-mode="dark">
            <label className="label mb-1 block">Content</label>
            <MDEditor
              value={form.content}
              onChange={v => setForm({ ...form, content: v || '' })}
              height={380}
              preview="edit"
            />
            <p className="text-xs text-zinc-600 mt-1">
              Supports Markdown — use <code className="text-zinc-500">![alt](url)</code> to insert images
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost"
              onClick={() => { setOpen(false); setEditing(null); setForm(EMPTY_FORM) }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {editing ? 'Save changes' : 'Create doc'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
