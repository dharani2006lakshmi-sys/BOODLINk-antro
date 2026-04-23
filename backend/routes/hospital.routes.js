// ============================================================
// hospital.routes.js — Hospital Blood Request Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const hospitalController = require('../controllers/hospital.controller');

router.use(verifyToken);

// POST /api/hospitals/requests         — Hospital submits a request
router.post('/requests', requireRole('hospital'), hospitalController.createRequest);

// GET  /api/hospitals/requests         — Hospital views own requests
router.get('/requests', requireRole(['hospital', 'admin']), hospitalController.getMyRequests);

// GET  /api/hospitals/requests/all     — Admin views all requests
router.get('/requests/all', requireRole('admin'), hospitalController.getAllRequests);

// PUT  /api/hospitals/requests/:id     — Admin approves/rejects
router.put('/requests/:id', requireRole('admin'), hospitalController.updateRequestStatus);

// GET  /api/hospitals                  — Admin: list all hospitals
router.get('/', requireRole('admin'), hospitalController.getAllHospitals);

module.exports = router;
