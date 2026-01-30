import React from 'react';

export const PaperSheet: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white relative shadow-[2px_3px_5px_rgba(0,0,0,0.1)] hover:shadow-[3px_5px_8px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out border border-[#E0DCD0] ${className}`}
  >
    <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none mix-blend-multiply"></div>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative font-mono font-bold uppercase tracking-wider text-sm px-6 py-3 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-terracotta text-white shadow-[4px_4px_0px_0px_rgba(44,42,41,1)] border-2 border-ink hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(44,42,41,1)]",
    secondary: "bg-paper-dark text-ink shadow-[3px_3px_0px_0px_rgba(44,42,41,0.3)] border-2 border-ink hover:-translate-y-0.5",
    danger: "bg-red-700 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <div className="relative group">
    <input 
      className={`w-full bg-transparent border-b-2 border-pencil-gray/30 focus:border-terracotta outline-none py-2 font-mono text-ink placeholder-ink/40 transition-colors ${className}`}
      {...props}
    />
    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-terracotta transition-all duration-500 group-focus-within:w-full" />
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <div className="relative group">
    <textarea 
      className={`w-full bg-transparent border-b-2 border-pencil-gray/30 focus:border-terracotta outline-none py-2 font-hand text-xl text-ink placeholder-ink/40 transition-colors resize-y min-h-[100px] ${className}`}
      {...props}
    />
    <div className="absolute bottom-1 left-0 w-0 h-0.5 bg-terracotta transition-all duration-500 group-focus-within:w-full" />
  </div>
);

export const ModalOverlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="absolute inset-0" onClick={onClose} />
    <div className="relative z-10 w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {children}
    </div>
  </div>
);

export const Tape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute h-8 w-24 bg-denim/40 rotate-[-4deg] -top-3 left-1/2 -translate-x-1/2 backdrop-blur-[1px] shadow-sm border-l border-r border-white/20 ${className}`}></div>
);

export const HolePunch: React.FC = () => (
  <div className="w-4 h-4 rounded-full bg-stone-800/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] border border-white/30"></div>
);

export const Divider: React.FC = () => (
    <div className="w-full h-px bg-pencil-gray/20 my-4 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-pencil-gray/40"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-pencil-gray/40"></div>
    </div>
);