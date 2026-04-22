// ============================================================
// donor-card.js — Donor Card Generation & Download
// ============================================================

/**
 * Renders a donor card into a target element.
 * @param {object} donor - Donor profile from Firestore
 * @param {string} targetId - ID of the container element
 */
function renderDonorCard(donor, targetId = 'donorCardContainer') {
  const container = document.getElementById(targetId);
  if (!container) return;

  const category  = getDonorCategory(donor.totalDonations || 0);
  const tierClass = getCategoryClass(category);
  const tierEmoji = { Gold: '🥇', Silver: '🥈', Bronze: '🥉' }[category] || '🥉';

  container.innerHTML = `
    <div class="donor-card-wrap" id="donorCardEl">
      <div class="card-org">🩸 Blood Bank Management System</div>
      <div class="card-name">${escapeHtml(donor.name)}</div>
      <div style="margin: 8px 0;">
        <span class="card-blood">${donor.bloodGroup || '—'}</span>
        &nbsp;
        <span class="tier-badge ${tierClass}">${tierEmoji} ${category}</span>
      </div>
      <div class="card-meta">
        <div class="card-meta-item">
          <div class="label">Donor ID</div>
          <div class="value" style="font-size:0.78rem;">${donor.uid ? donor.uid.slice(0,10).toUpperCase() : '—'}</div>
        </div>
        <div class="card-meta-item">
          <div class="label">Total Donations</div>
          <div class="value">${donor.totalDonations || 0}</div>
        </div>
        <div class="card-meta-item">
          <div class="label">Reward Points</div>
          <div class="value">${donor.points || 0} pts</div>
        </div>
        <div class="card-meta-item">
          <div class="label">Member Since</div>
          <div class="value">${formatDate(donor.createdAt)}</div>
        </div>
      </div>
      <div style="margin-top:18px; padding-top:14px; border-top: 1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:0.68rem; color:rgba(255,255,255,0.35); letter-spacing:0.05em;">VALID IDENTIFICATION CARD</div>
        <div style="font-size:0.8rem; font-weight:700; color:rgba(255,255,255,0.5);">💙 Save Lives</div>
      </div>
    </div>
  `;
}

/**
 * Renders a mini donation-specific card.
 * @param {object} donation - Individual donation record
 * @param {object} donor    - Donor profile
 */
function renderDonationCard(donation, donor) {
  return `
    <div class="donor-card-wrap" style="max-width:360px;">
      <div class="card-org">🩸 Donation Certificate</div>
      <div class="card-name">${escapeHtml(donor.name)}</div>
      <div style="margin: 8px 0;">
        <span class="card-blood">${donation.bloodGroup || donor.bloodGroup}</span>
      </div>
      <div class="card-meta">
        <div class="card-meta-item">
          <div class="label">Donation ID</div>
          <div class="value" style="font-size:0.78rem;">${donation.id ? donation.id.slice(0,12).toUpperCase() : '—'}</div>
        </div>
        <div class="card-meta-item">
          <div class="label">Donation Date</div>
          <div class="value">${formatDate(donation.donatedAt)}</div>
        </div>
        <div class="card-meta-item">
          <div class="label">Units</div>
          <div class="value">${donation.units || 1} unit</div>
        </div>
        <div class="card-meta-item">
          <div class="label">Points Earned</div>
          <div class="value">+${donation.pointsEarned || 10} pts</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Download the donor card as a PNG using html2canvas.
 * Requires html2canvas CDN to be loaded.
 */
async function downloadDonorCard() {
  const el = document.getElementById('donorCardEl');
  if (!el) { showToast('Card not found.', 'error'); return; }

  // Dynamically load html2canvas if not present
  if (!window.html2canvas) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  }

  showToast('Generating card…', 'info');
  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
    const link   = document.createElement('a');
    link.download = 'donor-card.png';
    link.href     = canvas.toDataURL('image/png');
    link.click();
    showToast('Card downloaded!', 'success');
  } catch (err) {
    showToast('Could not generate image. Try screenshot.', 'error');
  }
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
