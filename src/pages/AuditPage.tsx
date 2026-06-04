import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, TrendingUp, CheckCircle, GitBranch, BarChart2 } from 'lucide-react';
import { auditApi, projectsApi } from '../lib/api';
import { AuditLog, ProjectStats } from '../types';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import clsx from 'clsx';

const ACTION_COLORS: Record<string, string> = {
  CREATE:        'text-emerald-400 bg-emerald-500/10',
  UPDATE:        'text-blue-400 bg-blue-500/10',
  DELETE:        'text-red-400 bg-red-500/10',
  STATUS_CHANGE: 'text-amber-400 bg-amber-500/10',
};

export default function AuditPage() {
  const { id } = useParams<{ id: string }>();
  const [logs, setLogs]   = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([auditApi.getByProject(id), projectsApi.getStats(id)])
      .then(([l, s]) => { setLogs(l); setStats(s); });
  }, [id]);

  const radialData = stats ? [{ name: 'Success', value: stats.overallSuccess, fill: '#7c3aed' }] : [];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-xl font-semibold">Audit &amp; Analytics</h1>

      {stats && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Sprints', value: stats.totalSprints,  icon: GitBranch,  color: 'text-violet-400' },
              { label: 'Total Tasks',   value: stats.totalTasks,    icon: Activity,   color: 'text-blue-400' },
              { label: 'Done Tasks',    value: stats.doneTasks,     icon: CheckCircle,color: 'text-emerald-400' },
              { label: 'Success Rate',  value: `${stats.overallSuccess}%`, icon: TrendingUp, color: 'text-amber-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={color} />
                  <span className="text-xs text-zinc-500">{label}</span>
                </div>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Bar chart */}
            <div className="card p-5">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <BarChart2 size={14} className="text-violet-400" /> Sprint success rates
              </h3>
              {stats.sprints.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.sprints} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [`${v}%`, 'Success']}
                    />
                    <Bar dataKey="successRate" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">No sprint data yet</div>
              )}
            </div>

            {/* Radial chart */}
            <div className="card p-5 flex flex-col items-center justify-center">
              <h3 className="text-sm font-medium mb-2 self-start flex items-center gap-2">
                <TrendingUp size={14} className="text-violet-400" /> Overall progress
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart innerRadius="60%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" background={{ fill: '#27272a' }} cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-3xl font-semibold -mt-12">{stats.overallSuccess}%</p>
              <p className="text-xs text-zinc-500 mt-1">overall completion</p>
            </div>
          </div>
        </>
      )}

      {/* Activity log */}
      <div className="card">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Activity size={14} className="text-violet-400" />
          <h3 className="text-sm font-medium">Activity log</h3>
          <span className="badge bg-zinc-500/10 text-zinc-400 text-xs">{logs.length} events</span>
        </div>
        <div className="divide-y divide-zinc-800/50 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-sm">No activity recorded yet</div>
          ) : logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-zinc-800/20 transition-colors">
              <span className={clsx('badge text-xs flex-shrink-0 mt-0.5', ACTION_COLORS[log.action] ?? 'bg-zinc-500/10 text-zinc-400')}>
                {log.action}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300">{log.details}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">{log.entityType}</span>
                  {log.user && <span className="text-xs text-zinc-500">by {log.user.name}</span>}
                </div>
              </div>
              <span className="text-xs text-zinc-600 flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
