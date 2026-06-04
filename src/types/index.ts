export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  color?: string;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  sprints?: Sprint[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'admin' | 'dev' | 'viewer';
  joinedAt: string;
  user?: User;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'review' | 'done';
  startDate?: string;
  endDate?: string;
  projectId: string;
  createdAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  order: number;
  dueDate?: string;
  storyPoints?: number;
  sprintId: string;
  assigneeId?: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  label: string;
  type: 'env' | 'api_key' | 'url' | 'secret' | 'database' | 'other';
  environment?: string;
  value: string;
  notes?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doc {
  id: string;
  title: string;
  content?: string;
  category?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  projectId?: string;
  userId?: string;
  user?: User;
  project?: Project;
  createdAt: string;
}

export interface ProjectStats {
  totalSprints: number;
  totalTasks: number;
  doneTasks: number;
  overallSuccess: number;
  sprints: { id: string; name: string; status: string; total: number; done: number; successRate: number }[];
}
