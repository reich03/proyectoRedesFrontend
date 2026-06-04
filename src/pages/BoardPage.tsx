import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, DragStartEvent, DragEndEvent, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, GripVertical, Flag, Circle, Clock, CheckCircle2, Loader,
  Eye, Flame, X, ArrowRight, Trash2,
} from 'lucide-react';
import { sprintsApi, tasksApi, usersApi } from '../lib/api';
import { Sprint, Task, User as IUser } from '../types';
import clsx from 'clsx';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',      icon: Circle,       color: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
  { id: 'in_progress', label: 'In Progress', icon: Loader,       color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  { id: 'review',      label: 'Review',      icon: Eye,          color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  { id: 'done',        label: 'Done',        icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-zinc-400', medium: 'text-blue-400', high: 'text-amber-400', critical: 'text-red-400',
};

const SPRINT_STATUS_STYLES: Record<string, string> = {
  planning: 'bg-zinc-500/10 text-zinc-400',
  active:   'bg-emerald-500/10 text-emerald-400',
  review:   'bg-amber-500/10 text-amber-400',
  done:     'bg-blue-500/10 text-blue-400',
};

const SPRINT_NEXT: Record<string, string | null> = {
  planning: 'active', active: 'review', review: 'done', done: null,
};
const SPRINT_NEXT_LABEL: Record<string, string> = {
  planning: 'Start Sprint', active: 'Move to Review', review: 'Complete Sprint',
};

// ── Droppable column wrapper (required by @dnd-kit to detect empty-column drops)
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}
      className={clsx('flex-1 overflow-y-auto space-y-2 pr-1 rounded-lg transition-colors min-h-[4rem]',
        isOver && 'bg-violet-500/5')}>
      {children}
    </div>
  );
}

// ── Draggable task card
function TaskCard({ task, isDragging, onClick }: { task: Task; isDragging?: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const PIcon = task.priority === 'critical' ? Flame : Flag;

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={clsx('card-sm p-3 cursor-pointer select-none', isDragging && 'opacity-40')}
      onClick={onClick}>
      <div className="flex items-start gap-2">
        <button {...listeners}
          className="mt-0.5 text-zinc-700 hover:text-zinc-400 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}>
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-100 leading-snug">{task.title}</p>
          {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2">
              <PIcon size={12} className={PRIORITY_COLORS[task.priority]} />
              {task.storyPoints != null && (
                <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{task.storyPoints}pts</span>
              )}
            </div>
            {task.assignee && (
              <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[9px] text-white font-medium"
                title={task.assignee.name}>
                {task.assignee.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Task detail / edit modal
function TaskModal({ task, users, onClose, onUpdate, onDelete }: {
  task: Task;
  users: IUser[];
  onClose: () => void;
  onUpdate: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({
    title:       task.title,
    description: task.description || '',
    status:      task.status,
    priority:    task.priority,
    storyPoints: task.storyPoints?.toString() || '',
    assigneeId:  task.assigneeId || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updated = await tasksApi.update(task.id, {
      ...form,
      storyPoints: form.storyPoints ? parseInt(form.storyPoints) : null,
      assigneeId:  form.assigneeId || null,
    });
    onUpdate({ ...task, ...updated });
    setSaving(false);
    onClose();
  };

  const del = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await tasksApi.delete(task.id);
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-100">Task Detail</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Title</label>
            <input className="input w-full" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Description</label>
            <textarea className="input w-full resize-none h-20" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Status</label>
              <select className="input w-full" value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Priority</label>
              <select className="input w-full" value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value as any }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Story Points</label>
              <input className="input w-full" type="number" placeholder="–" value={form.storyPoints}
                onChange={e => setForm(p => ({ ...p, storyPoints: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Assignee</label>
              <select className="input w-full" value={form.assigneeId}
                onChange={e => setForm(p => ({ ...p, assigneeId: e.target.value }))}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-zinc-800">
          <button onClick={del} className="btn-danger text-xs flex items-center gap-1.5">
            <Trash2 size={13} /> Delete
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-xs">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary text-xs">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main board page
export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [sprints, setSprints]           = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [users, setUsers]               = useState<IUser[]>([]);
  const [dragging, setDragging]         = useState<Task | null>(null);
  const [showAdd, setShowAdd]           = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assigneeId: '', storyPoints: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    const [s, u] = await Promise.all([sprintsApi.getByProject(id!), usersApi.getAll()]);
    setSprints(s);
    setUsers(u);
    const active = s.find((x: Sprint) => x.status === 'active') || s[0] || null;
    setActiveSprint(active);
    if (active) await loadTasks(active.id);
  };

  const loadTasks = async (sprintId: string) => {
    const t = await tasksApi.getBySprint(sprintId);
    setTasks(t);
  };

  const selectSprint = (s: Sprint) => { setActiveSprint(s); loadTasks(s.id); };

  const advanceSprint = async () => {
    if (!activeSprint) return;
    const next = SPRINT_NEXT[activeSprint.status];
    if (!next) return;
    const updated = await sprintsApi.update(activeSprint.id, { status: next });
    setActiveSprint(updated);
    setSprints(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleDragStart = (e: DragStartEvent) => {
    setDragging(tasks.find(t => t.id === e.active.id) || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setDragging(null);
    const { active, over } = e;
    if (!over) return;
    // over.id can be a column id OR a task id — resolve to column either way
    const colById   = COLUMNS.find(c => c.id === over.id);
    const taskOver  = tasks.find(t => t.id === over.id);
    const targetCol = colById?.id ?? (taskOver ? taskOver.status : null);
    if (!targetCol) return;
    const task = tasks.find(t => t.id === active.id);
    if (task && task.status !== targetCol) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: targetCol as any } : t));
      await tasksApi.update(task.id, { status: targetCol });
    }
  };

  const addTask = async (status: string) => {
    if (!newTask.title.trim() || !activeSprint) return;
    const t = await tasksApi.create({
      ...newTask, status, sprintId: activeSprint.id,
      assigneeId:  newTask.assigneeId || null,
      storyPoints: newTask.storyPoints ? parseInt(newTask.storyPoints) : null,
      order: tasks.filter(x => x.status === status).length,
    });
    setTasks(prev => [...prev, t]);
    setShowAdd(null);
    setNewTask({ title: '', description: '', priority: 'medium', assigneeId: '', storyPoints: '' });
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Board</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {sprints.map(s => (
              <button key={s.id} onClick={() => selectSprint(s)}
                className={clsx('text-xs px-3 py-1.5 rounded-lg transition-colors',
                  activeSprint?.id === s.id ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100')}>
                {s.name}
              </button>
            ))}
            {sprints.length === 0 && (
              <span className="text-sm text-zinc-500">
                No sprints —{' '}
                <Link to={`/projects/${id}/sprints`}
                  className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">
                  create one in Sprints
                </Link>
              </span>
            )}
          </div>
        </div>

        {activeSprint && (
          <div className="flex items-center gap-3">
            <span className={clsx('badge text-xs capitalize', SPRINT_STATUS_STYLES[activeSprint.status])}>
              {activeSprint.status}
            </span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock size={12} />
              {activeSprint.startDate || '–'} → {activeSprint.endDate || '–'}
            </span>
            {SPRINT_NEXT[activeSprint.status] && (
              <button onClick={advanceSprint}
                className="btn-primary text-xs flex items-center gap-1.5">
                <ArrowRight size={13} />
                {SPRINT_NEXT_LABEL[activeSprint.status]}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {!activeSprint ? (
        <div className="card p-16 text-center space-y-4">
          <p className="text-zinc-500">Select or create a sprint to start</p>
          <Link to={`/projects/${id}/sprints`} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus size={14} /> New Sprint
          </Link>
        </div>
      ) : (
        /* ── Kanban board ── */
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-4 h-[calc(100vh-220px)]">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id).sort((a, b) => a.order - b.order);
              return (
                <div key={col.id} className="flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <col.icon size={14} className={col.color} />
                      <span className="text-xs font-medium text-zinc-300">{col.label}</span>
                      <span className={clsx('badge text-xs', col.bg, col.color)}>{colTasks.length}</span>
                    </div>
                    <button onClick={() => setShowAdd(col.id)}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Droppable + sortable list */}
                  <DroppableColumn id={col.id}>
                    <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      {colTasks.map(t => (
                        <TaskCard key={t.id} task={t} isDragging={dragging?.id === t.id}
                          onClick={() => setSelectedTask(t)} />
                      ))}
                    </SortableContext>

                    {/* Inline add form */}
                    {showAdd === col.id && (
                      <div className="card-sm p-3 space-y-2 animate-slide-up">
                        <input className="input text-xs py-1.5" placeholder="Task title"
                          value={newTask.title} autoFocus
                          onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addTask(col.id)} />
                        <textarea className="input text-xs py-1.5 resize-none h-14" placeholder="Description"
                          value={newTask.description}
                          onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} />
                        <div className="flex gap-2">
                          <select className="input text-xs py-1.5" value={newTask.priority}
                            onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                          <input className="input text-xs py-1.5 w-20" placeholder="pts" type="number"
                            value={newTask.storyPoints}
                            onChange={e => setNewTask(p => ({ ...p, storyPoints: e.target.value }))} />
                        </div>
                        <select className="input text-xs py-1.5" value={newTask.assigneeId}
                          onChange={e => setNewTask(p => ({ ...p, assigneeId: e.target.value }))}>
                          <option value="">Unassigned</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => setShowAdd(null)} className="btn-ghost text-xs py-1 flex-1">Cancel</button>
                          <button onClick={() => addTask(col.id)} className="btn-primary text-xs py-1 flex-1">Add</button>
                        </div>
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
          <DragOverlay>{dragging && <TaskCard task={dragging} onClick={() => {}} />}</DragOverlay>
        </DndContext>
      )}

      {/* ── Task detail modal ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          users={users}
          onClose={() => setSelectedTask(null)}
          onUpdate={updated => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))}
          onDelete={taskId => setTasks(prev => prev.filter(t => t.id !== taskId))}
        />
      )}
    </div>
  );
}
