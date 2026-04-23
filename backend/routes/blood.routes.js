// ============================================================
// blood.routes.js — Blood Stock Management Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const bloodController = require('../controllers/blood.controller');

router.use(verifyToken);

// GET  /api/blood/stock          — All roles: view current stock
router.get('/stock', bloodController.getStock);

// PUT  /api/blood/stock/:group   — Admin only: set stock for a group
router.put('/stock/:group', requireRole('admin'), bloodController.updateStock);

// POST /api/blood/donate         — Admin records a donation & updates stock
router.post('/donate', requireRole('admin'), bloodController.recordDonation);

module.exports = router;
