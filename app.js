const input = document.getElementById('todoInput');
const list  = document.getElementById('todoList');

let currentFilter = 'all';
let allTodos = [];

// 오늘 날짜 표시
const days = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
const now = new Date();
document.getElementById('todayDate').textContent =
  `\u{1F4C5} ${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}`;

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

async function addTodo() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const res = await fetch('/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  allTodos = await res.json();
  render();
}

async function toggleTodo(id) {
  const res = await fetch(`/todos/${id}/toggle`, { method: 'PATCH' });
  allTodos = await res.json();
  render();
}

async function deleteTodo(id) {
  const res = await fetch(`/todos/${id}`, { method: 'DELETE' });
  allTodos = await res.json();
  render();
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function updateStats() {
  const total = allTodos.length;
  const done = allTodos.filter(t => t.done).length;
  const active = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('activeCount').textContent = active;
  document.getElementById('donePercent').textContent = percent + '%';
  document.getElementById('totalCount').textContent = total + '개';
}

function render() {
  updateStats();

  let filtered = allTodos;
  if (currentFilter === 'active') filtered = allTodos.filter(t => !t.done);
  if (currentFilter === 'done') filtered = allTodos.filter(t => t.done);

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-msg">할 일이 없습니다.</div>';
    return;
  }

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    li.innerHTML = `
      <div class="checkbox" onclick="toggleTodo(${todo.id})"></div>
      <span class="text">${escapeHtml(todo.text)}</span>
      <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="삭제">&#x1F5D1;</button>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 초기 로드
fetch('/todos').then(r => r.json()).then(todos => { allTodos = todos; render(); });
