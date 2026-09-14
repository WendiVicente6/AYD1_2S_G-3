const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function post(path, data) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Ocurrió un error al procesar la solicitud.");
  }

  return result;
}

export const registerStudent = (data) => post("/students", data);
export const registerTutor = (data) => post("/tutors", data);
