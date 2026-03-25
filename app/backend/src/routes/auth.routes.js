import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../db.js';
import { validate } from '../validators/auth.validator.js';
import { registerSchema, loginSchema, childLoginSchema } from '../validators/auth.validator.js';
import authenticateJWT from '../middleware/authenticateJWT.js';

const router = Router();

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for existing user
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create household
    const { data: household, error: hhErr } = await supabase
      .from('households')
      .insert({})
      .select()
      .single();

    if (hhErr) throw hhErr;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        household_id: household.id,
        role: 'parent',
      })
      .select('id, email, role, household_id')
      .single();

    if (userErr) throw userErr;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, householdId: user.household_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, householdId: user.household_id } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, household_id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, householdId: user.household_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, householdId: user.household_id } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
// JWT is stateless; client simply discards the token.
router.post('/logout', authenticateJWT, (_req, res) => {
  res.json({ message: 'Logged out' });
});

// ── POST /api/auth/child-login ──────────────────────────────────────────────
router.post('/child-login', validate(childLoginSchema), async (req, res, next) => {
  try {
    const { childId, pin } = req.body;

    const { data: child, error } = await supabase
      .from('child_profiles')
      .select('id, name, household_id, pin_hash, archived_at')
      .eq('id', childId)
      .maybeSingle();

    if (error) throw error;
    if (!child || child.archived_at) {
      return res.status(401).json({ error: 'Child profile not found or archived' });
    }
    if (!child.pin_hash) {
      return res.status(400).json({ error: 'No PIN set for this child profile' });
    }

    const valid = await bcrypt.compare(pin, child.pin_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid PIN' });

    const token = jwt.sign(
      { id: child.id, name: child.name, role: 'child', householdId: child.household_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, child: { id: child.id, name: child.name } });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

export default router;
