/**
 * api.js – fetch wrapper + token helpers
 * All frontend JS files import from this module.
 */

const LOCAL_API_BASE = 'http://localhost:4000';
const REMOTE_API_FALLBACK = 'https://your-backend.onrender.com';

const runtimeBaseUrl = window.APP_API_BASE_URL || localStorage.getItem('APP_API_BASE_URL');
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const BASE_URL = runtimeBaseUrl || (isLocalFrontend ? LOCAL_API_BASE : REMOTE_API_FALLBACK);

// ── Token helpers ─────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('token');
}

export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('householdId');
}

export function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  if (user?.householdId) localStorage.setItem('householdId', user.householdId);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function getHouseholdId() {
  return localStorage.getItem('householdId');
}

export function setApiBaseUrl(url) {
  if (!url) {
    localStorage.removeItem('APP_API_BASE_URL');
    return;
  }
  localStorage.setItem('APP_API_BASE_URL', url);
}

export function isLoggedIn() {
  return !!getToken();
}

// ── Redirect helpers ──────────────────────────────────────────────────────

export function requireAuth(redirectTo = 'index.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

export function requireGuest(redirectTo = 'dashboard.html') {
  if (isLoggedIn()) {
    const user = getUser();
    if (user?.role === 'child') {
      window.location.href = 'child-home.html';
    } else {
      window.location.href = redirectTo;
    }
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || data.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ── Auth endpoints ────────────────────────────────────────────────────────

export const auth = {
  register: (email, password) =>
    request('POST', '/api/auth/register', { email, password }, false),

  login: (email, password) =>
    request('POST', '/api/auth/login', { email, password }, false),

  childLogin: (childId, pin) =>
    request('POST', '/api/auth/child-login', { childId, pin }, false),

  logout: () => request('POST', '/api/auth/logout'),

  me: () => request('GET', '/api/auth/me'),
};

// ── Children endpoints ────────────────────────────────────────────────────

export const children = {
  list: () => request('GET', '/api/children'),
  listPublic: (householdId) => request('GET', `/api/children/public?householdId=${encodeURIComponent(householdId)}`, null, false),
  create: (data) => request('POST', '/api/children', data),
  update: (id, data) => request('PATCH', `/api/children/${id}`, data),
  archive: (id) => request('DELETE', `/api/children/${id}`),
};

// ── Chores endpoints ──────────────────────────────────────────────────────

export const chores = {
  list: () => request('GET', '/api/chores'),
  create: (data) => request('POST', '/api/chores', data),
  update: (id, data) => request('PATCH', `/api/chores/${id}`, data),
};

// ── Dashboard endpoint ────────────────────────────────────────────────────

export const dashboard = {
  summary: () => request('GET', '/api/dashboard'),
};
