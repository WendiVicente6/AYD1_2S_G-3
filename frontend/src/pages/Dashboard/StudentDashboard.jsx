import { useAuth } from "../context/AuthContext";
import TutoresDisponibles from "../Tutores/TutoresDisponibles";

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

      <TutoresDisponibles />
    </section>
  );
}