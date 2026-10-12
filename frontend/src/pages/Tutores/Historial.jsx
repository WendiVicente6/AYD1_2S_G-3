import { useEffect, useState } from "react";
import { History, Star } from "lucide-react";
import {
  getHistorialSesiones,
  getTiposReporte,
  calificarEstudiante,
  reportarEstudiante,
} from "../../services/tutorsService";

function formatFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

const ESTADO_CLASE = {
  Pendiente: "status-badge status-pendiente",
  Confirmada: "status-badge status-confirmada",
  Completada: "status-badge status-completada",
  Cancelada: "status-badge status-cancelada",
};

function EstadoBadge({ estado }) {
  return <span className={ESTADO_CLASE[estado] || "status-badge"}>{estado}</span>;
}

function ModalOverlay({ children, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
        display: "grid", placeItems: "center", zIndex: 50,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="registration-card" style={{ width: "min(480px, 90vw)" }}>
        {children}
      </div>
    </div>
  );
}

function CalificarModal({ sesion, onClose, onSuccess }) {
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    setError("");

    if (estrellas < 0 || estrellas > 5) {
      setError("Selecciona una calificación entre 0 y 5 estrellas.");
      return;
    }

    setGuardando(true);
    try {
      const result = await calificarEstudiante(sesion.id_sesion, { estrellas, comentario: comentario.trim() });
      onSuccess(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Calificar a {sesion.estudiante}</h2>
      <p>{formatFecha(sesion.fecha)} · {sesion.hora}</p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={confirmar} className="registration-form" style={{ gridTemplateColumns: "1fr" }}>
        <label>
          Calificación
          <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEstrellas(n)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                aria-label={`${n} estrellas`}
              >
                <Star
                  size={28}
                  fill={n <= estrellas ? "#f5a623" : "none"}
                  color={n <= estrellas ? "#f5a623" : "#d1d5db"}
                />
              </button>
            ))}
          </div>
        </label>

        <label>
          Comentario (opcional)
          <textarea
            rows={3}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cómo fue la sesión con este estudiante..."
            style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={onClose} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Confirmar calificación"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ReportarModal({ sesion, onClose, onSuccess }) {
  const [tipos, setTipos] = useState([]);
  const [idTipoReporte, setIdTipoReporte] = useState("");
  const [explicacion, setExplicacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargandoTipos, setCargandoTipos] = useState(true);

  useEffect(() => {
    getTiposReporte()
      .then(setTipos)
      .catch((err) => setError(err.message))
      .finally(() => setCargandoTipos(false));
  }, []);

  async function confirmar(e) {
    e.preventDefault();
    setError("");

    if (!idTipoReporte) {
      setError("Selecciona una categoría de reporte.");
      return;
    }
    if (!explicacion.trim()) {
      setError("La explicación del reporte es obligatoria.");
      return;
    }

    setGuardando(true);
    try {
      const result = await reportarEstudiante(sesion.id_sesion, {
        id_tipo_reporte: Number(idTipoReporte),
        explicacion: explicacion.trim(),
      });
      onSuccess(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Reportar a {sesion.estudiante}</h2>
      <p>{formatFecha(sesion.fecha)} · {sesion.hora}</p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={confirmar} className="registration-form" style={{ gridTemplateColumns: "1fr" }}>
        <label>
          Categoría del reporte
          <select
            value={idTipoReporte}
            onChange={(e) => setIdTipoReporte(e.target.value)}
            disabled={cargandoTipos}
            required
          >
            <option value="">Selecciona una categoría</option>
            {tipos.map((t) => (
              <option key={t.id_tipo_reporte} value={t.id_tipo_reporte}>{t.txt_desc}</option>
            ))}
          </select>
        </label>

        <label>
          Explicación
          <textarea
            rows={4}
            value={explicacion}
            onChange={(e) => setExplicacion(e.target.value)}
            placeholder="Describe lo ocurrido con el mayor detalle posible..."
            style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
            required
          />
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={onClose} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando}>
            {guardando ? "Enviando..." : "Confirmar reporte"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

export default function Historial() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensajeGlobal, setMensajeGlobal] = useState("");

  const [modalCalificar, setModalCalificar] = useState(null); // sesión seleccionada o null
  const [modalReportar, setModalReportar] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  function cargar() {
    setLoading(true);
    getHistorialSesiones()
      .then(setSesiones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function manejarExito(mensaje) {
    setMensajeGlobal(mensaje);
    setModalCalificar(null);
    setModalReportar(null);
    cargar(); // refresca para que no se pueda volver a calificar la misma sesión
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Historial de sesiones</h2>
          <p>Consulta las sesiones que ya has atendido.</p>
        </div>
      </div>

      {mensajeGlobal && <div className="alert success">{mensajeGlobal}</div>}
      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : !error && sesiones.length === 0 ? (
        <article className="empty-page">
          <div className="empty-icon"><History size={28} /></div>
          <h2>Aún no tienes sesiones registradas</h2>
          <p>Cuando atiendas una sesión, aparecerá aquí.</p>
        </article>
      ) : sesiones.length > 0 && (
        <article className="panel">
          <div className="historial-table-wrapper">
            <table className="historial-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estudiante</th>
                  <th>Cancelado por</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s) => (
                  <tr key={s.id_sesion}>
                    <td>{formatFecha(s.fecha)}</td>
                    <td>{s.hora}</td>
                    <td>{s.estudiante}</td>
                    <td>{s.cancelado_por || "—"}</td>
                    <td>{s.motivo || "—"}</td>
                    <td><EstadoBadge estado={s.estado} /></td>
                    <td>
                      {s.estado === "Completada" ? (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {s.ya_calificada ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "13px", color: "#6b7280" }}>
                              <Star size={14} fill="#f5a623" color="#f5a623" />
                              {s.calificacion_estrellas}
                            </span>
                          ) : (
                            <button className="text-button" onClick={() => setModalCalificar(s)}>
                              Calificar
                            </button>
                          )}
                          <button className="text-button" onClick={() => setModalReportar(s)}>
                            Reportar
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {modalCalificar && (
        <CalificarModal
          sesion={modalCalificar}
          onClose={() => setModalCalificar(null)}
          onSuccess={manejarExito}
        />
      )}

      {modalReportar && (
        <ReportarModal
          sesion={modalReportar}
          onClose={() => setModalReportar(null)}
          onSuccess={manejarExito}
        />
      )}
    </section>
  );
}