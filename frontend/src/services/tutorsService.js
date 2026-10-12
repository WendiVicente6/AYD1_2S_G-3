import { apiRequest } from "./api";
import { getToken } from "./authService";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// HU-006  Tutores disponibles para el estudiante 
export async function getTutoresDisponibles() {
  const data = await apiRequest("/estudiante/tutores", { headers: authHeaders() });
  return data.tutores;
}

// HU-007  Horario general de un tutor 
export async function getHorarioTutor(idTutor) {
  const data = await apiRequest(`/estudiante/tutores/${idTutor}/horario`, {
    headers: authHeaders(),
  });
  return data.horario; // puede ser null si el tutor no ha configurado horario
}

// HU-007  Disponibilidad de un tutor en una fecha concreta
export async function getDisponibilidad(idTutor, fecha) {
  const data = await apiRequest(
    `/estudiante/tutores/${idTutor}/disponibilidad?fecha=${fecha}`,
    { headers: authHeaders() }
  );
  return data; // { ok, atiende, fecha, slots, mensaje? }
}

// Historial de sesiones atendidas por el tutor autenticado
export async function getHistorialSesiones() {
  const data = await apiRequest("/tutor/historial", { headers: authHeaders() });
  return data.sesiones;
}

// Estadísticas del dashboard del tutor autenticado
export async function getTutorDashboardStats() {
  const data = await apiRequest("/tutor/dashboard", { headers: authHeaders() });
  return data.stats;
}

// Perfil del tutor autenticado
export async function getPerfilTutor() {
  const data = await apiRequest("/tutor/perfil", { headers: authHeaders() });
  return data.perfil;
}

export async function updatePerfilTutor(perfil) {
  return apiRequest("/tutor/perfil", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(perfil),
  });
}

// ==========================================
// ADMIN - APROBAR TUTORES
// ==========================================

export async function getTutoresPendientes() {
  const data = await apiRequest("/admin/tutores-pendientes", {
    headers: authHeaders(),
  });

  return data.tutores;
}

export async function aprobarTutor(id_usuario) {
  return apiRequest(`/admin/tutores/${id_usuario}/aprobar`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

export async function rechazarTutor(id_usuario) {
  return apiRequest(`/admin/tutores/${id_usuario}/rechazar`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}


export async function getActiveTutors() {
  const data = await apiRequest("/admin/tutores", {
    headers: authHeaders(),
  });

  return data;
}

export async function deactivateTutor(id_usuario) {
  return apiRequest(`/admin/tutores/${id_usuario}/baja`, {
    method: "PATCH",
    headers: authHeaders(),
  });
}

// ==========================================
// HU-037 y HU-038 — Calificar / Reportar estudiante
// ==========================================

export async function getTiposReporte() {
  const data = await apiRequest("/tipos-reporte", { headers: authHeaders() });
  return data.tipos;
}

export async function calificarEstudiante(idSesion, { estrellas, comentario }) {
  return apiRequest(`/tutor/sesiones/${idSesion}/calificar`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ estrellas, comentario }),
  });
}

export async function reportarEstudiante(idSesion, { id_tipo_reporte, explicacion }) {
  return apiRequest(`/tutor/sesiones/${idSesion}/reportar`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ id_tipo_reporte, explicacion }),
  });
}

