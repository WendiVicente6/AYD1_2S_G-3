import { apiRequest } from "./api";

export async function getPendingStudents() {
  return await apiRequest("/admin/estudiantes-pendientes");
}

export async function approveStudent(id_usuario) {
  return await apiRequest(`/admin/estudiantes/${id_usuario}/aprobar`, {
    method: "PATCH",
  });
}

export async function rejectStudent(id_usuario) { 
  return await apiRequest(`/admin/estudiantes/${id_usuario}/rechazar`, {
     method: "PATCH",
   }); 
}

export async function getActiveStudents() { 
  return await apiRequest("/admin/estudiantes"); }
  
export async function deactivateStudent(id_usuario) { 
  return await apiRequest(`/admin/estudiantes/${id_usuario}/baja`, { method: "PATCH", }); 

}

export async function getStudentCarnetPdf(id_usuario) {
  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const response = await fetch(
    `${API_URL}/admin/estudiantes/${id_usuario}/carnet-pdf`
  );

  if (!response.ok) {
    let message = "No fue posible cargar el carnet PDF.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // La respuesta puede no contener JSON.
    }

    throw new Error(message);
  }

  return await response.blob();
}