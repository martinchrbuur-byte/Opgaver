import { requireAuth, clearToken, children } from './api.js';

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

showFormBtn.addEventListener('click', () => addCard.classList.remove('hidden'));
cancelBtn.addEventListener('click', () => {
  addCard.classList.add('hidden');
  addForm.reset();
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addError.classList.add('hidden');

  const name     = document.getElementById('childName').value.trim();
  const ageRange = document.getElementById('ageRange').value || undefined;
  const pin      = document.getElementById('pin').value || undefined;

  try {
    await children.create({ name, ageRange, pin });
    addCard.classList.add('hidden');
    addForm.reset();
    loadChildren();
  } catch (err) {
    addError.textContent = err.message;
    addError.classList.remove('hidden');
  }
});

async function loadChildren() {
  document.getElementById('spinner').classList.remove('hidden');
  document.getElementById('childTable').classList.add('hidden');
  document.getElementById('noChildren').classList.add('hidden');

  try {
    const data = await children.list();
    document.getElementById('spinner').classList.add('hidden');

    if (data.length === 0) {
      document.getElementById('noChildren').classList.remove('hidden');
      return;
    }

    const tbody = document.getElementById('childBody');
    tbody.innerHTML = data.map((c) => `
      <tr id="row-${c.id}">
        <td>${escHtml(c.name)}</td>
        <td>${c.age_range || '–'}</td>
        <td>
          <button class="btn btn-ghost" onclick="archiveChild('${c.id}')">Archive</button>
        </td>
      </tr>`
    ).join('');
    document.getElementById('childTable').classList.remove('hidden');
  } catch (err) {
    console.error(err);
    document.getElementById('spinner').classList.add('hidden');
  }
}

window.archiveChild = async (id) => {
  if (!confirm('Archive this child profile?')) return;
  try {
    await children.archive(id);
    document.getElementById(`row-${id}`)?.remove();
    const rows = document.querySelectorAll('#childBody tr');
    if (rows.length === 0) {
      document.getElementById('childTable').classList.add('hidden');
      document.getElementById('noChildren').classList.remove('hidden');
    }
  } catch (err) {
    alert(err.message);
  }
};

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

loadChildren();
