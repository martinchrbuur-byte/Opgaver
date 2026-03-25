import { requireAuth, clearToken, getUser, chores } from './api.js';

requireAuth('index.html');

const user = getUser();
if (user?.role !== 'child') {
  // Parent accidentally landed here - redirect
  window.location.href = 'dashboard.html';
}

document.getElementById('greeting').textContent = `Hi, ${user?.name || 'there'} 👋`;

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'index.html';
});

function statusLabel(status) {
  const map = {
    active: '🟢 To Do',
    pending_approval: '🟡 Waiting for approval',
    approved: '✅ Done',
    rejected: '❌ Rejected',
  };
  return map[status] || status;
}

async function loadChores() {
  try {
    const data = await chores.list();
    document.getElementById('spinner').classList.add('hidden');

    if (data.length === 0) {
      document.getElementById('noChores').classList.remove('hidden');
      return;
    }

    const list = document.getElementById('choreList');
    list.innerHTML = data.map((c) => `
      <div class="card">
        <p class="card-title">${escHtml(c.title)}</p>
        <p class="text-muted">Reward: <strong>$${Number(c.reward).toFixed(2)}</strong></p>
        <p class="text-muted">Difficulty: ${c.difficulty}</p>
        ${c.due_date ? `<p class="text-muted">Due: ${new Date(c.due_date).toLocaleDateString()}</p>` : ''}
        <p class="mt-1"><span class="badge badge-${c.status.replace('_', '-')}">${statusLabel(c.status)}</span></p>
        ${c.status === 'rejected' && c.rejection_reason ? `<p class="error-msg mt-1">Reason: ${escHtml(c.rejection_reason)}</p>` : ''}
        ${c.status === 'active'
          ? `<button class="btn btn-primary mt-2" onclick="markDone('${c.id}', this)">Mark as done ✅</button>`
          : ''}
      </div>`
    ).join('');
    list.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    document.getElementById('spinner').classList.add('hidden');
  }
}

window.markDone = async (id, btn) => {
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  try {
    await chores.update(id, { status: 'pending_approval' });
    loadChores();
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = 'Mark as done ✅';
  }
};

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

loadChores();
