import { Board, Task, TaskPriority, TaskStatus } from './types';

const DEMO_USER_ID = 'demo-user';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

/** Fixed seed boards – same for every demo session */
export const DEMO_BOARDS: Board[] = [
  {
    id: 'demo-board-1',
    title: 'Work',
    description: 'Tasks for work and projects.',
    userId: DEMO_USER_ID,
    theme: 'plain',
    createdAt: now - 5 * day,
  },
  {
    id: 'demo-board-2',
    title: 'Personal',
    description: 'Personal errands and ideas.',
    userId: DEMO_USER_ID,
    theme: 'plain',
    createdAt: now - 2 * day,
  },
];

/** Fixed seed tasks per board – same for every demo session */
export const DEMO_TASKS: Record<string, Task[]> = {
  'demo-board-1': [
    {
      id: 'demo-task-1',
      boardId: 'demo-board-1',
      title: 'Review project proposal',
      description: 'Go through the Q4 proposal and add comments.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      createdAt: now - 3 * day,
      dueDate: now + 2 * day,
      tags: [],
      rotation: -1.2,
    },
    {
      id: 'demo-task-2',
      boardId: 'demo-board-1',
      title: 'Send weekly update',
      description: 'Email the team with progress and blockers.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      createdAt: now - 1 * day,
      tags: [],
      rotation: 0.8,
    },
    {
      id: 'demo-task-3',
      boardId: 'demo-board-1',
      title: 'Schedule 1:1s',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      createdAt: now - 4 * day,
      tags: [],
      rotation: -0.5,
    },
    {
      id: 'demo-task-4',
      boardId: 'demo-board-1',
      title: 'Prepare deck for Monday',
      description: 'Slides for the client presentation.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      createdAt: now - 2 * day,
      dueDate: now + 5 * day,
      tags: [],
      rotation: 1.1,
    },
  ],
  'demo-board-2': [
    {
      id: 'demo-task-5',
      boardId: 'demo-board-2',
      title: 'Buy groceries',
      description: 'Milk, bread, eggs, coffee.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      createdAt: now - 1 * day,
      tags: [],
      rotation: -0.3,
    },
    {
      id: 'demo-task-6',
      boardId: 'demo-board-2',
      title: 'Call mom',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      createdAt: now - 2 * day,
      tags: [],
      rotation: 0.6,
    },
    {
      id: 'demo-task-7',
      boardId: 'demo-board-2',
      title: 'Book dentist appointment',
      description: 'Check availability for next week.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.LOW,
      createdAt: now,
      tags: [],
      rotation: -1,
    },
  ],
};

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@folio.com',
  name: 'Demo User',
};
