import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { Trash2, Check, Paperclip, AlertCircle, Bookmark, Clock } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete, onClick }) => {
  const isDone = task.status === TaskStatus.DONE;

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...task,
      status: isDone ? TaskStatus.TODO : TaskStatus.DONE
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case TaskPriority.HIGH: return <AlertCircle className="w-4 h-4 text-red-600" />;
      case TaskPriority.MEDIUM: return <Paperclip className="w-4 h-4 text-denim" />;
      case TaskPriority.LOW: return <Bookmark className="w-4 h-4 text-olive" />;
    }
  };

  const priorityLabel = {
    [TaskPriority.HIGH]: 'Urgent',
    [TaskPriority.MEDIUM]: 'Standard',
    [TaskPriority.LOW]: 'Low Key'
  };

  // Rotation style from task data for "messy" look
  const rotationStyle = {
    transform: `rotate(${task.rotation}deg)`,
  };

  // Check if overdue
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && !isDone;

  return (
    <div 
      onClick={onClick}
      style={rotationStyle}
      className={`
        group relative p-6 bg-white
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-[5px_8px_15px_rgba(0,0,0,0.1)]
        hover:z-10 cursor-pointer
        ${isDone ? 'opacity-80 grayscale-[0.5]' : 'shadow-[2px_3px_5px_rgba(0,0,0,0.08)]'}
        border border-stone-200
        flex flex-col
      `}
    >
        {/* Paper texture overlay */}
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none mix-blend-multiply"></div>

        {/* Top "Pin" or indicator */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="w-3 h-3 rounded-full bg-stone-300 shadow-sm border border-stone-400"></div>
        </div>

        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${isDone ? 'line-through decoration-terracotta decoration-2' : 'text-pencil-gray'}`}>
                {getPriorityIcon()}
                <span>{priorityLabel[task.priority]}</span>
            </div>
            {task.dueDate && (
                <span className={`font-hand text-sm font-bold flex items-center gap-1 ${isOverdue ? 'text-red-600 animate-pulse' : 'text-terracotta'}`}>
                    {isOverdue && <Clock size={12} />}
                    {isOverdue ? 'Overdue' : `Due ${new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}`}
                </span>
            )}
        </div>

        <h3 className={`font-serif text-xl font-medium mb-2 leading-tight ${isDone ? 'line-through decoration-terracotta/60 decoration-wavy' : 'text-ink'}`}>
            {task.title}
        </h3>
        
        {task.description && (
            <p className="font-hand text-lg text-pencil-gray mb-4 leading-relaxed line-clamp-3">
                {task.description}
            </p>
        )}

        <div className="mt-auto pt-4 border-t border-dashed border-stone-200 flex items-center justify-between relative z-10">
            <button 
                onClick={handleStatusToggle}
                className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
                    ${isDone 
                        ? 'border-terracotta text-terracotta bg-terracotta/10 rotate-12 scale-110' 
                        : 'border-stone-300 text-stone-300 hover:border-olive hover:text-olive'}
                `}
                title={isDone ? "Mark as TODO" : "Mark as DONE"}
            >
                {isDone ? <Check size={18} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-current opacity-0 hover:opacity-100 transition-opacity" />}
            </button>

            <button 
                onClick={handleDelete}
                className="text-stone-300 hover:text-red-500 transition-colors p-2"
                title="Discard"
            >
                <Trash2 size={16} />
            </button>
        </div>

        {/* "Stamp" effect when done */}
        {isDone && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rotate-[-15deg] border-4 border-terracotta/20 p-2 rounded-lg z-0">
                <span className="text-4xl font-bold uppercase text-terracotta/20 tracking-widest font-mono">DONE</span>
            </div>
        )}
    </div>
  );
};

export default TaskItem;