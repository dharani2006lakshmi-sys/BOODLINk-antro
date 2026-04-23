// firebase-init.js — Firebase configuration & initialization

const firebaseConfig = {
  apiKey: "AIzaSyD9DjzvAxR_ST_4liqaLM-zngkI1K9AYwk",
  authDomain: "bloodlink-781c4.firebaseapp.com",
  projectId: "bloodlink-781c4",
  storageBucket: "bloodlink-781c4.firebasestorage.app",
  messagingSenderId: "565462585503",
  appId: "1:565462585503:web:1d1877ee58066d50ad92aa",
  measurementId: "G-BSDD3GBZB8"
};

// Initialize Firebase (compat SDK — works with firebase.auth() / firebase.firestore())
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// ── Helper: Get current user's profile from Firestore ──
async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const doc = await db.collection('users').doc(user.uid).get();
  return doc.exists ? { uid: user.uid, ...doc.data() } : null;
}

// ── Helper: Show toast notification ──
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `show toast-${type}`;
  setTimeout(() => { toast.className = ''; }, 3500);
}

// ── Helper: Format date ──
function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Helper: Calculate donor category ──
function getDonorCategory(totalDonations) {
  if (totalDonations >= 6) return 'Gold';
  if (totalDonations >= 3) return 'Silver';
  return 'Bronze';
}

// ── Helper: Get category badge class ──
function getCategoryClass(category) {
  const map = { Gold: 'tier-gold', Silver: 'tier-silver', Bronze: 'tier-bronze' };
  return map[category] || 'tier-bronze';
}

// ── Helper: Get eligibility status ──
function checkEligibility(medical) {
  const reasons = [];
  if (!medical) return { eligible: false, reasons: ['No medical data found'] };

  const age    = parseInt(medical.age);
  const weight = parseFloat(medical.weight);
  const hb     = parseFloat(medical.hemoglobin);

  if (age < 18 || age > 65)   reasons.push('Age must be 18–65');
  if (weight < 50)             reasons.push('Weight must be at least 50 kg');
  if (hb < 12.5)               reasons.push('Hemoglobin must be ≥ 12.5 g/dL');
  if (medical.activeDiseases)  reasons.push('Active disease condition');

  if (medical.lastDonationDate) {
    const lastDate = medical.lastDonationDate.toDate
      ? medical.lastDonationDate.toDate()
      : new Date(medical.lastDonationDate);
    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 56) {
      const daysLeft = Math.ceil(56 - daysSince);
      reasons.push(`Must wait ${daysLeft} more days since last donation`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

// ── Auth Guard — redirect if not logged in ──
function requireAuth(allowedRole) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = '../pages/login.html';
      return;
    }
    const profile = await getCurrentUserProfile();
    if (!profile || (allowedRole && profile.role !== allowedRole)) {
      showToast('Access denied. Redirecting...', 'error');
      setTimeout(() => { window.location.href = '../pages/login.html'; }, 1500);
    }
  });
}
