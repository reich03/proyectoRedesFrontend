import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, FileText, Trash2, Edit2, Clock, BookOpen } from 'lucide-react'
import { docsApi } from '../lib/api'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { format } from 'date-fns'

const TYPE_STYLES: Record<string,string> = {
  note: 'bg-blue-400/10 text-blue-400',
  wiki: 'bg-purple-400/10 text-purple-400',
  runbook: 'bg-amber-400/10 text-amber-400',
  adr: 'bg-emerald-400/10 text-emerald-400',
}

const emptyForm = { title: '', content: '', category: 'note', authorName: '' }

export default function DocsPage() {
  const { id } = useParams<{ id: string }>()
  const [docs, setDocs] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<{ title: string; content: string; category: string; authorName: string }>(emptyForm)

  useEffect(() => { if (id) load() }, [id])
  const load = async () => {
    try {
      const data = await docsApi.getByProject(id!)
      const list = Array.isArray(data) ? data : []
      setDocs(list)
      if (list.length > 0) setSelected((prev: any) => prev ?? list[0])
    } catch {
      setDocs([])
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title required')
    if (editing) {
      const updated = await docsApi.update(editing.id, form)
      setSelected(updated)
      toast.success('Doc updated')
    } else {
      const created = await docsApi.create({ ...form, projectId: id })
      setSelected(created)
      toast.success('Doc created')
    }
    setOpen(false); setEditing(null); setForm(emptyForm); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete document?')) return
    await docsApi.delete(id)
    toast.success('Deleted')
    if (selected?.id === id) setSelected(null)
    load()
  }

  return (
    <div className="flex h-full" style={{height:'calc(100vh - 57px)'}}>
      {/* Sidebar list */}
      <div className="w-64 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="section-title">Documents</span>
          <button className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-accent transition-colors"
            onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true) }}>
            <Plus size={14}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {docs.map(d => (
            <button key={d.id} onClick={() => setSelected(d)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-zinc-800/50 transition-colors ${selected?.id===d.id?'bg-zinc-800/80 border-r-2 border-accent':''}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${selected?.id===d.id?'bg-accent':'bg-zinc-600'}`}/>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">{d.title}</p>
                <p className="text-xs text-zinc-600 truncate">{d.category || d.type || '–'}</p>
              </div>
            </button>
          ))}
          {docs.length === 0 && <p className="text-xs text-zinc-600 text-center py-8">No docs yet</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-semibold text-zinc-100">{selected.title}</h2>
                  <span className={`badge text-xs ${TYPE_STYLES[selected.category] || TYPE_STYLES.note}`}>{selected.category || 'note'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {selected.authorName && <span>by {selected.authorName}</span>}
                  <span className="flex items-center gap-1"><Clock size={10}/>{format(new Date(selected.updatedAt),'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost" onClick={() => { setEditing(selected); setForm(selected); setOpen(true) }}><Edit2 size={14}/>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(selected.id)}><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl">
                {selected.content ? (
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans">{selected.content}</pre>
                ) : (
                  <p className="text-zinc-600 text-sm italic">No content yet. Click Edit to add content.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={BookOpen} title="Select or create a document" description="Your project wiki and notes live here"
              action={<button className="btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true) }}><Plus size={14}/>New doc</button>}/>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); setForm(emptyForm) }} title={editing ? 'Edit Document' : 'New Document'} size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {['note','wiki','runbook','adr','design','other'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Author</label>
            <input className="input" placeholder="Your name" value={form.authorName} onChange={e=>setForm({...form,authorName:e.target.value})}/>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input resize-none font-mono text-xs" rows={14} placeholder="Write your documentation here..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={()=>{setOpen(false);setEditing(null);setForm(emptyForm)}}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>{editing ? 'Save changes' : 'Create doc'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
