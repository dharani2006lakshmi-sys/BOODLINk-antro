// ============================================================
// hospital.js — Hospital Dashboard Logic
// ============================================================

requireAuth('hospital');

let currentHospital = null;

function showSection(name, el) {
  document.querySelectorAll('[id^="section-"]').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = { overview:'Hospital Overview', request:'New Blood Request', myrequests:'My Requests', stock:'Blood Availability' };
  document.getElementById('topbarTitle').textContent = titles[name] || '';
  if (name === 'myrequests') loadMyRequests();
  if (name === 'stock')      loadStockAvailability();
}

auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'hospital') return;
  currentHospital = profile;
  document.getElementById('hospitalNameTop').textContent = profile.name;
  document.getElementById('userAvatar').textContent = profile.name[0].toUpperCase();
  loadOverview();
});

async function loadOverview() {
  const snap = await db.collection('hospitalRequests')
    .where('hospitalId','==',auth.currentUser.uid).get();

  let pending=0, approved=0, rejected=0;
  snap.forEach(doc => {
    const s = doc.data().status;
    if (s==='pending') pending++;
    else if (s==='approved') approved++;
    else if (s==='rejected') rejected++;
  });

  document.getElementById('statTotal').textContent    = snap.size;
  document.getElementById('statPending').textContent  = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;

  // Recent 5
  const recentSnap = await db.collection('hospitalRequests')
    .where('hospitalId','==',auth.currentUser.uid)
    .orderBy('createdAt','desc').limit(5).get();

  const tbody = document.getElementById('overviewRequestsBody');
  tbody.innerHTML = '';
  recentSnap.forEach(doc => {
    const r = doc.data();
    tbody.innerHTML += requestRow(r);
  });
}

async function loadMyRequests() {
  const snap = await db.collection('hospitalRequests')
    .where('hospitalId','==',auth.currentUser.uid)
    .orderBy('createdAt','desc').get();

  const tbody = document.getElementById('myRequestsBody');
  tbody.innerHTML = '';
  if (snap.empty) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:24px;">No requests yet.</td></tr>';
    return;
  }
  snap.forEach(doc => tbody.innerHTML += requestRow(doc.data()));
}

function requestRow(r) {
  const statusBadge = { pending:'<span class="badge badge-warning">⏳ Pending</span>',
    approved:'<span class="badge badge-success">✓ Approved</span>',
    rejected:'<span class="badge badge-danger">✗ Rejected</span>' }[r.status] || '';
  const priorityBadge = { emergency:'<span class="badge badge-danger">🚨 Emergency</span>',
    urgent:'<span class="badge badge-warning">🟠 Urgent</span>',
    normal:'<span class="badge badge-info">🔵 Normal</span>' }[r.priority] || '';
  return `<tr>
    <td><span class="blood-pill">${r.bloodGroup}</span></td>
    <td>${r.units}</td>
    <td>${priorityBadge}</td>
    <td>${r.reason || '—'}</td>
    <td>${formatDate(r.createdAt)}</td>
    <td>${statusBadge}</td>
  </tr>`;
}

async function checkStock() {
  const group = document.getElementById('reqBloodGroup').value;
  if (!group) { showToast('Please select a blood group first.', 'error'); return; }

  const doc = await db.collection('bloodStock').doc(group).get();
  const el  = document.getElementById('stockAvailability');

  if (!doc.exists || doc.data().units === 0) {
    el.innerHTML = '<div class="alert alert-danger">⚠️ No stock available for this blood group right now.</div>';
  } else {
    el.innerHTML = `<div class="alert alert-success">✅ <strong>${doc.data().units} units</strong> of ${group} are currently available.</div>`;
  }
}

async function submitRequest() {
  const bloodGroup = document.getElementById('reqBloodGroup').value;
  const units      = parseInt(document.getElementById('reqUnits').value) || 1;
  const priority   = document.getElementById('reqPriority').value;
  const reason     = document.getElementById('reqReason').value.trim();

  if (!bloodGroup) { showToast('Please select a blood group.', 'error'); return; }

  await db.collection('hospitalRequests').add({
    hospitalId:   currentHospital.uid,
    hospitalName: currentHospital.name,
    bloodGroup, units, priority, reason,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  showToast('Blood request submitted! Awaiting admin approval.', 'success');
  document.getElementById('reqBloodGroup').value = '';
  document.getElementById('reqUnits').value = '1';
  document.getElementById('reqReason').value = '';
  document.getElementById('stockAvailability').innerHTML = '';
  loadOverview();
}

async function loadStockAvailability() {
  const snap = await db.collection('bloodStock').get();
  const grid = document.getElementById('availabilityGrid');
  grid.innerHTML = '';

  snap.forEach(doc => {
    const d = doc.data();
    const status = d.units === 0 ? { label:'Out of Stock', cls:'badge-danger', color:'#e74c3c' }
                 : d.units < 5  ? { label:'Low Stock',    cls:'badge-warning', color:'#f39c12' }
                 :                { label:'Available',     cls:'badge-success', color:'#27ae60' };
    grid.innerHTML += `
      <div class="card" style="text-align:center;border-top:4px solid ${status.color};">
        <div style="font-size:2rem;font-weight:900;font-family:var(--font-display);color:${status.color};margin-bottom:4px;">${d.bloodGroup}</div>
        <div style="font-size:1.8rem;font-weight:800;">${d.units}</div>
        <div style="font-size:0.75rem;color:var(--text-light);margin-bottom:8px;">units</div>
        <span class="badge ${status.cls}">${status.label}</span>
      </div>`;
  });
}
