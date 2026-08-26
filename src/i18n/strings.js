// One entry per key: { en, es }. Add both languages together so they stay in
// sync. Use {placeholders} for interpolation via t(key, { placeholder }).

export const STRINGS = {
  // ---------- common ----------
  'common.opening': { en: 'Opening Tornasol…', es: 'Abriendo Tornasol…' },
  'common.loading': { en: 'Loading…', es: 'Cargando…' },
  'common.loadingNotes': { en: 'Loading notes…', es: 'Cargando notas…' },
  'common.pleaseWait': { en: 'Please wait…', es: 'Un momento…' },
  'common.saving': { en: 'Saving…', es: 'Guardando…' },
  'common.cancel': { en: 'Cancel', es: 'Cancelar' },
  'common.add': { en: 'Add', es: 'Añadir' },
  'common.you': { en: 'You', es: 'Tú' },
  'common.me': { en: 'Me', es: 'Yo' },
  'common.member': { en: 'Member', es: 'Miembro' },
  'common.someone': { en: 'Someone', es: 'Alguien' },
  'common.goHome': { en: 'Go home', es: 'Ir al inicio' },
  'common.goStart': { en: 'Go to start', es: 'Ir al inicio' },
  'common.tryAgainGeneric': {
    en: 'Something went wrong. Please try again.',
    es: 'Algo salió mal. Por favor inténtalo de nuevo.',
  },

  // ---------- nav ----------
  'nav.home': { en: 'Home', es: 'Inicio' },
  'nav.events': { en: 'Events', es: 'Eventos' },
  'nav.tasks': { en: 'Tasks', es: 'Tareas' },
  'nav.notes': { en: 'Notes', es: 'Notas' },
  'nav.group': { en: 'Group', es: 'Grupo' },
  'nav.profileAria': { en: 'Your profile and settings', es: 'Tu perfil y ajustes' },
  'nav.homeAria': { en: 'Tornasol home', es: 'Inicio de Tornasol' },

  // ---------- landing ----------
  'landing.lead': {
    en: 'Caring for someone you love is easier when everyone shares the load.',
    es: 'Cuidar a quien amas es más fácil cuando todos comparten la carga.',
  },
  'landing.body': {
    en: 'Tornasol helps your family take turns caring for a parent, partner, or friend. See who is on today, sign up for an event when you can, and leave a note for whoever comes next.',
    es: 'Tornasol ayuda a tu familia a turnarse para cuidar a un padre, pareja o amigo. Mira quién está hoy, apúntate a un evento cuando puedas y deja una nota para quien siga.',
  },
  'landing.tagline': {
    en: 'Simple, warm, and easy to read — made for real families.',
    es: 'Sencillo, cálido y fácil de leer — hecho para familias reales.',
  },
  'landing.getStarted': { en: 'Get started', es: 'Comenzar' },
  'landing.haveAccount': { en: 'Already have an account?', es: '¿Ya tienes una cuenta?' },
  'landing.logIn': { en: 'Log in', es: 'Iniciar sesión' },

  // ---------- auth ----------
  'auth.tabLogin': { en: 'Log in', es: 'Iniciar sesión' },
  'auth.tabSignup': { en: 'Create account', es: 'Crear cuenta' },
  'auth.resetTitle': { en: 'Reset your password', es: 'Restablece tu contraseña' },
  'auth.signupTitle': { en: 'Create your account', es: 'Crea tu cuenta' },
  'auth.welcome': { en: 'Welcome back', es: 'Bienvenido de nuevo' },
  'auth.forgotIntro': {
    en: 'Enter your email and we will send you a link to set a new password.',
    es: 'Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.',
  },
  'auth.name': { en: 'Your name', es: 'Tu nombre' },
  'auth.namePlaceholder': { en: 'e.g. Maria Lopez', es: 'p. ej. María López' },
  'auth.email': { en: 'Email', es: 'Correo electrónico' },
  'auth.password': { en: 'Password', es: 'Contraseña' },
  'auth.passwordNewPlaceholder': { en: 'At least 6 characters', es: 'Al menos 6 caracteres' },
  'auth.passwordPlaceholder': { en: 'Your password', es: 'Tu contraseña' },
  'auth.sendReset': { en: 'Send reset link', es: 'Enviar enlace' },
  'auth.forgot': { en: 'Forgot your password?', es: '¿Olvidaste tu contraseña?' },
  'auth.backToLogin': { en: '← Back to log in', es: '← Volver a iniciar sesión' },
  'auth.checkEmailTitle': { en: 'Check your email', es: 'Revisa tu correo' },
  'auth.checkEmailMsg': {
    en: 'We sent a link to {email}. Open it on this phone to finish setting up your account.',
    es: 'Enviamos un enlace a {email}. Ábrelo en este teléfono para terminar de crear tu cuenta.',
  },
  'auth.checkEmailHint': {
    en: 'You can close this page — the link will bring you right back.',
    es: 'Puedes cerrar esta página — el enlace te traerá de vuelta.',
  },
  'auth.resetSent': {
    en: 'We sent you a link. Open it on this phone to reset your password.',
    es: 'Te enviamos un enlace. Ábrelo en este teléfono para restablecer tu contraseña.',
  },
  'auth.dupAccount': {
    en: 'There is already an account with this email. Try logging in instead.',
    es: 'Ya existe una cuenta con este correo. Mejor inicia sesión.',
  },
  'auth.confirmEmailNotice': {
    en: 'Almost there! Check your email for a link to confirm your account.',
    es: '¡Casi listo! Revisa tu correo para confirmar tu cuenta.',
  },

  // ---------- reset password ----------
  'reset.title': { en: 'Set a new password', es: 'Crea una nueva contraseña' },
  'reset.done': {
    en: 'Your password is updated. Taking you into Tornasol…',
    es: 'Tu contraseña se actualizó. Entrando a Tornasol…',
  },
  'reset.expired': {
    en: 'Open this page from the link we emailed you on this phone. If you are seeing this, the link may have expired — please request a new one.',
    es: 'Abre esta página desde el enlace que te enviamos por correo en este teléfono. Si ves esto, el enlace pudo haber caducado — solicita uno nuevo.',
  },
  'reset.newPassword': { en: 'New password', es: 'Nueva contraseña' },
  'reset.typeAgain': { en: 'Type it again', es: 'Escríbela otra vez' },
  'reset.save': { en: 'Save new password', es: 'Guardar contraseña' },
  'reset.tooShort': {
    en: 'Please choose a password with at least 6 characters.',
    es: 'Elige una contraseña de al menos 6 caracteres.',
  },
  'reset.noMatch': {
    en: 'Those passwords do not match. Please type them again.',
    es: 'Las contraseñas no coinciden. Escríbelas otra vez.',
  },

  // ---------- setup notice ----------
  'setup.title': { en: 'Almost ready', es: 'Casi listo' },
  'setup.body': {
    en: 'Tornasol needs to be connected to its database before you can sign in.',
    es: 'Tornasol necesita conectarse a su base de datos antes de iniciar sesión.',
  },
  'setup.hint': {
    en: 'This message only appears during setup — your family will never see it.',
    es: 'Este mensaje solo aparece durante la configuración — tu familia nunca lo verá.',
  },

  // ---------- not found ----------
  'notfound.title': { en: 'Page not found', es: 'Página no encontrada' },
  'notfound.body': { en: "That page doesn't seem to exist.", es: 'Esa página no existe.' },

  // ---------- invite ----------
  'invite.opening': { en: 'Opening your invite…', es: 'Abriendo tu invitación…' },
  'invite.invalidTitle': { en: 'This invite is not valid', es: 'Esta invitación no es válida' },
  'invite.invalidBody': {
    en: 'The link may have expired or already been used. Please ask the person who invited you to send a new one.',
    es: 'El enlace pudo haber caducado o ya se usó. Pide a quien te invitó que te envíe uno nuevo.',
  },
  'invite.youreInvited': { en: "You're invited!", es: '¡Estás invitado!' },
  'invite.joinPrompt': {
    en: 'Join {group} to help coordinate care together.',
    es: 'Únete a {group} para coordinar los cuidados juntos.',
  },
  'invite.createAccount': { en: 'Create your account', es: 'Crea tu cuenta' },
  'invite.haveAccount': { en: 'Already have an account?', es: '¿Ya tienes una cuenta?' },
  'invite.logInToJoin': { en: 'Log in to join', es: 'Inicia sesión para unirte' },
  'invite.joining': { en: 'Joining {group}…', es: 'Uniéndote a {group}…' },
  'invite.joinedTitle': { en: "You're in!", es: '¡Ya estás dentro!' },
  'invite.joinedBody': {
    en: 'Welcome to {group}. Taking you to the app…',
    es: 'Bienvenido a {group}. Entrando a la app…',
  },
  'invite.errorTitle': { en: "We couldn't add you", es: 'No pudimos agregarte' },
  'invite.tryAgain': { en: 'Try again', es: 'Intentar de nuevo' },

  // ---------- no group gate / create group ----------
  'gate.title': { en: "Let's set up your care team", es: 'Vamos a crear tu equipo de cuidado' },
  'gate.body': {
    en: 'Everything in Tornasol happens inside a care team. Create one to get started — or open an invite link someone shared with you.',
    es: 'Todo en Tornasol ocurre dentro de un equipo de cuidado. Crea uno para empezar — o abre un enlace de invitación que te compartieron.',
  },
  'createGroup.title': { en: 'Start a care team', es: 'Crea un equipo de cuidado' },
  'createGroup.intro': {
    en: "Give your group a name — like the person you're caring for.",
    es: 'Dale un nombre a tu grupo — como la persona a quien cuidan.',
  },
  'createGroup.nameLabel': { en: 'Group name', es: 'Nombre del grupo' },
  'createGroup.namePlaceholder': { en: "e.g. Marysol's care team", es: 'p. ej. Equipo de Marysol' },
  'createGroup.submit': { en: 'Create group', es: 'Crear grupo' },
  'createGroup.creating': { en: 'Creating…', es: 'Creando…' },

  // ---------- group switcher ----------
  'switcher.title': { en: 'Switch care team', es: 'Cambiar de equipo' },
  'switcher.aria': {
    en: 'Care team: {name}. Tap to switch.',
    es: 'Equipo de cuidado: {name}. Toca para cambiar.',
  },

  // ---------- home ----------
  'home.hello': { en: 'Hello, {name}', es: 'Hola, {name}' },
  'home.caringFor': {
    en: "Here's what you have on for {group}.",
    es: 'Esto es lo que tienes en {group}.',
  },
  'home.yourEvents': { en: 'Your events', es: 'Tus eventos' },
  'home.seeCalendar': { en: 'See calendar', es: 'Ver calendario' },
  'home.noEvents': {
    en: "You're not signed up for any upcoming events. Open the calendar to find one.",
    es: 'No estás apuntado a eventos próximos. Abre el calendario para encontrar uno.',
  },
  'home.yourTasks': { en: 'Your tasks', es: 'Tus tareas' },
  'home.seeAllTasks': { en: 'See all tasks', es: 'Ver todas las tareas' },
  'home.noTasks': {
    en: 'Nothing assigned to you right now.',
    es: 'Nada asignado a ti por ahora.',
  },

  // ---------- calendar ----------
  'cal.title': { en: 'Events', es: 'Eventos' },
  'cal.month': { en: 'Month', es: 'Mes' },
  'cal.week': { en: 'Week', es: 'Semana' },
  'cal.loading': { en: 'Loading events…', es: 'Cargando eventos…' },
  'cal.today': { en: 'Today', es: 'Hoy' },
  'relative.tomorrow': { en: 'Tomorrow', es: 'Mañana' },
  'relative.yesterday': { en: 'Yesterday', es: 'Ayer' },
  'cal.prev': { en: 'Previous', es: 'Anterior' },
  'cal.next': { en: 'Next', es: 'Siguiente' },
  'cal.goToday': { en: 'Go to today', es: 'Ir a hoy' },
  'cal.noEventsShort': { en: 'No events', es: 'Sin eventos' },
  'cal.nothingPlanned': { en: 'Nothing planned', es: 'Nada planeado' },
  'cal.eventOne': { en: '{n} event', es: '{n} evento' },
  'cal.eventOther': { en: '{n} events', es: '{n} eventos' },
  'cal.tasksLabel': { en: 'tasks', es: 'tareas' },

  // ---------- day modal ----------
  'day.empty': {
    en: 'Nothing planned for this day yet.',
    es: 'Nada planeado para este día todavía.',
  },
  'day.events': { en: 'Events', es: 'Eventos' },
  'day.tasks': { en: 'Tasks', es: 'Tareas' },
  'day.add': { en: 'Add to this day', es: 'Añadir a este día' },

  // ---------- event card / detail ----------
  'event.full': { en: 'Full', es: 'Lleno' },
  'event.youreIn': { en: "You're in", es: 'Estás dentro' },
  'event.title': { en: 'Event', es: 'Evento' },
  'event.seriesNote': {
    en: 'Part of a weekly series — this is just this week.',
    es: 'Parte de una serie semanal — esto es solo esta semana.',
  },
  'event.share': { en: 'Share to WhatsApp', es: 'Compartir por WhatsApp' },
  'event.whosComing': { en: "Who's coming", es: 'Quién viene' },
  'event.signedUp': { en: '{n} / {cap} signed up', es: '{n} / {cap} apuntados' },
  'event.noOneYet': { en: 'No one has signed up yet.', es: 'Nadie se ha apuntado aún.' },
  'event.giveUp': { en: 'Give up my spot', es: 'Ceder mi lugar' },
  'event.transferTo': { en: 'Transfer my spot to…', es: 'Transferir mi lugar a…' },
  'event.transfer': { en: 'Transfer', es: 'Transferir' },
  'event.isFull': { en: 'This event is full.', es: 'Este evento está lleno.' },
  'event.signUp': { en: 'Sign up', es: 'Apuntarme' },
  'event.notesTitle': { en: 'Handoff notes', es: 'Notas de relevo' },
  'event.notesHint': {
    en: 'Meds, meals, mood — anything the next person should know.',
    es: 'Medicinas, comidas, ánimo — cualquier cosa que deba saber la siguiente persona.',
  },
  'event.noNotes': { en: 'No notes yet.', es: 'Aún no hay notas.' },
  'event.notePlaceholder': {
    en: 'Write a note for the next caregiver…',
    es: 'Escribe una nota para el siguiente cuidador…',
  },
  'event.addNote': { en: 'Add note', es: 'Añadir nota' },
  'event.deleteNote': { en: 'Delete note', es: 'Eliminar nota' },
  'event.deleteThis': { en: 'Delete this event', es: 'Eliminar este evento' },
  'event.deleteFuture': { en: 'Delete this & future repeats', es: 'Eliminar este y los siguientes' },
  'event.confirmDelete': {
    en: 'Delete this event? This cannot be undone.',
    es: '¿Eliminar este evento? No se puede deshacer.',
  },
  'event.confirmDeleteSeries': {
    en: 'Delete this event and all future repeats? This cannot be undone.',
    es: '¿Eliminar este evento y todas sus repeticiones futuras? No se puede deshacer.',
  },
  'event.hasThisShift': { en: 'has this shift', es: 'tiene este turno' },

  // ---------- add modal ----------
  'add.title': { en: 'Add to this day', es: 'Añadir a este día' },
  'add.event': { en: 'Event', es: 'Evento' },
  'add.task': { en: 'Task', es: 'Tarea' },
  'add.day': { en: 'Day', es: 'Día' },
  'add.titleOptional': { en: 'Title (optional)', es: 'Título (opcional)' },
  'add.titlePlaceholder': { en: 'e.g. Lunch with Dad', es: 'p. ej. Almuerzo con papá' },
  'add.type': { en: 'Type', es: 'Tipo' },
  'add.chooseType': { en: 'Choose a type', es: 'Elige un tipo' },
  'add.allDay': { en: 'All day', es: 'Todo el día' },
  'add.starts': { en: 'Starts', es: 'Empieza' },
  'add.ends': { en: 'Ends', es: 'Termina' },
  'add.howMany': { en: 'How many people are needed?', es: '¿Cuántas personas se necesitan?' },
  'add.upTo': { en: 'Up to {n} (the size of your team).', es: 'Hasta {n} (el tamaño de tu equipo).' },
  'add.repeat': { en: 'Repeat every week', es: 'Repetir cada semana' },
  'add.howManyWeeks': { en: 'For how many weeks?', es: '¿Por cuántas semanas?' },
  'add.weeks': { en: 'weeks', es: 'semanas' },
  'add.eachWeekSeparate': {
    en: 'Each week is signed up separately.',
    es: 'Cada semana se apunta por separado.',
  },
  'add.addEvent': { en: 'Add event', es: 'Añadir evento' },
  'add.addTask': { en: 'Add task', es: 'Añadir tarea' },
  'add.whatToDo': { en: 'What needs to be done?', es: '¿Qué hay que hacer?' },
  'add.taskPlaceholder': { en: 'e.g. Refill prescription', es: 'p. ej. Surtir receta' },
  'add.whoFor': { en: "Who's it for?", es: '¿Para quién es?' },
  'add.dueOptional': { en: 'Due date (optional)', es: 'Fecha límite (opcional)' },
  'add.noDueDate': { en: 'No due date', es: 'Sin fecha límite' },
  'add.chooseType.err': { en: 'Please choose an event type.', es: 'Elige un tipo de evento.' },
  'add.endAfterStart': {
    en: 'The end time needs to be after the start time.',
    es: 'La hora de fin debe ser después de la de inicio.',
  },
  'add.whatToDo.err': {
    en: 'Please write what needs to be done.',
    es: 'Escribe qué hay que hacer.',
  },

  // ---------- pickers ----------
  'picker.pickDay': { en: 'Pick a day', es: 'Elige un día' },
  'picker.pickTime': { en: 'Pick a time', es: 'Elige una hora' },
  'picker.pickColor': { en: 'Pick a color', es: 'Elige un color' },
  'picker.done': { en: 'Done', es: 'Listo' },
  'picker.anyoneShared': { en: 'Anyone (shared)', es: 'Cualquiera (compartida)' },

  // ---------- tasks ----------
  'tasks.title': { en: 'Tasks', es: 'Tareas' },
  'tasks.loading': { en: 'Loading tasks…', es: 'Cargando tareas…' },
  'tasks.todo': { en: 'To do', es: 'Pendientes' },
  'tasks.done': { en: 'Done', es: 'Hechas' },
  'tasks.allCaughtUp': {
    en: 'All caught up. Nothing to do right now.',
    es: 'Todo al día. Nada por hacer ahora.',
  },
  'tasks.shared': { en: 'Shared', es: 'Compartida' },
  'tasks.markDone': { en: 'Mark as done', es: 'Marcar como hecha' },
  'tasks.markNotDone': { en: 'Mark as not done', es: 'Marcar como pendiente' },
  'tasks.deleteTask': { en: 'Delete task', es: 'Eliminar tarea' },
  'tasks.confirmDelete': { en: 'Delete this task?', es: '¿Eliminar esta tarea?' },

  // ---------- notes ----------
  'notes.title': { en: 'Handoff notes', es: 'Notas de relevo' },
  'notes.intro': {
    en: 'A shared log of what\'s happened, newest first. Add notes from any event on the calendar.',
    es: 'Un registro compartido de lo que ha pasado, lo más reciente primero. Añade notas desde cualquier evento del calendario.',
  },
  'notes.empty': {
    en: 'No notes yet. Open an event on the calendar to leave the first one.',
    es: 'Aún no hay notas. Abre un evento en el calendario para dejar la primera.',
  },

  // ---------- group ----------
  'group.onTeam': { en: 'on this care team', es: 'en este equipo' },
  'group.person': { en: 'person', es: 'persona' },
  'group.people': { en: 'people', es: 'personas' },
  'group.peopleHeading': { en: 'People', es: 'Personas' },
  'group.admin': { en: 'Admin', es: 'Administrador' },
  'group.inviteTitle': { en: 'Invite someone', es: 'Invitar a alguien' },
  'group.inviteIntro': {
    en: 'Create a link and share it, or send it by email.',
    es: 'Crea un enlace y compártelo, o envíalo por correo.',
  },
  'group.createLink': { en: 'Create invite link', es: 'Crear enlace de invitación' },
  'group.creatingLink': { en: 'Creating link…', es: 'Creando enlace…' },
  'group.copy': { en: 'Copy', es: 'Copiar' },
  'group.copied': { en: 'Copied!', es: '¡Copiado!' },
  'group.sendEmail': { en: 'Send by email', es: 'Enviar por correo' },
  'group.share': { en: 'Share…', es: 'Compartir…' },
  'group.linkExpires': { en: 'This link works for 14 days.', es: 'Este enlace funciona por 14 días.' },
  'group.onlyAdminInvite': {
    en: 'Only the team admin can invite new people. Ask them to send you a link.',
    es: 'Solo el administrador puede invitar. Pídele que te envíe un enlace.',
  },
  'group.settings': { en: 'Group settings', es: 'Ajustes del grupo' },
  'group.membersCanCreate': { en: 'Members can create events', es: 'Los miembros pueden crear eventos' },
  'group.membersCanCreateOn': {
    en: 'Anyone can add events to the calendar.',
    es: 'Cualquiera puede añadir eventos al calendario.',
  },
  'group.membersCanCreateOff': {
    en: 'Only you can add events. Others can sign up.',
    es: 'Solo tú puedes añadir eventos. Los demás pueden apuntarse.',
  },
  'group.shareFamily': { en: 'Share with the family', es: 'Compartir con la familia' },
  'group.shareFamilyIntro': {
    en: "Post this week's schedule to your WhatsApp group.",
    es: 'Publica el plan de esta semana en tu grupo de WhatsApp.',
  },
  'group.shareThisWeek': { en: 'Share this week', es: 'Compartir esta semana' },
  'group.preparing': { en: 'Preparing…', es: 'Preparando…' },
  'group.dangerZone': { en: 'Danger zone', es: 'Zona de peligro' },
  'group.deleteIntro': {
    en: 'Deleting this care team removes its events, tasks, notes, and members for everyone. This cannot be undone.',
    es: 'Eliminar este equipo borra sus eventos, tareas, notas y miembros para todos. No se puede deshacer.',
  },
  'group.deleteTeam': { en: 'Delete this care team', es: 'Eliminar este equipo' },
  'group.deleteModalTitle': { en: 'Delete care team', es: 'Eliminar equipo' },
  'group.deleteConfirmBody': {
    en: 'This permanently deletes {name} and all of its events, tasks, and notes. To confirm, type the team\'s name below.',
    es: 'Esto elimina permanentemente {name} y todos sus eventos, tareas y notas. Para confirmar, escribe el nombre del equipo abajo.',
  },
  'group.teamName': { en: 'Team name', es: 'Nombre del equipo' },
  'group.deleteForever': { en: 'Delete forever', es: 'Eliminar para siempre' },
  'group.deleting': { en: 'Deleting…', es: 'Eliminando…' },
  'group.remove': { en: 'Remove', es: 'Quitar' },

  // ---------- event types manager ----------
  'types.title': { en: 'Event types', es: 'Tipos de evento' },
  'types.intro': {
    en: 'Categories for your events. Tap the color to change it.',
    es: 'Categorías para tus eventos. Toca el color para cambiarlo.',
  },
  'types.name': { en: 'Type name', es: 'Nombre del tipo' },
  'types.addLabel': { en: 'Add a type', es: 'Añadir un tipo' },
  'types.addPlaceholder': { en: 'e.g. Meal time', es: 'p. ej. Hora de comer' },
  'types.confirmDelete': {
    en: 'Delete the "{name}" type? Events using it will keep their color but lose the label.',
    es: '¿Eliminar el tipo "{name}"? Los eventos que lo usan conservan su color pero pierden la etiqueta.',
  },

  // ---------- profile ----------
  'profile.title': { en: 'Profile & settings', es: 'Perfil y ajustes' },
  'profile.logOut': { en: 'Log out', es: 'Cerrar sesión' },
  'profile.yourTeams': { en: 'Your care teams', es: 'Tus equipos' },
  'profile.noTeams': {
    en: "You're not in any care team yet. Create one below.",
    es: 'Aún no estás en ningún equipo. Crea uno abajo.',
  },
  'profile.active': { en: 'Active', es: 'Activo' },
  'profile.switch': { en: 'Switch', es: 'Cambiar' },
  'profile.startAnother': { en: 'Start another care team', es: 'Crear otro equipo' },
  'profile.startAnotherIntro': {
    en: 'You can care for more than one person. Each team has its own events, notes, and members.',
    es: 'Puedes cuidar a más de una persona. Cada equipo tiene sus propios eventos, notas y miembros.',
  },
  'profile.newTeam': { en: 'New care team', es: 'Nuevo equipo' },
  'profile.language': { en: 'Language', es: 'Idioma' },
  'profile.languageIntro': {
    en: 'Choose how Tornasol reads for you.',
    es: 'Elige cómo se muestra Tornasol para ti.',
  },
}
