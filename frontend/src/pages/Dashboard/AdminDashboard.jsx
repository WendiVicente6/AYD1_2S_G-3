import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  GraduationCap,
  UserRound,
  MessageCircle,
} from "lucide-react";

import StatCard from "../../components/StatCard/StatCard";
import { getDashboard } from "../../services/dashboardService";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const data = await getDashboard();

        console.log("Datos del dashboard:", data);

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

  const { stats } = dashboard;

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
          detail="Este mes"
        />
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Aprobaciones pendientes</h3>
              <p>Usuarios esperando revisión.</p>
            </div>

          </div>

          <div className="approval-list">
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
      </div>
    </section>
  );
}
