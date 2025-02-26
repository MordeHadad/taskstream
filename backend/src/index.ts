import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { setupSSEHandler } from './sse';
import { getQueue, getHistory, addToQueue, current } from './worker';

const app = express();
const port = process.env.PORT || 4000;

// Setup upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());

app.post('/api/tasks', upload.array('files'), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0)
        return res.status(400).json({ error: 'No files uploaded' });

    const addedTasks = files.map(file => {
        const task = {
            id: crypto.randomUUID(),
            status: 'queued' as const,
            filename: file.originalname,
            filePath: file.path,
            size: file.size
        };
        addToQueue(task);
        return { id: task.id, status: task.status };
    });

    res.json({ tasks: addedTasks });
});

app.get('/api/stream', setupSSEHandler);

app.get('/api/tasks', (_, res) => {
    res.json({
        queue: getQueue(),
        history: getHistory(),
        activeJob: current
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
