
import { apiRequest } from "./api";

export async function getReportesTutores() {
  return apiRequest("/admin/reportes-tutores");
}

export async function getReportesEstudiantes() {
  return apiRequest("/admin/reportes-estudiantes");
}

export async function rechazarReporte(idReporte) {
  return apiRequest(`/admin/reportes/${idReporte}/rechazar`, {
    method: "PATCH",
  });
}

export async function desactivarReportado(idReporte) {
  return apiRequest(
    `/admin/reportes/${idReporte}/desactivar-reportado`,
    {
      method: "PATCH",
    }
  );
}
