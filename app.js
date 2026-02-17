const input = document.getElementById('todoInput');
const list  = document.getElementById('todoList');

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
  const todos = await res.json();
  render(todos);
}

async function deleteTodo(id) {
  const res = await fetch(`/todos/${id}`, { method: 'DELETE' });
  const todos = await res.json();
  render(todos);
}

function render(todos) {
  list.innerHTML = '';
  if (todos.length === 0) {
    list.innerHTML = '<li class="empty">아직 할 일이 없습니다.</li>';
    return;
  }
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(todo.text)}</span>
      <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="삭제">&#x2715;</button>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 초기 로드
fetch('/todos').then(r => r.json()).then(render);
