// ============================================================
// donor.routes.js — Donor Management Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const donorController = require('../controllers/donor.controller');

// All donor routes require authentication
router.use(verifyToken);

// GET  /api/donors/me          — Donor's own profile
router.get('/me', requireRole(['donor']), donorController.getMyProfile);

// PUT  /api/donors/me/medical  — Save/update medical details
router.put('/me/medical', requireRole(['donor']), donorController.saveMedical);

// GET  /api/donors/me/donations — Donor's donation history
router.get('/me/donations', requireRole(['donor']), donorController.getMyDonations);

// GET  /api/donors/me/card     — Donor card data
router.get('/me/card', requireRole(['donor']), donorController.getDonorCard);

// GET  /api/donors             — Admin: list all donors
router.get('/', requireRole('admin'), donorController.getAllDonors);

// GET  /api/donors/:uid        — Admin: get specific donor
router.get('/:uid', requireRole('admin'), donorController.getDonorById);

module.exports = router;
