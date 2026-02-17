const input = document.getElementById('todoInput');
const list  = document.getElementById('todoList');

let currentFilter = 'all';
let allTodos = [];

// 날짜 관리
const days = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
let currentDateObj = new Date();

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d) {
  return `📅 ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`;
}

function updateDateLabel() {
  document.getElementById('todayDate').textContent = formatDisplay(currentDateObj);
}

function changeDate(delta) {
  currentDateObj.setDate(currentDateObj.getDate() + delta);
  updateDateLabel();
  loadTodos();
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

async function loadTodos() {
  const date = toDateStr(currentDateObj);
  const res = await fetch(`/todos?date=${date}`);
  allTodos = await res.json();
  render();
}

async function addTodo() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const date = toDateStr(currentDateObj);
  const res = await fetch('/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, date })
  });
  allTodos = await res.json();
  render();
}

async function toggleTodo(id) {
  const date = toDateStr(currentDateObj);
  const res = await fetch(`/todos/${id}/toggle?date=${date}`, { method: 'PATCH' });
  allTodos = await res.json();
  render();
}

async function deleteTodo(id) {
  const date = toDateStr(currentDateObj);
  const res = await fetch(`/todos/${id}?date=${date}`, { method: 'DELETE' });
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

  // 모두 완료 dot 표시
  const dot = document.getElementById('allDoneDot');
  if (total > 0 && done === total) {
    dot.classList.add('visible');
  } else {
    dot.classList.remove('visible');
  }
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
updateDateLabel();
loadTodos();
