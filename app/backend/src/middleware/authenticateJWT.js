import jwt from 'jsonwebtoken';

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches the decoded payload to req.user.
 */
export default function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, householdId }
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}
