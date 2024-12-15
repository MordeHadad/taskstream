"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSSE = exports.setupSSEHandler = void 0;
let clients = [];
const setupSSEHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ log: 'Connected to stream', status: 'connected' })}\n\n`);
    clients.push(res);
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
};
exports.setupSSEHandler = setupSSEHandler;
const sendSSE = (data) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
        client.write(payload);
    });
};
exports.sendSSE = sendSSE;
