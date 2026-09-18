// ============================================================
// admin.routes.js — Admin-only Summary & Report Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

router.use(verifyToken);
router.use(requireRole('admin'));

// GET /api/admin/summary   — Dashboard stats summary
router.get('/summary', adminController.getSummary);

// GET /api/admin/report    — Full system report
router.get('/report', adminController.getReport);

module.exports = router;
