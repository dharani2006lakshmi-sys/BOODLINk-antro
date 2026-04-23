// ============================================================
// auth.middleware.js — Firebase Token Verification & RBAC
// ============================================================

const { auth, db } = require('../firebase-admin');

/**
 * Verifies the Firebase ID token from Authorization header.
 * Attaches decoded token + Firestore profile to req.user.
 */
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    // Attach basic decoded token
    req.user = { uid: decoded.uid, email: decoded.email };

    // Fetch full profile from Firestore for role info
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (userDoc.exists) {
      req.user = { ...req.user, ...userDoc.data() };
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.', detail: err.message });
  }
}

/**
 * Role-based access control middleware factory.
 * Usage: requireRole('admin') or requireRole(['admin','donor'])
 */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied.',
        required: allowed,
        yours: req.user?.role || 'none'
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
