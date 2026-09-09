import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { getPendingSessions } from "../../services/sessionsService";

function formatFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function PendingSessions() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const data = await getPendingSessions();
        setSesiones(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

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
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}