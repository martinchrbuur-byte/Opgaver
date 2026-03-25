import { auth, saveToken, saveUser, requireGuest } from './api.js';

// Redirect to dashboard if already logged in
requireGuest();

const isRegister = window.location.pathname.endsWith('register.html');
const form       = document.getElementById(isRegister ? 'registerForm' : 'loginForm');
const errorMsg   = document.getElementById('errorMsg');
const submitBtn  = document.getElementById('submitBtn');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  submitBtn.disabled = true;
  submitBtn.textContent = isRegister ? 'Creating…' : 'Signing in…';

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const result = isRegister
      ? await auth.register(email, password)
      : await auth.login(email, password);

    saveToken(result.token);
    saveUser(result.user);

    // Redirect based on role
    if (result.user.role === 'child') {
      window.location.href = 'child-home.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = isRegister ? 'Create account' : 'Sign in';
  }
});
