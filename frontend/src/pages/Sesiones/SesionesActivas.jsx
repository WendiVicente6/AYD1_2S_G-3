import { useState, useEffect } from "react";
import { getSesionesActivas } from "../../services/sessionsService";

export default function SesionesActivas() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSesionesActivas()
      .then(setSesiones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Mis sesiones</h2>
          <p>Sesiones de tutoría pendientes o confirmadas.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : sesiones.length === 0 ? (
        <article className="empty-page">
          <h2>No tienes sesiones activas</h2>
          <p>Cuando programes una sesión, aparecerá aquí.</p>
        </article>
      ) : (
        <div className="registration-card">
          <table className="tabla-sesiones" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Materia</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Tutor</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Fecha</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Hora</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id_sesion}>
                  <td style={{ padding: "8px" }}>{s.materia}</td>
                  <td style={{ padding: "8px" }}>{s.tutor_nombres} {s.tutor_apellidos}</td>
                  <td style={{ padding: "8px" }}>{s.fec_sesion}</td>
                  <td style={{ padding: "8px" }}>{s.hora_inicio} - {s.hora_final}</td>
                  <td style={{ padding: "8px" }}>{s.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}