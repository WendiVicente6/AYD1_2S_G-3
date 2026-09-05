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

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Ocurrió un error al guardar el horario.");
  }
  return result;
}