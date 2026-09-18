// ============================================================
// blood.controller.js — Blood Stock & Donation Logic
// ============================================================

const { db } = require('../firebase-admin');

const BLOOD_GROUPS     = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const POINTS_PER_DONATE = 10;

// ── Category helper ──
function getCategory(total) {
  if (total >= 6) return 'Gold';
  if (total >= 3) return 'Silver';
  return 'Bronze';
}

/**
 * GET /api/blood/stock
 * Returns current blood stock for all groups.
 */
exports.getStock = async (req, res) => {
  try {
    const snap  = await db.collection('bloodStock').get();
    const stock = {};
    snap.forEach(doc => { stock[doc.id] = doc.data(); });

    // Fill in groups with no document as 0
    BLOOD_GROUPS.forEach(g => {
      if (!stock[g]) stock[g] = { bloodGroup: g, units: 0 };
    });

    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/blood/stock/:group  (Admin)
 * Sets absolute unit count for a blood group.
 * Body: { units }
 */
exports.updateStock = async (req, res) => {
  const { group } = req.params;
  const { units } = req.body;

  if (!BLOOD_GROUPS.includes(group)) {
    return res.status(400).json({ error: `Invalid blood group. Must be one of: ${BLOOD_GROUPS.join(', ')}` });
  }
  if (units === undefined || isNaN(parseInt(units)) || parseInt(units) < 0) {
    return res.status(400).json({ error: 'units must be a non-negative integer.' });
  }

  try {
    await db.collection('bloodStock').doc(group).set({
      bloodGroup: group,
      units: parseInt(units),
      updatedAt: new Date()
    }, { merge: true });

    res.json({ message: `Stock for ${group} updated to ${units} units.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/blood/donate  (Admin)
 * Records a donation, updates donor stats + rewards, and increments stock.
 * Body: { donorEmail, bloodGroup, units, hospital }
 */
exports.recordDonation = async (req, res) => {
  const { donorEmail, bloodGroup, units = 1, hospital } = req.body;

  if (!donorEmail || !bloodGroup) {
    return res.status(400).json({ error: 'donorEmail and bloodGroup are required.' });
  }

  try {
    // 1. Find donor by email
    const userSnap = await db.collection('users')
      .where('email', '==', donorEmail)
      .where('role', '==', 'donor')
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ error: 'Donor not found with this email.' });
    }

    const userDoc = userSnap.docs[0];
    const uid     = userDoc.id;
    const donor   = userDoc.data();

    // 2. Add donation record
    const donationRef = await db.collection('donations').add({
      donorId:      uid,
      donorName:    donor.name,
      bloodGroup,
      units:        parseInt(units),
      hospital:     hospital || '',
      pointsEarned: POINTS_PER_DONATE,
      donatedAt:    new Date()
    });

    // 3. Update donor profile (totalDonations, points, category, lastDonationDate)
    const donorRef = db.collection('donors').doc(uid);
    const donorDoc = await donorRef.get();
    const existing = donorDoc.exists ? donorDoc.data() : {};

    const newTotal    = (existing.totalDonations || 0) + 1;
    const newPoints   = (existing.points || 0) + POINTS_PER_DONATE;
    const newCategory = getCategory(newTotal);

    await donorRef.set({
      totalDonations:   newTotal,
      points:           newPoints,
      category:         newCategory,
      bloodGroup,
      lastDonationDate: new Date(),
      eligible:         false,  // reset; re-evaluated after 56 days
      updatedAt:        new Date()
    }, { merge: true });

    // 4. Increment blood stock
    const stockRef = db.collection('bloodStock').doc(bloodGroup);
    const stockDoc = await stockRef.get();
    await stockRef.set({
      bloodGroup,
      units:     (stockDoc.exists ? stockDoc.data().units : 0) + parseInt(units),
      updatedAt: new Date()
    }, { merge: true });

    res.status(201).json({
      message:    'Donation recorded successfully.',
      donationId: donationRef.id,
      donor: {
        name:           donor.name,
        totalDonations: newTotal,
        points:         newPoints,
        category:       newCategory
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
