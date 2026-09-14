import { useState, useEffect } from "react";
import { getHistorialSesiones } from "../../services/sessionsService";

const ESTADO_CLASE = {
  "Atendida": "success",
  "Cancelada por el estudiante": "warning",
  "Cancelada por el tutor": "error",
};

export default function HistorialSesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistorialSesiones()
      .then(setSesiones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Historial de sesiones</h2>
          <p>Sesiones atendidas o canceladas.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : sesiones.length === 0 ? (
        <article className="empty-page">
          <h2>Aún no tienes historial</h2>
          <p>Cuando una sesión sea atendida o cancelada, aparecerá aquí.</p>
        </article>
      ) : (
        <div className="registration-card">
          <table className="tabla-sesiones" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Fecha</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Tutor</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Materia</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Dirección</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Motivo</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Resumen</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id_sesion}>
                  <td style={{ padding: "8px" }}>{s.fecha}</td>
                  <td style={{ padding: "8px" }}>{s.tutor}</td>
                  <td style={{ padding: "8px" }}>{s.materia}</td>
                  <td style={{ padding: "8px" }}>{s.direccion}</td>
                  <td style={{ padding: "8px" }}>{s.motivo}</td>
                  <td style={{ padding: "8px" }}>{s.resumen || "—"}</td>
                  <td style={{ padding: "8px" }}>
                    <span className={`status ${ESTADO_CLASE[s.estado] || ""}`}>
                      {s.estado}
                    </span>
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