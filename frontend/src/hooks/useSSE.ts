import { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';

export function useSSE() {
    const { addLog, setIsConnected, setActiveJob } = useTaskStore();

    useEffect(() => {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/stream`);

        eventSource.onopen = () => setIsConnected(true);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.status === 'connected') return;

            addLog(data);

            if (data.jobId) {
                setActiveJob({
                    id: data.jobId,
                    status: data.status,
                    ...(data.hash ? { hash: data.hash } : {})
                });
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
        };

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, [addLog, setIsConnected, setActiveJob]);
}
