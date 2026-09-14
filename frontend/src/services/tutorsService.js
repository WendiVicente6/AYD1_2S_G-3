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
