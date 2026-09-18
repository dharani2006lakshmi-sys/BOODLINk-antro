// ============================================================
// admin.js — Admin Dashboard Logic
// ============================================================

requireAuth('admin');

// ── Section Navigation ──
function showSection(name, el) {
  document.querySelectorAll('[id^="section-"]').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');

  const titles = { overview:'Dashboard Overview', donors:'Blood Donors', hospitals:'Hospitals',
                   requests:'Blood Requests', stock:'Blood Stock', donations:'Donations' };
  document.getElementById('topbarTitle').textContent = titles[name] || '';

  const loaders = { donors: loadDonors, hospitals: loadHospitals,
                    requests: loadRequests, stock: loadStockTable, donations: loadDonations };
  if (loaders[name]) loaders[name]();
}

// ── Init ──
auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') return;
  document.getElementById('adminName').textContent = profile.name;
  document.getElementById('userAvatar').textContent = profile.name[0].toUpperCase();
  loadOverview();
});

// ── Overview ──
async function loadOverview() {
  const [donorsSnap, hospitalsSnap, donationsSnap, requestsSnap, stockSnap] = await Promise.all([
    db.collection('donors').get(),
    db.collection('users').where('role','==','hospital').get(),
    db.collection('donations').get(),
    db.collection('hospitalRequests').where('status','==','pending').get(),
    db.collection('bloodStock').get()
  ]);

  document.getElementById('statDonors').textContent    = donorsSnap.size;
  document.getElementById('statHospitals').textContent = hospitalsSnap.size;
  document.getElementById('statDonations').textContent = donationsSnap.size;
  document.getElementById('statPending').textContent   = requestsSnap.size;

  // Update pending badge
  if (requestsSnap.size > 0) {
    const badge = document.getElementById('pendingBadge');
    badge.textContent = requestsSnap.size;
    badge.style.display = 'inline-flex';
  }

  // Stock grid
  const stockGrid = document.getElementById('stockGrid');
  stockGrid.innerHTML = '';
  stockSnap.forEach(doc => {
    const d = doc.data();
    const pct = Math.min(100, (d.units / 50) * 100);
    const color = d.units < 5 ? '#e74c3c' : d.units < 15 ? '#f39c12' : '#27ae60';
    stockGrid.innerHTML += `
      <div style="background:var(--bg);border-radius:10px;padding:14px;text-align:center;">
        <div class="blood-pill" style="width:42px;height:42px;margin:0 auto 8px;">${d.bloodGroup}</div>
        <div style="font-weight:800;font-size:1.3rem;color:${color};">${d.units}</div>
        <div style="font-size:0.72rem;color:var(--text-light);margin-bottom:6px;">units</div>
        <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${color};"></div></div>
      </div>`;
  });

  // Recent requests
  const recentSnap = await db.collection('hospitalRequests').orderBy('createdAt','desc').limit(5).get();
  const tbody = document.getElementById('recentRequestsBody');
  tbody.innerHTML = '';
  recentSnap.forEach(doc => {
    const r = doc.data();
    tbody.innerHTML += requestRow(doc.id, r);
  });
}

// ── Donors ──
async function loadDonors() {
  const snap = await db.collection('donors').get();
  renderDonorsTable(snap.docs);

  document.getElementById('donorSearch').addEventListener('input', async (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = snap.docs.filter(d => {
      const data = d.data();
      return (data.name || '').toLowerCase().includes(q) ||
             (data.bloodGroup || '').toLowerCase().includes(q);
    });
    renderDonorsTable(filtered);
  });
}

function renderDonorsTable(docs) {
  const tbody = document.getElementById('donorsBody');
  tbody.innerHTML = '';
  if (docs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:32px;">No donors found.</td></tr>';
    return;
  }
  docs.forEach(doc => {
    const d = doc.data();
    const cat = getDonorCategory(d.totalDonations || 0);
    tbody.innerHTML += `
      <tr>
        <td><strong>${d.name || '—'}</strong></td>
        <td><span class="blood-pill">${d.bloodGroup || '—'}</span></td>
        <td>${d.phone || '—'}</td>
        <td>${d.totalDonations || 0}</td>
        <td>${d.points || 0}</td>
        <td><span class="tier-badge ${getCategoryClass(cat)}">${cat}</span></td>
        <td><span class="badge ${d.eligible ? 'badge-success':'badge-danger'}">${d.eligible ? '✓ Yes':'✗ No'}</span></td>
      </tr>`;
  });
}

// ── Hospitals ──
async function loadHospitals() {
  const snap = await db.collection('users').where('role','==','hospital').get();
  const tbody = document.getElementById('hospitalsBody');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.email}</td>
        <td>${d.phone || '—'}</td>
        <td>${formatDate(d.createdAt)}</td>
        <td>—</td>
      </tr>`;
  });
}

// ── Requests ──
async function loadRequests() {
  const filter = document.getElementById('requestFilter')?.value || 'all';
  let query = db.collection('hospitalRequests').orderBy('createdAt','desc');
  if (filter !== 'all') query = query.where('status','==',filter);

  const snap = await query.get();
  const tbody = document.getElementById('requestsBody');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const r = doc.data();
    tbody.innerHTML += requestRow(doc.id, r, true);
  });
}

function requestRow(id, r, showActions = false) {
  const statusBadge = {
    pending:  '<span class="badge badge-warning">⏳ Pending</span>',
    approved: '<span class="badge badge-success">✓ Approved</span>',
    rejected: '<span class="badge badge-danger">✗ Rejected</span>'
  }[r.status] || '';

  const priorityBadge = r.priority === 'emergency'
    ? '<span class="badge badge-danger">🚨 Emergency</span>'
    : '<span class="badge badge-info">🔵 Normal</span>';

  const actions = showActions && r.status === 'pending' ? `
    <button class="btn btn-success btn-sm" onclick="updateRequest('${id}','approved')">✓ Approve</button>
    <button class="btn btn-danger btn-sm" onclick="updateRequest('${id}','rejected')">✗ Reject</button>
  ` : '—';

  return `
    <tr>
      <td><strong>${r.hospitalName || '—'}</strong></td>
      <td><span class="blood-pill">${r.bloodGroup}</span></td>
      <td>${r.units}</td>
      <td>${priorityBadge}</td>
      <td>${r.reason || '—'}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td>${statusBadge}</td>
      <td style="display:flex;gap:6px;">${actions}</td>
    </tr>`;
}

async function updateRequest(requestId, status) {
  try {
    const reqRef = db.collection('hospitalRequests').doc(requestId);
    const req    = (await reqRef.get()).data();

    await reqRef.update({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });

    // Deduct stock if approved
    if (status === 'approved' && req.bloodGroup && req.units) {
      const stockRef = db.collection('bloodStock').doc(req.bloodGroup);
      await stockRef.update({
        units: firebase.firestore.FieldValue.increment(-parseInt(req.units)),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    showToast(`Request ${status}!`, status === 'approved' ? 'success' : 'info');
    loadRequests();
  } catch (err) {
    showToast('Error updating request: ' + err.message, 'error');
  }
}

// ── Stock Table ──
async function loadStockTable() {
  const snap = await db.collection('bloodStock').get();
  const container = document.getElementById('stockTable');
  let html = `<div class="table-wrap"><table>
    <thead><tr><th>Blood Group</th><th>Units Available</th><th>Status</th><th>Last Updated</th></tr></thead>
    <tbody>`;

  snap.forEach(doc => {
    const d = doc.data();
    const status = d.units === 0 ? '<span class="badge badge-danger">Out of Stock</span>'
                 : d.units < 5  ? '<span class="badge badge-warning">Low Stock</span>'
                 : '<span class="badge badge-success">Available</span>';
    html += `<tr>
      <td><span class="blood-pill" style="width:40px;height:40px;">${d.bloodGroup}</span></td>
      <td><strong style="font-size:1.1rem;">${d.units}</strong> units</td>
      <td>${status}</td>
      <td>${formatDate(d.updatedAt)}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ── Update Stock ──
function openStockModal() { document.getElementById('stockModal').classList.remove('hidden'); }

async function updateStock() {
  const group = document.getElementById('stockGroup').value;
  const units = parseInt(document.getElementById('stockUnits').value);
  if (isNaN(units) || units < 0) { showToast('Enter a valid unit count.', 'error'); return; }

  await db.collection('bloodStock').doc(group).set({
    bloodGroup: group, units,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  showToast(`${group} stock updated to ${units} units.`, 'success');
  closeModal('stockModal');
  loadStockTable();
}

// ── Donations ──
async function loadDonations() {
  const snap = await db.collection('donations').orderBy('donatedAt','desc').get();
  const tbody = document.getElementById('donationsBody');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `
      <tr>
        <td><strong>${d.donorName || '—'}</strong></td>
        <td><span class="blood-pill">${d.bloodGroup}</span></td>
        <td>${d.units || 1}</td>
        <td>${d.hospital || '—'}</td>
        <td>${formatDate(d.donatedAt)}</td>
        <td><span class="badge badge-success">+${d.pointsEarned || 10}</span></td>
      </tr>`;
  });
}

// ── Record Donation ──
function openAddDonationModal() { document.getElementById('addDonationModal').classList.remove('hidden'); }

async function recordDonation() {
  const email      = document.getElementById('donationDonorEmail').value.trim();
  const bloodGroup = document.getElementById('donationBloodGroup').value;
  const units      = parseInt(document.getElementById('donationUnits').value) || 1;
  const hospital   = document.getElementById('donationHospital').value.trim();

  if (!email) { showToast('Please enter donor email.', 'error'); return; }

  // Find donor by email
  const userSnap = await db.collection('users').where('email','==',email).where('role','==','donor').get();
  if (userSnap.empty) { showToast('Donor not found with this email.', 'error'); return; }

  const userDoc = userSnap.docs[0];
  const uid     = userDoc.id;
  const donor   = userDoc.data();

  // Add donation record
  const donationRef = await db.collection('donations').add({
    donorId: uid, donorName: donor.name, bloodGroup, units, hospital,
    pointsEarned: 10,
    donatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Update donor stats
  const donorRef = db.collection('donors').doc(uid);
  const donorDoc = await donorRef.get();
  const newTotal = (donorDoc.exists ? (donorDoc.data().totalDonations || 0) : 0) + 1;
  const newPoints = (donorDoc.exists ? (donorDoc.data().points || 0) : 0) + 10;

  await donorRef.set({
    totalDonations: newTotal,
    points: newPoints,
    category: getDonorCategory(newTotal),
    bloodGroup,
    lastDonationDate: firebase.firestore.FieldValue.serverTimestamp(),
    eligible: false // reset eligibility after donation
  }, { merge: true });

  // Update blood stock
  await db.collection('bloodStock').doc(bloodGroup).set({
    bloodGroup,
    units: firebase.firestore.FieldValue.increment(units),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  showToast(`Donation recorded! ${donor.name} earned 10 points.`, 'success');
  closeModal('addDonationModal');
  loadDonations();
}

// ── Modal helpers ──
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', (e) => { if (e.target === o) o.classList.add('hidden'); });
});
