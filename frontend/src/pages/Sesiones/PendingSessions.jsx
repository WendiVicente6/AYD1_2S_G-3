import { useEffect, useState } from "react";
import { Inbox, Plus, Trash2 } from "lucide-react";
import {
  getPendingSessions,
  attendSession,
  confirmSession,
  cancelSession,
} from "../../services/sessionsService";

const TIPOS_RECURSO = ["Texto", "Video", "PDF", "Ejercicio"];

function formatFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

function recursoVacio() {
  return { nombre: "", tipo: "Texto", descripcion: "" };
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
  display: "grid", placeItems: "center", zIndex: 50,
};

export default function PendingSessions() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensajeGlobal, setMensajeGlobal] = useState("");

  // Modal de acciones: sesión seleccionada + qué vista mostrar dentro del modal
  const [accionesSesion, setAccionesSesion] = useState(null);
  const [vista, setVista] = useState("menu"); // "menu" | "atender" | "cancelar"

  const [dificultades, setDificultades] = useState("");
  const [recursos, setRecursos] = useState([]);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
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

  function abrirAcciones(sesion) {
    setAccionesSesion(sesion);
    setVista("menu");
    setDificultades("");
    setRecursos([]);
    setMotivoCancelacion("");
    setErrorModal("");
  }

  function cerrarModal() {
    setAccionesSesion(null);
    setVista("menu");
    setDificultades("");
    setRecursos([]);
    setMotivoCancelacion("");
    setErrorModal("");
  }

  function agregarRecurso() {
    setRecursos((prev) => [...prev, recursoVacio()]);
  }

  function actualizarRecurso(index, campo, valor) {
    setRecursos((prev) => prev.map((r, i) => (i === index ? { ...r, [campo]: valor } : r)));
  }

  function quitarRecurso(index) {
    setRecursos((prev) => prev.filter((_, i) => i !== index));
  }

  function actualizarEstado(idSesion, nuevoEstado) {
    setSesiones((prev) =>
      prev.map((s) => (s.id_sesion === idSesion ? { ...s, estado: nuevoEstado } : s))
    );
  }

  function quitarSesion(idSesion) {
    setSesiones((prev) => prev.filter((s) => s.id_sesion !== idSesion));
  }

  async function confirmarSesion() {
    setErrorModal("");
    setGuardando(true);
    try {
      const result = await confirmSession(accionesSesion.id_sesion);
      setMensajeGlobal(result.message);
      actualizarEstado(accionesSesion.id_sesion, "Confirmada");
      cerrarModal();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarAtencion(e) {
    e.preventDefault();
    setErrorModal("");

    if (!dificultades.trim()) {
      setErrorModal("Las dificultades identificadas son obligatorias.");
      return;
    }

    for (const r of recursos) {
      if (!r.nombre.trim() || !r.tipo || !r.descripcion.trim()) {
        setErrorModal("Cada recurso recomendado debe tener nombre, tipo y descripción de uso.");
        return;
      }
    }

    setGuardando(true);
    try {
      const result = await attendSession(accionesSesion.id_sesion, {
        dificultades: dificultades.trim(),
        recursos: recursos.map((r) => ({
          nombre: r.nombre.trim(),
          tipo: r.tipo,
          descripcion: r.descripcion.trim(),
        })),
      });
      setMensajeGlobal(result.message);
      quitarSesion(accionesSesion.id_sesion);
      cerrarModal();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarCancelacion(e) {
    e.preventDefault();
    setErrorModal("");

    if (!motivoCancelacion.trim()) {
      setErrorModal("El motivo de la cancelación es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const result = await cancelSession(accionesSesion.id_sesion, motivoCancelacion.trim());
      setMensajeGlobal(result.message);
      quitarSesion(accionesSesion.id_sesion);
      cerrarModal();
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
                <button className="text-button" onClick={() => abrirAcciones(s)}>
                  Acciones
                </button>
              </div>
            ))}
          </div>
        </article>
      )}

      {accionesSesion && (
        <div role="dialog" aria-modal="true" style={overlayStyle}>
          <div className="registration-card" style={{ width: "min(480px, 90vw)" }}>
            <h2 style={{ marginTop: 0 }}>
              {vista === "menu" && "Acciones de la sesión"}
              {vista === "atender" && "Atender sesión"}
              {vista === "cancelar" && "Cancelar sesión"}
            </h2>
            <p>
              <strong>{accionesSesion.estudiante}</strong> — {accionesSesion.materia}
              <br />
              {formatFecha(accionesSesion.fecha)} · {accionesSesion.hora_inicio} - {accionesSesion.hora_final}
            </p>

            {errorModal && <div className="alert error">{errorModal}</div>}

            {vista === "menu" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {accionesSesion.estado === "Pendiente" && (
                  <button type="button" onClick={confirmarSesion} disabled={guardando}>
                    {guardando ? "Confirmando..." : "Confirmar"}
                  </button>
                )}
                <button type="button" onClick={() => setVista("atender")} disabled={guardando}>
                  Atender
                </button>
                <button
                  type="button"
                  onClick={() => setVista("cancelar")}
                  disabled={guardando}
                  style={{ background: "#fdecec", color: "#c0392b" }}
                >
                  Cancelar sesión
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  style={{ background: "#e5e7eb", color: "#111827" }}
                >
                  Cerrar
                </button>
              </div>
            )}

            {vista === "atender" && (
              <form onSubmit={confirmarAtencion} className="registration-form" style={{ gridTemplateColumns: "1fr", maxHeight: "70vh", overflowY: "auto" }}>
                <label>
                  Dificultades identificadas
                  <textarea
                    rows={3}
                    value={dificultades}
                    onChange={(e) => setDificultades(e.target.value)}
                    placeholder="Temas donde el estudiante presentó dificultad..."
                    style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
                    required
                  />
                </label>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px" }}>Recursos recomendados</strong>
                    <button
                      type="button"
                      onClick={agregarRecurso}
                      disabled={guardando}
                      className="text-button"
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Plus size={14} /> Agregar recurso
                    </button>
                  </div>

                  {recursos.length === 0 && (
                    <p className="muted-text" style={{ margin: 0 }}>
                      Opcional. Puedes agregar uno o más recursos (texto, video, PDF, ejercicio) para guiar al estudiante.
                    </p>
                  )}

                  {recursos.map((recurso, index) => (
                    <div
                      key={index}
                      style={{
                        border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px",
                        marginBottom: "10px", display: "flex", flexDirection: "column", gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          value={recurso.nombre}
                          onChange={(e) => actualizarRecurso(index, "nombre", e.target.value)}
                          placeholder="Nombre del recurso"
                          style={{ flex: 1, padding: "9px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit" }}
                          required
                        />
                        <select
                          value={recurso.tipo}
                          onChange={(e) => actualizarRecurso(index, "tipo", e.target.value)}
                          style={{ padding: "9px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit" }}
                        >
                          {TIPOS_RECURSO.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => quitarRecurso(index)}
                          disabled={guardando}
                          aria-label="Quitar recurso"
                          style={{ background: "transparent", color: "#c0392b", padding: "0 6px" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={recurso.descripcion}
                        onChange={(e) => actualizarRecurso(index, "descripcion", e.target.value)}
                        placeholder="Descripción de uso: cómo debe aprovechar este recurso el estudiante..."
                        style={{ padding: "9px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setVista("menu")} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
                    Atrás
                  </button>
                  <button type="submit" disabled={guardando}>
                    {guardando ? "Guardando..." : "Confirmar atención"}
                  </button>
                </div>
              </form>
            )}

            {vista === "cancelar" && (
              <form onSubmit={confirmarCancelacion} className="registration-form" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  Motivo de la cancelación
                  <textarea
                    rows={4}
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Explica brevemente por qué debes cancelar esta sesión..."
                    style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
                    required
                  />
                </label>
                <p className="muted-text" style={{ margin: 0 }}>
                  Se notificará al estudiante por correo con este motivo.
                </p>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setVista("menu")} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
                    Atrás
                  </button>
                  <button type="submit" disabled={guardando} style={{ background: "#c0392b" }}>
                    {guardando ? "Cancelando..." : "Confirmar cancelación"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
