import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = window.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ensure(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function mapParentUser(supabaseUser, householdId) {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: 'parent',
    householdId,
  };
}

async function ensureParentProfile(supabaseUser) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  if (existingProfile?.household_id) {
    return existingProfile.household_id;
  }

  const { data: household, error: householdErr } = await supabase
    .from('households')
    .insert({ created_by: supabaseUser.id })
    .select('id')
    .single();

  if (householdErr) throw householdErr;

  const { error: profileErr } = await supabase
    .from('profiles')
    .insert({ id: supabaseUser.id, household_id: household.id, role: 'parent' });

  if (profileErr) throw profileErr;

  return household.id;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function saveToken(token) {
  localStorage.setItem('token', token || 'local-session');
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('householdId');
  supabase.auth.signOut();
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

export function isLoggedIn() {
  return !!getToken();
}

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

export const auth = {
  register: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    const user = ensure(data.user, 'Signup succeeded but no user returned. Disable email confirmation for faster testing.');
    const householdId = await ensureParentProfile(user);
    const mapped = mapParentUser(user, householdId);

    return {
      token: data.session?.access_token || 'local-session',
      user: mapped,
    };
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const user = ensure(data.user, 'Login failed: missing user');
    const householdId = await ensureParentProfile(user);
    const mapped = mapParentUser(user, householdId);

    return {
      token: data.session?.access_token || 'local-session',
      user: mapped,
    };
  },

  childLogin: async (childId, pin) => {
    const { data: child, error } = await supabase
      .from('child_profiles')
      .select('id, name, household_id, pin_code, archived_at')
      .eq('id', childId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!child || child.archived_at) throw new Error('Child profile not found');
    if (!child.pin_code) throw new Error('This child has no PIN set');
    if (String(child.pin_code) !== String(pin)) throw new Error('Invalid PIN');

    return {
      token: `child-${child.id}`,
      child: {
        id: child.id,
        name: child.name,
        role: 'child',
        householdId: child.household_id,
      },
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return { ok: true };
  },

  me: async () => {
    const user = getUser();
    return { user };
  },
};

export const children = {
  list: async () => {
    const householdId = ensure(getHouseholdId(), 'Missing household id');
    const { data, error } = await supabase
      .from('child_profiles')
      .select('id, name, age_range, created_at')
      .eq('household_id', householdId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  listPublic: async (householdId) => {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('id, name')
      .eq('household_id', householdId)
      .is('archived_at', null)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  create: async ({ name, ageRange, pin }) => {
    const householdId = ensure(getHouseholdId(), 'Missing household id');
    const { data, error } = await supabase
      .from('child_profiles')
      .insert({ household_id: householdId, name, age_range: ageRange || null, pin_code: pin || null })
      .select('id, name, age_range, created_at')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id, data) => {
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.ageRange !== undefined) updates.age_range = data.ageRange;
    if (data.pin !== undefined) updates.pin_code = data.pin;

    const { data: result, error } = await supabase
      .from('child_profiles')
      .update(updates)
      .eq('id', id)
      .select('id, name, age_range, created_at')
      .single();

    if (error) throw new Error(error.message);
    return result;
  },

  archive: async (id) => {
    const { error } = await supabase
      .from('child_profiles')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { ok: true };
  },
};

export const chores = {
  list: async () => {
    const householdId = ensure(getHouseholdId(), 'Missing household id');
    const user = getUser();

    let query = supabase
      .from('chores')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (user?.role === 'child') {
      query = query.contains('assigned_to', [user.id]);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  create: async ({ title, type, frequency, dueDate, reward, difficulty, assignedTo }) => {
    const householdId = ensure(getHouseholdId(), 'Missing household id');

    const { data, error } = await supabase
      .from('chores')
      .insert({
        household_id: householdId,
        title,
        type: type || 'one-time',
        frequency: frequency || null,
        due_date: dueDate || null,
        reward: reward || 0,
        difficulty: difficulty || 'medium',
        assigned_to: assignedTo,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id, changes) => {
    const user = getUser();
    const updates = {};

    if (user?.role === 'child') {
      updates.status = 'pending_approval';
    } else {
      if (changes.status !== undefined) updates.status = changes.status;
      if (changes.rejectionReason !== undefined) updates.rejection_reason = changes.rejectionReason;
      if (changes.title !== undefined) updates.title = changes.title;
      if (changes.reward !== undefined) updates.reward = changes.reward;
      if (changes.assignedTo !== undefined) updates.assigned_to = changes.assignedTo;
    }

    const { data, error } = await supabase
      .from('chores')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

export const dashboard = {
  summary: async () => {
    const [allChores, allChildren] = await Promise.all([chores.list(), children.list()]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pendingApproval = allChores.filter((chore) => chore.status === 'pending_approval').length;
    const completedThisWeek = allChores.filter(
      (chore) => chore.status === 'approved' && new Date(chore.created_at) >= weekAgo
    ).length;

    const childStats = allChildren.map((child) => ({
      id: child.id,
      name: child.name,
      assignedCount: allChores.filter(
        (chore) => Array.isArray(chore.assigned_to) && chore.assigned_to.includes(child.id) && chore.status === 'active'
      ).length,
    }));

    return {
      totalChores: allChores.length,
      pendingApproval,
      completedThisWeek,
      children: childStats,
    };
  },
};
