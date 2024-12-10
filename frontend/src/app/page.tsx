'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useSSE } from '@/hooks/useSSE';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, UploadCloud, CheckCircle2, CircleDashed, FileBox, Hash } from 'lucide-react';

export default function Home() {
    useSSE();
    const { isConnected, activeJob, logs, queue, history, setQueue, setHistory, clearLogs, setActiveJob } = useTaskStore();
    const logEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:4000/api/tasks');
            const data = await res.json();
            setQueue(data.queue);
            setHistory(data.history);

            const currentActive = useTaskStore.getState().activeJob;

            if (data.activeJob) {
                if (!currentActive || currentActive.id !== data.activeJob.id) {
                    setActiveJob(data.activeJob);
                }
            } else if (currentActive && currentActive.status === 'running') {
                const finishedJob = data.history.find((h: { id: string }) => h.id === currentActive.id);
                if (finishedJob) {
                    setActiveJob(finishedJob);
                } else {
                    setActiveJob({ id: currentActive.id, status: 'completed' });
                }
            }
        } catch (e) {
            console.error('Failed to fetch tasks', e);
        }
    }, [setQueue, setHistory, setActiveJob]);

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 2000);
        return () => clearInterval(interval);
    }, [fetchTasks]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(Array.from(e.target.files));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleRunTask = async () => {
        if (selectedFiles.length === 0) return;

        if (!activeJob)
            clearLogs();


        setIsUploading(true);
        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            await fetch('http://localhost:4000/api/tasks', {
                method: 'POST',
                body: formData
            });

            setSelectedFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchTasks();
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const latestProgress = latestLog?.progress || 0;

    const finalHash = latestLog?.hash || activeJob?.hash;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-mono">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="flex items-center justify-between border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Activity className="text-indigo-600" />
                            TaskStream Hasher
                        </h1>
                        <p className="text-slate-500 mt-2">Deterministic async streaming file hasher.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">SSE Stream</span>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                </header>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex-1 w-full md:w-auto flex gap-3 items-center">
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                            onClick={handleRunTask}
                            disabled={selectedFiles.length === 0 || isUploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm w-full md:w-auto"
                        >
                            <UploadCloud className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : `Upload & Hash ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center px-1">
                    <div className="text-sm text-slate-500 font-medium">
                        Queue: {queue.length} | History: {history.length}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <Card className="bg-white border-slate-200 shadow-md text-slate-900 ring-0">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                Active Job
                                {activeJob ? (
                                    <Badge variant={activeJob.status === 'completed' ? 'default' : 'secondary'} className={
                                        activeJob.status === 'running' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                            activeJob.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                activeJob.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' : ''
                                    }>
                                        {activeJob.status}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-500 border-slate-200">Idle</Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-mono text-xs flex flex-col gap-1 mt-2">
                                <span>ID: {activeJob ? activeJob.id : 'No job currently running'}</span>
                                {activeJob?.filename && (
                                    <span className="flex items-center gap-1 text-slate-700 font-medium bg-slate-100 p-1.5 rounded-md mt-1">
                                        <FileBox className="w-3 h-3" />
                                        {activeJob.filename}
                                        {activeJob.size && <span className="text-slate-400 font-normal ml-1">({(activeJob.size / 1024 / 1024).toFixed(2)} MB)</span>}
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-slate-600 font-medium">
                                    <span>Progress</span>
                                    <span>{activeJob ? latestProgress : 0}%</span>
                                </div>
                                <Progress value={activeJob ? latestProgress : 0} className="bg-slate-100" />
                            </div>

                            {activeJob?.status === 'running' && (
                                <div className="flex items-center text-sm text-amber-600 gap-2 font-medium">
                                    <CircleDashed className="w-4 h-4 animate-spin" />
                                    Calculating SHA-256 hash...
                                </div>
                            )}
                            {activeJob?.status === 'completed' && (
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-green-600 gap-2 font-medium">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Hash successfully computed
                                    </div>
                                    {finalHash && (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs break-all flex gap-2 items-start mt-2 text-slate-700">
                                            <Hash className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                            {finalHash}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200 shadow-md text-slate-700 font-mono text-sm pt-0 ring-0">
                        <CardHeader className="py-2 border-b border-slate-200 bg-white rounded-t-xl">
                            <CardTitle className="text-sm font-medium text-slate-600 flex justify-between items-center">
                                Terminal Output
                                <Button variant="ghost" size="sm" onClick={clearLogs} className="h-6 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100">Clear</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[250px] w-full p-4">
                                <div className="space-y-1 text-xs">
                                    {logs.length === 0 ? (
                                        <span className="text-slate-400">Waiting for events...</span>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} className="flex gap-4">
                                                <span className="text-slate-400 shrink-0">
                                                    {new Date(log.timestamp || Date.now()).toISOString().split('T')[1].slice(0, 12)}
                                                </span>
                                                <span className={
                                                    log.log?.includes('Complete') ? 'text-green-600 font-bold' :
                                                        log.log?.includes('Error') ? 'text-red-500' : 'text-slate-600'
                                                }>
                                                    {log.log}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                    <div ref={logEndRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
