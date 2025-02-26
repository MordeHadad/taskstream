import { addToQueue, getQueue, getHistory, queue, history } from '../worker';
import * as fs from 'fs';
import { sendEvent } from '../sse';
import { Task } from '../types';

jest.mock('fs');
jest.mock('../sse', () => ({
    sendEvent: jest.fn()
}));

describe('Worker Unit Tests', () => {
    beforeEach(() => {
        // Reset state
        queue.length = 0;
        history.length = 0;
        jest.clearAllMocks();
    });

    it('should add task to queue and start processing', () => {
        const mockTask: Task = {
            id: '123',
            status: 'queued',
            filename: 'test.txt',
            filePath: '/fake/path/test.txt',
            size: 100
        };

        (fs.existsSync as jest.Mock).mockReturnValue(false);

        addToQueue(mockTask);

        expect(getQueue()).toHaveLength(0);
    });

    it('should handle missing files correctly', async () => {
        const mockTask: Task = {
            id: '124',
            status: 'queued',
            filename: 'missing.txt',
            filePath: '/fake/path/missing.txt',
            size: 100
        };

        (fs.existsSync as jest.Mock).mockReturnValue(false);
        
        addToQueue(mockTask);

        await new Promise(r => setTimeout(r, 10));

        const h = getHistory();
        expect(h).toHaveLength(1);
        expect(h[0].status).toBe('failed');
        expect(sendEvent).toHaveBeenCalledWith(expect.objectContaining({ log: 'Error: File missing!' }));
    });
});
