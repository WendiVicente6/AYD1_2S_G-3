import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import {
  getHistorialSesiones,
  calificarTutor,
  getTiposReporteTutor,
  reportarTutor,
} from "../../services/sessionsService";

const ESTADO_CLASE = {
  "Atendida": "success",
  "Cancelada por el estudiante": "warning",
  "Cancelada por el tutor": "error",
};

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

// HU-034: calificar la atención del tutor (0 a 5 estrellas + comentario opcional)
function CalificarTutorModal({ sesion, onClose, onSuccess }) {
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
      const result = await calificarTutor(sesion.id_sesion, { estrellas, comentario: comentario.trim() });
      onSuccess(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>Calificar a {sesion.tutor}</h2>
      <p>{sesion.fecha} · {sesion.materia}</p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={confirmar} className="registration-form" style={{ gridTemplateColumns: "1fr" }}>
        <label>
          Calificación ({estrellas} de 5)
          <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                // Volver a tocar la misma estrella la quita, para poder dejar 0 estrellas
                onClick={() => setEstrellas(estrellas === n ? n - 1 : n)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                aria-label={`${n} estrellas`}
                data-testid={`estrella-${n}`}
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
            maxLength={300}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Cómo fue la atención del tutor?"
            data-testid="comentario-calificacion"
            style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={onClose} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} data-testid="confirmar-calificacion">
            {guardando ? "Guardando..." : "Confirmar calificación"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// HU-035: reportar al tutor (categoría predefinida + explicación obligatoria)
function ReportarTutorModal({ sesion, onClose, onSuccess }) {
  const [tipos, setTipos] = useState([]);
  const [idTipoReporte, setIdTipoReporte] = useState("");
  const [explicacion, setExplicacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargandoTipos, setCargandoTipos] = useState(true);

  useEffect(() => {
    getTiposReporteTutor()
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
      const result = await reportarTutor(sesion.id_sesion, {
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
      <h2 style={{ marginTop: 0 }}>Reportar a {sesion.tutor}</h2>
      <p>{sesion.fecha} · {sesion.materia}</p>
      <p style={{ fontSize: "13px", color: "#6b7280" }}>
        El reporte se enviará al administrador, quien decidirá qué acción tomar.
      </p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={confirmar} className="registration-form" style={{ gridTemplateColumns: "1fr" }}>
        <label>
          Categoría del reporte
          <select
            value={idTipoReporte}
            onChange={(e) => setIdTipoReporte(e.target.value)}
            disabled={cargandoTipos}
            required
            data-testid="categoria-reporte"
          >
            <option value="">{cargandoTipos ? "Cargando..." : "Selecciona una categoría"}</option>
            {tipos.map((t) => (
              <option key={t.id_tipo_reporte} value={t.id_tipo_reporte}>{t.txt_desc}</option>
            ))}
          </select>
        </label>

        <label>
          Explicación
          <textarea
            rows={4}
            maxLength={500}
            value={explicacion}
            onChange={(e) => setExplicacion(e.target.value)}
            placeholder="Describe lo ocurrido con el mayor detalle posible..."
            style={{ padding: "11px", border: "1px solid #d1d5db", borderRadius: "8px", font: "inherit", resize: "vertical" }}
            required
            data-testid="explicacion-reporte"
          />
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={onClose} disabled={guardando} style={{ background: "#e5e7eb", color: "#111827" }}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} data-testid="confirmar-reporte">
            {guardando ? "Enviando..." : "Confirmar reporte"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

export default function HistorialSesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mensajeGlobal, setMensajeGlobal] = useState("");
  const [modalCalificar, setModalCalificar] = useState(null); // sesión seleccionada o null
  const [modalReportar, setModalReportar] = useState(null);

  function pedirHistorial() {
    return getHistorialSesiones()
      .then(setSesiones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // Carga inicial (loading ya empieza en true)
  useEffect(() => {
    pedirHistorial();
  }, []);

  // Recarga después de calificar o reportar
  function cargar() {
    setLoading(true);
    pedirHistorial();
  }

  function manejarExito(mensaje) {
    setMensajeGlobal(mensaje);
    setModalCalificar(null);
    setModalReportar(null);
    cargar(); // refresca para que no se pueda volver a calificar/reportar la misma sesión
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Historial de sesiones</h2>
          <p>Sesiones atendidas o canceladas.</p>
        </div>
      </div>

      {mensajeGlobal && <div className="alert success" data-testid="mensaje-exito">{mensajeGlobal}</div>}
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
                <th style={{ textAlign: "left", padding: "8px" }}>Plan de estudio</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Acciones</th>
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
                  <td style={{ padding: "8px" }}>
                    <Link to={`/student/plan-estudio/${s.id_sesion}`} data-testid="ver-plan">Ver plan</Link>
                  </td>
                  <td style={{ padding: "8px" }}>
                    {s.estado !== "Atendida" ? (
                      "—"
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {s.ya_calificada ? (
                          <span
                            style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "13px", color: "#6b7280" }}
                            data-testid="calificacion-estrellas"
                          >
                            <Star size={14} fill="#f5a623" color="#f5a623" />
                            {s.calificacion_estrellas}
                          </span>
                        ) : (
                          <button className="text-button" onClick={() => setModalCalificar(s)} data-testid="calificar-tutor">
                            Calificar
                          </button>
                        )}
                        {s.ya_reportada ? (
                          <span style={{ fontSize: "13px", color: "#6b7280" }} data-testid="reportado">Reportado</span>
                        ) : (
                          <button className="text-button" onClick={() => setModalReportar(s)} data-testid="reportar-tutor">
                            Reportar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCalificar && (
        <CalificarTutorModal
          sesion={modalCalificar}
          onClose={() => setModalCalificar(null)}
          onSuccess={manejarExito}
        />
      )}

      {modalReportar && (
        <ReportarTutorModal
          sesion={modalReportar}
          onClose={() => setModalReportar(null)}
          onSuccess={manejarExito}
        />
      )}
    </section>
  );
}
