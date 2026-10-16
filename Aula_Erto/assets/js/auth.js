/* ============================================================
   ERTO · Aula Virtual — Lógica de sesión y autenticación
   ============================================================ */

   const AUTH = {

    /* ---------- Guardar / leer / limpiar sesión ---------- */
    guardarSesion(usuario, token) {
      const S = CONFIG.STORAGE;
      localStorage.setItem(S.TOKEN, token);
      localStorage.setItem(S.USER_ID, usuario.id);
      localStorage.setItem(S.NOMBRES, usuario.nombres);
      localStorage.setItem(S.APELLIDOS, usuario.apellidos);
      localStorage.setItem(S.EMAIL, usuario.email);
      localStorage.setItem(S.ROL, usuario.rol);
    },
  
    sesion() {
      const S = CONFIG.STORAGE;
      const token = localStorage.getItem(S.TOKEN);
      if (!token) return null;
      return {
        token: token,
        id: localStorage.getItem(S.USER_ID),
        nombres: localStorage.getItem(S.NOMBRES),
        apellidos: localStorage.getItem(S.APELLIDOS),
        email: localStorage.getItem(S.EMAIL),
        rol: localStorage.getItem(S.ROL)
      };
    },
  
    cerrarSesion(redirigir = true) {
      Object.values(CONFIG.STORAGE).forEach(function (k) { localStorage.removeItem(k); });
      if (redirigir) window.location.href = CONFIG.ROUTES.login;
    },
  
    /* ---------- Validar sesión contra el backend ---------- */
    async validar() {
      const s = this.sesion();
      if (!s || !s.token) return false;
      try {
        const r = await API.verificarSesion(s.token);
        if (!r.success) { this.cerrarSesion(false); return false; }
        return true;
      } catch (e) {
        return false;
      }
    },
  
    /* ---------- Proteger páginas privadas ---------- */
    async protegerPagina(rolRequerido) {
      const ok = await this.validar();
      if (!ok) { window.location.href = CONFIG.ROUTES.login; return false; }
      const s = this.sesion();
      if (rolRequerido && s.rol !== rolRequerido) {
        window.location.href = CONFIG.ROUTES[s.rol] || CONFIG.ROUTES.login;
        return false;
      }
      return true;
    },
  
    /* ---------- Redirigir según rol ---------- */
    redirigirPorRol(rol) {
      window.location.href = CONFIG.ROUTES[rol] || CONFIG.ROUTES.estudiante;
    },
  
    /* ---------- Bloqueo básico de DevTools (páginas privadas) ---------- */
    bloquearInspeccion() {
      document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      document.addEventListener('keydown', function (e) {
        const k = (e.key || '').toLowerCase();
        if (
          k === 'f12' ||
          (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
          (e.ctrlKey && k === 'u')
        ) {
          e.preventDefault();
          return false;
        }
      });
    },
  
    /* ---------- Logout con confirmación ---------- */
    logoutUI() {
      if (confirm('¿Deseas cerrar sesión?')) this.cerrarSesion();
    }
  };
  
  /* ---------- Utilidades compartidas de UI ---------- */
  
  /** Muestra un alert dentro de un contenedor. */
  function mostrarAlerta(elId, tipo, mensaje) {
    const el = document.getElementById(elId);
    if (!el) return;
    const iconos = {
      error: 'fa-circle-exclamation',
      success: 'fa-circle-check',
      info: 'fa-circle-info',
      warning: 'fa-triangle-exclamation'
    };
    el.className = 'alert alert-' + tipo + ' show';
    el.innerHTML = '<i class="fa-solid ' + (iconos[tipo] || iconos.info) + '"></i><span>' + mensaje + '</span>';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  function ocultarAlerta(elId) {
    const el = document.getElementById(elId);
    if (el) el.classList.remove('show');
  }
  
  /** Activa/desactiva el estado de carga de un botón. */
  function btnLoading(btn, cargando, textoCarga) {
    if (!btn) return;
    if (cargando) {
      btn.dataset.original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> ' + (textoCarga || 'Procesando...');
    } else {
      btn.disabled = false;
      if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
    }
  }
  
  /** Validaciones reutilizables. */
  const VALID = {
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); },
    min:   function (v, n) { return String(v).trim().length >= n; },
    igual: function (a, b) { return a === b; },
    soloNumeros: function (v) { return /^[0-9]+$/.test(String(v).trim()); }
  };
  
  /** Marca visualmente un campo. */
  function marcarCampo(input, valido) {
    if (!input) return;
    input.classList.toggle('is-invalid', !valido);
    input.classList.toggle('is-valid', valido);
  }
  
  /** Toggle mostrar/ocultar contraseña. */
  function togglePassword(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const esPass = input.type === 'password';
    input.type = esPass ? 'text' : 'password';
    iconEl.classList.toggle('fa-eye', !esPass);
    iconEl.classList.toggle('fa-eye-slash', esPass);
  }