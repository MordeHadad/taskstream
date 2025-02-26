import request from 'supertest';
import app from '../index';
import * as path from 'path';
import * as fs from 'fs';

describe('Express Integration Tests', () => {
    
    it('GET /api/tasks should return queue and history', async () => {
        const response = await request(app).get('/api/tasks');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('queue');
        expect(response.body).toHaveProperty('history');
        expect(response.body).toHaveProperty('activeJob');
    });

    it('POST /api/tasks should upload a file and return task info', async () => {
        // Create a dummy file
        const testFilePath = path.join(__dirname, 'dummy.txt');
        fs.writeFileSync(testFilePath, 'dummy content');

        const response = await request(app)
            .post('/api/tasks')
            .attach('files', testFilePath);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('tasks');
        expect(Array.isArray(response.body.tasks)).toBe(true);
        expect(response.body.tasks.length).toBe(1);
        expect(response.body.tasks[0]).toHaveProperty('id');
        expect(['queued', 'running', 'failed', 'completed']).toContain(response.body.tasks[0].status);

        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('POST /api/tasks without files should return 400', async () => {
        const response = await request(app).post('/api/tasks');
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('No files uploaded');
    });

});
