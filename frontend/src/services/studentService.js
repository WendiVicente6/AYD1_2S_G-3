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