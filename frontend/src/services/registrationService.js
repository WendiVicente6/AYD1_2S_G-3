const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function post(path, data) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Ocurrió un error al procesar la solicitud."
    );
  }

  return result;
}

// Registro de estudiante: envía texto y archivos usando FormData.
export async function registerStudent(data) {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });

  const response = await fetch(`${API_URL}/students`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "No fue posible registrar al estudiante."
    );
  }

  return result;
}

// El registro de tutores sigue usando JSON.
export const registerTutor = (data) => post("/tutors", data);
