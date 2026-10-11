/*************************************************************
 * ERTO - AULA VIRTUAL / PUNKE NETWORK
 * Backend completo en Google Apps Script
 * Base de datos: Google Sheets
 *************************************************************/

const SHEET_ID   = 'PONER_ID_DE_LA_HOJA';   // <-- reemplazar
const SECRET_KEY = 'erto-punke-2026';

/* ============================================================
 *  UTILIDADES BASE
 * ============================================================ */
function getSheet(nombre) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  return sh;
}

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ success: true }, data || {})))
    .setMimeType(ContentService.MimeType.JSON);
}

function fail(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sha256(txt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, txt);
  return raw.map(function(b){ return ((b < 0 ? b + 256 : b).toString(16)).padStart(2,'0'); }).join('');
}

function uuid() {
  return Utilities.getUuid();
}

function ahora() { return new Date(); }

function hojasDelSistema() {
  return ['usuarios','cursos','modulos','preguntas','progreso','resultados','certificados','accesos','recuperaciones','sesiones'];
}

function asegurarHojas() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  hojasDelSistema().forEach(function(n){
    if (!ss.getSheetByName(n)) ss.insertSheet(n);
  });
}

/* ============================================================
 *  ENRUTADOR
 * ============================================================ */
function doGet(e) {
  asegurarHojas();
  var accion = (e && e.parameter && e.parameter.accion) || '';
  try {
    switch (accion) {
      case 'cursos':              return ok({ cursos: listarCursos() });
      case 'curso_detalle':       return ok(cursoDetalle(e.parameter));
      case 'preguntas':           return ok({ preguntas: obtenerPreguntas(e.parameter.curso_id) });
      case 'certificados_usuario':return ok({ certificados: certificadosDeUsuario(e.parameter.usuario_id) });
      case 'ping':                return ok({ msg: 'pong' });
      default:                    return fail('Acción no reconocida: ' + accion);
    }
  } catch (err) { return fail(err.message); }
}

function doPost(e) {
  asegurarHojas();
  var datos = {};
  try {
    if (e && e.postData && e.postData.contents) {
      datos = JSON.parse(e.postData.contents);
    }
  } catch (err) { return fail('JSON inválido'); }

  var accion = datos.accion;
  try {
    switch (accion) {
      case 'registro':            return registro(datos);
      case 'login':               return login(datos);
      case 'verificar_sesion':    return verificarSesion(datos);
      case 'logout':              return logout(datos);
      case 'marcar_modulo':       return marcarModulo(datos);
      case 'guardar_examen':      return guardarExamen(datos);
      case 'lista_certificados':  return listaCertificados(datos);
      case 'marcar_enviado':      return marcarEnviado(datos);
      case 'lista_usuarios':      return listaUsuarios(datos);
      case 'cambiar_rol':         return cambiarRol(datos);
      case 'toggle_activo':       return toggleActivo(datos);
      case 'recuperar':           return recuperar(datos);
      case 'certificado_detalle': return ok({ certificado: certificadoPorCodigo(datos.codigo) });
      default:                    return fail('Acción no reconocida: ' + accion);
    }
  } catch (err) { return fail(err.message); }
}

/* ============================================================
 *  HELPERS DE LECTURA / ESCRITURA
 * ============================================================ */
function leerTodo(nombre) {
  var sh = getSheet(nombre);
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  return data.slice(1).map(function(row){
    var o = {};
    headers.forEach(function(h, i){ o[h] = row[i]; });
    return o;
  });
}

function siguienteId(nombre) {
  var sh = getSheet(nombre);
  var last = sh.getLastRow();
  if (last < 2) return 1;
  var ids = sh.getRange(2,1,last-1,1).getValues().flat()
              .map(function(v){ return Number(v)||0; });
  return Math.max.apply(null, ids.concat([0])) + 1;
}

/* ============================================================
 *  ACCIONES
 * ============================================================ */
function registro(d) {
  if (!d.email || d.email.indexOf('@') < 0 || d.email.indexOf('.') < 0) return fail('Email inválido');
  if (!d.password || d.password.length < 8) return fail('La contraseña debe tener mínimo 8 caracteres');
  if (d.password !== d.password_confirm) return fail('Las contraseñas no coinciden');

  var usuarios = leerTodo('usuarios');
  if (usuarios.some(function(u){ return String(u.email).toLowerCase() === String(d.email).toLowerCase(); }))
    return fail('El email ya está registrado');

  var sh = getSheet('usuarios');
  var id = siguienteId('usuarios');
  sh.appendRow([
    id,
    d.nombres || '',
    d.apellidos || '',
    d.tipo_documento || 'CC',
    d.numero_documento || '',
    d.email || '',
    d.telefono || '',
    sha256(d.password),
    'estudiante',
    d.universidad || '',
    d.programa || '',
    'SI',
    ahora(),
    ''
  ]);
  return ok({ id: id, message: 'Usuario registrado correctamente' });
}

function login(d) {
  var usuarios = leerTodo('usuarios');
  var hash = sha256(d.password || '');
  var user = usuarios.find(function(u){
    return String(u.email).toLowerCase() === String(d.email).toLowerCase() && String(u.password) === hash;
  });
  if (!user) return fail('Credenciales incorrectas');
  if (String(user.activo).toUpperCase() === 'NO') return fail('Usuario inactivo');

  var token = uuid();
  var expira = new Date(Date.now() + 24*60*60*1000);
  getSheet('sesiones').appendRow([user.id, token, ahora(), expira]);

  // actualizar ultimo_acceso
  var sh = getSheet('usuarios');
  var data = sh.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (Number(data[i][0]) === Number(user.id)) {
      sh.getRange(i+1, 14).setValue(ahora());
      break;
    }
  }

  return ok({
    token: token,
    usuario: {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      rol: user.rol,
      numero_documento: user.numero_documento
    }
  });
}

function verificarSesion(d) {
  if (!d.token) return fail('Token requerido');
  var sesiones = leerTodo('sesiones');
  var s = sesiones.find(function(x){ return x.token === d.token; });
  if (!s) return fail('Sesión inválida');
  if (new Date(s.expira) < new Date()) return fail('Sesión expirada');
  return ok({ valido: true, usuario_id: s.usuario_id });
}

function logout(d) {
  var sh = getSheet('sesiones');
  var data = sh.getDataRange().getValues();
  for (var i = data.length-1; i>=1; i--) {
    if (data[i][1] === d.token) sh.deleteRow(i+1);
  }
  return ok({});
}

function listarCursos() {
  return leerTodo('cursos').filter(function(c){ return String(c.activo).toUpperCase() !== 'NO'; });
}

function cursoDetalle(p) {
  var cursoId = Number(p.curso_id || p.id);
  var modulos = leerTodo('modulos').filter(function(m){ return Number(m.curso_id) === cursoId; });
  modulos.sort(function(a,b){ return Number(a.numero_modulo) - Number(b.numero_modulo); });

  var progresoUsuario = [];
  if (p.usuario_id) {
    progresoUsuario = leerTodo('progreso').filter(function(x){
      return Number(x.usuario_id) === Number(p.usuario_id);
    });
  }

  var modulosConProgreso = modulos.map(function(m, idx){
    var comp = progresoUsuario.some(function(x){
      return Number(x.modulo_id) === Number(m.id) && String(x.completado).toUpperCase() === 'SI';
    });
    var desbloqueado = (idx === 0) || comp || progresoUsuario.some(function(x){
      var prev = modulos[idx-1];
      return prev && Number(x.modulo_id) === Number(prev.id) && String(x.completado).toUpperCase() === 'SI';
    });
    return Object.assign({}, m, {
      completado: comp ? 'SI' : 'NO',
      desbloqueado: desbloqueado
    });
  });

  var total = modulosConProgreso.length;
  var completados = modulosConProgreso.filter(function(m){ return m.completado === 'SI'; }).length;
  var porcentaje = total ? Math.round((completados/total)*100) : 0;

  return { modulos: modulosConProgreso, progreso: porcentaje, completados: completados, total: total };
}

function marcarModulo(d) {
  if (!d.usuario_id || !d.modulo_id) return fail('Datos incompletos');
  var sh = getSheet('progreso');
  var data = sh.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (Number(data[i][1]) === Number(d.usuario_id) && Number(data[i][2]) === Number(d.modulo_id)) {
      sh.getRange(i+1, 4).setValue('SI');
      sh.getRange(i+1, 5).setValue(ahora());
      return ok({});
    }
  }
  sh.appendRow([siguienteId('progreso'), d.usuario_id, d.modulo_id, 'SI', ahora()]);
  return ok({});
}

function obtenerPreguntas(cursoId) {
  return leerTodo('preguntas')
    .filter(function(p){ return Number(p.curso_id) === Number(cursoId); })
    .map(function(p){
      return {
        id: p.id,
        numero_pregunta: p.numero_pregunta,
        pregunta: p.pregunta,
        opcion_a: p.opcion_a,
        opcion_b: p.opcion_b,
        opcion_c: p.opcion_c,
        opcion_d: p.opcion_d
      };
    });
}

function guardarExamen(d) {
  if (!d.usuario_id || !d.curso_id || !d.respuestas) return fail('Datos incompletos');

  var preguntas = leerTodo('preguntas').filter(function(p){
    return Number(p.curso_id) === Number(d.curso_id);
  });
  var total = preguntas.length;
  var aciertos = 0;
  var detalle = [];

  preguntas.forEach(function(p){
    var r = d.respuestas[p.id];
    var correcta = String(p.respuesta_correcta).toLowerCase();
    var okR = r && String(r).toLowerCase() === correcta;
    if (okR) aciertos++;
    detalle.push({ pregunta_id: p.id, marcada: r || '', correcta: p.respuesta_correcta, ok: okR });
  });

  var porcentaje = total ? Math.round((aciertos/total)*100) : 0;
  var aprobado = porcentaje >= 80;

  var intentos = leerTodo('resultados').filter(function(x){
    return Number(x.usuario_id) === Number(d.usuario_id) && Number(x.curso_id) === Number(d.curso_id);
  }).length + 1;

  getSheet('resultados').appendRow([
    siguienteId('resultados'),
    d.usuario_id,
    d.curso_id,
    aciertos,
    total,
    porcentaje,
    aprobado ? 'SI' : 'NO',
    intentos,
    ahora(),
    JSON.stringify(detalle)
  ]);

  var certificado = null;
  if (aprobado) {
    certificado = crearCertificado(d.usuario_id, d.curso_id, porcentaje);
  }

  return ok({ aciertos: aciertos, total: total, porcentaje: porcentaje, aprobado: aprobado, certificado: certificado });
}

function crearCertificado(usuarioId, cursoId, nota) {
  var usuarios = leerTodo('usuarios');
  var user = usuarios.find(function(u){ return Number(u.id) === Number(usuarioId); });
  var cursos = leerTodo('cursos');
  var curso = cursos.find(function(c){ return Number(c.id) === Number(cursoId); });
  if (!user || !curso) return null;

  var codigo = 'ERTO-2026-' + Math.random().toString(36).slice(2,8).toUpperCase();
  var nombre = (user.nombres || '') + ' ' + (user.apellidos || '');

  getSheet('certificados').appendRow([
    siguienteId('certificados'),
    codigo,
    usuarioId,
    cursoId,
    nombre.trim(),
    user.numero_documento || '',
    nota,
    ahora(),
    'Pendiente'
  ]);

  return { codigo: codigo, curso: curso.titulo, nombre: nombre, nota: nota };
}

function certificadosDeUsuario(usuarioId) {
  return leerTodo('certificados').filter(function(c){
    return Number(c.usuario_id) === Number(usuarioId);
  });
}

function certificadoPorCodigo(codigo) {
  var c = leerTodo('certificados').find(function(x){ return x.codigo === codigo; });
  if (!c) return null;
  var curso = leerTodo('cursos').find(function(x){ return Number(x.id) === Number(c.curso_id); });
  return Object.assign({}, c, { curso_titulo: curso ? curso.titulo : '' });
}

function listaCertificados(d) {
  if (!esTutorOAdmin(d.token)) return fail('No autorizado');
  var certs = leerTodo('certificados');
  var cursos = leerTodo('cursos');
  return ok({ certificados: certs.map(function(c){
    var cur = cursos.find(function(x){ return Number(x.id) === Number(c.curso_id); });
    return Object.assign({}, c, { curso_titulo: cur ? cur.titulo : '' });
  })});
}

function marcarEnviado(d) {
  if (!esTutorOAdmin(d.token)) return fail('No autorizado');
  var sh = getSheet('certificados');
  var data = sh.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (data[i][1] === d.codigo) {
      sh.getRange(i+1, 9).setValue('Enviado');
      return ok({});
    }
  }
  return fail('Certificado no encontrado');
}

function listaUsuarios(d) {
  if (!esAdmin(d.token)) return fail('No autorizado');
  return ok({ usuarios: leerTodo('usuarios').map(function(u){
    delete u.password;
    return u;
  })});
}

function cambiarRol(d) {
  if (!esAdmin(d.token)) return fail('No autorizado');
  var sh = getSheet('usuarios');
  var data = sh.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (Number(data[i][0]) === Number(d.usuario_id)) {
      sh.getRange(i+1, 9).setValue(d.rol);
      return ok({});
    }
  }
  return fail('Usuario no encontrado');
}

function toggleActivo(d) {
  if (!esAdmin(d.token)) return fail('No autorizado');
  var sh = getSheet('usuarios');
  var data = sh.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (Number(data[i][0]) === Number(d.usuario_id)) {
      var actual = String(data[i][11]).toUpperCase();
      sh.getRange(i+1, 12).setValue(actual === 'SI' ? 'NO' : 'SI');
      return ok({ nuevo: actual === 'SI' ? 'NO' : 'SI' });
    }
  }
  return fail('Usuario no encontrado');
}

function recuperar(d) {
  if (!d.email) return fail('Email requerido');
  var usuarios = leerTodo('usuarios');
  var u = usuarios.find(function(x){ return String(x.email).toLowerCase() === String(d.email).toLowerCase(); });
  if (!u) return fail('Email no registrado');

  var token = uuid();
  var expira = new Date(Date.now() + 60*60*1000);
  getSheet('recuperaciones').appendRow([d.email, token, expira, 'NO']);

  // En producción: MailApp.sendEmail(...)
  return ok({ token: token, message: 'Token generado. Copia este código para restablecer.' });
}

/* ============================================================
 *  AUTORIZACIÓN
 * ============================================================ */
function usuarioDesdeToken(token) {
  if (!token) return null;
  var sesiones = leerTodo('sesiones');
  var s = sesiones.find(function(x){ return x.token === token; });
  if (!s) return null;
  if (new Date(s.expira) < new Date()) return null;
  var usuarios = leerTodo('usuarios');
  return usuarios.find(function(u){ return Number(u.id) === Number(s.usuario_id); }) || null;
}

function esAdmin(token) {
  var u = usuarioDesdeToken(token);
  return u && u.rol === 'admin';
}

function esTutorOAdmin(token) {
  var u = usuarioDesdeToken(token);
  return u && (u.rol === 'admin' || u.rol === 'tutor');
}