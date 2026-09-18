// ============================================================
// donor.controller.js — Donor Business Logic
// ============================================================

const { db } = require('../firebase-admin');

// ── Eligibility check helper ──
function checkEligibility(data) {
  const reasons = [];
  const age    = parseInt(data.age);
  const weight = parseFloat(data.weight);
  const hb     = parseFloat(data.hemoglobin);

  if (!data.bloodGroup)           reasons.push('Blood group not set');
  if (isNaN(age) || age < 18 || age > 65) reasons.push('Age must be 18–65');
  if (isNaN(weight) || weight < 50)       reasons.push('Weight must be ≥ 50 kg');
  if (isNaN(hb) || hb < 12.5)            reasons.push('Hemoglobin must be ≥ 12.5 g/dL');
  if (data.activeDiseases)                reasons.push('Active disease present');

  if (data.lastDonationDate) {
    const last = data.lastDonationDate instanceof Date
      ? data.lastDonationDate
      : new Date(data.lastDonationDate);
    const days = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 56) reasons.push(`Must wait ${Math.ceil(56 - days)} more days since last donation`);
  }
  return { eligible: reasons.length === 0, reasons };
}

// ── Category helper ──
function getCategory(totalDonations) {
  if (totalDonations >= 6) return 'Gold';
  if (totalDonations >= 3) return 'Silver';
  return 'Bronze';
}

/**
 * GET /api/donors/me
 */
exports.getMyProfile = async (req, res) => {
  try {
    const doc = await db.collection('donors').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Donor profile not found.' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/donors/me/medical
 * Body: { bloodGroup, age, weight, hemoglobin, bloodPressure, diseases, activeDiseases, lastDonationDate }
 */
exports.saveMedical = async (req, res) => {
  const { bloodGroup, age, weight, hemoglobin, bloodPressure, diseases, activeDiseases, lastDonationDate } = req.body;

  if (!bloodGroup || !age || !weight || !hemoglobin) {
    return res.status(400).json({ error: 'bloodGroup, age, weight, and hemoglobin are required.' });
  }

  const medicalData = {
    bloodGroup,
    age:          parseInt(age),
    weight:       parseFloat(weight),
    hemoglobin:   parseFloat(hemoglobin),
    bloodPressure: bloodPressure || '',
    diseases:      diseases || '',
    activeDiseases: !!activeDiseases,
    lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
    updatedAt: new Date()
  };

  const eligibility = checkEligibility(medicalData);
  medicalData.eligible = eligibility.eligible;

  try {
    await db.collection('donors').doc(req.user.uid).set(medicalData, { merge: true });
    res.json({ message: 'Medical details saved.', ...eligibility });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/donors/me/donations
 */
exports.getMyDonations = async (req, res) => {
  try {
    const snap = await db.collection('donations')
      .where('donorId', '==', req.user.uid)
      .orderBy('donatedAt', 'desc')
      .get();

    const donations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/donors/me/card
 * Returns all data needed to render a donor card.
 */
exports.getDonorCard = async (req, res) => {
  try {
    const donorDoc = await db.collection('donors').doc(req.user.uid).get();
    const userDoc  = await db.collection('users').doc(req.user.uid).get();

    if (!donorDoc.exists) return res.status(404).json({ error: 'Donor profile not found.' });

    const donor = { ...userDoc.data(), ...donorDoc.data() };
    const category = getCategory(donor.totalDonations || 0);

    res.json({
      uid:            req.user.uid,
      name:           donor.name,
      bloodGroup:     donor.bloodGroup,
      totalDonations: donor.totalDonations || 0,
      points:         donor.points || 0,
      category,
      createdAt:      donor.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/donors  (Admin)
 */
exports.getAllDonors = async (req, res) => {
  try {
    const snap    = await db.collection('donors').get();
    const donors  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/donors/:uid  (Admin)
 */
exports.getDonorById = async (req, res) => {
  try {
    const doc = await db.collection('donors').doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Donor not found.' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
