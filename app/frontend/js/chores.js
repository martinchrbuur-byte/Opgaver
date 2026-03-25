import { requireAuth, clearToken, chores, children } from './api.js';

requireAuth();

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'index.html';
});

const showFormBtn = document.getElementById('showFormBtn');
const cancelBtn   = document.getElementById('cancelBtn');
const addCard     = document.getElementById('addCard');
const addForm     = document.getElementById('addForm');
const addError    = document.getElementById('addError');

let childrenCache = [];

showFormBtn.addEventListener('click', async () => {
  addCard.classList.remove('hidden');
  if (childrenCache.length === 0) {
    try {
      childrenCache = await children.list();
    } catch {/* ignore */}
  }
  renderChildCheckboxes();
});

cancelBtn.addEventListener('click', () => {
  addCard.classList.add('hidden');
  addForm.reset();
});

function renderChildCheckboxes() {
  const container = document.getElementById('childCheckboxes');
  if (childrenCache.length === 0) {
    container.innerHTML = '<span class="text-muted">No children found. <a href="children.html">Add children first.</a></span>';
    return;
  }
  container.innerHTML = childrenCache.map((c) => `
    <label class="flex" style="cursor:pointer;margin-bottom:.35rem;">
      <input type="checkbox" name="assignTo" value="${c.id}" />
      ${escHtml(c.name)}
    </label>`).join('');
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addError.classList.add('hidden');

  const title      = document.getElementById('title').value.trim();
  const reward     = parseFloat(document.getElementById('reward').value) || 0;
  const difficulty = document.getElementById('difficulty').value;
  const dueDate    = document.getElementById('dueDate').value || undefined;
  const assignedTo = [...document.querySelectorAll('input[name="assignTo"]:checked')]
    .map((cb) => cb.value);

  if (assignedTo.length === 0) {
    addError.textContent = 'Please assign the chore to at least one child.';
    addError.classList.remove('hidden');
    return;
  }

  try {
    await chores.create({ title, reward, difficulty, dueDate, assignedTo, type: 'one-time' });
    addCard.classList.add('hidden');
    addForm.reset();
    loadChores();
  } catch (err) {
    addError.textContent = err.message;
    addError.classList.remove('hidden');
  }
});

async function loadChores() {
  document.getElementById('spinner').classList.remove('hidden');
  document.getElementById('choreTable').classList.add('hidden');
  document.getElementById('noChores').classList.add('hidden');

  try {
    const data = await chores.list();
    document.getElementById('spinner').classList.add('hidden');

    if (data.length === 0) {
      document.getElementById('noChores').classList.remove('hidden');
      return;
    }

    const tbody = document.getElementById('choreBody');
    tbody.innerHTML = data.map((c) => `
      <tr>
        <td>${escHtml(c.title)}</td>
        <td>$${Number(c.reward).toFixed(2)}</td>
        <td>${c.difficulty}</td>
        <td><span class="badge badge-${c.status.replace('_', '-')}">${c.status.replace('_', ' ')}</span></td>
        <td>${c.due_date ? new Date(c.due_date).toLocaleDateString() : '–'}</td>
      </tr>`
    ).join('');
    document.getElementById('choreTable').classList.remove('hidden');
  } catch (err) {
    console.error(err);
    document.getElementById('spinner').classList.add('hidden');
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

loadChores();
