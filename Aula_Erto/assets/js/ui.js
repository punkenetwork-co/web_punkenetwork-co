/* ============================================================
   ERTO · Aula Virtual — Componentes de UI compartidos
   ============================================================ */

/** Renderiza el logo en TODOS los elementos con [data-logo].
 *  Si CONFIG.LOGO_URL existe, muestra imagen; si no, la letra "E".
 */
function renderLogos() {
    const url = (CONFIG.LOGO_URL || '').trim();
    document.querySelectorAll('[data-logo]').forEach(function (el) {
      if (url) {
        el.classList.add('has-image');
        el.innerHTML = '<img src="' + url + '" alt="' + CONFIG.APP_NAME + '">';
      } else {
        el.classList.remove('has-image');
        el.textContent = (CONFIG.APP_NAME || 'E').charAt(0).toUpperCase();
      }
    });
  }
  
  /** Renderiza el footer completo en <footer data-footer></footer>. */
  function renderFooter() {
    document.querySelectorAll('[data-footer]').forEach(function (el) {
      el.className = 'footer';
      el.innerHTML =
        '<div class="container">' +
          '<div class="footer-grid">' +
            '<div>' +
              '<div class="footer-brand">' +
                '<div class="brand-logo" data-logo></div>' +
                '<div class="brand-text">' +
                  '<strong style="color:#fff;">' + CONFIG.APP_NAME + '</strong>' +
                  '<span style="color:#8b8fa8;">' + CONFIG.ORG + '</span>' +
                '</div>' +
              '</div>' +
              '<p>ERTO es la unidad especializada en formación, investigación y consultoría de Punke Network. Creamos experiencias de aprendizaje virtuales accesibles, prácticas y certificadas.</p>' +
              '<div class="footer-social">' +
                '<a href="' + CONFIG.SOCIAL.instagram + '" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>' +
                '<a href="' + CONFIG.SOCIAL.facebook + '" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>' +
                '<a href="' + CONFIG.SOCIAL.tiktok + '" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>' +
                '<a href="' + CONFIG.SOCIAL.youtube + '" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<h4>Plataforma</h4>' +
              '<ul>' +
                '<li><a href="index.html">Inicio</a></li>' +
                '<li><a href="inscripcion.html">Inscripción</a></li>' +
                '<li><a href="login.html">Iniciar sesión</a></li>' +
                '<li><a href="recuperar.html">Recuperar contraseña</a></li>' +
              '</ul>' +
            '</div>' +
            '<div>' +
              '<h4>Contacto</h4>' +
              '<ul>' +
                '<li><i class="fa-solid fa-envelope"></i> ' + CONFIG.CONTACTO.email + '</li>' +
                '<li><i class="fa-solid fa-location-dot"></i> ' + CONFIG.CONTACTO.ciudad + '</li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="footer-bottom">&copy; ' + new Date().getFullYear() + ' ' + CONFIG.ORG + '. Todos los derechos reservados.</div>' +
        '</div>';
    });
    renderLogos();
  }
  
  /** Renderiza la topbar con redes sociales. */
  function renderTopbar() {
    document.querySelectorAll('[data-topbar]').forEach(function (el) {
      el.className = 'topbar';
      el.innerHTML =
        '<div class="container">' +
          '<div class="topbar-info">' +
            '<span><i class="fa-solid fa-graduation-cap"></i> ERTO · Educación para el Rendimiento, la Transformación y las Oportunidades</span>' +
          '</div>' +
          '<div class="topbar-social">' +
            '<a href="' + CONFIG.SOCIAL.instagram + '"><i class="fa-brands fa-instagram"></i></a>' +
            '<a href="' + CONFIG.SOCIAL.facebook + '"><i class="fa-brands fa-facebook-f"></i></a>' +
            '<a href="' + CONFIG.SOCIAL.tiktok + '"><i class="fa-brands fa-tiktok"></i></a>' +
            '<a href="' + CONFIG.SOCIAL.youtube + '"><i class="fa-brands fa-youtube"></i></a>' +
          '</div>' +
        '</div>';
    });
  }
  
  /** Devuelve el HTML del brand (logo + texto). */
  function brandHTML(href) {
    return '<a href="' + (href || 'index.html') + '" class="brand">' +
      '<div class="brand-logo" data-logo></div>' +
      '<div class="brand-text">' +
        '<strong>' + CONFIG.APP_NAME + '</strong>' +
        '<span>' + CONFIG.ORG + '</span>' +
      '</div>' +
    '</a>';
  }
  
  /** Renderiza navbar con items según sesión. */
  function renderNavbar(active) {
    document.querySelectorAll('[data-navbar]').forEach(function (el) {
      const s = AUTH.sesion();
      let links = '';
      if (!s) {
        links =
          '<li><a href="index.html"' + (active === 'inicio' ? ' class="active"' : '') + '><i class="fa-solid fa-house"></i> Inicio</a></li>' +
          '<li><a href="inscripcion.html"' + (active === 'inscripcion' ? ' class="active"' : '') + '><i class="fa-solid fa-pen-to-square"></i> Inscripción</a></li>' +
          '<li><a href="login.html"' + (active === 'login' ? ' class="active"' : '') + '><i class="fa-solid fa-right-to-bracket"></i> Iniciar sesión</a></li>';
      } else {
        const panel = CONFIG.ROUTES[s.rol] || 'panel-estudiante.html';
        links =
          '<li><a href="' + panel + '"' + (active === 'panel' ? ' class="active"' : '') + '><i class="fa-solid fa-gauge"></i> Mi panel</a></li>' +
          '<li><a href="#" onclick="AUTH.logoutUI(); return false;"><i class="fa-solid fa-right-from-bracket"></i> Salir</a></li>';
      }
      el.className = 'navbar';
      el.innerHTML =
        '<div class="container">' +
          brandHTML('index.html') +
          '<ul class="nav-links">' + links + '</ul>' +
          '<button class="nav-toggle" aria-label="Menú"><i class="fa-solid fa-bars"></i></button>' +
        '</div>';
  
      const toggle = el.querySelector('.nav-toggle');
      const ul = el.querySelector('.nav-links');
      toggle.addEventListener('click', function () {
        const abierto = ul.classList.toggle('open-mobile');
        if (abierto) {
          ul.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:72px;right:1rem;background:#fff;padding:1.2rem 1.5rem;border-radius:14px;box-shadow:0 12px 30px rgba(2,0,175,.18);gap:1rem;';
        } else {
          ul.removeAttribute('style');
        }
      });
    });
    renderLogos();
  }
  
  /** Inicializa topbar + navbar + footer en cualquier página. */
  function initLayout(active) {
    renderTopbar();
    renderNavbar(active);
    renderFooter();
  }
  
  /** Escapa HTML (para textos de usuario en paneles). */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  /** Formatea fecha. */
  function fmtFecha(v) {
    if (!v) return '—';
    try {
      const d = new Date(v);
      if (isNaN(d)) return '—';
      return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return '—'; }
  }
  
  /** Genera las iniciales del usuario. */
  function iniciales(nombres, apellidos) {
    return ((nombres || ' ').charAt(0) + (apellidos || ' ').charAt(0)).toUpperCase();
  }