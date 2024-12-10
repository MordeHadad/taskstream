export type Task = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  filename?: string;
  filePath?: string;
  size?: number;
  hash?: string;
}

export type ProgressEvent = {
  jobId: string;
  progress: number;
  log: string;
  status: Task['status'];
  hash?: string;
}
