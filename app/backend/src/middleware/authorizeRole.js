/**
 * Factory that returns a middleware allowing only the specified roles.
 * Usage: router.get('/...', authenticateJWT, authorizeRole('parent'), handler)
 */
export default function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
