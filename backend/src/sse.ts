import { Request, Response } from 'express';
import { ProgressEvent } from './types';

let clients: Response[] = [];

export const setupSSEHandler = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ log: 'Connected to stream', status: 'connected' })}\n\n`);

    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
};

export const sendEvent = (data: Partial<ProgressEvent>) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
        client.write(payload);
    });
};
