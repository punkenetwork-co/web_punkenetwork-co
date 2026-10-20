/* ============================================================
   ERTO · Aula Virtual — Configuración global
   ============================================================ */

   const CONFIG = {
    // ⚠️ PEGA AQUÍ la URL /exec de tu Web App de Google Apps Script
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby5M4sWxsC5eBn2k3sok73s3IUpmcv-EwhcctRFhWFNubcGdkslr08T1oNIBB3fi3Ec/exec',
  
    // 🖼️ URL del logo (deja '' para mostrar la letra "E" por defecto)
    LOGO_URL: 'https://static.wixstatic.com/media/1580a1_49c5e261837d47559bffdca0f03228c4~mv2.png/v1/fill/w_117,h_87,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo_edited.png',          // Ej: 'assets/img/logo-erto.png' o 'https://.../logo.png'
  
    // Nombre visible
    APP_NAME: 'Aula Virtual ERTO',
    ORG: 'Punke Network · ERTO',
  
    // Redes sociales (barra superior y footer)
    SOCIAL: {
      instagram: '#',
      facebook: '#',
      tiktok: '#',
      youtube: '#',
      whatsapp: '#'
    },
  
    CONTACTO: {
      email: 'contacto@punkenetwork.com',
      ciudad: 'Colombia'
    },
  
    // Claves de almacenamiento local
    STORAGE: {
      TOKEN: 'erto_token',
      USER_ID: 'usuario_id',
      NOMBRES: 'nombres',
      APELLIDOS: 'apellidos',
      EMAIL: 'email',
      ROL: 'rol'
    },
  
    // Rutas
    ROUTES: {
      estudiante: 'panel-estudiante.html',
      tutor: 'panel-tutor.html',
      admin: 'panel-admin.html',
      login: 'login.html',
      inscripcion: 'inscripcion.html',
      recuperar: 'recuperar.html'
    },
  
    // Opciones
    TIPOS_DOCUMENTO: ['CC', 'CE', 'TI', 'PPT', 'ID'],
    COMO_NOS_CONOCIO: ['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Recomendación', 'Google', 'Otro'],
    NIVELES: ['Básico', 'Intermedio', 'Avanzado'],
  
    VERSION: '1.0.0'
  };