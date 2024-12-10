import { create } from 'zustand';

export type Task = {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    filename?: string;
    size?: number;
    hash?: string;
}

export type Log = {
    jobId: string;
    progress: number;
    log: string;
    status: string;
    hash?: string;
    timestamp?: number;
}

type TaskStore = {
    activeJob: Task | null;
    history: Task[];
    queue: Task[];
    logs: Log[];
    isConnected: boolean;
    setActiveJob: (task: Task | null) => void;
    setHistory: (tasks: Task[]) => void;
    setQueue: (tasks: Task[]) => void;
    addLog: (log: Log) => void;
    setIsConnected: (status: boolean) => void;
    clearLogs: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
    activeJob: null,
    history: [],
    queue: [],
    logs: [],
    isConnected: false,
    setActiveJob: (task) => set((state) => ({
        activeJob: task ? { ...state.activeJob, ...task } : null
    })),
    setHistory: (tasks) => set({ history: tasks }),
    setQueue: (tasks) => set({ queue: tasks }),
    addLog: (log) => set((state) => ({ logs: [...state.logs, { ...log, timestamp: log.timestamp || Date.now() }] })),
    setIsConnected: (status) => set({ isConnected: status }),
    clearLogs: () => set({ logs: [] }),
}));
