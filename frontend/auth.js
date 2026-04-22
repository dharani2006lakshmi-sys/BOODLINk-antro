// ============================================================
// auth.js — Authentication: Login, Register, Logout
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // ── Redirect logged-in users ──
  auth.onAuthStateChanged(async (user) => {
    if (user && (window.location.pathname.includes('login') || window.location.pathname.includes('register'))) {
      const profile = await getCurrentUserProfile();
      if (profile) redirectByRole(profile.role);
    }
  });

  // ── LOGIN FORM ──
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const btn      = loginForm.querySelector('button[type=submit]');

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        await auth.signInWithEmailAndPassword(email, password);
        const profile = await getCurrentUserProfile();
        showToast(`Welcome back, ${profile.name}!`, 'success');
        setTimeout(() => redirectByRole(profile.role), 800);
      } catch (err) {
        showToast(getAuthError(err.code), 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  // ── REGISTER FORM ──
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name     = document.getElementById('regName').value.trim();
      const email    = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const role     = document.getElementById('regRole').value;
      const phone    = document.getElementById('regPhone').value.trim();
      const btn      = registerForm.querySelector('button[type=submit]');

      if (!name || !email || !password || !role) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creating account…';

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const uid  = cred.user.uid;

        // Save user profile in Firestore
        await db.collection('users').doc(uid).set({
          uid, name, email, role, phone,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Initialize donor-specific subcollection
        if (role === 'donor') {
          await db.collection('donors').doc(uid).set({
            uid, name, email, phone,
            bloodGroup: '', totalDonations: 0, points: 0,
            category: 'Bronze',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }

        // Initialize blood stock if first admin
        if (role === 'admin') {
          await initBloodStock();
        }

        showToast('Account created successfully!', 'success');
        setTimeout(() => redirectByRole(role), 1000);
      } catch (err) {
        showToast(getAuthError(err.code), 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  // ── Logout buttons ──
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = '../pages/login.html';
    });
  });
});

// ── Redirect by role ──
function redirectByRole(role) {
  const map = {
    admin:    '../pages/admin-dashboard.html',
    donor:    '../pages/donor-dashboard.html',
    hospital: '../pages/hospital-dashboard.html'
  };
  window.location.href = map[role] || '../pages/login.html';
}

// ── Initialize default blood stock ──
async function initBloodStock() {
  const groups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const batch  = db.batch();
  for (const g of groups) {
    const ref = db.collection('bloodStock').doc(g);
    const doc = await ref.get();
    if (!doc.exists) {
      batch.set(ref, { bloodGroup: g, units: 0, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
  }
  await batch.commit();
}

// ── Friendly error messages ──
function getAuthError(code) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts. Try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
