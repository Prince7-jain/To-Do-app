import { User, Board, Task, TaskStatus, TaskPriority } from '../types';

// Use environment variable for API URL or default to localhost
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('folio_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/** Normalize API entities that may return _id from MongoDB to id for frontend */
function normalizeId<T extends { id?: string; _id?: string }>(obj: T): T {
  if (!obj) return obj;
  const id = obj.id ?? (obj as any)._id;
  if (id !== undefined) {
    const { _id, ...rest } = obj as any;
    return { ...rest, id: String(id) } as T;
  }
  return obj;
}

function normalizeTask(t: any): Task {
  const n = normalizeId(t);
  return {
    ...n,
    id: String(n.id),
    boardId: String(n.boardId),
    title: String(n.title),
    description: n.description ?? undefined,
    status: n.status as TaskStatus,
    priority: n.priority as TaskPriority,
    createdAt: Number(n.createdAt),
    dueDate: n.dueDate != null ? Number(n.dueDate) : undefined,
    tags: Array.isArray(n.tags) ? n.tags : [],
    rotation: Number(n.rotation) || 0,
  };
}

function normalizeBoard(b: any): Board {
  const n = normalizeId(b);
  return { ...n, id: String(n.id), createdAt: Number(n.createdAt) };
}

function normalizeUser(u: any): User {
  const n = normalizeId(u);
  return { ...n, id: String(n.id), email: String(n.email), name: String(n.name) };
}

// --- Auth Services: Password Flow ---

export const login = async (email: string, password?: string): Promise<User> => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password || '');

  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) {
     const err = await response.json().catch(() => ({}));
     throw new Error(err.detail || 'Login failed. Check your credentials.');
  }
  
  const data = await response.json();
  localStorage.setItem('folio_token', data.access_token);
  return normalizeUser(data.user);
};

/** Step 1: Send OTP to verify email at registration */
export const registerRequestOtp = async (name: string, email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to send verification code');
    }
};

/** Step 2: Verify OTP and create account (returns user + token) */
export const registerVerifyOtp = async (email: string, otp: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/register-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Invalid or expired code');
    }
    const data = await response.json();
    localStorage.setItem('folio_token', data.access_token);
    return normalizeUser(data.user);
};

/** Request password reset: send OTP to email */
export const requestResetPassword = async (email: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/request-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to send reset code');
    }
};

/** Verify OTP and set new password */
export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to reset password');
    }
};

// --- Auth Services: OTP Flow ---

export const requestOtp = async (email: string): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error('Failed to send code. Please try again.');
    }
};

export const verifyOtp = async (email: string, otp: string, name?: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Invalid code');
    }

    const data = await response.json();
    localStorage.setItem('folio_token', data.access_token);
    return normalizeUser(data.user);
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('folio_token');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('folio_token');
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/users/me`, {
        headers: getHeaders()
    });
    if (response.ok) {
        const data = await response.json();
        return normalizeUser(data);
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Board Services
export const getBoards = async (): Promise<Board[]> => {
  const response = await fetch(`${API_URL}/boards`, { headers: getHeaders() });
  if (!response.ok) return [];
  const list = await response.json();
  return Array.isArray(list) ? list.map(normalizeBoard) : [];
};

export const createBoard = async (board: Omit<Board, 'id' | 'createdAt' | 'userId'>): Promise<Board> => {
  const response = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(board)
  });
  if (!response.ok) throw new Error('Failed to create board');
  return normalizeBoard(await response.json());
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  await fetch(`${API_URL}/boards/${boardId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};

// Task Services
export const getTasks = async (boardId: string): Promise<Task[]> => {
  const response = await fetch(`${API_URL}/boards/${boardId}/tasks`, { headers: getHeaders() });
  if (!response.ok) return [];
  const list = await response.json();
  return Array.isArray(list) ? list.map(normalizeTask) : [];
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'rotation'>): Promise<Task> => {
  const payload = {
    ...task,
    rotation: task.rotation ?? Math.random() * 4 - 2,
    tags: task.tags ?? [],
  };
  
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) throw new Error('Failed to create task');
  return normalizeTask(await response.json());
};

export const updateTask = async (task: Task): Promise<Task> => {
  const payload = {
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? null,
    rotation: task.rotation ?? 0,
    tags: task.tags ?? null,
  };
  const response = await fetch(`${API_URL}/tasks/${task.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) throw new Error('Failed to update task');
  return normalizeTask(await response.json());
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};

export const seedDataIfEmpty = () => {
  // No-op for real backend
};