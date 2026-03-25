import { Router } from 'express';
import supabase from '../db.js';
import authenticateJWT from '../middleware/authenticateJWT.js';
import householdGuard from '../middleware/householdGuard.js';

const router = Router();

// ── GET /api/dashboard ──────────────────────────────────────────────────────
// Returns a summary of household stats:
//   - totalChores, pendingApproval, completedThisWeek
//   - children list (id, name, assignedCount)
router.get('/', authenticateJWT, householdGuard, async (req, res, next) => {
  try {
    const hid = req.householdId;

    // Fetch all non-cancelled chores
    const { data: chores, error: choreErr } = await supabase
      .from('chores')
      .select('id, status, assigned_to, created_at')
      .eq('household_id', hid);

    if (choreErr) throw choreErr;

    // Fetch active children
    const { data: children, error: childErr } = await supabase
      .from('child_profiles')
      .select('id, name')
      .eq('household_id', hid)
      .is('archived_at', null);

    if (childErr) throw childErr;

    // Compute stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pendingApproval = chores.filter((c) => c.status === 'pending_approval').length;
    const completedThisWeek = chores.filter(
      (c) => c.status === 'approved' && new Date(c.created_at) >= weekAgo
    ).length;

    const childrenWithCounts = children.map((child) => ({
      id: child.id,
      name: child.name,
      assignedCount: chores.filter(
        (c) => Array.isArray(c.assigned_to) && c.assigned_to.includes(child.id) && c.status === 'active'
      ).length,
    }));

    res.json({
      totalChores: chores.length,
      pendingApproval,
      completedThisWeek,
      children: childrenWithCounts,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
