# TaskStream Hasher

I created a deterministic async streaming file hasher. you upload multiple files, process them sequentially in a background queue, and stream live hashing progress to a Next.js UI via Server-Sent Events (SSE).

## Features
- **Streaming SHA-256 Calculation:** Calculates hashes using Node.js `crypto` and file streams (`fs.readSync`) in 512KB chunks, preventing memory bloat for large files.
- **Live Progress Updates:** Real-time progress bars and terminal logs powered by SSE.
- **Sequential Background Queue:** Express.js worker safely processes one file at a time.
- **Batch Uploading:** Select and upload multiple files at once using `multer`.
- **Clean UI:** Polished light-theme dashboard built with Next.js, Tailwind CSS, and shadcn/ui.

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, lucide-react
- **Backend:** Express.js, TypeScript, Multer (for multipart/form-data uploads)
- **Queue/Stream:** In-memory array, sequential async worker, Server-Sent Events (manual headers)

## Run

1. Start the Backend Worker & API:
```bash
cd backend
npm install
npm run dev
```
*(Runs on `http://localhost:4000`)*

2. Start the Frontend Dashboard:
```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:3000`)*

Open `http://localhost:3000`, select one or more files, click **Upload & Hash**, and watch the stream.

## API Endpoints

- `POST /api/tasks`: Queue files for hashing (multipart/form-data), returns `{ tasks: [...] }`
- `GET /api/stream`: SSE stream emitting live progress and hash outputs
- `GET /api/tasks`: Returns `{ queue: [...], history: [...], activeJob: {...} }`
