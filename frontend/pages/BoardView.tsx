import React, { useState, useEffect } from 'react';
import { Board, Task, TaskPriority, TaskStatus } from '../types';
import * as api from '../services/mockService';
import TaskItem from '../components/TaskItem';
import EditTaskModal from '../components/EditTaskModal';
import { Button, Tape } from '../components/ui/LayoutElements';
import { ArrowLeft, Plus, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../contexts';

interface BoardViewProps {
  boardId: string;
  onBack: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ boardId, onBack }) => {
  const { isDemo, demoBoards, demoTasks, setDemoBoards, setDemoTasks } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  useEffect(() => {
    if (isDemo) {
      const b = demoBoards.find((b) => b.id === boardId) || null;
      setBoard(b);
      setTasks(demoTasks[boardId] || []);
    } else {
      loadData();
    }
  }, [boardId, isDemo, demoBoards, demoTasks]);

  const loadData = async () => {
    const b = (await api.getBoards()).find((b) => b.id === boardId);
    if (b) setBoard(b);
    const t = await api.getTasks(boardId);
    setTasks(t);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (isDemo) {
      const newTask: Task = {
        id: `demo-task-${Date.now()}`,
        boardId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        status: TaskStatus.TODO,
        priority: newTaskPriority,
        createdAt: Date.now(),
        tags: [],
        rotation: Math.random() * 4 - 2,
      };
      setDemoTasks((prev) => ({
        ...prev,
        [boardId]: [...(prev[boardId] || []), newTask],
      }));
      setNewTaskTitle('');
      setNewTaskDescription('');
      setIsAdding(false);
      return;
    }

    await api.createTask({
      boardId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: TaskStatus.TODO,
      priority: newTaskPriority,
      tags: [],
    });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAdding(false);
    loadData();
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    if (isDemo) {
      setDemoTasks((prev) => ({
        ...prev,
        [boardId]: (prev[boardId] || []).map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      }));
      return;
    }
    try {
      const saved = await api.updateTask(updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } catch {
      // keep optimistic update
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (isDemo) {
      setDemoTasks((prev) => ({
        ...prev,
        [boardId]: (prev[boardId] || []).filter((t) => t.id !== id),
      }));
      return;
    }
    await api.deleteTask(id);
  };

  const handleDeleteBoard = async () => {
    if (!confirm('Are you sure you want to shred this entire task list?')) return;
    if (isDemo) {
      setDemoBoards((prev) => prev.filter((b) => b.id !== boardId));
      setDemoTasks((prev) => {
        const next = { ...prev };
        delete next[boardId];
        return next;
      });
      onBack();
      return;
    }
    await api.deleteBoard(boardId);
    onBack();
  };

  // Filter & Search Logic
  const filteredTasks = tasks
    .filter(t => filter === 'ALL' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!board) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <button 
            onClick={onBack}
            className="group flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-pencil-gray hover:text-terracotta transition-colors"
        >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Desk
        </button>

        <div className="flex gap-2 items-center">
            {/* Search Bar */}
            <div className="relative group mr-4">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-pencil-gray group-focus-within:text-terracotta transition-colors" />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find a card..."
                    className="pl-6 bg-transparent border-b border-transparent focus:border-terracotta outline-none font-mono text-sm w-32 focus:w-48 transition-all duration-300 placeholder-pencil-gray/50 text-ink"
                />
            </div>
            <button 
                onClick={handleDeleteBoard}
                className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                title="Delete Board"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>

      <div className="relative mb-12 pb-8 border-b-2 border-stone-200 border-dashed">
        <div className="absolute -top-6 -left-10 opacity-10 pointer-events-none hidden lg:block">
             <div className="text-[120px] font-serif leading-none text-ink">“</div>
        </div>
        
        <h1 className="font-serif text-5xl md:text-6xl text-ink font-bold mb-4 relative z-10">{board.title}</h1>
        <p className="font-hand text-2xl text-olive max-w-2xl">{board.description}</p>
        
        {/* Filter Tabs - Physical Tabs Look */}
        <div className="absolute bottom-[-2px] right-0 flex gap-1 flex-wrap justify-end">
             {(['ALL', TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE] as const).map((s) => (
                <button
                    key={s}
                    onClick={() => setFilter(s as TaskStatus | 'ALL')}
                    className={`
                        px-4 py-2 font-mono text-xs uppercase tracking-wider rounded-t-lg border-t border-l border-r border-stone-300 transition-all
                        ${filter === s 
                            ? 'bg-[#F5F5F0] text-terracotta translate-y-[2px] border-b-[#F5F5F0] z-10 font-bold' 
                            : 'bg-stone-200 text-stone-500 hover:bg-stone-100'}
                    `}
                >
                    {s === 'ALL' ? 'All Cards' : s === TaskStatus.IN_PROGRESS ? 'In Progress' : s}
                </button>
             ))}
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
        {/* Add Task Card - Dotted outline */}
        {!isAdding ? (
            <button 
                onClick={() => setIsAdding(true)}
                className="group h-48 border-4 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-stone-400 hover:border-terracotta hover:text-terracotta hover:bg-white/50 transition-all cursor-pointer opacity-70 hover:opacity-100"
            >
                <Plus size={48} strokeWidth={1} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-hand text-xl">Jot something down...</span>
            </button>
        ) : (
            <div className="col-span-1 md:col-span-2 bg-white p-6 shadow-lg border border-terracotta relative rotate-1 animate-in fade-in zoom-in-95 duration-200">
                <Tape />
                <form onSubmit={handleCreateTask}>
                    <input 
                        className="w-full font-serif text-2xl mb-2 outline-none placeholder:text-stone-300 text-stone-900 font-semibold bg-transparent"
                        placeholder="What needs doing?"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        autoFocus
                    />
                    <textarea
                        className="w-full font-hand text-lg mb-4 outline-none placeholder:text-stone-300 text-stone-600 bg-transparent resize-none border-b border-transparent focus:border-pencil-gray/30 pb-1 min-h-[60px]"
                        placeholder="Add a description (optional)"
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                        rows={2}
                    />
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                        {Object.values(TaskPriority).map(p => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="priority" 
                                    checked={newTaskPriority === p}
                                    onChange={() => setNewTaskPriority(p)}
                                    className="hidden"
                                />
                                <div className={`
                                    w-4 h-4 rounded-full border-2 transition-all
                                    ${newTaskPriority === p ? 'border-terracotta bg-terracotta scale-110' : 'border-stone-300 group-hover:border-olive'}
                                `}></div>
                                <span className={`font-mono text-xs uppercase tracking-wider ${newTaskPriority === p ? 'text-ink font-bold' : 'text-pencil-gray'}`}>
                                    {p}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsAdding(false)} className="py-2 px-4 text-xs">
                            Scrap it
                        </Button>
                        <Button type="submit" className="py-2 px-4 text-xs">
                            Pin it
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {filteredTasks.map((task) => (
            <TaskItem 
                key={task.id} 
                task={task} 
                onUpdate={handleUpdateTask} 
                onDelete={handleDeleteTask}
                onClick={() => setEditingTask(task)}
            />
        ))}

        {filteredTasks.length === 0 && !isAdding && (
            <div className="col-span-full py-12 text-center text-stone-400 font-hand text-xl">
                {searchQuery ? 'No cards match your search.' : 'Nothing here yet.'}
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <EditTaskModal 
            task={editingTask}
            onSave={handleUpdateTask}
            onClose={() => setEditingTask(null)}
            onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default BoardView;