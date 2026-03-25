import { Router } from 'express';
import supabase from '../db.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import authorizeRole from '../middleware/authorizeRole.js';
import householdGuard from '../middleware/householdGuard.js';
import { validate } from '../validators/chore.validator.js';
import { createChoreSchema, updateChoreSchema } from '../validators/chore.validator.js';

const router = Router();
const parentGuard = [authenticateJWT, authorizeRole('parent'), householdGuard];
const childGuard  = [authenticateJWT, authorizeRole('child'), householdGuard];
const anyGuard    = [authenticateJWT, householdGuard];

// ── POST /api/chores  (parent creates a chore) ──────────────────────────────
router.post('/', ...parentGuard, validate(createChoreSchema), async (req, res, next) => {
  try {
    const { title, type, frequency, dueDate, reward, difficulty, assignedTo } = req.body;

    const { data, error } = await supabase
      .from('chores')
      .insert({
        household_id: req.householdId,
        title,
        type: type || 'one-time',
        frequency: frequency || null,
        due_date: dueDate || null,
        reward: reward || 0,
        difficulty: difficulty || 'medium',
        assigned_to: assignedTo,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/chores  (all chores for household) ─────────────────────────────
router.get('/', ...anyGuard, async (req, res, next) => {
  try {
    let query = supabase
      .from('chores')
      .select('*')
      .eq('household_id', req.householdId)
      .order('created_at', { ascending: false });

    // Children only see chores assigned to them
    if (req.user.role === 'child') {
      query = query.contains('assigned_to', [req.user.id]);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/chores/:id  (update status or details) ──────────────────────
router.patch('/:id', authenticateJWT, householdGuard, validate(updateChoreSchema), async (req, res, next) => {
  try {
    const { status, rejectionReason, title, reward, assignedTo } = req.body;
    const updates = {};

    // Children can only submit for approval
    if (req.user.role === 'child') {
      if (status !== 'pending_approval') {
        return res.status(403).json({ error: 'Children can only submit chores for approval' });
      }
      updates.status = 'pending_approval';
    } else {
      // Parent can update any field
      if (status !== undefined) updates.status = status;
      if (rejectionReason !== undefined) updates.rejection_reason = rejectionReason;
      if (title !== undefined) updates.title = title;
      if (reward !== undefined) updates.reward = reward;
      if (assignedTo !== undefined) updates.assigned_to = assignedTo;
    }

    const { data, error } = await supabase
      .from('chores')
      .update(updates)
      .eq('id', req.params.id)
      .eq('household_id', req.householdId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Chore not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
