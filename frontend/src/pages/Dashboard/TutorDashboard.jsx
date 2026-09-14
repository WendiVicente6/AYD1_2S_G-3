import { Link } from "react-router-dom";
import { CalendarClock, Clock, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import StatCard from "../../components/StatCard/StatCard";

export default function TutorDashboard() {
  const { user } = useAuth();
  const firstName = user?.nombres?.split(" ")[0] || "";

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Hola{firstName ? `, ${firstName}` : ""} 👋</h2>
          <p>Este es tu resumen como tutor en EduConnect.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Clock />}
          label="Mi horario"
          value={<Link to="/tutor/schedule" className="text-button">Configurar</Link>}
          detail="Días y horas de atención"
        />
        <StatCard icon={<CalendarClock />} label="Sesiones pendientes" value="—" detail="Próximamente" />
        <StatCard icon={<GraduationCap />} label="Estudiantes atendidos" value="—" detail="Próximamente" />
      </div>

      <div className="dashboard-grid">
        <article className="panel empty-page" style={{ minHeight: "220px" }}>
          <div className="empty-icon"><CalendarClock size={28} /></div>
          <h2>Tus sesiones pendientes aparecerán aquí</h2>
          <p>Esta vista se conectará cuando esté lista la gestión de sesiones del tutor.</p>
        </article>
      </div>
    </section>
  );
}