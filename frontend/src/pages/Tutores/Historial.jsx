import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { getHistorialSesiones } from "../../services/tutorsService";

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

export default function Historial() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <p>Consulta las sesiones que ya has atendido.</p>
        </div>
      </div>

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}
