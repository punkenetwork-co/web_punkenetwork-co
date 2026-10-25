/* ============================================================
   ERTO · Aula Virtual — Capa de comunicación con Apps Script
   ============================================================ */

   const API = {

    async post(accion, datos = {}) {
      const payload = Object.assign({ accion: accion }, datos);
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      if (!res.ok) throw new Error('Error de red (' + res.status + ').');
      try { return await res.json(); }
      catch (e) { throw new Error('Respuesta inválida del servidor.'); }
    },
  
    async get(accion, params = {}) {
      const qs = new URLSearchParams(Object.assign({ accion: accion }, params)).toString();
      const res = await fetch(CONFIG.APPS_SCRIPT_URL + '?' + qs, { method: 'GET', redirect: 'follow' });
      if (!res.ok) throw new Error('Error de red (' + res.status + ')');
      return res.json();
    },
  
    /* ---------- Público ---------- */
    registrar(datos)        { return this.post('registro', datos); },
    login(email, password)  { return this.post('login', { email, password }); },
    verificarSesion(token)  { return this.post('verificarSesion', { token }); },
    recuperar(email)        { return this.post('recuperar', { email }); },
    restablecer(datos)      { return this.post('restablecer', datos); },
    cursos()                { return this.get('cursos'); },
  
    /* ---------- Estudiante ---------- */
    misCursos(token)        { return this.post('misCursos', { token }); },
    perfil(token)           { return this.post('perfil', { token }); },
    actualizarPerfil(token, datos) { return this.post('actualizarPerfil', Object.assign({ token }, datos)); },
    cursoContenido(token, curso_id) { return this.post('cursoContenido', { token, curso_id }); },
    marcarProgreso(token, curso_id, item_id, completado) {
      return this.post('marcarProgreso', { token, curso_id, item_id, completado });
    },
  
    /* ---------- Tutor ---------- */
    cursosTutor(token)      { return this.post('cursosTutor', { token }); },
    estudiantesCurso(token, curso_id) { return this.post('estudiantesCurso', { token, curso_id }); },
  
    /* ---------- Admin ---------- */
    adminResumen(token)     { return this.post('adminResumen', { token }); },
    adminUsuarios(token)    { return this.post('adminUsuarios', { token }); },
    adminInscripciones(token) { return this.post('adminInscripciones', { token }); },
    adminCursos(token)      { return this.post('adminCursos', { token }); },
    guardarCurso(token, curso) { return this.post('guardarCurso', { token, curso }); },
    cambiarRol(token, usuario_id, rol) { return this.post('cambiarRol', { token, usuario_id, rol }); },
    activarUsuario(token, usuario_id, activo) { return this.post('activarUsuario', { token, usuario_id, activo }); },

    estadoCurso(token, curso_id) { return this.post('estadoCurso', { token, curso_id }); },
    examen(token, curso_id)      { return this.post('examen', { token, curso_id }); },
    enviarExamen(token, curso_id, respuestas) { return this.post('enviarExamen', { token, curso_id, respuestas }); },
    enviarEncuesta(token, datos) { return this.post('enviarEncuesta', Object.assign({ token }, datos)); },
    enviarCertificado(token, datos) { return this.post('enviarCertificado', Object.assign({ token }, datos)); },
    inscribirCurso(token, curso_id) { return this.post('inscribirCurso', { token, curso_id }); },
    crearActividad(token, datos) { return this.post('crearActividad', Object.assign({ token }, datos)); },
    obtenerActividadesModulo(token, modulo_id) { return this.post('obtenerActividadesModulo', { token, modulo_id }); },
    subirEntrega(token, datos) { return this.post('subirEntrega', Object.assign({ token }, datos)); },
    verEntregas(token, actividad_id) { return this.post('verEntregas', { token, actividad_id }); },

  };

  