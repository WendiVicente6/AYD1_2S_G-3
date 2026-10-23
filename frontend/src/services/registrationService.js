const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

// Registro de tutores: envía texto y archivos (foto + CV) usando FormData,
// igual que el registro de estudiante.
export async function registerTutor(data) {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === "materias") return;
    if (value !== null && value !== undefined && value !== "") {
      formData.append(key, value);
    }
  });

  (data.materias || []).forEach((idMateria) => {
    formData.append("materias", idMateria);
  });

  const response = await fetch(`${API_URL}/tutors`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "No fue posible registrar al tutor."
    );
  }

  return result;
}
