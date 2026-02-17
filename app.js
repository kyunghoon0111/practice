const input = document.getElementById('todoInput');
const list  = document.getElementById('todoList');

let currentFilter = 'all';
let allTodos = [];
let dateSummary = {}; // { "YYYY-MM-DD": "done" | "active" }

// 날짜 관리
const dayLabels = ['일','월','화','수','목','금','토'];
const today = new Date();
let currentDateObj = new Date();
let calendarYear  = currentDateObj.getFullYear();
let calendarMonth = currentDateObj.getMonth(); // 0-indexed

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d) {
  const fullDays = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
  return `📅 ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${fullDays[d.getDay()]}`;
}

function updateDateLabel() {
  document.getElementById('todayDate').textContent = formatDisplay(currentDateObj);
}

function changeDate(delta) {
  currentDateObj.setDate(currentDateObj.getDate() + delta);
  // 달력 월도 선택 날짜에 맞춤
  calendarYear  = currentDateObj.getFullYear();
  calendarMonth = currentDateObj.getMonth();
  updateDateLabel();
  loadTodos();
}

function changeCalendarMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth < 0)  { calendarMonth = 11; calendarYear--; }
  if (calendarMonth > 11) { calendarMonth = 0;  calendarYear++; }
  renderCalendar();
}

function selectDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  currentDateObj = new Date(y, m - 1, d);
  updateDateLabel();
  loadTodos();
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

async function loadDateSummary() {
  const res = await fetch('/todos/dates');
  dateSummary = await res.json();
  renderCalendar();
}

async function loadTodos() {
  const date = toDateStr(currentDateObj);
  const res = await fetch(`/todos?date=${date}`);
  allTodos = await res.json();
  render();
  loadDateSummary(); // 완료 상태 최신화 → 달력 갱신
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
  loadDateSummary();
}

async function toggleTodo(id) {
  const date = toDateStr(currentDateObj);
  const res = await fetch(`/todos/${id}/toggle?date=${date}`, { method: 'PATCH' });
  allTodos = await res.json();
  render();
  loadDateSummary();
}

async function deleteTodo(id) {
  const date = toDateStr(currentDateObj);
  const res = await fetch(`/todos/${id}?date=${date}`, { method: 'DELETE' });
  allTodos = await res.json();
  render();
  loadDateSummary();
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

  const allDone = total > 0 && done === total;

  // 헤더 dot
  document.getElementById('allDoneDot').classList.toggle('visible', allDone);

  // 축하 이미지 생성 버튼
  const bar = document.getElementById('celebrationBar');
  if (allDone) {
    bar.classList.add('visible');
  } else {
    bar.classList.remove('visible');
    resetCelebrationBtn();
  }
}

function resetCelebrationBtn() {
  document.getElementById('celebBtnIcon').textContent = '🎉';
  document.getElementById('celebBtnText').textContent = '나노 바나나로 축하 이미지 생성';
  document.getElementById('celebrationBtn').disabled = false;
}

async function generateCelebration() {
  const btn = document.getElementById('celebrationBtn');
  btn.disabled = true;
  document.getElementById('celebBtnIcon').textContent = '⏳';
  document.getElementById('celebBtnText').textContent = '이미지 생성 중...';

  // 모달 열기 (로딩 상태)
  const overlay = document.getElementById('modalOverlay');
  const modalImg = document.getElementById('modalImage');
  const loading = document.getElementById('modalLoading');
  const download = document.getElementById('modalDownload');
  const subtitle = document.getElementById('modalSubtitle');

  subtitle.textContent = toDateStr(currentDateObj).replace(/-/g, '.');
  modalImg.style.display = 'none';
  loading.style.display = 'flex';
  download.style.display = 'none';
  overlay.classList.add('visible');

  try {
    const tasks = allTodos.map(t => t.text);
    const res = await fetch('/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: toDateStr(currentDateObj), tasks })
    });
    const data = await res.json();

    if (data.image) {
      const src = `data:${data.mimeType};base64,${data.image}`;
      modalImg.src = src;
      modalImg.style.display = 'block';
      loading.style.display = 'none';
      download.href = src;
      download.style.display = 'inline-block';

      document.getElementById('celebBtnIcon').textContent = '✅';
      document.getElementById('celebBtnText').textContent = '이미지 생성 완료!';
    } else {
      throw new Error(data.error || '이미지 생성 실패');
    }
  } catch (e) {
    loading.style.display = 'none';
    document.getElementById('modalImageWrap').innerHTML =
      `<p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">${e.message}</p>`;
    document.getElementById('celebBtnIcon').textContent = '❌';
    document.getElementById('celebBtnText').textContent = '생성 실패 — 다시 시도';
    btn.disabled = false;
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
}

function render() {
  updateStats();

  let filtered = allTodos;
  if (currentFilter === 'active') filtered = allTodos.filter(t => !t.done);
  if (currentFilter === 'done')   filtered = allTodos.filter(t => t.done);

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

// ─── 달력 렌더링 ────────────────────────────────────────────
function renderCalendar() {
  document.getElementById('calendarTitle').textContent =
    `${calendarYear}년 ${calendarMonth + 1}월`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  // 요일 헤더
  dayLabels.forEach((d, i) => {
    const cell = document.createElement('div');
    cell.className = 'cal-day-header' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '');
    cell.textContent = d;
    grid.appendChild(cell);
  });

  // 이번 달 1일의 요일(0=일)
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  // 이번 달 마지막 날
  const lastDate = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  // 빈 칸 채우기
  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }

  const todayStr    = toDateStr(today);
  const selectedStr = toDateStr(currentDateObj);

  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = new Date(calendarYear, calendarMonth, d).getDay();

    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (dow === 0) cell.classList.add('sun');
    if (dow === 6) cell.classList.add('sat');
    if (dateStr === todayStr)    cell.classList.add('today');
    if (dateStr === selectedStr) cell.classList.add('selected');

    const num = document.createElement('span');
    num.className = 'cal-num';
    num.textContent = d;
    cell.appendChild(num);

    // 완료 dot
    if (dateSummary[dateStr]) {
      const dot = document.createElement('span');
      dot.className = 'cal-dot ' + (dateSummary[dateStr] === 'done' ? 'dot-done' : 'dot-active');
      cell.appendChild(dot);
    }

    cell.addEventListener('click', () => selectDate(dateStr));
    grid.appendChild(cell);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 초기 로드
updateDateLabel();
loadTodos();
renderCalendar();
