/**
 * Attaches req.householdId from the authenticated user's JWT payload.
 * Must be used AFTER authenticateJWT.
 */
export default function householdGuard(req, res, next) {
  if (!req.user?.householdId) {
    return res.status(403).json({ error: 'No household associated with this account' });
  }
  req.householdId = req.user.householdId;
  next();
}
