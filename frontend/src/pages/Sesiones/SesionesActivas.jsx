import { useState, useEffect } from "react";
import { getSesionesActivas, cancelarSesion } from "../../services/sessionsService";

export default function SesionesActivas() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [sesionAConfirmar, setSesionAConfirmar] = useState(null);

  useEffect(() => {
    getSesionesActivas()
      .then(setSesiones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function confirmarCancelacion() {
    const sesion = sesionAConfirmar;
    setSesionAConfirmar(null);

    setError("");
    setCancelandoId(sesion.id_sesion);
    try {
      await cancelarSesion(sesion.id_sesion);
      // Se quita de la lista de activas sin recargar toda la página
      setSesiones((prev) => prev.filter((s) => s.id_sesion !== sesion.id_sesion));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelandoId(null);
    }
  }

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
                <th style={{ padding: "8px" }}></th>
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
                  <td style={{ padding: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setSesionAConfirmar(s)}
                      disabled={cancelandoId === s.id_sesion}
                      style={{
                        border: "1px solid #d33",
                        background: "transparent",
                        color: "#d33",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {cancelandoId === s.id_sesion ? "Cancelando..." : "Cancelar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sesionAConfirmar && (
        <div className="modal-overlay" onClick={() => setSesionAConfirmar(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Cancelar sesión</h3>
            </div>

            <p className="muted-text">
              ¿Seguro que quieres cancelar la sesión de{" "}
              <strong>{sesionAConfirmar.materia}</strong> con{" "}
              <strong>{sesionAConfirmar.tutor_nombres} {sesionAConfirmar.tutor_apellidos}</strong>{" "}
              el {sesionAConfirmar.fec_sesion}?
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setSesionAConfirmar(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "transparent",
                  fontWeight: 600,
                }}
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "0",
                  background: "#d33",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
