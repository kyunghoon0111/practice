const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
// todos: { "YYYY-MM-DD": [{id, text, done}] }
const todos = {};

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

function parseUrl(url) {
  const [pathname, query] = url.split('?');
  const params = {};
  if (query) query.split('&').forEach(p => {
    const [k, v] = p.split('=');
    params[k] = decodeURIComponent(v);
  });
  return { pathname, params };
}

const server = http.createServer((req, res) => {
  const { pathname, params } = parseUrl(req.url);

  if (req.method === 'GET' && STATIC_FILES[pathname]) {
    const { file, type } = STATIC_FILES[pathname];
    serveStatic(res, file, type);
  } else if (req.method === 'GET' && pathname === '/') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(500); res.end('Server Error'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });

  // GET /todos?date=YYYY-MM-DD
  } else if (req.method === 'GET' && pathname === '/todos') {
    const date = params.date;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos[date] || []));

  // GET /todos/dates — 완료 상태별 날짜 목록
  } else if (req.method === 'GET' && pathname === '/todos/dates') {
    const summary = {};
    Object.entries(todos).forEach(([date, list]) => {
      if (list.length > 0) {
        summary[date] = list.every(t => t.done) ? 'done' : 'active';
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(summary));

  // POST /todos  body: {text, date}
  } else if (req.method === 'POST' && pathname === '/todos') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { text, date } = JSON.parse(body);
      if (text && text.trim() && date) {
        if (!todos[date]) todos[date] = [];
        todos[date].push({ id: Date.now(), text: text.trim(), done: false });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(todos[date] || []));
    });

  // PATCH /todos/:id/toggle?date=YYYY-MM-DD
  } else if (req.method === 'PATCH' && pathname.match(/^\/todos\/\d+\/toggle$/)) {
    const id = parseInt(pathname.split('/')[2]);
    const date = params.date;
    const list = todos[date] || [];
    const todo = list.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));

  // DELETE /todos/:id?date=YYYY-MM-DD
  } else if (req.method === 'DELETE' && pathname.startsWith('/todos/')) {
    const id = parseInt(pathname.split('/')[2]);
    const date = params.date;
    if (todos[date]) {
      const index = todos[date].findIndex(t => t.id === id);
      if (index !== -1) todos[date].splice(index, 1);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(todos[date] || []));

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
