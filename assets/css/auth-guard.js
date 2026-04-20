// ═══════════════════════════════════════
//  assets/js/auth-guard.js
//  Role-based access control + sidebar
// ═══════════════════════════════════════

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Role permissions ─────────────────────────────────
// Each role defines which pages they can access
export const ROLE_PAGES = {
  admin: ['dashboard', 'admin', 'donors', 'hospitals', 'medical', 'reports'],
  donor: ['dashboard', 'donors', 'medical'],
  hospital: ['dashboard', 'hospitals', 'reports'],
};

// ── Sidebar nav items per role ────────────────────────
const NAV_ITEMS = {
  admin: [
    { section: 'Overview', items: [
      { href: 'dashboard.html', page: 'dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'Management', items: [
      { href: 'admin.html',     page: 'admin',     icon: '🛡️',  label: 'Admin & Staff' },
      { href: 'donors.html',    page: 'donors',    icon: '🧑‍🤝‍🧑', label: 'Donors' },
      { href: 'hospitals.html', page: 'hospitals', icon: '🏥',  label: 'Hospitals' },
    ]},
    { section: 'Medical', items: [
      { href: 'medical.html',   page: 'medical',   icon: '💉',  label: 'Medical Details' },
      { href: 'reports.html',   page: 'reports',   icon: '📋',  label: 'Reports' },
    ]},
  ],
  donor: [
    { section: 'Overview', items: [
      { href: 'dashboard.html', page: 'dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'My Info', items: [
      { href: 'donors.html',    page: 'donors',    icon: '🧑‍🤝‍🧑', label: 'My Donations' },
      { href: 'medical.html',   page: 'medical',   icon: '💉',  label: 'Medical Details' },
    ]},
  ],
  hospital: [
    { section: 'Overview', items: [
      { href: 'dashboard.html', page: 'dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'Hospital', items: [
      { href: 'hospitals.html', page: 'hospitals', icon: '🏥',  label: 'Blood Requests' },
      { href: 'reports.html',   page: 'reports',   icon: '📋',  label: 'Reports' },
    ]},
  ],
};

const ROLE_LABELS = {
  admin:    'Administrator',
  donor:    'Donor',
  hospital: 'Hospital Staff',
};

// ── Auth guard + sidebar injector ─────────────────────
export function initPage(activePage, onReady) {
  const role = sessionStorage.getItem('bbms_role') || 'admin';
  const email = sessionStorage.getItem('bbms_user') || '';

  // Check if this role is allowed on this page
  const allowed = ROLE_PAGES[role] || ROLE_PAGES.admin;
  if (!allowed.includes(activePage)) {
    // Redirect to dashboard if not authorized
    window.location.href = 'dashboard.html';
    return;
  }

  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    injectSidebar(activePage, role, email);
    if (onReady) onReady(role, user);
  });
}

function injectSidebar(activePage, role, email) {
  const mount = document.getElementById('sidebarMount');
  if (!mount) return;

  const initLetter = (email || role || 'A')[0].toUpperCase();
  const sections = NAV_ITEMS[role] || NAV_ITEMS.admin;

  const navHTML = sections.map(sec => `
    <div class="nav-section">
      <span class="nav-label">${sec.section}</span>
      ${sec.items.map(item => `
        <a href="${item.href}" class="nav-item ${activePage === item.page ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span> ${item.label}
        </a>
      `).join('')}
    </div>
  `).join('');

  mount.innerHTML = `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">🩸</div>
      <div class="logo-text">LifeFlow</div>
    </div>
    <nav class="sidebar-nav">
      ${navHTML}
    </nav>
    <div class="sidebar-user">
      <div class="user-avatar">${initLetter}</div>
      <div class="user-info">
        <div class="user-name">${email || ROLE_LABELS[role]}</div>
        <div class="user-role">${ROLE_LABELS[role] || role}</div>
      </div>
      <button class="logout-btn" onclick="doLogout()" title="Logout">⏻</button>
    </div>
  </aside>`;
}
