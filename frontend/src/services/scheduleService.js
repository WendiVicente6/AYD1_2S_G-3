import { getToken } from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function setSchedule({ dias, hora_inicio, hora_fin }) {
  const response = await fetch(`${API_URL}/tutors/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ dias, hora_inicio, hora_fin }),
  });
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getSchedule() {
  const response = await fetch(`${API_URL}/tutors/schedule`, {
    headers: authHeaders(),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "No fue posible consultar el horario.");
  }
  return result.horario; // null si no tiene horario todavía
}

export async function createSchedule(payload) {
  const response = await fetch(`${API_URL}/tutors/schedule`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Ocurrió un error al guardar el horario.");
  }
  return result;
}

export async function updateSchedule(payload) {
  const response = await fetch(`${API_URL}/tutors/schedule`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Ocurrió un error al actualizar el horario.");
  }
  return result;
}