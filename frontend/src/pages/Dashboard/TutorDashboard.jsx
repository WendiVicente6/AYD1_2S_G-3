import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Clock, GraduationCap, History } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import StatCard from "../../components/StatCard/StatCard";
import { getTutorDashboardStats } from "../../services/tutorsService";

export default function TutorDashboard() {
  const { user } = useAuth();
  const firstName = user?.nombres?.split(" ")[0] || "";

  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTutorDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Hola{firstName ? `, ${firstName}` : ""} 👋</h2>
          <p>Este es tu resumen como tutor en EduConnect.</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="stats-grid">
        <StatCard
          icon={<Clock />}
          label="Mi horario"
          value={<Link to="/tutor/schedule" className="text-button">Configurar</Link>}
          detail="Días y horas de atención"
        />
        <StatCard
          icon={<CalendarClock />}
          label="Sesiones pendientes"
          value={stats ? stats.sesiones_pendientes : "—"}
          detail="Por confirmar o atender"
        />
        <StatCard
          icon={<GraduationCap />}
          label="Estudiantes atendidos"
          value={stats ? stats.estudiantes_atendidos : "—"}
          detail="Sesiones completadas"
        />
        <StatCard
          icon={<History />}
          label="Mi historial"
          value={<Link to="/tutor/historial" className="text-button">Ver historial</Link>}
          detail="Sesiones ya atendidas o canceladas"
        />
      </div>
    </section>
  );
}
