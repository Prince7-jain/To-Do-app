import React, { useState, useEffect } from 'react';
import { Board } from '../types';
import * as api from '../services/mockService';
import { PaperSheet, Button, Divider, HolePunch } from '../components/ui/LayoutElements';
import { Plus, FolderOpen, Calendar } from 'lucide-react';
import { useAuth } from '../contexts';

interface DashboardProps {
  onOpenBoard: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenBoard }) => {
  const { isDemo, demoBoards, setDemoBoards } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    if (isDemo) {
      setBoards(demoBoards);
    } else {
      loadBoards();
    }
  }, [isDemo, demoBoards]);

  const loadBoards = async () => {
    const data = await api.getBoards();
    setBoards(data);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    if (isDemo) {
      const newBoard: Board = {
        id: `demo-board-${Date.now()}`,
        title: newBoardTitle.trim(),
        description: 'New task',
        userId: 'demo-user',
        theme: 'plain',
        createdAt: Date.now(),
      };
      setDemoBoards((prev) => [...prev, newBoard]);
      setNewBoardTitle('');
      setShowCreate(false);
      return;
    }

    await api.createBoard({
      title: newBoardTitle,
      description: 'New task',
      theme: 'plain',
    });
    setNewBoardTitle('');
    setShowCreate(false);
    loadBoards();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
            <h2 className="font-serif text-5xl text-ink mb-1">Overview</h2>
            <p className="font-hand text-xl text-olive ml-2">Everything on your desk today.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} variant="secondary">
            <Plus className="inline mr-2 w-4 h-4" /> New task
        </Button>
      </header>

      {/* Create Board Form (Inline, organic expansion) */}
      {showCreate && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <PaperSheet className="p-8 max-w-lg mx-auto rotate-[-1deg]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl text-ink">New task</h3>
                    <button onClick={() => setShowCreate(false)} className="text-pencil-gray hover:text-red-500 font-mono text-xs uppercase">Cancel</button>
                </div>
                <form onSubmit={handleCreateBoard} className="flex gap-4">
                    <input 
                        type="text" 
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        placeholder="Task name..."
                        className="flex-1 bg-transparent border-b-2 border-ink font-serif text-xl text-ink focus:border-terracotta outline-none pb-2 placeholder-ink/30"
                        autoFocus
                    />
                    <Button type="submit">Create</Button>
                </form>
            </PaperSheet>
        </div>
      )}

      {/* Board Grid - Masonry-ish feel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {boards.map((board, index) => (
            <div 
                key={board.id}
                onClick={() => onOpenBoard(board.id)}
                className={`
                    group cursor-pointer relative transition-all duration-300
                    hover:-translate-y-2 hover:z-10
                `}
                style={{
                    transform: `rotate(${index % 2 === 0 ? '1deg' : '-1deg'})`
                }}
            >
                {/* Folder Tab */}
                <div className="absolute top-0 left-0 w-1/3 h-8 bg-[#EBE7E0] rounded-t-lg border-t border-l border-r border-[#D1CEC4] group-hover:bg-mustard/20 transition-colors"></div>
                
                {/* Main Folder Body */}
                <PaperSheet className="mt-6 p-8 min-h-[200px] flex flex-col justify-between rounded-tr-lg rounded-br-lg rounded-bl-lg">
                    {/* Decorative holes like a ring binder */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-12">
                        <HolePunch />
                        <HolePunch />
                    </div>

                    <div className="pl-8">
                        <h3 className="font-serif text-3xl font-bold text-ink mb-2 leading-none group-hover:text-terracotta transition-colors">
                            {board.title}
                        </h3>
                        <p className="font-hand text-lg text-pencil-gray line-clamp-2">
                            {board.description}
                        </p>
                    </div>

                    <div className="pl-8 mt-6 pt-6 border-t border-dashed border-stone-300 flex justify-between items-center text-xs font-mono text-pencil-gray uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-2">
                            <Calendar size={12} />
                            {new Date(board.createdAt).toLocaleDateString()}
                        </span>
                        <FolderOpen size={14} className="group-hover:text-terracotta" />
                    </div>
                </PaperSheet>
            </div>
        ))}

        {boards.length === 0 && !showCreate && (
            <div className="col-span-full py-20 text-center opacity-50">
                <p className="font-serif text-2xl italic text-pencil-gray">Your desk is clear.</p>
                <p className="font-hand text-lg mt-2 text-ink">Create a new task to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;