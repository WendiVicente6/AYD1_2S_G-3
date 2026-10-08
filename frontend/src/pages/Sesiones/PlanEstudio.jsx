import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlanEstudio } from "../../services/sessionsService";

const ETIQUETA_TIPO = {
  Texto: { label: "Texto", color: "#374151", bg: "#f3f4f6" },
  Video: { label: "Video", color: "#7c2d12", bg: "#ffedd5" },
  PDF: { label: "PDF", color: "#991b1b", bg: "#fee2e2" },
  Enlace: { label: "Enlace", color: "#1e40af", bg: "#dbeafe" },
};

function formatearFecha(fecha) {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function PlanEstudio() {
  const { idSesion } = useParams();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlanEstudio(idSesion)
      .then(setPlan)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [idSesion]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <Link to="/student/historial" style={{ display: "inline-block", marginBottom: "8px" }}>
            ← Volver al historial
          </Link>
          <h2>Plan de estudio</h2>
          <p>Detalle del plan definido por tu tutor para esta sesión.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : !plan ? (
        <article className="empty-page">
          <h2>Aún no tienes un plan de estudio</h2>
          <p>Tu tutor todavía no ha registrado un plan para esta sesión.</p>
        </article>
      ) : (
        <div className="registration-card">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
                Fecha de la última sesión
              </p>
              <p style={{ margin: 0 }}>{formatearFecha(plan.fecha_ultima_sesion)}</p>
            </div>

            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
                Tutor
              </p>
              <p style={{ margin: 0 }}>{plan.tutor_nombre}</p>
            </div>

            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
                Especialidad del tutor
              </p>
              <p style={{ margin: 0 }}>{plan.tutor_especialidad}</p>
            </div>

            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
                Número de identificación del tutor
              </p>
              <p style={{ margin: 0 }}>{plan.tutor_nro_id}</p>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
              Dificultades identificadas
            </p>
            {plan.dificultades ? (
              <p style={{ margin: 0 }}>{plan.dificultades}</p>
            ) : (
              <p style={{ margin: 0, color: "#9ca3af" }}>El tutor no registró dificultades para esta sesión.</p>
            )}
          </div>

          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#6b7280", marginBottom: "8px" }}>
              Recursos recomendados
            </p>
            {plan.recursos.length === 0 ? (
              <p style={{ margin: 0, color: "#9ca3af" }}>El tutor no registró recursos para esta sesión.</p>
            ) : (
              <ul style={{ listStyle: "disc", paddingLeft: "22px", margin: 0 }}>
                {plan.recursos.map((r) => {
                  const etiqueta = ETIQUETA_TIPO[r.tipo_recurso] || { label: r.tipo_recurso, color: "#374151", bg: "#f3f4f6" };
                  return (
                    <li key={r.id_recurso} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong>{r.nombre_recurso}</strong>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            color: etiqueta.color,
                            backgroundColor: etiqueta.bg,
                          }}
                        >
                          {etiqueta.label}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#4b5563" }}>{r.descripcion_uso}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
