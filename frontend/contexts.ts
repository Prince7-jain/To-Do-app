import { createContext, useContext } from 'react';
import { User, Board, Task } from './types';

export interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: () => void;
  isLoading: boolean;
  isDemo: boolean;
  demoBoards: Board[];
  demoTasks: Record<string, Task[]>;
  setDemoBoards: React.Dispatch<React.SetStateAction<Board[]>>;
  setDemoTasks: React.Dispatch<React.SetStateAction<Record<string, Task[]>>>;
  resetDemo: () => void;
  showRegisterBanner: boolean;
  setShowRegisterBanner: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);