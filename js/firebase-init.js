// ============================================================
// firebase-init.js — Firebase configuration & initialization
// Replace firebaseConfig values with YOUR project's config
// from Firebase Console > Project Settings > Your Apps
// ============================================================

// ⚠️  REPLACE THESE VALUES with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (using compat SDK for simplicity)
firebase.initializeApp(firebaseConfig);

// Export commonly used instances
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

  const age = parseInt(medical.age);
  const weight = parseFloat(medical.weight);
  const hb = parseFloat(medical.hemoglobin);

  if (age < 18 || age > 65)   reasons.push('Age must be 18–65');
  if (weight < 50)             reasons.push('Weight must be at least 50 kg');
  if (hb < 12.5)               reasons.push('Hemoglobin must be ≥ 12.5 g/dL');
  if (medical.activeDiseases)  reasons.push('Active disease condition');

  // Last donation cooldown (56 days / ~2 months)
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
