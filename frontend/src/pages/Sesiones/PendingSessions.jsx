import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { getPendingSessions, attendSession } from "../../services/sessionsService";

function formatFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function PendingSessions() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensajeGlobal, setMensajeGlobal] = useState("");

  // Estado del modal de "Atender"
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  const [resumen, setResumen] = useState("");
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarSesiones() {
    try {
      const data = await getPendingSessions();
      setSesiones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarSesiones();
  }, []);

  function abrirModal(sesion) {
    setSesionSeleccionada(sesion);
    setResumen("");
    setErrorModal("");
  }

  function cerrarModal() {
    setSesionSeleccionada(null);
    setResumen("");
    setErrorModal("");
  }

  async function confirmarAtencion(e) {
    e.preventDefault();
    setErrorModal("");

    if (!resumen.trim()) {
      setErrorModal("El resumen de la sesión es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const result = await attendSession(sesionSeleccionada.id_sesion, resumen.trim());
      setMensajeGlobal(result.message);
      cerrarModal();
      // Quitar la sesión atendida de la lista sin tener que re-consultar todo
      setSesiones((prev) => prev.filter((s) => s.id_sesion !== sesionSeleccionada.id_sesion));
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return <section className="page-container"><p>Cargando sesiones...</p></section>;
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Sesiones pendientes</h2>
          <p>Sesiones que aún no has atendido, ordenadas por fecha más próxima.</p>
        </div>
      </div>

      {mensajeGlobal && <div className="alert success">{mensajeGlobal}</div>}
      {error && <div className="alert error">{error}</div>}

      {!error && sesiones.length === 0 && (
        <article className="empty-page">
          <div className="empty-icon"><Inbox size={28} /></div>
          <h2>No tienes sesiones pendientes</h2>
          <p>Cuando un estudiante programe una sesión contigo, aparecerá aquí.</p>
        </article>
      )}

      {sesiones.length > 0 && (
        <article className="panel">
          <div className="sessions-list">
            {sesiones.map((s) => (
              <div key={s.id_sesion} className="session-row">
                <div className="session-date">{formatFecha(s.fecha)}</div>
                <div>
                  <strong>{s.estudiante}</strong>
                  <span>{s.materia} — {s.motivo || "Sin motivo especificado"}</span>
                </div>
                <time>{s.hora_inicio} - {s.hora_final}</time>
                <button className="text-button" onClick={() => abrirModal(s)}>
                  Atender
                </button>
              </div>
            ))}
          </div>
        </article>
      )}

      {sesionSeleccionada && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
            display: "grid", placeItems: "center", zIndex: 50,
          }}
        >
          <div className="registration-card" style={{ width: "min(480px, 90vw)" }}>
            <h2 style={{ marginTop: 0 }}>Atender sesión</h2>
            <p>
              <strong>{sesionSeleccionada.estudiante}</strong> — {sesionSeleccionada.materia}
              <br />
              {formatFecha(sesionSeleccionada.fecha)} · {sesionSeleccionada.hora_inicio} - {sesionSeleccionada.hora_final}
            </p>

            {errorModal && <div className="alert error">{errorModal}</div>}

            <form onSubmit={confirmarAtencion} className="registration-form" style={{ gridTemplateColumns: "1fr" }}>
              <label>
                Resumen de la sesión
                <textarea
                  rows={4}
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  placeholder="Temas cubiertos, recomendaciones, próximos pasos..."
                  style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
                  required
                />
              </label>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={cerrarModal} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Confirmar atención"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}