import { apiRequest } from "./api";

export async function getReporteTutores() {
  return await apiRequest("/admin/reportes/tutores");
}

export async function getReporteMaterias() {
  return await apiRequest("/admin/reportes/materias");
}
