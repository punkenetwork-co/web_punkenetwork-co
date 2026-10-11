/* Utilidades generales */

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function alerta(msg, tipo = 'info') {
  const c = document.createElement('div');
  c.className = 'toast toast-' + tipo;
  c.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${msg}`;
  document.body.appendChild(c);
  setTimeout(() => c.classList.add('show'), 30);
  setTimeout(() => { c.classList.remove('show'); setTimeout(()=>c.remove(),300); }, 3500);
}

function formatearFecha(f) {
  if (!f) return '—';
  const d = new Date(f);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'2-digit' });
}

function validarEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function protegerPagina() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) e.preventDefault();
    if (e.ctrlKey && e.key.toUpperCase() === 'U') e.preventDefault();
  });
  document.addEventListener('copy',  e => e.preventDefault());
  document.addEventListener('cut',   e => e.preventDefault());
  document.addEventListener('dragstart', e => e.preventDefault());
}

function getParam(n) { return new URLSearchParams(location.search).get(n); }

/* Inyectar header/topbar genéricos */
function pintarHeader(contenedorId, titulo, badge = null) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  const u = usuarioActual() || {};
  cont.innerHTML = `
    <div class="topbar">
      <div class="container topbar-inner">
        <span><i class="fa-solid fa-graduation-cap"></i> Aula Virtual ERTO</span>
        <span><i class="fa-solid fa-clock"></i> ${new Date().toLocaleDateString('es-CO')}</span>
      </div>
    </div>
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="index.html" class="brand">
          <img src="assets/img/logo/logo.png" alt="ERTO" onerror="this.style.display='none'">
          <span>ERTO<span class="brand-dot">.</span></span>
        </a>
        <div class="nav-right">
          <span class="user-chip">
            <i class="fa-solid fa-user-circle"></i>
            ${u.nombres || ''} ${u.apellidos || ''}
            ${badge ? `<span class="badge badge-${badge.color}">${badge.texto}</span>` : ''}
          </span>
          <button class="btn btn-outline btn-sm" onclick="cerrarSesion()">
            <i class="fa-solid fa-right-from-bracket"></i> Salir
          </button>
        </div>
      </div>
    </nav>`;
}