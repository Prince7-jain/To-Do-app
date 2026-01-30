import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { Button, Input, TextArea, PaperSheet, Tape, ModalOverlay, Divider } from './ui/LayoutElements';
import { X, Calendar, AlertCircle, Paperclip, Bookmark, Trash2, Check, Circle } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  onSave: (task: Task) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onSave, onClose, onDelete }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  // Convert timestamp to YYYY-MM-DD for input type="date"
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined
    });
    onClose();
  };

  const getPriorityIcon = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.HIGH: return <AlertCircle className="w-4 h-4" />;
      case TaskPriority.MEDIUM: return <Paperclip className="w-4 h-4" />;
      case TaskPriority.LOW: return <Bookmark className="w-4 h-4" />;
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <PaperSheet className="p-8 md:p-12 rotate-1 shadow-2xl">
        <Tape />
        
        {/* Close button - looks like a doodle */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-pencil-gray hover:text-terracotta hover:rotate-90 transition-all duration-300"
        >
            <X size={24} />
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-1">Title</label>
                <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-serif text-3xl font-bold border-b-2 border-ink pb-2"
                    placeholder="Task Title..."
                    autoFocus
                />
            </div>

            <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2">Status</label>
                <div className="flex flex-wrap gap-3">
                    {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((s) => (
                        <label
                            key={s}
                            className={`
                                cursor-pointer flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all
                                ${status === s
                                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                                    : 'border-stone-200 text-stone-400 hover:border-olive'}
                            `}
                        >
                            <input
                                type="radio"
                                name="status"
                                className="hidden"
                                checked={status === s}
                                onChange={() => setStatus(s)}
                            />
                            {s === TaskStatus.DONE ? <Check size={18} /> : <Circle size={18} />}
                            <span className="font-mono text-xs font-bold">{s === TaskStatus.IN_PROGRESS ? 'In Progress' : s}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-3">Priority</label>
                     <div className="flex gap-4">
                        {Object.values(TaskPriority).map((p) => (
                            <label key={p} className={`
                                cursor-pointer flex items-center gap-2 px-3 py-2 border-2 rounded-lg transition-all
                                ${priority === p 
                                    ? 'border-terracotta bg-terracotta/10 text-terracotta' 
                                    : 'border-stone-200 text-stone-400 hover:border-olive'}
                            `}>
                                <input 
                                    type="radio" 
                                    name="priority" 
                                    className="hidden" 
                                    checked={priority === p}
                                    onChange={() => setPriority(p)} 
                                />
                                {getPriorityIcon(p)}
                                <span className="font-mono text-xs font-bold">{p}</span>
                            </label>
                        ))}
                     </div>
                </div>

                <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2">Due Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-0 bottom-3 text-pencil-gray w-5 h-5" />
                        <Input 
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="pl-8 font-mono"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2">Details & Notes</label>
                <TextArea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more context..."
                />
            </div>

            <Divider />

            <div className="flex justify-between items-center pt-2">
                <button 
                    type="button"
                    onClick={() => { onDelete(task.id); onClose(); }}
                    className="flex items-center gap-2 text-stone-400 hover:text-red-600 transition-colors font-mono text-xs uppercase tracking-widest"
                >
                    <Trash2 size={16} /> Delete Card
                </button>

                <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Changes
                    </Button>
                </div>
            </div>
        </form>
      </PaperSheet>
    </ModalOverlay>
  );
};

export default EditTaskModal;