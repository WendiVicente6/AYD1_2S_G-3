import { useEffect, useState } from "react";
import {
  CalendarDays,
  GraduationCap,
  UserRound,
  MessageCircle,
} from "lucide-react";

import StatCard from "../../components/StatCard/StatCard";
import { getDashboard } from "../../services/dashboardService";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const data = await getDashboard();

        //console.log("Datos del dashboard:", data);

        setDashboard(data);
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
        setError("No fue posible cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  if (loading) {
    return <p>Cargando dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!dashboard) {
    return <p>No hay información disponible.</p>;
  }

  const { stats, sessions } = dashboard;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Resumen general</h2>
          <p>Consulta rápida del estado de EduConnect.</p>
        </div>

        <span className="date-chip">
          {new Date().toLocaleDateString("es-GT", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="stats-grid">
        <StatCard
          icon={<GraduationCap />}
          label="Estudiantes"
          value={stats.estudiantes}
          detail="Total activos"
        />

        <StatCard
          icon={<UserRound />}
          label="Tutores"
          value={stats.tutores}
          detail="Total activos"
        />

        <StatCard
          icon={<CalendarDays />}
          label="Sesiones"
          value={stats.sesiones}
          detail="Este mes"
        />

        <StatCard
          icon={<MessageCircle />}
          label="Mensajes"
          value={stats.mensajes}
          detail="Actualmente"
        />
      </div>

      {/* APROBACIONES */}
      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Aprobaciones pendientes</h3>
              <p>Usuarios esperando revisión.</p>
            </div>
          </div>

          <div className="approval-list">

            {/* ESTUDIANTES */}
            <div className="approval-row">
              <div className="mini-avatar student">
                E
              </div>

              <div>
                <strong>Estudiantes</strong>
                <span>Solicitudes pendientes</span>
              </div>

              <b>{stats.estudiantes_pendientes}</b>

              <span className="status pending">
                Pendientes
              </span>
            </div>

            {/* TUTORES */}
            <div className="approval-row">
              <div className="mini-avatar tutor">
                T
              </div>

              <div>
                <strong>Tutores</strong>
                <span>Solicitudes pendientes</span>
              </div>

              <b>{stats.tutores_pendientes}</b>

              <span className="status pending">
                Pendientes
              </span>
            </div>

          </div>
        </article>

        {/* PRÓXIMAS SESIONES */}
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Próximas sesiones</h3>
              <p>Sesiones programadas en EduConnect.</p>
            </div>
          </div>

          <div className="approval-list">

            {sessions.length === 0 ? (
              <p>No hay próximas sesiones.</p>
            ) : (
              sessions.map((session) => (
                <div
                  className="approval-row"
                  key={session.id_sesion}
                >
                  <div className="mini-avatar">
                    {new Date(session.fec_sesion).getDate()}
                  </div>

                  <div>
                    <strong>{session.materia}</strong>
                    <span>{session.tutor}</span>
                  </div>

                  <b>
                    {session.hora_inicio?.slice(0, 5)}
                  </b>

                  <span className="status">
                    {new Date(
                      session.fec_sesion
                    ).toLocaleDateString("es-GT", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              ))
            )}

          </div>
        </article>
      </div>
    </section>
  );
}





/*import { CalendarDays, GraduationCap, UserRound, MessageCircle } from "lucide-react";
import StatCard from "../../components/StatCard/StatCard";

const sessions = [
  { date: "24 MAY", subject: "Matemáticas Básicas", tutor: "Ana López", time: "10:00 AM" },
  { date: "25 MAY", subject: "Física I", tutor: "Carlos Méndez", time: "02:00 PM" },
  { date: "26 MAY", subject: "Programación I", tutor: "Miguel Torres", time: "04:00 PM" },
];

export default function Dashboard() {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Resumen general</h2>
          <p>Consulta rápida del estado de EduConnect.</p>
        </div>
        <span className="date-chip">Agosto 2026</span>
      </div>

      <div className="stats-grid">
        <StatCard icon={<GraduationCap />} label="Estudiantes" value="126" detail="Total registrados"  />
        <StatCard icon={<UserRound />} label="Tutores" value="38" detail="Total registrados"  />
        <StatCard icon={<CalendarDays />} label="Sesiones" value="56" detail="Este mes"  />
        <StatCard icon={<MessageCircle />} label="Mensajes" value="243" detail="Este mes" />
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div><h3>Aprobaciones pendientes</h3><p>Usuarios esperando revisión.</p></div>
            <button className="text-button">Ver todos</button>
          </div>
          <div className="approval-list">
            <div className="approval-row">
              <div className="mini-avatar student">E</div>
              <div><strong>Estudiantes</strong><span>Solicitudes pendientes</span></div>
              <b>14</b><span className="status pending">Pendientes</span>
            </div>
            <div className="approval-row">
              <div className="mini-avatar tutor">T</div>
              <div><strong>Tutores</strong><span>Solicitudes pendientes</span></div>
              <b>6</b><span className="status pending">Pendientes</span>
            </div>
          </div>
        </article>
      </div>

    </section>
  );
}
*/