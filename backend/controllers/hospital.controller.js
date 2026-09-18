// ============================================================
// hospital.controller.js — Hospital Request Logic
// ============================================================

const { db } = require('../firebase-admin');

/**
 * POST /api/hospitals/requests
 * Hospital submits a blood request.
 */
exports.createRequest = async (req, res) => {
  const { bloodGroup, units, priority, reason } = req.body;

  if (!bloodGroup || !units) {
    return res.status(400).json({ error: 'bloodGroup and units are required.' });
  }

  const validGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  if (!validGroups.includes(bloodGroup)) {
    return res.status(400).json({ error: 'Invalid blood group.' });
  }

  try {
    const ref = await db.collection('hospitalRequests').add({
      hospitalId:   req.user.uid,
      hospitalName: req.user.name,
      bloodGroup,
      units:    parseInt(units),
      priority: priority || 'normal',
      reason:   reason || '',
      status:   'pending',
      createdAt: new Date()
    });

    res.status(201).json({ message: 'Blood request submitted.', requestId: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hospitals/requests
 * Hospital sees its own requests; admin sees all if they call this.
 */
exports.getMyRequests = async (req, res) => {
  try {
    let query = db.collection('hospitalRequests').orderBy('createdAt', 'desc');
    if (req.user.role === 'hospital') {
      query = query.where('hospitalId', '==', req.user.uid);
    }
    const snap = await query.get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hospitals/requests/all  (Admin)
 */
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.collection('hospitalRequests').orderBy('createdAt', 'desc');
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snap     = await query.get();
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/hospitals/requests/:id  (Admin)
 * Approve or reject a request. On approval, deducts blood stock.
 */
exports.updateRequestStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "approved" or "rejected".' });
  }

  try {
    const reqRef = db.collection('hospitalRequests').doc(id);
    const reqDoc = await reqRef.get();

    if (!reqDoc.exists) return res.status(404).json({ error: 'Request not found.' });
    const requestData = reqDoc.data();

    if (requestData.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be updated.' });
    }

    // If approving, verify and deduct stock
    if (status === 'approved') {
      const stockRef = db.collection('bloodStock').doc(requestData.bloodGroup);
      const stockDoc = await stockRef.get();

      if (!stockDoc.exists || stockDoc.data().units < requestData.units) {
        return res.status(409).json({
          error: 'Insufficient blood stock.',
          available: stockDoc.exists ? stockDoc.data().units : 0,
          requested: requestData.units
        });
      }

      await stockRef.update({
        units: stockDoc.data().units - requestData.units,
        updatedAt: new Date()
      });
    }

    await reqRef.update({ status, updatedAt: new Date() });

    res.json({ message: `Request ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hospitals  (Admin)
 */
exports.getAllHospitals = async (req, res) => {
  try {
    const snap = await db.collection('users').where('role', '==', 'hospital').get();
    const hospitals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
