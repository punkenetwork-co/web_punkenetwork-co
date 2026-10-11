/* Autenticación y sesión */

function guardarSesion(datos) {
    localStorage.setItem(STORAGE_KEYS.token, datos.token);
    localStorage.setItem(STORAGE_KEYS.usuario_id, datos.usuario.id);
    localStorage.setItem(STORAGE_KEYS.nombres, datos.usuario.nombres);
    localStorage.setItem(STORAGE_KEYS.apellidos, datos.usuario.apellidos);
    localStorage.setItem(STORAGE_KEYS.email, datos.usuario.email);
    localStorage.setItem(STORAGE_KEYS.rol, datos.usuario.rol);
  }
  
  function cerrarSesion() {
    API.logout().finally(() => {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      location.href = 'login.html';
    });
  }
  
  function usuarioActual() {
    const id = localStorage.getItem(STORAGE_KEYS.usuario_id);
    if (!id) return null;
    return {
      id,
      nombres:   localStorage.getItem(STORAGE_KEYS.nombres),
      apellidos: localStorage.getItem(STORAGE_KEYS.apellidos),
      email:     localStorage.getItem(STORAGE_KEYS.email),
      rol:       localStorage.getItem(STORAGE_KEYS.rol),
      token:     localStorage.getItem(STORAGE_KEYS.token)
    };
  }
  
  async function requiereSesion(rolesPermitidos = []) {
    const u = usuarioActual();
    if (!u || !u.token) { location.href = 'login.html'; return null; }
    const r = await API.verificar();
    if (!r.success) { cerrarSesion(); return null; }
    if (rolesPermitidos.length && !rolesPermitidos.includes(u.rol)) {
      location.href = 'login.html'; return null;
    }
    return u;
  }
  
  async function hacerLogin(email, password) {
    const r = await API.login({ email, password });
    if (r.success) {
      guardarSesion(r);
      const destino = r.usuario.rol === 'admin' ? 'panel-admin.html'
                    : r.usuario.rol === 'tutor' ? 'panel-tutor.html'
                    : 'panel-estudiante.html';
      location.href = destino;
    }
    return r;
  }
  
  async function hacerRegistro(datos) {
    return await API.registro(datos);
  }