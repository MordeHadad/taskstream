"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const sse_1 = require("./sse");
const worker_1 = require("./worker");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Setup upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir))
    fs.mkdirSync(uploadDir, { recursive: true });
const upload = (0, multer_1.default)({ dest: uploadDir });
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/api/tasks', upload.array('files'), (req, res) => {
    const files = req.files;
    if (!files || files.length === 0)
        return res.status(400).json({ error: 'No files uploaded' });
    const addedTasks = files.map(file => {
        const task = {
            id: (0, uuid_1.v4)(),
            status: 'queued',
            filename: file.originalname,
            filePath: file.path,
            size: file.size
        };
        (0, worker_1.addToQueue)(task);
        return { id: task.id, status: task.status };
    });
    res.json({ tasks: addedTasks });
});
app.get('/api/stream', sse_1.setupSSEHandler);
app.get('/api/tasks', (_, res) => {
    res.json({
        queue: (0, worker_1.getQueue)(),
        history: (0, worker_1.getHistory)(),
        activeJob: worker_1.current
    });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
