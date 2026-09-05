import { CalendarDays, GraduationCap, UserRound, MessageCircle } from "lucide-react";
import StatCard from "../../components/StatCard/StatCard";

export default function AdminDashboard() {
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
        <StatCard icon={<GraduationCap />} label="Estudiantes" value="126" detail="Total registrados" />
        <StatCard icon={<UserRound />} label="Tutores" value="38" detail="Total registrados" />
        <StatCard icon={<CalendarDays />} label="Sesiones" value="56" detail="Este mes" />
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