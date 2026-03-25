import { requireAuth, clearToken, dashboard, chores } from './api.js';

requireAuth();

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'index.html';
});

async function loadDashboard() {
  try {
    const data = await dashboard.summary();

    document.getElementById('statTotal').textContent   = data.totalChores;
    document.getElementById('statPending').textContent = data.pendingApproval;
    document.getElementById('statWeek').textContent    = data.completedThisWeek;

    // Children table
    document.getElementById('spinner').classList.add('hidden');
    if (data.children.length === 0) {
      document.getElementById('noChildren').classList.remove('hidden');
    } else {
      const tbody = document.getElementById('childBody');
      tbody.innerHTML = data.children
        .map((c) => `<tr><td>${escHtml(c.name)}</td><td>${c.assignedCount}</td></tr>`)
        .join('');
      document.getElementById('childTable').classList.remove('hidden');
    }

    // Pending approvals
    await loadPending();
  } catch (err) {
    document.getElementById('spinner').classList.add('hidden');
    console.error(err);
  }
}

async function loadPending() {
  try {
    const all = await chores.list();
    const pending = all.filter((c) => c.status === 'pending_approval');

    document.getElementById('pendingSpinner').classList.add('hidden');
    if (pending.length === 0) {
      document.getElementById('noPending').classList.remove('hidden');
      return;
    }

    const tbody = document.getElementById('pendingBody');
    tbody.innerHTML = pending
      .map(
        (c) => `
        <tr>
          <td>${escHtml(c.title)}</td>
          <td class="flex">
            <button class="btn btn-success btn-sm" onclick="approveChore('${c.id}')">Approve</button>
            <button class="btn btn-danger  btn-sm" onclick="rejectChore('${c.id}')">Reject</button>
          </td>
        </tr>`
      )
      .join('');
    document.getElementById('pendingTable').classList.remove('hidden');
  } catch (err) {
    console.error(err);
  }
}

window.approveChore = async (id) => {
  try {
    await chores.update(id, { status: 'approved' });
    loadDashboard();
  } catch (err) {
    alert(err.message);
  }
};

window.rejectChore = async (id) => {
  const reason = prompt('Reason for rejection (optional):') || '';
  try {
    await chores.update(id, { status: 'rejected', rejectionReason: reason });
    loadDashboard();
  } catch (err) {
    alert(err.message);
  }
};

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

loadDashboard();
