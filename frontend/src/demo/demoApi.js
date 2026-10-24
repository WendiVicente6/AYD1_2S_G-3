/* EduConnect DEMO: API simulada, sin backend ni base de datos.
   Los datos se guardan únicamente en localStorage del navegador actual.
   NO activar en una aplicación con información real. */
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";
const STORAGE_KEY = "educonnect_demo_v2";
const DEMO_PASSWORD = "Demo12345!";

const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const materiasBase = [
  { id_materia: 1, nombre: "Matemática" },
  { id_materia: 2, nombre: "Programación" },
  { id_materia: 3, nombre: "Física" },
  { id_materia: 4, nombre: "Bases de Datos" },
  { id_materia: 5, nombre: "Inglés" },
];
const seed = () => ({
  users: [
    { id_usuario: 1, nombres: "Andrea", apellidos: "Morales", correo: "admin@demo.com", password: DEMO_PASSWORD, role: "admin", carnet: "ADMIN-001", genero: "Femenino", telefono: "5555-1001", direccion: "Ciudad de Guatemala", fec_nac: "1994-04-12", estado: "Activo" },
    { id_usuario: 2, id_tutor: 2, nombres: "Carlos", apellidos: "López", correo: "tutor@demo.com", password: DEMO_PASSWORD, role: "tutor", carnet: "202000001", genero: "Masculino", telefono: "5555-1002", direccion: "Campus Central", fec_nac: "1999-05-20", estado: "Activo", nro_id: "123456789", dir_tutoria: "Biblioteca central", direccion_tutoria: "Biblioteca central", anio_inicio_tutoria: "2022", u_graduacion: "USAC", materias: [1, 2, 4] },
    { id_usuario: 3, id_tutor: 3, nombres: "María", apellidos: "Pérez", correo: "maria.tutora@demo.com", password: DEMO_PASSWORD, role: "tutor", carnet: "202000002", genero: "Femenino", telefono: "5555-1003", direccion: "Zona 12", fec_nac: "2000-09-12", estado: "Activo", nro_id: "789456123", dir_tutoria: "Edificio T3", direccion_tutoria: "Edificio T3", anio_inicio_tutoria: "2023", u_graduacion: "USAC", materias: [3, 5] },
    { id_usuario: 4, nombres: "Luis", apellidos: "Ramírez", correo: "estudiante@demo.com", password: DEMO_PASSWORD, role: "student", carnet: "202212426", genero: "Masculino", telefono: "5555-1004", direccion: "Mixco", fec_nac: "2003-06-14", estado: "Activo" },
    { id_usuario: 5, nombres: "Sofía", apellidos: "García", correo: "sofia@demo.com", password: DEMO_PASSWORD, role: "student", carnet: "202310025", genero: "Femenino", telefono: "5555-1005", direccion: "Villa Nueva", fec_nac: "2004-04-06", estado: "Activo" },
    { id_usuario: 6, nombres: "Diego", apellidos: "Herrera", correo: "diego@demo.com", password: DEMO_PASSWORD, role: "student", carnet: "202310026", genero: "Masculino", telefono: "5555-1006", direccion: "Guatemala", fec_nac: "2002-01-01", estado: "Pendiente" },
    { id_usuario: 7, id_tutor: 7, nombres: "Elena", apellidos: "Castillo", correo: "elena@demo.com", password: DEMO_PASSWORD, role: "tutor", carnet: "202000007", genero: "Femenino", telefono: "5555-1007", direccion: "Guatemala", fec_nac: "1998-11-10", estado: "Pendiente", dir_tutoria: "USAC", materias: [1, 3], cv_pdf_nombre: null },
  ],
  materias: materiasBase,
  schedules: { 2: { dias: [1, 2, 3, 4, 5], hora_inicio: "08:00", hora_fin: "16:00" }, 3: { dias: [1, 3, 5], hora_inicio: "09:00", hora_fin: "15:00" } },
  sessions: [
    { id_sesion: 101, id_estudiante: 4, id_tutor: 2, id_materia: 2, fecha: dateOffset(2), hora_inicio: "10:00", hora_final: "11:00", motivo: "Repasar JavaScript", estado: "Pendiente" },
    { id_sesion: 102, id_estudiante: 4, id_tutor: 2, id_materia: 4, fecha: dateOffset(4), hora_inicio: "14:00", hora_final: "15:00", motivo: "Consultas SQL", estado: "Confirmada" },
    { id_sesion: 103, id_estudiante: 4, id_tutor: 3, id_materia: 3, fecha: dateOffset(-4), hora_inicio: "09:00", hora_final: "10:00", motivo: "Leyes de Newton", estado: "Completada", dificultades: "Repasar diagramas de cuerpo libre", recursos: [{ nombre: "Guía de física", tipo: "Texto", descripcion: "Repasar la segunda ley de Newton y resolver tres ejercicios." }] },
    { id_sesion: 104, id_estudiante: 5, id_tutor: 2, id_materia: 1, fecha: dateOffset(-7), hora_inicio: "11:00", hora_final: "12:00", motivo: "Ecuaciones", estado: "Completada", dificultades: "Operaciones con fracciones", recursos: [{ nombre: "Ejercicios algebraicos", tipo: "Ejercicio", descripcion: "Resolver cinco ecuaciones lineales." }] },
    { id_sesion: 105, id_estudiante: 5, id_tutor: 3, id_materia: 5, fecha: dateOffset(-2), hora_inicio: "10:00", hora_final: "11:00", motivo: "Conversación", estado: "Cancelada", cancelado_por: "Estudiante" },
    { id_sesion: 106, id_estudiante: 5, id_tutor: 2, id_materia: 2, fecha: dateOffset(5), hora_inicio: "10:00", hora_final: "11:00", motivo: "React", estado: "Pendiente" },
  ],
  ratings: [{ id_sesion: 103, dirigido_a: "tutor", id_calificado: 3, estrellas: 5, comentario: "Excelente explicación" }],
  reports: [
    { id_reporte: 1, reportado_id: 3, denunciante_id: 4, categoria: "Incumplimiento de horario", explicacion: "Ejemplo de reporte para evaluación", estado_gestion: "Pendiente", fec_creacion: dateOffset(-2) },
    { id_reporte: 2, reportado_id: 5, denunciante_id: 2, categoria: "Comportamiento inadecuado", explicacion: "Ejemplo de reporte de estudiante", estado_gestion: "Pendiente", fec_creacion: dateOffset(-3) },
  ],
});
let db;
try {
  db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed();
} catch {
  db = seed();
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* cuotas de almacenamiento */ }
}
function userById(id) { return db.users.find(u => u.id_usuario === Number(id)); }
function currentUser() {
  const fromSession = sessionStorage.getItem("educonnect_user");
  try { return userById(JSON.parse(fromSession)?.id_usuario); } catch { return null; }
}
function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  void password;
  return { ...rest, id_rol: { admin: 1, tutor: 2, student: 3 }[user.role], rol: { admin: "Administrador", tutor: "Tutor", student: "Estudiante" }[user.role], sn_activo: user.estado === "Activo" ? 1 : 0, id_estado_usr: 1, foto: null };
}
const tutorName = (id) => { const u = userById(id); return u ? `${u.nombres} ${u.apellidos}` : "Tutor"; };
const studentName = (id) => { const u = userById(id); return u ? `${u.nombres} ${u.apellidos}` : "Estudiante"; };
const subjectName = (id) => db.materias.find(m => m.id_materia === Number(id))?.nombre || "Materia";
const scheduleFor = (id) => db.schedules[id] || null;
const completed = s => s.estado === "Completada" || s.estado === "Atendida";
const makeSession = s => ({
  ...s, materia: subjectName(s.id_materia), tutor: tutorName(s.id_tutor), estudiante: studentName(s.id_estudiante),
  tutor_nombres: userById(s.id_tutor)?.nombres || "", tutor_apellidos: userById(s.id_tutor)?.apellidos || "",
  fec_sesion: s.fecha, hora: `${s.hora_inicio} - ${s.hora_final}`, direccion: userById(s.id_tutor)?.dir_tutoria || "Campus Central",
  resumen: s.dificultades || "Tutoría académica", ya_calificada: db.ratings.some(r => r.id_sesion === s.id_sesion && r.dirigido_a === "tutor"),
  calificacion_estrellas: db.ratings.find(r => r.id_sesion === s.id_sesion && r.dirigido_a === "tutor")?.estrellas,
  ya_reportada: db.reports.some(r => r.id_sesion === s.id_sesion && r.reportado_id === s.id_tutor),
});
const reportRow = r => ({ ...r, reportado: r.reportado_id ? (userById(r.reportado_id)?.nombres + " " + userById(r.reportado_id)?.apellidos) : "Usuario", denunciante: r.denunciante_id ? (userById(r.denunciante_id)?.nombres + " " + userById(r.denunciante_id)?.apellidos) : "Usuario" });
function respond(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } }); }
function fail(message, status = 400) { return respond({ ok: false, message }, status); }
function ok(message, other = {}) { return { ok: true, message, ...other }; }
function aggregates() {
  const tutorRows = db.users.filter(u => u.role === "tutor" && u.estado === "Activo").map(t => {
    const s = db.sessions.filter(s => s.id_tutor === t.id_usuario);
    return { id_tutor: t.id_usuario, tutor: tutorName(t.id_usuario), estudiantes_atendidos: new Set(s.filter(completed).map(x => x.id_estudiante)).size, total_sesiones: s.length, sesiones_atendidas: s.filter(completed).length, materias: (t.materias || []).map(subjectName).join(", ") };
  });
  const materialRows = db.materias.map(m => {
    const s = db.sessions.filter(s => s.id_materia === m.id_materia);
    const cancelled = s.filter(x => x.estado === "Cancelada").length;
    const completedCount = s.filter(completed).length;
    return { id_materia: m.id_materia, materia: m.nombre, total_sesiones: s.length, estudiantes_atendidos: new Set(s.map(x => x.id_estudiante)).size, tutores: new Set(s.map(x => x.id_tutor)).size, sesiones_canceladas: cancelled, tasa_cancelacion: s.length ? cancelled / s.length * 100 : 0, sesiones_completadas: completedCount, tasa_completadas: s.length ? completedCount / s.length * 100 : 0, tasa_canceladas: s.length ? cancelled / s.length * 100 : 0 };
  });
  const studentRows = db.users.filter(u => u.role === "student").map(u => {
    const ss = db.sessions.filter(s => s.id_estudiante === u.id_usuario);
    return { id_estudiante: u.id_usuario, estudiante: studentName(u.id_usuario), total_sesiones: ss.length, completadas: ss.filter(completed).length, confirmadas: ss.filter(x => x.estado === "Confirmada").length, pendientes: ss.filter(x => x.estado === "Pendiente").length };
  });
  const timeRows = [...new Set(db.sessions.map(s => s.hora_inicio))].sort().map(time => {
    const ss = db.sessions.filter(s => s.hora_inicio === time);
    return { hora_inicio: time, total_sesiones: ss.length, completadas: ss.filter(completed).length, confirmadas: ss.filter(x => x.estado === "Confirmada").length, pendientes: ss.filter(x => x.estado === "Pendiente").length };
  });
  const evolution = [6, 5, 4, 3, 2, 1].map((week, i) => ({ semana: dateOffset(-7 * week), pendientes: i + 1, confirmadas: 2 + (i % 2), completadas: 1 + i, canceladas: i % 3, total_sesiones: (i + 1) + 2 + (i % 2) + (1 + i) + i % 3 }));
  const rates = role => db.users.filter(u => u.role === role && u.estado === "Activo").map(u => {
    const rs = db.ratings.filter(r => r.id_calificado === u.id_usuario);
    return { [role === "tutor" ? "id_tutor" : "id_estudiante"]: u.id_usuario, [role === "tutor" ? "tutor" : "estudiante"]: `${u.nombres} ${u.apellidos}`, materias: (u.materias || []).map(subjectName).join(", "), promedio_estrellas: rs.length ? rs.reduce((sum, x) => sum + x.estrellas, 0) / rs.length : null, total_calificaciones: rs.length };
  });
  return { tutorRows, materialRows, studentRows, timeRows, evolution, rates };
}
function demoPdf() {
  const lines = ["%PDF-1.1", "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj", "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj", "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj", "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj"];
  const stream = "BT /F1 18 Tf 70 700 Td (Documento de ejemplo - EduConnect Demo) Tj ET";
  lines.push(`5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
  let pdf = "%PDF-1.1\n"; const offsets = [0];
  for (const line of lines.slice(1)) { offsets.push(pdf.length); pdf += line + "\n"; }
  const start = pdf.length;
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (const n of offsets.slice(1)) pdf += `${String(n).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Response(pdf, { status: 200, headers: { "Content-Type": "application/pdf" } });
}
async function route(path, method, options) {
  const url = new URL(`https://demo.local${path}`);
  const p = url.pathname;
  const input = options.body instanceof FormData ? Object.fromEntries(options.body.entries()) : (() => { try { return JSON.parse(options.body || "{}"); } catch { return {}; } })();
  const auth = currentUser();
  let match;

  if (p === "/auth/login" && method === "POST") {
    const user = db.users.find(u => u.correo.toLowerCase() === String(input.correo || "").trim().toLowerCase() && u.password === input.password);
    if (!user) return fail("Correo o contraseña incorrectos. Usa las cuentas DEMO.", 401);
    if (user.estado !== "Activo") return fail("El usuario no está aprobado todavía.", 403);
    return respond(ok("Ingreso correcto (modo demostración).", { token: `demo-token-${user.id_usuario}`, user: publicUser(user) }));
  }
  if (p === "/auth/me" && method === "GET") return auth ? respond({ user: publicUser(auth) }) : fail("Sesión no iniciada", 401);
  if (p === "/auth/me" && method === "PUT") {
    if (!auth) return fail("Sesión no iniciada", 401);
    Object.assign(auth, Object.fromEntries(Object.entries(input).filter(([k]) => ["nombres", "apellidos", "direccion", "telefono", "fec_nac", "genero"].includes(k))));
    if (input.password_nueva) auth.password = input.password_nueva;
    save(); return respond(ok("Perfil actualizado", { user: publicUser(auth) }));
  }
  if (p === "/auth2" && method === "POST") return respond(ok("Validación de demostración correcta"));
  if (p === "/materias" && method === "GET") return respond({ materias: db.materias });

  if (p === "/students" && method === "POST" || p === "/tutors" && method === "POST") {
    if (db.users.some(u => u.correo === input.correo)) return fail("Este correo ya está registrado.", 409);
    const isTutor = p === "/tutors";
    const next = Math.max(...db.users.map(u => u.id_usuario)) + 1;
    const nuevo = { id_usuario: next, ...input, role: isTutor ? "tutor" : "student", estado: "Pendiente" };
    if (isTutor) { nuevo.id_tutor = next; nuevo.materias = options.body.getAll("materias").map(Number); nuevo.cv_pdf_nombre = input.cv_pdf?.name || null; }
    delete nuevo.foto; delete nuevo.cv_pdf; delete nuevo.carnet_pdf;
    db.users.push(nuevo); save(); return respond(ok("Solicitud enviada. Pendiente de aprobación."), 201);
  }

  if (p === "/admin/dashboard" && method === "GET") return respond({ stats: {
    estudiantes: db.users.filter(u => u.role === "student" && u.estado === "Activo").length,
    tutores: db.users.filter(u => u.role === "tutor" && u.estado === "Activo").length,
    sesiones: db.sessions.length, mensajes: db.reports.length,
    estudiantes_pendientes: db.users.filter(u => u.role === "student" && u.estado === "Pendiente").length,
    tutores_pendientes: db.users.filter(u => u.role === "tutor" && u.estado === "Pendiente").length,
  } });
  if (p === "/admin/estudiantes-pendientes") return respond({ estudiantes: db.users.filter(u => u.role === "student" && u.estado === "Pendiente").map(publicUser) });
  if (p === "/admin/tutores-pendientes") return respond({ tutores: db.users.filter(u => u.role === "tutor" && u.estado === "Pendiente").map(publicUser) });
  if (p === "/admin/estudiantes" && method === "GET") return respond({ estudiantes: db.users.filter(u => u.role === "student" && u.estado === "Activo").map(publicUser) });
  if (p === "/admin/tutores" && method === "GET") return respond({ tutores: db.users.filter(u => u.role === "tutor" && u.estado === "Activo").map(publicUser) });
  if (/^\/admin\/(estudiantes|tutores)\/\d+\/(carnet-pdf|cv-pdf)$/.test(p)) return demoPdf();
  if ((match = p.match(/^\/admin\/(estudiantes|tutores)\/(\d+)\/(aprobar|rechazar|baja)$/)) && method === "PATCH") {
    const user = userById(match[2]);
    if (!user) return fail("Usuario no encontrado", 404);
    user.estado = match[3] === "aprobar" ? "Activo" : match[3] === "rechazar" ? "Rechazado" : "Inactivo";
    save(); return respond(ok(`Usuario ${match[3] === "aprobar" ? "aprobado" : "actualizado"} correctamente.`));
  }
  if ((match = p.match(/^\/admin\/(estudiantes|tutores)\/(\d+)$/)) && method === "PUT") {
    const user = userById(match[2]); if (!user) return fail("Usuario no encontrado", 404);
    Object.assign(user, input); save();
    return respond(ok("Actualizado correctamente.", { estudiante: publicUser(user), tutor: publicUser(user) }));
  }

  if (p === "/estudiante/tutores" && method === "GET") return respond({ tutores: db.users.filter(u => u.role === "tutor" && u.estado === "Activo").map(u => ({ id_tutor: u.id_usuario, nombre_completo: tutorName(u.id_usuario), direccion_tutoria: u.dir_tutoria || "Campus central", foto: null, materias: (u.materias || []).map(subjectName) })) });
  if (p === "/tutores" && method === "GET") return respond({ tutores: db.users.filter(u => u.role === "tutor" && u.estado === "Activo" && (u.materias || []).includes(Number(url.searchParams.get("id_materia")))).map(u => ({ id_tutor: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos })) });
  if ((match = p.match(/^\/estudiante\/tutores\/(\d+)\/horario$/))) return respond({ horario: scheduleFor(match[1]) });
  if ((match = p.match(/^\/tutores\/(\d+)\/disponibilidad$/))) {
    const horario = scheduleFor(match[1]); return respond({ disponibilidad: horario ? horario.dias.map(d => ({ id_horario: match[1], dia_semana: d, hora_inicio: horario.hora_inicio, hora_fin: horario.hora_fin })) : [] });
  }
  if ((match = p.match(/^\/estudiante\/tutores\/(\d+)\/disponibilidad$/))) {
    const horario = scheduleFor(match[1]); const fecha = url.searchParams.get("fecha");
    const day = new Date(`${fecha}T12:00:00`).getDay() || 7;
    const atiende = Boolean(horario?.dias.includes(day));
    const startHour = horario ? parseInt(horario.hora_inicio, 10) : 8;
    const endHour = horario ? parseInt(horario.hora_fin, 10) : 15;
    const slots = atiende ? Array.from({ length: Math.min(9, endHour - startHour) }, (_, i) => ({ hora_inicio: `${String(startHour + i).padStart(2, "0")}:00`, hora_fin: `${String(startHour + i + 1).padStart(2, "0")}:00`, estado: db.sessions.some(s => s.id_tutor === Number(match[1]) && s.fecha === fecha && s.hora_inicio === `${String(startHour + i).padStart(2, "0")}:00` && s.estado !== "Cancelada") ? "ocupado" : "disponible" })) : [];
    return respond({ ok: true, fecha, atiende, slots, mensaje: atiende ? "" : "El tutor no atiende este día." });
  }

  if (p === "/tutors/schedule" && method === "GET") return respond({ horario: auth ? scheduleFor(auth.id_usuario) : null });
  if (p === "/tutors/schedule" && ["POST", "PUT"].includes(method)) {
    if (!auth || auth.role !== "tutor") return fail("Acceso de tutor requerido", 403);
    db.schedules[auth.id_usuario] = { dias: (input.dias || []).map(Number), hora_inicio: input.hora_inicio, hora_fin: input.hora_fin }; save(); return respond(ok("Horario guardado correctamente."));
  }
  if (p === "/tutor/dashboard") {
    const ss = db.sessions.filter(s => s.id_tutor === auth?.id_usuario);
    return respond({ stats: { sesiones_pendientes: ss.filter(s => ["Pendiente", "Confirmada"].includes(s.estado)).length, estudiantes_atendidos: new Set(ss.filter(completed).map(s => s.id_estudiante)).size } });
  }
  if (p === "/tutor/perfil" && method === "GET") {
    if (!auth) return fail("Inicia sesión", 401);
    return respond({ perfil: { ...publicUser(auth), materias: (auth.materias || []).map(id => db.materias.find(m => m.id_materia === id)).filter(Boolean) } });
  }
  if (p === "/tutor/perfil" && method === "PUT") {
    if (!auth) return fail("Inicia sesión", 401);
    Object.assign(auth, input);
    if (options.body instanceof FormData) auth.materias = options.body.getAll("materias").map(Number);
    delete auth.foto; save(); return respond(ok("Perfil de tutor actualizado."));
  }
  if (p === "/sesiones" && method === "POST") {
    if (!auth || auth.role !== "student") return fail("Inicia sesión como estudiante", 403);
    const next = Math.max(100, ...db.sessions.map(s => s.id_sesion)) + 1;
    db.sessions.push({ ...input, id_sesion: next, id_estudiante: auth.id_usuario, id_tutor: Number(input.id_tutor), id_materia: Number(input.id_materia), estado: "Pendiente" });
    save(); return respond(ok("Sesión programada correctamente.", { id_sesion: next }), 201);
  }
  if (p === "/sesiones/activas") return respond({ sesiones: db.sessions.filter(s => s.id_estudiante === auth?.id_usuario && ["Pendiente", "Confirmada"].includes(s.estado)).map(makeSession) });
  if (p === "/sesiones/historial") return respond({ sesiones: db.sessions.filter(s => s.id_estudiante === auth?.id_usuario && !["Pendiente", "Confirmada"].includes(s.estado)).map(s => ({ ...makeSession(s), estado: completed(s) ? "Atendida" : "Cancelada" })) });
  if (p === "/tutors/sessions/pending") return respond({ sesiones: db.sessions.filter(s => s.id_tutor === auth?.id_usuario && ["Pendiente", "Confirmada"].includes(s.estado)).map(makeSession) });
  if (p === "/tutor/historial") return respond({ sesiones: db.sessions.filter(s => s.id_tutor === auth?.id_usuario && !["Pendiente", "Confirmada"].includes(s.estado)).map(s => ({ ...makeSession(s), ya_calificada: db.ratings.some(r => r.id_sesion === s.id_sesion && r.dirigido_a === "student"), calificacion_estrellas: db.ratings.find(r => r.id_sesion === s.id_sesion && r.dirigido_a === "student")?.estrellas })) });
  if ((match = p.match(/^\/sesiones\/(\d+)\/plan-estudio$/))) {
    const s = db.sessions.find(s => s.id_sesion === Number(match[1]));
    if (!s) return fail("Sesión no encontrada", 404);
    const tutor = userById(s.id_tutor);
    return respond({ plan: completed(s) ? { fecha_ultima_sesion: s.fecha, tutor_nombre: tutorName(s.id_tutor), tutor_especialidad: (tutor?.materias || []).map(subjectName).join(", "), tutor_nro_id: tutor?.nro_id || tutor?.carnet, dificultades: s.dificultades || "Repasar los temas principales", recursos: s.recursos || [] } : null });
  }
  if ((match = p.match(/^\/(?:tutors\/sessions|sesiones)\/(\d+)\/(confirm|cancel|cancelar|attend)$/)) && ["PUT", "POST"].includes(method)) {
    const s = db.sessions.find(s => s.id_sesion === Number(match[1])); if (!s) return fail("Sesión no encontrada", 404);
    if (match[2] === "confirm") s.estado = "Confirmada";
    else if (match[2] === "attend") { s.estado = "Completada"; s.dificultades = input.dificultades; s.recursos = input.recursos || []; }
    else { s.estado = "Cancelada"; s.cancelado_por = auth?.role === "tutor" ? "Tutor" : "Estudiante"; s.motivo_cancelacion = input.motivo || "Cancelada"; }
    save(); return respond(ok("Sesión actualizada correctamente."));
  }
  if ((match = p.match(/^\/(?:tutor\/sesiones|sesiones)\/(\d+)\/(calificar|reportar)$/)) && method === "POST") {
    const s = db.sessions.find(s => s.id_sesion === Number(match[1])); if (!s) return fail("Sesión no encontrada", 404);
    const targetTutor = !p.startsWith("/tutor/");
    if (match[2] === "calificar") {
      db.ratings = db.ratings.filter(r => !(r.id_sesion === s.id_sesion && r.dirigido_a === (targetTutor ? "tutor" : "student")));
      db.ratings.push({ id_sesion: s.id_sesion, dirigido_a: targetTutor ? "tutor" : "student", id_calificado: targetTutor ? s.id_tutor : s.id_estudiante, estrellas: Number(input.estrellas), comentario: input.comentario });
    } else {
      db.reports.push({ id_reporte: Math.max(...db.reports.map(r => r.id_reporte), 0) + 1, id_sesion: s.id_sesion, reportado_id: targetTutor ? s.id_tutor : s.id_estudiante, denunciante_id: auth?.id_usuario, categoria: db.reportTypes?.find(t => t.id_tipo_reporte === Number(input.id_tipo_reporte))?.txt_desc || "Incumplimiento", explicacion: input.explicacion, fec_creacion: dateOffset(0), estado_gestion: "Pendiente" });
    }
    save(); return respond(ok(match[2] === "calificar" ? "Calificación guardada." : "Reporte enviado."));
  }
  if (p === "/tipos-reporte") return respond({ tipos: [{ id_tipo_reporte: 1, txt_desc: "Incumplimiento de horario" }, { id_tipo_reporte: 2, txt_desc: "Comportamiento inadecuado" }, { id_tipo_reporte: 3, txt_desc: "Falta de comunicación" }] });

  if (p === "/admin/reportes-tutores") return respond({ reportes: db.reports.filter(r => userById(r.reportado_id)?.role === "tutor").map(reportRow) });
  if (p === "/admin/reportes-estudiantes") return respond({ reportes: db.reports.filter(r => userById(r.reportado_id)?.role === "student").map(reportRow) });
  if ((match = p.match(/^\/admin\/reportes\/(\d+)\/(rechazar|desactivar-reportado)$/)) && method === "PATCH") {
    const r = db.reports.find(r => r.id_reporte === Number(match[1])); if (!r) return fail("Reporte no encontrado", 404);
    r.estado_gestion = match[2] === "rechazar" ? "Rechazado" : "Aceptado";
    if (match[2] === "desactivar-reportado") { const reported = userById(r.reportado_id); if (reported) reported.estado = "Inactivo"; }
    save(); return respond(ok("Reporte gestionado."));
  }
  if (p.startsWith("/admin/reportes/") && method === "GET") {
    const name = p.split("/").pop(); const a = aggregates();
    const mapping = {
      tutores: { tutores: a.tutorRows }, materias: { materias: a.materialRows },
      "top-tutores-sesiones": { tutores: [...a.tutorRows].sort((x, y) => y.sesiones_atendidas - x.sesiones_atendidas) },
      "evolucion-sesiones": { evolucion: a.evolution }, "cancelaciones-materias": { materias: a.materialRows },
      "horarios-demandados": { horarios: a.timeRows }, "estudiantes-sesiones": { estudiantes: a.studentRows },
      "asistencia-cancelacion-materias": { materias: a.materialRows },
      "calificacion-tutores": { tutores: a.rates("tutor") }, "calificacion-estudiantes": { estudiantes: a.rates("student") },
    };
    if (mapping[name]) return respond(mapping[name]);
  }
  console.warn(`[EduConnect DEMO] Endpoint no simulado: ${method} ${p}`);
  return fail(`Esta función todavía no tiene datos de demostración: ${method} ${p}`, 404);
}

if (DEMO_MODE && typeof window !== "undefined") {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (resource, options = {}) => {
    const requestUrl = typeof resource === "string" ? resource : resource.url;
    const url = new URL(requestUrl, window.location.origin);
    const configuredApi = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const apiUrl = new URL(configuredApi, window.location.origin);
    // Intercepta solo peticiones destinadas a la API de EduConnect.
    if (url.origin === apiUrl.origin && (url.pathname === apiUrl.pathname || url.pathname.startsWith(`${apiUrl.pathname.replace(/\/$/, "")}/`))) {
      const relative = url.pathname.slice(apiUrl.pathname.replace(/\/$/, "").length) + url.search;
      return route(relative, (options.method || "GET").toUpperCase(), options);
    }
    return nativeFetch(resource, options);
  };
  save();
}
export { DEMO_MODE };
