
import { useCallback, useEffect, useState } from "react";
import {
  getReportesTutores,
  rechazarReporte,
  desactivarReportado,
} from "../../services/adminReportsService";
import "./ReportesAdmin.css";

export default function ReportesTutores() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarReportes = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const data = await getReportesTutores();
      setReportes(data.reportes || []);
    } catch (e) {
      setError(e.message || "No fue posible cargar los reportes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  async function gestionar(id, accion) {
    const texto =
      accion === "rechazar"
        ? "¿Deseas rechazar este reporte?"
        : "¿Deseas dar de baja al tutor reportado?";

    if (!window.confirm(texto)) return;

    setMensaje("");
    setError("");

    try {
      if (accion === "rechazar") {
        await rechazarReporte(id);
        setMensaje("Reporte rechazado correctamente.");
      } else {
        await desactivarReportado(id);
        setMensaje("Tutor dado de baja y reporte atendido.");
      }

      await cargarReportes();
    } catch (e) {
      setError(e.message || "No fue posible gestionar el reporte.");
    }
  }

  return (
    <section className="reportes-admin">
      <h1>Reportes de tutores</h1>
      <p>Reportes presentados por estudiantes contra tutores.</p>

      {mensaje && <p className="ra-mensaje">{mensaje}</p>}
      {error && <p className="ra-error">{error}</p>}

      {cargando ? (
        <p>Cargando reportes...</p>
      ) : reportes.length === 0 ? (
        <p>No hay reportes registrados contra tutores.</p>
      ) : (
        <div className="ra-tabla-contenedor">
          <table className="ra-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Explicación</th>
                <th>Tutor reportado</th>
                <th>Estudiante denunciante</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => (
                <tr key={r.id_reporte}>
                  <td>
                    {r.fec_creacion
                      ? new Date(r.fec_creacion).toLocaleString()
                      : "—"}
                  </td>
                  <td>{r.categoria}</td>
                  <td>{r.explicacion}</td>
                  <td>{r.reportado}</td>
                  <td>{r.denunciante}</td>
                  <td>{r.estado_gestion}</td>
                  <td>
                    {r.estado_gestion === "Pendiente" ? (
                      <div className="ra-acciones">
                        <button
                          onClick={() =>
                            gestionar(r.id_reporte, "rechazar")
                          }
                        >
                          Rechazar
                        </button>
                        <button
                          className="ra-baja"
                          onClick={() =>
                            gestionar(r.id_reporte, "desactivar")
                          }
                        >
                          Dar de baja
                        </button>
                      </div>
                    ) : (
                      "Sin acciones"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
