import { useEffect, useState } from "react";
import { CalendarClock, Search, BookOpen, History } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTutoresDisponibles } from "../../services/tutorsService";
import { getSesionesActivas } from "../../services/sessionsService";
import StatCard from "../../components/StatCard/StatCard";

export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.nombres?.split(" ")[0] || "";
  const [tutores, setTutores] = useState(null);
  const [sesiones, setSesiones] = useState(null);

  useEffect(() => {
    getTutoresDisponibles().then(setTutores).catch(() => setTutores([]));
    getSesionesActivas().then(setSesiones).catch(() => setSesiones([]));
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Hola{firstName ? `, ${firstName}` : ""} 👋</h2>
          <p>Este es tu resumen como estudiante en EduConnect.</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<Search />} label="Tutores disponibles" value={tutores === null ? "—" : tutores.length} detail="Disponibles para apoyar tus estudios" />
        <StatCard icon={<CalendarClock />} label="Mis sesiones activas" value={sesiones === null ? "—" : sesiones.length} detail="Pendientes y confirmadas" />
        <StatCard icon={<BookOpen />} label="Programar tutoría" value={<Link to="/student/programar-sesion" className="text-button">Programar</Link>} detail="Selecciona materia y tutor" />
        <StatCard icon={<History />} label="Mi historial" value={<Link to="/student/historial" className="text-button">Ver historial</Link>} detail="Consulta tus planes de estudio" />
      </div>
      <article className="panel" style={{ marginTop: 20 }}>
        <h3>Comienza tu próxima tutoría</h3>
        <p>Revisa los docentes disponibles, selecciona una materia y programa una sesión de estudio.</p>
        <Link to="/student/tutores" className="text-button">Ver tutores disponibles →</Link>
      </article>
    </section>
  );
}
