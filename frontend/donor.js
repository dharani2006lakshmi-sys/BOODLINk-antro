// ============================================================
// donor.js — Donor Dashboard Logic
// ============================================================

requireAuth('donor');

let currentDonor = null;
let currentUser  = null;

// ── Section Navigation ──
function showSection(name, el) {
  document.querySelectorAll('[id^="section-"]').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = { overview:'Donor Overview', profile:'My Profile', medical:'Medical Details',
                   history:'Donation History', card:'Donor Card', rewards:'Rewards & Tier' };
  document.getElementById('topbarTitle').textContent = titles[name] || '';

  if (name === 'card')    renderDonorCard(currentDonor);
  if (name === 'history') loadHistory();
  if (name === 'rewards') loadRewards();
  if (name === 'medical') prefillMedical();
  if (name === 'profile') prefillProfile();
}

// ── Init ──
auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  currentUser = user;
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'donor') return;

  document.getElementById('donorNameTop').textContent = profile.name;
  document.getElementById('userAvatar').textContent   = profile.name[0].toUpperCase();

  // Load donor document
  const donorDoc = await db.collection('donors').doc(user.uid).get();
  currentDonor = donorDoc.exists ? { uid: user.uid, ...donorDoc.data() } : { uid: user.uid, ...profile };

  loadOverview();
});

// ── Overview ──
async function loadOverview() {
  const d = currentDonor;
  document.getElementById('statTotalDonations').textContent = d.totalDonations || 0;
  document.getElementById('statPoints').textContent         = d.points || 0;
  document.getElementById('statBloodGroup').textContent     = d.bloodGroup || '?';

  const cat = getDonorCategory(d.totalDonations || 0);
  const catEl = document.getElementById('statCategory');
  catEl.innerHTML = `<span class="tier-badge ${getCategoryClass(cat)}">${cat}</span>`;

  // Eligibility alert
  const elig = checkEligibility(d);
  const alertEl = document.getElementById('eligibilityAlert');
  if (elig.eligible) {
    alertEl.innerHTML = '<div class="alert alert-success">✅ You are currently <strong>eligible</strong> to donate blood!</div>';
  } else {
    alertEl.innerHTML = `<div class="alert alert-warning">⚠️ Not eligible: ${elig.reasons.join(', ')}</div>`;
  }

  // Recent donations
  const snap = await db.collection('donations')
    .where('donorId','==',currentUser.uid)
    .orderBy('donatedAt','desc').limit(5).get();
  const tbody = document.getElementById('recentDonationsBody');
  tbody.innerHTML = '';
  if (snap.empty) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:24px;">No donations yet.</td></tr>';
  } else {
    snap.forEach(doc => {
      const don = doc.data();
      tbody.innerHTML += `<tr>
        <td>${formatDate(don.donatedAt)}</td>
        <td><span class="blood-pill">${don.bloodGroup}</span></td>
        <td>${don.units || 1}</td>
        <td>${don.hospital || '—'}</td>
        <td><span class="badge badge-success">+${don.pointsEarned || 10}</span></td>
      </tr>`;
    });
  }
}

// ── Profile ──
function prefillProfile() {
  db.collection('users').doc(currentUser.uid).get().then(doc => {
    const d = doc.data();
    document.getElementById('profileName').value  = d.name || '';
    document.getElementById('profilePhone').value = d.phone || '';
    document.getElementById('profileEmail').value = d.email || '';
  });
}

async function saveProfile() {
  const name  = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  await db.collection('users').doc(currentUser.uid).update({ name, phone });
  await db.collection('donors').doc(currentUser.uid).update({ name, phone });
  currentDonor.name = name;
  showToast('Profile updated!', 'success');
}

// ── Medical ──
function prefillMedical() {
  const d = currentDonor;
  if (d.bloodGroup)      document.getElementById('medBloodGroup').value    = d.bloodGroup;
  if (d.age)             document.getElementById('medAge').value            = d.age;
  if (d.weight)          document.getElementById('medWeight').value         = d.weight;
  if (d.hemoglobin)      document.getElementById('medHemoglobin').value     = d.hemoglobin;
  if (d.bloodPressure)   document.getElementById('medBP').value             = d.bloodPressure;
  if (d.diseases)        document.getElementById('medDiseases').value       = d.diseases;
  if (d.activeDiseases)  document.getElementById('medActiveDiseases').checked = d.activeDiseases;
  if (d.lastDonationDate) {
    const dt = d.lastDonationDate.toDate ? d.lastDonationDate.toDate() : new Date(d.lastDonationDate);
    document.getElementById('medLastDonation').value = dt.toISOString().split('T')[0];
  }
}

async function saveMedical() {
  const bloodGroup    = document.getElementById('medBloodGroup').value;
  const age           = document.getElementById('medAge').value;
  const weight        = document.getElementById('medWeight').value;
  const hemoglobin    = document.getElementById('medHemoglobin').value;
  const bloodPressure = document.getElementById('medBP').value;
  const diseases      = document.getElementById('medDiseases').value;
  const activeDiseases = document.getElementById('medActiveDiseases').checked;
  const lastDonationDate = document.getElementById('medLastDonation').value;

  if (!bloodGroup || !age || !weight || !hemoglobin) {
    showToast('Please fill in all required medical fields.', 'error');
    return;
  }

  const medical = { bloodGroup, age: parseInt(age), weight: parseFloat(weight),
    hemoglobin: parseFloat(hemoglobin), bloodPressure, diseases, activeDiseases,
    lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp() };

  // Check eligibility
  const elig = checkEligibility(medical);
  medical.eligible = elig.eligible;

  await db.collection('donors').doc(currentUser.uid).set(medical, { merge: true });
  Object.assign(currentDonor, medical);

  // Show result
  const resultEl = document.getElementById('eligibilityResult');
  if (elig.eligible) {
    resultEl.innerHTML = '<div class="alert alert-success">✅ You are <strong>eligible</strong> to donate blood!</div>';
  } else {
    resultEl.innerHTML = `<div class="alert alert-warning">⚠️ Not yet eligible: <ul style="margin:8px 0 0 20px;">${elig.reasons.map(r=>`<li>${r}</li>`).join('')}</ul></div>`;
  }

  showToast('Medical info saved!', 'success');
}

// ── History ──
async function loadHistory() {
  const snap = await db.collection('donations')
    .where('donorId','==',currentUser.uid)
    .orderBy('donatedAt','desc').get();
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';
  let i = 1;
  if (snap.empty) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:24px;">No donations recorded yet.</td></tr>';
    return;
  }
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `<tr>
      <td>${i++}</td>
      <td>${formatDate(d.donatedAt)}</td>
      <td><span class="blood-pill">${d.bloodGroup}</span></td>
      <td>${d.units || 1}</td>
      <td>${d.hospital || '—'}</td>
      <td><span class="badge badge-success">+${d.pointsEarned || 10}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="showDonationCard('${doc.id}')">View Card</button></td>
    </tr>`;
  });
}

async function showDonationCard(donationId) {
  const doc = await db.collection('donations').doc(donationId).get();
  const html = renderDonationCard({ id: donationId, ...doc.data() }, currentDonor);
  // Show in a quick overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" style="max-width:420px;">${html}<br>
    <button class="btn btn-ghost btn-full" onclick="this.closest('.modal-overlay').remove()">Close</button>
  </div>`;
  document.body.appendChild(overlay);
}

// ── Rewards ──
function loadRewards() {
  const d = currentDonor;
  const total = d.totalDonations || 0;
  const cat   = getDonorCategory(total);
  const points = d.points || 0;

  // Next tier
  const nextTier = total < 3 ? { name:'Silver', at: 3 } : total < 6 ? { name:'Gold', at: 6 } : null;
  const pct = nextTier ? Math.min(100, (total / nextTier.at) * 100) : 100;

  document.getElementById('rewardsProgress').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <span style="font-size:3rem;">${{Gold:'🥇',Silver:'🥈',Bronze:'🥉'}[cat]}</span>
      <div>
        <div style="font-size:1.4rem;font-weight:800;">${cat} Donor</div>
        <div style="color:var(--text-light);">${total} donation${total!==1?'s':''} · ${points} points</div>
      </div>
    </div>
    ${nextTier ? `
    <div style="margin-bottom:8px;font-size:0.88rem;color:var(--text-mid);">
      Progress to <strong>${nextTier.name}</strong>: ${total}/${nextTier.at} donations
    </div>
    <div class="progress" style="height:12px;margin-bottom:16px;">
      <div class="progress-bar" style="width:${pct}%;"></div>
    </div>
    ` : '<div class="alert alert-success" style="margin-top:12px;">🎉 You have reached the highest tier — <strong>Gold</strong>!</div>'}
    <div class="card" style="background:var(--bg);margin-top:16px;">
      <h4 style="margin-bottom:12px;">How Points Work</h4>
      <p>Each blood donation earns you <strong>10 points</strong>. Points accumulate and help determine your tier:</p>
      <ul style="margin:12px 0 0 20px;color:var(--text-mid);line-height:2;">
        <li>🥉 <strong>Bronze</strong> — 1–2 donations (10–20 pts)</li>
        <li>🥈 <strong>Silver</strong> — 3–5 donations (30–50 pts)</li>
        <li>🥇 <strong>Gold</strong> — 6+ donations (60+ pts)</li>
      </ul>
    </div>`;
}
