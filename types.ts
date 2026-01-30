export interface User {
  id: string;
  email: string;
  name: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW', // Folded corner
  MEDIUM = 'MEDIUM', // Paperclip
  HIGH = 'HIGH' // Red Stamp
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  dueDate?: number;
  tags?: string[];
  rotation: number; // For visual imperfection
}

export interface Board {
  id: string;
  title: string;
  description: string;
  userId: string;
  theme: 'plain' | 'grid' | 'lines' | 'dots';
  createdAt: number;
}