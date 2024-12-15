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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToQueue = exports.getHistory = exports.getQueue = exports.current = exports.history = exports.queue = void 0;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const sse_1 = require("./sse");
exports.queue = [];
exports.history = [];
exports.current = null;
let running = false;
const getQueue = () => exports.queue;
exports.getQueue = getQueue;
const getHistory = () => exports.history;
exports.getHistory = getHistory;
const addToQueue = (task) => {
    exports.queue.push(task);
    startWorker();
};
exports.addToQueue = addToQueue;
const startWorker = async () => {
    if (running)
        return;
    running = true;
    while (exports.queue.length) {
        exports.current = exports.queue.shift();
        exports.current.status = 'running';
        (0, sse_1.sendSSE)({ jobId: exports.current.id, progress: 0, log: `Starting hash for ${exports.current.filename}...`, status: exports.current.status });
        if (!exports.current.filePath || !fs.existsSync(exports.current.filePath)) {
            exports.current.status = 'failed';
            (0, sse_1.sendSSE)({ jobId: exports.current.id, progress: 0, log: `Error: File missing!`, status: exports.current.status });
            exports.history.push(exports.current);
            continue;
        }
        const totalSize = exports.current.size || fs.statSync(exports.current.filePath).size;
        let processedSize = 0;
        const hash = crypto.createHash('sha256');
        const CHUNK_SIZE = 1024 * 512; // 512KB chunks
        const fd = fs.openSync(exports.current.filePath, 'r');
        const buffer = Buffer.alloc(CHUNK_SIZE);
        let bytesRead = 0;
        try {
            while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) !== 0) {
                hash.update(buffer.slice(0, bytesRead));
                processedSize += bytesRead;
                const progress = Math.min(100, Math.round((processedSize / totalSize) * 100));
                (0, sse_1.sendSSE)({
                    jobId: exports.current.id,
                    progress,
                    log: `Hashing... ${progress}% (${(processedSize / 1024 / 1024).toFixed(2)} MB)`,
                    status: exports.current.status
                });
                await new Promise(r => setTimeout(r, 20));
            }
            exports.current.hash = hash.digest('hex');
            exports.current.status = 'completed';
            (0, sse_1.sendSSE)({
                jobId: exports.current.id,
                progress: 100,
                log: `Complete! SHA-256: ${exports.current.hash}`,
                status: exports.current.status,
                hash: exports.current.hash
            });
        }
        catch (err) {
            exports.current.status = 'failed';
            (0, sse_1.sendSSE)({
                jobId: exports.current.id,
                progress: processedSize ? Math.round((processedSize / totalSize) * 100) : 0,
                log: `Error: ${err.message}`,
                status: exports.current.status
            });
        }
        finally {
            fs.closeSync(fd);
            if (fs.existsSync(exports.current.filePath))
                fs.unlinkSync(exports.current.filePath);
        }
        exports.history.push(exports.current);
    }
    exports.current = null;
    running = false;
};
