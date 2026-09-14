import { CalendarClock, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.nombres?.split(" ")[0] || "";

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Hola{firstName ? `, ${firstName}` : ""} 👋</h2>
          <p>Este es tu resumen como estudiante en EduConnect.</p>
        </div>
      </div>

      <article className="empty-page">
        <div className="empty-icon"><Search size={28} /></div>
        <h2>Aún no hay tutores para mostrar</h2>
        <p>Cuando esté lista la búsqueda de tutores, aquí verás tus opciones disponibles.</p>
        <span>
          <CalendarClock size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          También podrás ver tus próximas sesiones desde este panel.
        </span>
      </article>
    </section>
  );
}