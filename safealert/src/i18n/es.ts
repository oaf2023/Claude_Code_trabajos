/* ============================================================================
* Archivo         : es.ts
* Descripción     : Traducciones al español (default).
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { es } from '../i18n/es';
* ============================================================================ */

export const es = {
  app: {
    name: 'SafeAlert',
    tagline: 'Tu guardia de seguridad personal',
  },

  home: {
    guardActive: 'Modo guardia ACTIVO',
    guardInactive: 'Modo guardia INACTIVO',
    activate: 'ACTIVAR\nGUARDIA',
    deactivate: 'DESACTIVAR\nGUARDIA',
    alertDetected: 'ALERTA DETECTADA',
    sending: 'ENVIANDO\nALERTA',
    guardActiveShort: 'GUARDIA\nACTIVA',
    panic: 'ENVIAR ALERTA AHORA',
    panicSub: 'Ubicación a tus contactos',
    testAlert: 'Probar alerta (sin SMS real)',
    noContacts: 'Sin contactos de confianza',
    noContactsSub: 'Tocá para agregar contactos',
    contactsCount: '{count} contacto activo | {count} contactos activos',
  },

  alert: {
    pending: 'Alerta registrada. Pendiente de procesamiento.',
    partial: 'Alerta enviada parcialmente a {count} contactos',
    failed: 'La alerta no pudo enviarse desde el backend.',
    sent: 'Alerta enviada a {count} contactos',
    cancel: 'CANCELAR',
    dismiss: 'TERMINAR',
    incognito: 'INCÓGNITO',
    cancelHold: 'Mantén pulsado cinco segundos para volver',
    keyword: 'Palabra: "{word}"',
    sendingTo: 'Enviando alerta a {count} contactos...',
    locating: 'Obteniendo ubicación...',
    sendingMsg: 'Enviando alerta...',
  },

  protection: {
    active: 'Protección activa',
    limited: 'Protección limitada',
    stopped: 'Protección detenida',
  },

  contacts: {
    title: 'Contactos',
    empty: 'Sin contactos de confianza',
    emptySub: 'Agrega personas que recibirán tu ubicación en emergencias.',
    add: 'Agregar contacto',
    edit: 'Editar contacto',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar a {name}?',
    priority: 'Prioritario para llamada asistida',
    activeCount: '{active} de {total} contactos activos',
    headerHint: 'El contacto principal activo se usa como prioridad para la llamada asistida.',
    loading: 'Cargando contactos...',
  },

  history: {
    title: 'Historial',
    empty: 'Sin alertas aún',
    emptySub: 'Las alertas que envíes aparecerán aquí con el detalle de entregas.',
    noSession: 'Sesión no disponible',
    noSessionSub: 'Iniciá sesión para ver tu historial.',
    deliveries: 'Entregas:',
    test: 'PRUEBA',
  },

  settings: {
    title: 'Configuración',
    howToUse: 'Cómo funciona SafeAlert →',
    permissions: 'Ver estado de permisos →',
    audio: 'Grabar mensaje de voz',
    audioSub: 'Graba 10 segundos de audio y lo envía como segundo mensaje',
    reminders: 'Activar recordatorio local',
    remindersSub: 'Te recuerda revisar permisos y contactos una vez al día.',
    template: 'Plantilla de mensaje',
    templateSub: 'Usa {location} para la ubicación y {time} para la hora.',
    templateSave: 'Guardar plantilla',
    voice: 'Activación por voz',
    voiceSub: 'El modelo español instalado escucha en Android.',
    addWord: 'Nueva palabra...',
    addWordBtn: 'Agregar',
    sensitivity: 'Sensibilidad de detección',
    sensitivityLow: 'Baja\n(menos falsos)',
    sensitivityMedium: 'Media\n(recomendado)',
    sensitivityHigh: 'Alta\n(más detección)',
    countdown: 'Tiempo para cancelar',
    countdownSub: 'Segundos para cancelar una alerta accidental',
    privacy: 'Privacidad y datos',
    privacyAction: 'Administrar mis datos',
  },

  permissions: {
    title: 'Permisos requeridos',
    location: 'Ubicación',
    locationSub: 'Necesaria para enviar tu ubicación en alertas.',
    notifications: 'Notificaciones',
    notificationsSub: 'Necesaria para recordatorios y alertas.',
    microphone: 'Micrófono',
    microphoneSub: 'Necesaria para grabar audio de emergencia.',
    contacts: 'Contactos',
    contactsSub: 'Necesaria para seleccionar contactos de confianza.',
    grantAll: 'Conceder todos los permisos',
  },

  onboarding: {
    welcome: 'Tu seguridad,\nen una app',
    welcomeSub: 'SafeAlert monitorea tu voz y envía tu ubicación a tus contactos de confianza cuando más lo necesitás.',
    start: 'Comenzar',
    alreadyRegistered: 'Ya tengo una cuenta',
    howItWorks: 'Cómo funciona SafeAlert',
    step1Title: 'Activación por voz',
    step1Desc: 'Decí "Ayuda" o "Socorro" y SafeAlert activa la alerta automáticamente.',
    step2Title: 'Contactos de confianza',
    step2Desc: 'Elegí quiénes recibirán tu ubicación en una emergencia.',
    step3Title: 'Alerta enviada',
    step3Desc: 'Tus contactos reciben un SMS con tu ubicación exacta.',
    understand: 'Entendido',
  },

  errors: {
    noContacts: 'No hay contactos activos',
    sessionNotReady: 'La sesión no está lista. Reintenta en unos segundos.',
    generic: 'Ocurrió un error inesperado.',
    retry: 'Reintentar',
    network: 'Error de red. Verificá tu conexión.',
  },
};
