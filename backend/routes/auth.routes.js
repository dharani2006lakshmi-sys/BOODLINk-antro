// ============================================================
// auth.routes.js — Authentication Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { db, auth } = require('../firebase-admin');
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * POST /api/auth/register
 * Creates a Firebase Auth user and saves profile to Firestore.
 * Body: { name, email, password, role, phone }
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required.' });
  }

  const validRoles = ['admin', 'donor', 'hospital'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
  }

  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({ email, password, displayName: name });
    const uid = userRecord.uid;

    // Save profile to Firestore
    await db.collection('users').doc(uid).set({
      uid, name, email, role, phone: phone || '',
      createdAt: new Date()
    });

    // Initialize donor document
    if (role === 'donor') {
      await db.collection('donors').doc(uid).set({
        uid, name, email, phone: phone || '',
        bloodGroup: '', totalDonations: 0, points: 0,
        category: 'Bronze', eligible: false,
        createdAt: new Date()
      });
    }

    res.status(201).json({ message: 'User registered successfully.', uid });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use.' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/profile
 * Returns the current authenticated user's profile.
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found.' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/auth/profile
 * Updates name and phone for the authenticated user.
 */
router.put('/profile', verifyToken, async (req, res) => {
  const { name, phone } = req.body;
  try {
    await db.collection('users').doc(req.user.uid).update({ name, phone });
    res.json({ message: 'Profile updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
