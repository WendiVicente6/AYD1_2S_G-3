import { apiRequest } from "./api";

export async function getReporteTutores() {
  return await apiRequest("/admin/reportes/tutores");
}

export async function getReporteMaterias() {
  return await apiRequest("/admin/reportes/materias");
}

// Fase 2: Top 10 tutores con más sesiones completadas
export async function getReporteTopTutoresSesiones() {
  return await apiRequest("/admin/reportes/top-tutores-sesiones");
}

// Fase 2: Evolución semanal de sesiones por estado
export async function getReporteEvolucionSesiones() {
  return await apiRequest("/admin/reportes/evolucion-sesiones");
}


 // Fase 2: Materias con mayor tasa de cancelación
export async function getReporteCancelacionesMaterias() {
  return await apiRequest("/admin/reportes/cancelaciones-materias");
}

// Fase 2: Horarios más demandados
export async function getReporteHorariosDemandados() {
  return await apiRequest("/admin/reportes/horarios-demandados");
}

// Fase 2: Estudiantes con más sesiones programadas
export async function getReporteEstudiantesSesiones() {
  return await apiRequest("/admin/reportes/estudiantes-sesiones");
}

// Fase 2: Sesiones completadas frente a canceladas por materia
export async function getReporteAsistenciaCancelacionMaterias() {
  return await apiRequest(
    "/admin/reportes/asistencia-cancelacion-materias"
  );
}
