/* ============================================================
   ERTO · Aula Virtual — Backend Google Apps Script
   Base de datos: Google Sheets
   ============================================================ */

const SHEET_ID   = 'PONER_ID_DE_LA_HOJA';   // ⚠️ Reemplaza con tu ID
const SECRET_KEY = 'erto-punke-2026';
const TOKEN_HORAS = 24;
const RECUP_HORAS = 2;

const HEADERS = {
  usuarios: ['id','nombres','apellidos','tipo_documento','numero_documento','email',
             'telefono','password_hash','rol','universidad','programa','ciudad',
             'como_nos_conocio','activo','fecha_registro','ultimo_acceso'],
  inscripciones: ['id','usuario_id','curso_id','fecha_inscripcion','estado'],
  cursos: ['id','titulo','descripcion','tutor','dirigido_a','objetivo','imagen','color',
           'duracion_horas','nivel','activo'],
  contenidos: ['id','curso_id','orden','titulo','icono','contenido_html'],
  progreso: ['id','usuario_id','curso_id','item_id','completado','fecha'],
  sesiones: ['token','usuario_id','fecha_creacion','fecha_expiracion'],
  recuperaciones: ['email','token','expira','usado']
};

/* ============================================================
   SETUP — Ejecutar UNA VEZ
   ============================================================ */
function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  Object.keys(HEADERS).forEach(function (nombre) {
    let sh = ss.getSheetByName(nombre);
    if (!sh) sh = ss.insertSheet(nombre);
    const headers = HEADERS[nombre];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#0200AF').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  });

  // Sembrar cursos iniciales
  const shCursos = ss.getSheetByName('cursos');
  if (shCursos.getLastRow() < 2) {
    shCursos.getRange(2, 1, 2, HEADERS.cursos.length).setValues([
      [1,
       'Uso de IA en la Investigación Académica',
       'Desarrolla habilidades básicas para utilizar la inteligencia artificial como apoyo en procesos de investigación académica.',
       'Eliecer Rafael Torres Ochoa',
       'Estudiantes, docentes, investigadores en formación y público interesado.',
       'Desarrollar habilidades básicas para utilizar la IA como apoyo en procesos de investigación académica.',
       '', '#0200AF', 20, 'Básico', 'SÍ'],
      [2,
       'Cuidados Básicos en Casa',
       'Aprende los fundamentos del cuidado en casa: higiene, bioseguridad, signos vitales y signos de alarma.',
       'Zareth Dayana Ramírez Palacio',
       'Personal auxiliar en procesos de formación, personas que estén cuidando enfermos en casa y público general.',
       'Brindar conocimientos básicos de cuidado en casa para mejorar la atención de personas enfermas.',
       '', '#00a08c', 16, 'Básico', 'SÍ']
    ]);
  }

  // Sembrar contenidos básicos
  const shCont = ss.getSheetByName('contenidos');
  if (shCont.getLastRow() < 2) {
    shCont.getRange(2, 1, 4, HEADERS.contenidos.length).setValues([
      [1, 1, 1, 'Portada', 'fa-book', '<p>Bienvenido al curso <strong>Uso de IA en la Investigación Académica</strong>. Tutor: Eliecer Rafael Torres Ochoa.</p>'],
      [2, 1, 2, 'Presentación y objetivos', 'fa-flag', '<p>Este curso busca desarrollar tus habilidades para usar IA como apoyo en investigación.</p>'],
      [3, 1, 3, 'Módulo 1: Personalización de la IA y diseño de prompts', 'fa-robot', '<p>Aprenderás a diseñar prompts efectivos para tus tareas académicas.</p>'],
      [4, 1, 4, 'Módulo 2: Revisión bibliográfica con apoyo de la IA', 'fa-book-open', '<p>Uso de IA para revisión sistemática de literatura.</p>']
    ]);
  }

  // Promover al primer usuario registrado a admin (opcional)
  // Ejecuta manualmente `promoverAdmin('tu-email@dominio.com')` cuando quieras.

  Logger.log('✅ Setup completo.');
}

/** Utilidad manual: promueve un email a rol admin. */
function promoverAdmin(email) {
  const fila = buscarFila('usuarios', 6, String(email).toLowerCase());
  if (fila === -1) { Logger.log('Usuario no encontrado'); return; }
  getSheet('usuarios').getRange(fila, 9).setValue('admin');
  Logger.log('Usuario promovido a admin.');
}

/* ============================================================
   ENRUTADORES
   ============================================================ */
function doGet(e) {
  try {
    const accion = (e && e.parameter && e.parameter.accion) || 'cursos';
    let r;
    switch (accion) {
      case 'cursos': r = accionCursos(); break;
      case 'ping':   r = { success: true, message: 'API ERTO activa' }; break;
      default:       r = { success: false, message: 'Acción GET desconocida: ' + accion };
    }
    return jsonResponse(r);
  } catch (err) { return jsonResponse({ success: false, message: err.message }); }
}

function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    const accion = body.accion;
    let r;

    switch (accion) {
      /* Público */
      case 'registro':         r = accionRegistro(body); break;
      case 'login':            r = accionLogin(body); break;
      case 'verificarSesion':  r = accionVerificarSesion(body); break;
      case 'recuperar':        r = accionRecuperar(body); break;
      case 'restablecer':      r = accionRestablecer(body); break;
      case 'cursos':           r = accionCursos(); break;
      /* Estudiante */
      case 'misCursos':        r = accionMisCursos(body); break;
      case 'perfil':           r = accionPerfil(body); break;
      case 'actualizarPerfil': r = accionActualizarPerfil(body); break;
      case 'cursoContenido':   r = accionCursoContenido(body); break;
      case 'marcarProgreso':   r = accionMarcarProgreso(body); break;
      /* Tutor */
      case 'cursosTutor':      r = accionCursosTutor(body); break;
      case 'estudiantesCurso': r = accionEstudiantesCurso(body); break;
      /* Admin */
      case 'adminResumen':       r = accionAdminResumen(body); break;
      case 'adminUsuarios':      r = accionAdminUsuarios(body); break;
      case 'adminCursos':        r = accionAdminCursos(body); break;
      case 'adminInscripciones': r = accionAdminInscripciones(body); break;
      case 'guardarCurso':       r = accionGuardarCurso(body); break;
      case 'cambiarRol':         r = accionCambiarRol(body); break;
      case 'activarUsuario':     r = accionActivarUsuario(body); break;
      default: r = { success: false, message: 'Acción desconocida: ' + accion };
    }
    return jsonResponse(r);
  } catch (err) {
    return jsonResponse({ success: false, message: 'Error interno: ' + err.message });
  }
}

/* ============================================================
   UTILIDADES
   ============================================================ */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(nombre) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    const h = HEADERS[nombre] || [];
    if (h.length) { sh.getRange(1, 1, 1, h.length).setValues([h]); sh.setFrozenRows(1); }
  }
  return sh;
}

function leerHoja(nombre) {
  const sh = getSheet(nombre);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const headers = HEADERS[nombre];
  const values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  return values.map(function (row) {
    const o = {};
    headers.forEach(function (h, i) { o[h] = row[i]; });
    return o;
  });
}

function hashPassword(password) {
  const raw = String(password) + '::' + SECRET_KEY;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function siguienteId(nombreHoja) {
  const sh = getSheet(nombreHoja);
  const last = sh.getLastRow();
  if (last < 2) return 1;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues().flat();
  return ids.reduce(function (a, b) { return Math.max(a, Number(b) || 0); }, 0) + 1;
}

function normEmail(v) { return String(v || '').trim().toLowerCase(); }

function existeEnColumna(nombreHoja, colIndex, valor) {
  return buscarFila(nombreHoja, colIndex, valor) !== -1;
}

function buscarFila(nombreHoja, colIndex, valor) {
  const sh = getSheet(nombreHoja);
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const col = sh.getRange(2, colIndex, last - 1, 1).getValues().flat();
  const v = String(valor).toLowerCase();
  for (let i = 0; i < col.length; i++) {
    if (String(col[i]).toLowerCase() === v) return i + 2;
  }
  return -1;
}

function usuarioAFila(u) {
  return [u.id, u.nombres, u.apellidos, u.tipo_documento, u.numero_documento,
          u.email, u.telefono, u.password_hash, u.rol, u.universidad,
          u.programa, u.ciudad, u.como_nos_conocio, u.activo, u.fecha_registro, u.ultimo_acceso];
}

function usuarioPublico(u) {
  return {
    id: u.id, nombres: u.nombres, apellidos: u.apellidos, email: u.email,
    telefono: u.telefono, tipo_documento: u.tipo_documento,
    numero_documento: u.numero_documento, rol: u.rol,
    universidad: u.universidad, programa: u.programa, ciudad: u.ciudad
  };
}

function usuarioPorFila(fila) {
  const headers = HEADERS.usuarios;
  const row = getSheet('usuarios').getRange(fila, 1, 1, headers.length).getValues()[0];
  const u = {};
  headers.forEach(function (h, i) { u[h] = row[i]; });
  return u;
}

/** Verifica token y devuelve el usuario autenticado (o null). */
function usuarioDesdeToken(token) {
  if (!token) return null;
  const sh = getSheet('sesiones');
  const last = sh.getLastRow();
  if (last < 2) return null;
  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  const ahora = new Date();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(token)) {
      if (new Date(rows[i][3]) < ahora) return null;
      const fila = buscarFila('usuarios', 1, rows[i][1]);
      if (fila === -1) return null;
      return usuarioPorFila(fila);
    }
  }
  return null;
}

function requiereRol(usuario, roles) {
  if (!usuario) return false;
  return roles.indexOf(usuario.rol) !== -1;
}

/* ============================================================
   ACCIONES PÚBLICAS
   ============================================================ */
function accionRegistro(datos) {
  const requeridos = ['nombres','apellidos','tipo_documento','numero_documento','email','password','curso_id'];
  for (let i = 0; i < requeridos.length; i++) {
    if (!datos[requeridos[i]] || String(datos[requeridos[i]]).trim() === '') {
      return { success: false, message: 'El campo "' + requeridos[i] + '" es obligatorio.' };
    }
  }
  if (String(datos.nombres).trim().length < 2) return { success: false, message: 'Nombres inválidos.' };
  if (String(datos.apellidos).trim().length < 2) return { success: false, message: 'Apellidos inválidos.' };
  if (String(datos.numero_documento).trim().length < 6) return { success: false, message: 'Documento inválido.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(datos.email))) return { success: false, message: 'Correo inválido.' };
  if (String(datos.password).length < 8) return { success: false, message: 'Contraseña mínimo 8 caracteres.' };

  const email = normEmail(datos.email);
  if (existeEnColumna('usuarios', 6, email)) {
    return { success: false, message: 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.' };
  }
  if (existeEnColumna('usuarios', 5, String(datos.numero_documento).trim())) {
    return { success: false, message: 'Ya existe una cuenta con este documento.' };
  }

  const id = siguienteId('usuarios');
  const ahora = new Date();
  const usuario = {
    id, nombres: String(datos.nombres).trim(), apellidos: String(datos.apellidos).trim(),
    tipo_documento: String(datos.tipo_documento).trim().toUpperCase(),
    numero_documento: String(datos.numero_documento).trim(),
    email, telefono: String(datos.telefono || '').trim(),
    password_hash: hashPassword(datos.password),
    rol: 'estudiante',
    universidad: String(datos.universidad || '').trim(),
    programa: String(datos.programa || '').trim(),
    ciudad: String(datos.ciudad || '').trim(),
    como_nos_conocio: String(datos.como_nos_conocio || '').trim(),
    activo: 'SÍ', fecha_registro: ahora, ultimo_acceso: ahora
  };
  getSheet('usuarios').appendRow(usuarioAFila(usuario));

  const idInsc = siguienteId('inscripciones');
  getSheet('inscripciones').appendRow([idInsc, id, Number(datos.curso_id), ahora, 'activo']);

  const token = crearSesion(id);

  return {
    success: true,
    message: 'Tu cuenta fue creada y quedaste inscrito en el curso.',
    usuario: usuarioPublico(usuario),
    token: token,
    inscripcion_id: idInsc
  };
}

function accionLogin(datos) {
  const email = normEmail(datos.email);
  const password = String(datos.password || '');
  if (!email || !password) return { success: false, message: 'Correo y contraseña obligatorios.' };

  const fila = buscarFila('usuarios', 6, email);
  if (fila === -1) return { success: false, message: 'Credenciales incorrectas.' };

  const u = usuarioPorFila(fila);
  if (String(u.password_hash) !== hashPassword(password)) {
    return { success: false, message: 'Credenciales incorrectas.' };
  }
  const activo = String(u.activo).toUpperCase();
  if (activo !== 'SÍ' && activo !== 'SI') {
    return { success: false, message: 'Tu cuenta está inactiva. Contacta al administrador.' };
  }

  getSheet('usuarios').getRange(fila, 16).setValue(new Date());
  const token = crearSesion(u.id);
  return { success: true, message: 'Inicio de sesión exitoso.', usuario: usuarioPublico(u), token };
}

function crearSesion(usuarioId) {
  const token = Utilities.getUuid();
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + TOKEN_HORAS * 60 * 60 * 1000);
  getSheet('sesiones').appendRow([token, usuarioId, ahora, expira]);
  limpiarSesionesExpiradas();
  return token;
}

function accionVerificarSesion(datos) {
  const u = usuarioDesdeToken(String(datos.token || ''));
  if (!u) return { success: false, message: 'Sesión no válida o expirada.' };
  return { success: true, usuario: usuarioPublico(u) };
}

function limpiarSesionesExpiradas() {
  const sh = getSheet('sesiones');
  const last = sh.getLastRow();
  if (last < 2) return;
  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  const ahora = new Date();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (new Date(rows[i][3]) < ahora) sh.deleteRow(i + 2);
  }
}

function accionRecuperar(datos) {
  const email = normEmail(datos.email);
  const generica = { success: true, message: 'Si el correo está registrado, recibirás instrucciones.' };
  if (!email) return { success: false, message: 'Correo requerido.' };

  const fila = buscarFila('usuarios', 6, email);
  if (fila === -1) return generica;

  const token = Utilities.getUuid();
  const expira = new Date(Date.now() + RECUP_HORAS * 60 * 60 * 1000);
  getSheet('recuperaciones').appendRow([email, token, expira, 'NO']);

  try {
    const u = usuarioPorFila(fila);
    const enlace = 'https://tudominio.com/restablecer.html?token=' + token + '&email=' + encodeURIComponent(email);
    MailApp.sendEmail({
      to: email,
      subject: 'Restablecer contraseña · Aula Virtual ERTO',
      htmlBody:
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">' +
          '<div style="background:#0200AF;color:#fff;padding:20px;border-radius:12px 12px 0 0;">' +
            '<h2 style="margin:0;font-size:20px;">Aula Virtual ERTO</h2>' +
            '<p style="margin:6px 0 0;opacity:.85;font-size:13px;">Punke Network</p>' +
          '</div>' +
          '<div style="background:#f8f9fe;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e4e7f0;">' +
            '<p>Hola <strong>' + u.nombres + ' ' + u.apellidos + '</strong>,</p>' +
            '<p>Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por ' + RECUP_HORAS + ' horas:</p>' +
            '<p style="text-align:center;margin:28px 0;">' +
              '<a href="' + enlace + '" style="background:#0200AF;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;">Restablecer contraseña</a>' +
            '</p>' +
            '<p style="font-size:13px;color:#555570;">Si no solicitaste este cambio, ignora este mensaje.</p>' +
          '</div>' +
        '</div>'
    });
  } catch (e) { Logger.log('Mail error: ' + e.message); }

  return generica;
}

function accionRestablecer(datos) {
  const token = String(datos.token || '');
  const password = String(datos.password || '');
  const email = normEmail(datos.email);
  if (!token || !password || !email) return { success: false, message: 'Datos incompletos.' };
  if (password.length < 8) return { success: false, message: 'Mínimo 8 caracteres.' };

  const sh = getSheet('recuperaciones');
  const last = sh.getLastRow();
  if (last < 2) return { success: false, message: 'Token inválido.' };

  const rows = sh.getRange(2, 1, last - 1, 4).getValues();
  let filaEnc = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]) === token && normEmail(rows[i][0]) === email) {
      const usado = String(rows[i][3]).toUpperCase();
      if (usado === 'SÍ' || usado === 'SI') return { success: false, message: 'Token ya utilizado.' };
      if (new Date(rows[i][2]) < new Date()) return { success: false, message: 'Token expirado.' };
      filaEnc = i + 2; break;
    }
  }
  if (filaEnc === -1) return { success: false, message: 'Token inválido.' };

  const filaU = buscarFila('usuarios', 6, email);
  if (filaU === -1) return { success: false, message: 'Usuario no encontrado.' };

  getSheet('usuarios').getRange(filaU, 8).setValue(hashPassword(password));
  sh.getRange(filaEnc, 4).setValue('SÍ');

  // Invalidar sesiones del usuario
  try {
    const idU = getSheet('usuarios').getRange(filaU, 1).getValue();
    const shS = getSheet('sesiones');
    const lastS = shS.getLastRow();
    if (lastS >= 2) {
      const ses = shS.getRange(2, 1, lastS - 1, 2).getValues();
      for (let j = ses.length - 1; j >= 0; j--) {
        if (String(ses[j][1]) === String(idU)) shS.deleteRow(j + 2);
      }
    }
  } catch (e) {}

  return { success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

function accionCursos() {
  const cursos = leerHoja('cursos')
    .filter(function (c) {
      const a = String(c.activo || '').toUpperCase();
      return a === 'SÍ' || a === 'SI' || a === 'TRUE';
    })
    .map(function (c) {
      return {
        id: c.id, titulo: c.titulo, descripcion: c.descripcion,
        tutor: c.tutor, dirigido_a: c.dirigido_a, objetivo: c.objetivo,
        imagen: c.imagen, color: c.color || '#0200AF',
        duracion_horas: c.duracion_horas, nivel: c.nivel
      };
    });
  return { success: true, cursos };
}

/* ============================================================
   ESTUDIANTE
   ============================================================ */
function accionMisCursos(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!u) return { success: false, message: 'Sesión no válida.' };

  const inscripciones = leerHoja('inscripciones').filter(function (i) {
    return String(i.usuario_id) === String(u.id);
  });
  const cursos = leerHoja('cursos');
  const progreso = leerHoja('progreso').filter(function (p) {
    return String(p.usuario_id) === String(u.id);
  });
  const contenidos = leerHoja('contenidos');

  const misCursos = inscripciones.map(function (ins) {
    const c = cursos.find(function (x) { return String(x.id) === String(ins.curso_id); });
    if (!c) return null;
    const items = contenidos.filter(function (x) { return String(x.curso_id) === String(c.id); });
    const completados = progreso.filter(function (p) {
      return String(p.curso_id) === String(c.id) && (p.completado === true || String(p.completado).toLowerCase() === 'true' || String(p.completado).toUpperCase() === 'SÍ');
    }).length;
    const pct = items.length ? Math.round((completados / items.length) * 100) : 0;
    return {
      id: c.id, titulo: c.titulo, descripcion: c.descripcion, tutor: c.tutor,
      color: c.color || '#0200AF', duracion_horas: c.duracion_horas, nivel: c.nivel,
      estado: ins.estado, fecha_inscripcion: ins.fecha_inscripcion,
      total_items: items.length, completados: completados, progreso: pct
    };
  }).filter(Boolean);

  return { success: true, cursos: misCursos };
}

function accionPerfil(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!u) return { success: false, message: 'Sesión no válida.' };
  return { success: true, usuario: usuarioPublico(u) };
}

function accionActualizarPerfil(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!u) return { success: false, message: 'Sesión no válida.' };

  const fila = buscarFila('usuarios', 1, u.id);
  if (fila === -1) return { success: false, message: 'Usuario no encontrado.' };

  const campos = {
    nombres: 2, apellidos: 3, telefono: 7, universidad: 10, programa: 11, ciudad: 12
  };
  Object.keys(campos).forEach(function (k) {
    if (datos[k] !== undefined) {
      getSheet('usuarios').getRange(fila, campos[k]).setValue(String(datos[k]).trim());
    }
  });

  return { success: true, message: 'Perfil actualizado.' };
}

function accionCursoContenido(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!u) return { success: false, message: 'Sesión no válida.' };
  const cursoId = Number(datos.curso_id);

  const cursos = leerHoja('cursos');
  const c = cursos.find(function (x) { return Number(x.id) === cursoId; });
  if (!c) return { success: false, message: 'Curso no encontrado.' };

  const items = leerHoja('contenidos')
    .filter(function (x) { return Number(x.curso_id) === cursoId; })
    .sort(function (a, b) { return Number(a.orden) - Number(b.orden); });

  const prog = leerHoja('progreso').filter(function (p) {
    return String(p.usuario_id) === String(u.id) && Number(p.curso_id) === cursoId;
  });

  const modulos = items.map(function (it) {
    const p = prog.find(function (x) { return String(x.item_id) === String(it.id); });
    const completado = p && (p.completado === true || String(p.completado).toUpperCase() === 'SÍ' || String(p.completado).toLowerCase() === 'true');
    return {
      id: it.id, titulo: it.titulo, icono: it.icono || 'fa-book',
      contenido_html: it.contenido_html, completado: !!completado
    };
  });

  return {
    success: true,
    curso: {
      id: c.id, titulo: c.titulo, descripcion: c.descripcion,
      tutor: c.tutor, color: c.color, duracion_horas: c.duracion_horas,
      nivel: c.nivel, modulos: modulos
    }
  };
}

function accionMarcarProgreso(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!u) return { success: false, message: 'Sesión no válida.' };

  const sh = getSheet('progreso');
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, HEADERS.progreso.length).getValues();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]) === String(u.id) &&
        Number(rows[i][2]) === Number(datos.curso_id) &&
        String(rows[i][3]) === String(datos.item_id)) {
      sh.getRange(i + 2, 5).setValue(datos.completado ? 'SÍ' : 'NO');
      sh.getRange(i + 2, 6).setValue(new Date());
      return { success: true, message: 'Progreso actualizado.' };
    }
  }
  const id = siguienteId('progreso');
  sh.appendRow([id, u.id, Number(datos.curso_id), datos.item_id,
                datos.completado ? 'SÍ' : 'NO', new Date()]);
  return { success: true, message: 'Progreso guardado.' };
}

/* ============================================================
   TUTOR
   ============================================================ */
function accionCursosTutor(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['tutor','admin'])) return { success: false, message: 'Acceso denegado.' };

  const nombreCompleto = u.nombres + ' ' + u.apellidos;
  const cursos = leerHoja('cursos').filter(function (c) {
    return String(c.tutor || '').trim() === nombreCompleto.trim() || u.rol === 'admin';
  });

  const inscripciones = leerHoja('inscripciones');

  const result = cursos.map(function (c) {
    const total = inscripciones.filter(function (i) { return String(i.curso_id) === String(c.id); }).length;
    return {
      id: c.id, titulo: c.titulo, descripcion: c.descripcion,
      color: c.color, duracion_horas: c.duracion_horas,
      nivel: c.nivel, activo: c.activo, total_estudiantes: total
    };
  });

  return { success: true, cursos: result };
}

function accionEstudiantesCurso(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['tutor','admin'])) return { success: false, message: 'Acceso denegado.' };

  const cursoId = Number(datos.curso_id);
  const inscripciones = leerHoja('inscripciones').filter(function (i) { return Number(i.curso_id) === cursoId; });
  const usuarios = leerHoja('usuarios');

  const estudiantes = inscripciones.map(function (i) {
    const us = usuarios.find(function (x) { return String(x.id) === String(i.usuario_id); });
    if (!us) return null;
    return {
      id: us.id, nombres: us.nombres, apellidos: us.apellidos,
      email: us.email, tipo_documento: us.tipo_documento,
      numero_documento: us.numero_documento, estado: i.estado
    };
  }).filter(Boolean);

  return { success: true, estudiantes };
}

/* ============================================================
   ADMIN
   ============================================================ */
function accionAdminResumen(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };

  const usuarios = leerHoja('usuarios');
  const cursos = leerHoja('cursos');
  const inscripciones = leerHoja('inscripciones');

  const ultimas = inscripciones.slice(-8).reverse().map(function (i) {
    const us = usuarios.find(function (x) { return String(x.id) === String(i.usuario_id); });
    const c = cursos.find(function (x) { return String(x.id) === String(i.curso_id); });
    return {
      nombres: us ? us.nombres : '—', apellidos: us ? us.apellidos : '',
      email: us ? us.email : '—', curso_titulo: c ? c.titulo : '—',
      estado: i.estado, fecha_inscripcion: i.fecha_inscripcion
    };
  });

  return {
    success: true,
    stats: {
      total_usuarios: usuarios.length,
      total_cursos: cursos.length,
      total_inscripciones: inscripciones.length,
      estudiantes_activos: usuarios.filter(function (x) {
        return x.rol === 'estudiante' && (String(x.activo).toUpperCase() === 'SÍ' || String(x.activo).toUpperCase() === 'SI');
      }).length
    },
    ultimas_inscripciones: ultimas
  };
}

function accionAdminUsuarios(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };
  const usuarios = leerHoja('usuarios').map(function (x) {
    return {
      id: x.id, nombres: x.nombres, apellidos: x.apellidos, email: x.email,
      tipo_documento: x.tipo_documento, numero_documento: x.numero_documento,
      rol: x.rol, activo: x.activo, fecha_registro: x.fecha_registro
    };
  });
  return { success: true, usuarios };
}

function accionAdminCursos(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };
  return { success: true, cursos: leerHoja('cursos') };
}

function accionAdminInscripciones(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };

  const usuarios = leerHoja('usuarios');
  const cursos = leerHoja('cursos');
  const inscripciones = leerHoja('inscripciones').map(function (i) {
    const us = usuarios.find(function (x) { return String(x.id) === String(i.usuario_id); });
    const c = cursos.find(function (x) { return String(x.id) === String(i.curso_id); });
    return {
      id: i.id,
      nombres: us ? us.nombres : '—',
      apellidos: us ? us.apellidos : '',
      email: us ? us.email : '—',
      curso_titulo: c ? c.titulo : '—',
      estado: i.estado,
      fecha_inscripcion: i.fecha_inscripcion
    };
  }).reverse();

  return { success: true, inscripciones };
}

function accionGuardarCurso(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };

  const c = datos.curso || {};
  if (!c.titulo || !c.descripcion || !c.tutor) {
    return { success: false, message: 'Título, descripción y tutor son obligatorios.' };
  }

  const sh = getSheet('cursos');
  const fila = c.id ? buscarFila('cursos', 1, c.id) : -1;

  const fila_datos = [
    c.id || siguienteId('cursos'),
    c.titulo, c.descripcion, c.tutor,
    c.dirigido_a || '', c.objetivo || '', c.imagen || '',
    c.color || '#0200AF',
    c.duracion_horas || '', c.nivel || '', c.activo || 'SÍ'
  ];

  if (fila === -1) {
    sh.appendRow(fila_datos);
  } else {
    sh.getRange(fila, 1, 1, fila_datos.length).setValues([fila_datos]);
  }

  return { success: true, message: 'Curso guardado correctamente.' };
}

function accionCambiarRol(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };

  const usuarioId = datos.usuario_id;
  const rol = String(datos.rol || '').toLowerCase();
  if (['estudiante','tutor','admin'].indexOf(rol) === -1) {
    return { success: false, message: 'Rol inválido.' };
  }
  if (String(usuarioId) === String(u.id)) {
    return { success: false, message: 'No puedes cambiar tu propio rol.' };
  }

  const fila = buscarFila('usuarios', 1, usuarioId);
  if (fila === -1) return { success: false, message: 'Usuario no encontrado.' };

  getSheet('usuarios').getRange(fila, 9).setValue(rol);
  return { success: true, message: 'Rol actualizado.' };
}

function accionActivarUsuario(datos) {
  const u = usuarioDesdeToken(datos.token);
  if (!requiereRol(u, ['admin'])) return { success: false, message: 'Acceso denegado.' };

  if (String(datos.usuario_id) === String(u.id)) {
    return { success: false, message: 'No puedes desactivar tu propia cuenta.' };
  }

  const fila = buscarFila('usuarios', 1, datos.usuario_id);
  if (fila === -1) return { success: false, message: 'Usuario no encontrado.' };

  const activo = String(datos.activo || 'SÍ').toUpperCase();
  getSheet('usuarios').getRange(fila, 14).setValue(activo === 'NO' ? 'NO' : 'SÍ');
  return { success: true, message: 'Estado actualizado.' };
}