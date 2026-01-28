const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Initial DB state
const defaultDB = {
    student: {},
    tasks: []
};

// Check if DB exists, if not create it
if (!fs.existsSync(DB_FILE)) {
    saveDB(defaultDB);
}

function getDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return defaultDB;
    }
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
};

const server = http.createServer((req, res) => {
    // CORS headers for local development safety (not strictly needed since same origin)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const { method, url } = req;

    // API Routes
    if (url.startsWith('/student')) {
        if (method === 'GET') {
            const db = getDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.student));
            return;
        }
        if (method === 'POST' || method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const db = getDB();
                try {
                    db.student = JSON.parse(body);
                    saveDB(db);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(db.student));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }
    }

    if (url.startsWith('/tasks')) {
        const taskId = url.split('/')[2]; // /tasks/:id

        if (method === 'GET') {
            const db = getDB();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.tasks));
            return;
        }

        if (method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const db = getDB();
                try {
                    const newTask = JSON.parse(body);
                    newTask.id = Date.now().toString();
                    newTask.timestamp = new Date().toISOString();
                    db.tasks.push(newTask);
                    saveDB(db);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(newTask));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }

        if (method === 'PUT' && taskId) {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const db = getDB();
                try {
                    const updateData = JSON.parse(body);
                    const taskIndex = db.tasks.findIndex(t => t.id === taskId);

                    if (taskIndex !== -1) {
                        db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...updateData };
                        saveDB(db);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(db.tasks[taskIndex]));
                    } else {
                        res.writeHead(404);
                        res.end('Task not found');
                    }
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }

        if (method === 'DELETE' && taskId) {
            const db = getDB();
            const initialLength = db.tasks.length;
            db.tasks = db.tasks.filter(t => t.id !== taskId);

            if (db.tasks.length !== initialLength) {
                saveDB(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(404);
                res.end('Task not found');
            }
            return;
        }
    }

    // Static File Serving
    let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
