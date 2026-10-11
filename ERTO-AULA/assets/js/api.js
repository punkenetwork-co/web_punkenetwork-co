/* Comunicación con Google Apps Script */

async function apiGet(accion, params = {}) {
    const qs = new URLSearchParams({ accion, ...params }).toString();
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?${qs}`);
      return await res.json();
    } catch (e) { return { success:false, message:'Error de conexión' }; }
  }
  
  async function apiPost(accion, datos = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const usuario_id = localStorage.getItem(STORAGE_KEYS.usuario_id);
    const payload = { accion, token, usuario_id, ...datos };
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) { return { success:false, message:'Error de conexión' }; }
  }
  
  const API = {
    registro: (d)          => apiPost('registro', d),
    login: (d)             => apiPost('login', d),
    logout: ()             => apiPost('logout'),
    verificar: ()          => apiPost('verificar_sesion'),
    cursos: ()             => apiGet('cursos'),
    cursoDetalle: (id)     => apiGet('curso_detalle', { curso_id: id, usuario_id: localStorage.getItem(STORAGE_KEYS.usuario_id) }),
    marcarModulo: (mid)    => apiPost('marcar_modulo', { modulo_id: mid }),
    preguntas: (cid)       => apiGet('preguntas', { curso_id: cid }),
    guardarExamen: (d)     => apiPost('guardar_examen', d),
    certificadosUsuario: (uid) => apiGet('certificados_usuario', { usuario_id: uid }),
    certificadoDetalle: (codigo) => apiPost('certificado_detalle', { codigo }),
    listaCertificados: ()  => apiPost('lista_certificados'),
    marcarEnviado: (cod)   => apiPost('marcar_enviado', { codigo: cod }),
    listaUsuarios: ()      => apiPost('lista_usuarios'),
    cambiarRol: (uid, rol) => apiPost('cambiar_rol', { usuario_id: uid, rol }),
    toggleActivo: (uid)    => apiPost('toggle_activo', { usuario_id: uid }),
    recuperar: (email)     => apiPost('recuperar', { email })
  };