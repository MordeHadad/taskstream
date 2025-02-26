import * as fs from 'fs';
import * as crypto from 'crypto';
import { Task } from './types';
import { sendEvent } from './sse';

export const queue: Task[] = [];
export const history: Task[] = [];
export let current: Task | null = null;
let running = false;

export const getQueue = () => queue;
export const getHistory = () => history;

export const addToQueue = (task: Task) => {
    queue.push(task);
    startWorker();
};

const startWorker = async () => {
    if (running) return;
    running = true;

    while (queue.length) {
        current = queue.shift()!;
        current.status = 'running';

        sendEvent({ jobId: current.id, progress: 0, log: `Starting hash for ${current.filename}...`, status: current.status });

        if (!current.filePath || !fs.existsSync(current.filePath)) {
            current.status = 'failed';
            sendEvent({ jobId: current.id, progress: 0, log: `Error: File missing!`, status: current.status });
            history.push(current);
            continue;
        }

        const totalSize = current.size || fs.statSync(current.filePath).size;
        let processedSize = 0;
        const hash = crypto.createHash('sha256');

        const CHUNK_SIZE = 1024 * 512; // 512KB chunks
        const fd = fs.openSync(current.filePath, 'r');
        const buffer = Buffer.alloc(CHUNK_SIZE);
        let bytesRead = 0;

        try {
            while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) !== 0) {
                hash.update(buffer.slice(0, bytesRead));
                processedSize += bytesRead;

                const progress = Math.min(100, Math.round((processedSize / totalSize) * 100));

                sendEvent({
                    jobId: current.id,
                    progress,
                    log: `Hashing... ${progress}% (${(processedSize / 1024 / 1024).toFixed(2)} MB)`,
                    status: current.status
                });

                await new Promise(r => setTimeout(r, 20));
            }

            current.hash = hash.digest('hex');
            current.status = 'completed';

            sendEvent({
                jobId: current.id,
                progress: 100,
                log: `Complete! SHA-256: ${current.hash}`,
                status: current.status,
                hash: current.hash
            });

        } catch (err: any) {
            current.status = 'failed';
            sendEvent({
                jobId: current.id,
                progress: processedSize ? Math.round((processedSize / totalSize) * 100) : 0,
                log: `Error: ${err.message}`,
                status: current.status
            });
        } finally {
            fs.closeSync(fd);
            if (fs.existsSync(current.filePath))
                fs.unlinkSync(current.filePath);

        }

        history.push(current);
    }

    current = null;
    running = false;
};
