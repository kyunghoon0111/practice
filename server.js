const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const todos = [];

const STATIC_FILES = {
  '/style.css': { file: 'style.css', type: 'text/css' },
  '/app.js':    { file: 'app.js',    type: 'text/javascript' },
};

function serveStatic(res, file, contentType) {
  fs.readFile(path.join(__dirname, file), (err, data) => {
    if (err) { res.writeHead(500); res.end('Server Error'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && STATIC_FILES[req.url]) {
    const { file, type } = STATIC_FILES[req.url];
    serveStatic(res, file, type);
  } else if (req.method === 'GET' && req.url === '/') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else if (req.method === 'GET' && req.url === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
  } else if (req.method === 'POST' && req.url === '/todos') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { text } = JSON.parse(body);
      if (text && text.trim()) {
        todos.push({ id: Date.now(), text: text.trim() });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(todos));
    });
  } else if (req.method === 'DELETE' && req.url.startsWith('/todos/')) {
    const id = parseInt(req.url.split('/')[2]);
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) todos.splice(index, 1);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
