import { auth, children, saveToken, saveUser, requireGuest, getHouseholdId } from './api.js';

requireGuest('child-home.html');

const form      = document.getElementById('childLoginForm');
const select    = document.getElementById('childSelect');
const householdInput = document.getElementById('householdId');
const errorMsg  = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');

// Populate child dropdown from the household stored in localStorage (set when parent logged in)
async function populateChildren() {
  const householdId = householdInput.value.trim() || getHouseholdId();
  if (!householdId) {
    select.innerHTML = '<option value="">Enter household code first</option>';
    return;
  }
  localStorage.setItem('householdId', householdId);
  try {
    const list = await children.listPublic(householdId);
    if (list.length === 0) {
      select.innerHTML = '<option value="">No children added yet</option>';
    } else {
      select.innerHTML = '<option value="">– select your name –</option>' +
        list.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  } catch {
    select.innerHTML = '<option value="">Could not load children</option>';
  }
}

householdInput.value = getHouseholdId() || '';
householdInput.addEventListener('change', populateChildren);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.classList.add('hidden');

  const childId = select.value;
  const pin     = document.getElementById('pin').value;

  if (!childId) {
    errorMsg.textContent = 'Please select your name.';
    errorMsg.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  try {
    const result = await auth.childLogin(childId, pin);
    saveToken(result.token);
    saveUser({ ...result.child, role: 'child' });
    window.location.href = 'child-home.html';
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});

populateChildren();
