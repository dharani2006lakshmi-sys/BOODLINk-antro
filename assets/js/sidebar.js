// assets/js/sidebar.js — inject sidebar
export function injectSidebar(activePage) {
  const role  = sessionStorage.getItem('bbms_role') || 'admin';
  const names = { admin:'Admin User', donor:'Donor User', hospital:'Hospital Staff' };
  const rlbl  = { admin:'Administrator', donor:'Donor', hospital:'Hospital Staff' };
  const init  = (names[role]||'A')[0];

  const mount = document.getElementById('sidebarMount');
  if (!mount) return;

  mount.innerHTML = `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">🩸</div>
      <div class="logo-text">LifeFlow</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-label">Overview</span>
        <a href="dashboard.html" class="nav-item ${activePage==='dashboard'?'active':''}"><span class="nav-icon">📊</span> Dashboard</a>
      </div>
      <div class="nav-section">
        <span class="nav-label">Management</span>
        <a href="admin.html"     class="nav-item ${activePage==='admin'    ?'active':''}"><span class="nav-icon">🛡️</span> Admin</a>
        <a href="donors.html"    class="nav-item ${activePage==='donors'   ?'active':''}"><span class="nav-icon">🧑‍🤝‍🧑</span> Donors</a>
        <a href="hospitals.html" class="nav-item ${activePage==='hospitals'?'active':''}"><span class="nav-icon">🏥</span> Hospitals</a>
      </div>
      <div class="nav-section">
        <span class="nav-label">Medical</span>
        <a href="medical.html"  class="nav-item ${activePage==='medical' ?'active':''}"><span class="nav-icon">💉</span> Medical Details</a>
        <a href="reports.html"  class="nav-item ${activePage==='reports' ?'active':''}"><span class="nav-icon">📋</span> Reports</a>
      </div>
    </nav>
    <div class="sidebar-user">
      <div class="user-avatar">${init}</div>
      <div class="user-info">
        <div class="user-name">${names[role]}</div>
        <div class="user-role">${rlbl[role]}</div>
      </div>
      <button class="logout-btn" onclick="doLogout()" title="Logout">⏻</button>
    </div>
  </aside>`;
}
