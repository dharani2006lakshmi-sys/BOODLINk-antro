// ============================================================
// admin.controller.js — Admin Summary & Report Logic
// ============================================================

const { db } = require('../firebase-admin');

/**
 * GET /api/admin/summary
 * Returns key counts for the admin dashboard overview.
 */
exports.getSummary = async (req, res) => {
  try {
    const [donorsSnap, hospitalsSnap, donationsSnap, pendingSnap, stockSnap] = await Promise.all([
      db.collection('donors').get(),
      db.collection('users').where('role', '==', 'hospital').get(),
      db.collection('donations').get(),
      db.collection('hospitalRequests').where('status', '==', 'pending').get(),
      db.collection('bloodStock').get()
    ]);

    // Aggregate stock
    const stock = {};
    stockSnap.forEach(doc => {
      stock[doc.id] = doc.data().units;
    });

    // Count donors by blood group
    const bloodGroupCount = {};
    donorsSnap.forEach(doc => {
      const g = doc.data().bloodGroup;
      if (g) bloodGroupCount[g] = (bloodGroupCount[g] || 0) + 1;
    });

    res.json({
      totalDonors:       donorsSnap.size,
      totalHospitals:    hospitalsSnap.size,
      totalDonations:    donationsSnap.size,
      pendingRequests:   pendingSnap.size,
      bloodStock:        stock,
      donorsByBloodGroup: bloodGroupCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/report
 * Returns a full system report: recent donations, emergency requests, low stock alerts.
 */
exports.getReport = async (req, res) => {
  try {
    // Recent 10 donations
    const recentDonationsSnap = await db.collection('donations')
      .orderBy('donatedAt', 'desc').limit(10).get();
    const recentDonations = recentDonationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Emergency requests
    const emergencySnap = await db.collection('hospitalRequests')
      .where('priority', '==', 'emergency')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc').get();
    const emergencyRequests = emergencySnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Low stock (< 5 units)
    const stockSnap = await db.collection('bloodStock').get();
    const lowStock  = [];
    stockSnap.forEach(doc => {
      if (doc.data().units < 5) lowStock.push(doc.data());
    });

    // Top donors
    const topDonorsSnap = await db.collection('donors')
      .orderBy('totalDonations', 'desc').limit(5).get();
    const topDonors = topDonorsSnap.docs.map(d => ({
      name:           d.data().name,
      bloodGroup:     d.data().bloodGroup,
      totalDonations: d.data().totalDonations,
      category:       d.data().category
    }));

    res.json({
      generatedAt:       new Date().toISOString(),
      recentDonations,
      emergencyRequests,
      lowStockAlerts:    lowStock,
      topDonors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
