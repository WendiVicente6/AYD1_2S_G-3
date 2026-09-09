import { apiRequest } from "./api";
import { getToken } from "./authService";

export async function getMaterias() {
  const data = await apiRequest("/materias");
  return data.materias;
}

export async function getTutoresPorMateria(idMateria) {
  const data = await apiRequest(`/tutores?id_materia=${idMateria}`);
  return data.tutores;
}

export async function getDisponibilidadTutor(idTutor) {
  const data = await apiRequest(`/tutores/${idTutor}/disponibilidad`);
  return data.disponibilidad;
}

export async function crearSesion({ id_tutor, id_materia, fecha, hora_inicio, hora_final, motivo }) {
  const token = getToken();
  return apiRequest("/sesiones", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id_tutor, id_materia, fecha, hora_inicio, hora_final, motivo }),
  });
}

export async function getPendingSessions() {
  const token = getToken();
  const data = await apiRequest("/tutors/sessions/pending", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.sesiones;
}