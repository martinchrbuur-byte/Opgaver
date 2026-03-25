import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import authorizeRole from '../middleware/authorizeRole.js';
import householdGuard from '../middleware/householdGuard.js';
import { validate } from '../validators/child.validator.js';
import { createChildSchema, updateChildSchema } from '../validators/child.validator.js';

const router = Router();
const guard = [authenticateJWT, authorizeRole('parent'), householdGuard];

// ── GET /api/children/public?householdId=xxx  (no auth – child login dropdown) ──
router.get('/public', async (req, res, next) => {
  try {
    const { householdId } = req.query;
    if (!householdId) return res.status(400).json({ error: 'householdId query param required' });

    const { data, error } = await supabase
      .from('child_profiles')
      .select('id, name')
      .eq('household_id', householdId)
      .is('archived_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/children ───────────────────────────────────────────────────────
router.get('/', ...guard, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('id, name, age_range, created_at')
      .eq('household_id', req.householdId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/children ──────────────────────────────────────────────────────
router.post('/', ...guard, validate(createChildSchema), async (req, res, next) => {
  try {
    const { name, ageRange, pin } = req.body;

    let pinHash = null;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    const { data, error } = await supabase
      .from('child_profiles')
      .insert({ household_id: req.householdId, name, age_range: ageRange, pin_hash: pinHash })
      .select('id, name, age_range, created_at')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/children/:id ─────────────────────────────────────────────────
router.patch('/:id', ...guard, validate(updateChildSchema), async (req, res, next) => {
  try {
    const { name, ageRange, pin } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (ageRange !== undefined) updates.age_range = ageRange;
    if (pin !== undefined) updates.pin_hash = await bcrypt.hash(pin, 10);

    const { data, error } = await supabase
      .from('child_profiles')
      .update(updates)
      .eq('id', req.params.id)
      .eq('household_id', req.householdId)
      .select('id, name, age_range, created_at')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Child not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/children/:id (soft archive) ─────────────────────────────────
router.delete('/:id', ...guard, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('child_profiles')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('household_id', req.householdId)
      .select('id')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Child not found' });
    res.json({ message: 'Child archived' });
  } catch (err) {
    next(err);
  }
});

export default router;
