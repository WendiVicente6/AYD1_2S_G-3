import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../pages/context/AuthContext";

// Mapea rutas reales a un título legible de página.
const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/student/dashboard": "Dashboard",
  "/tutor/dashboard": "Dashboard",
  "/tutor/schedule": "Mi horario",
  "/students": "Estudiantes",
  "/tutors": "Tutores",
  "/sessions": "Sesiones",
  "/reports": "Reportes",
};

const ROLE_LABELS = {
  admin: "Administrador",
  tutor: "Tutor",
  student: "Estudiante",
};

function getInitials(nombres, apellidos) {
  const first = nombres?.trim()?.[0] || "";
  const second = apellidos?.trim()?.[0] || "";
  return (first + second).toUpperCase() || "U";
}

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();

  const roleLabel = ROLE_LABELS[user?.role] || "Usuario";
  const firstName = user?.nombres?.split(" ")[0] || "";
  const displayName = user ? `${user.nombres} ${user.apellidos}`.trim() : "Usuario";
  const initials = getInitials(user?.nombres, user?.apellidos);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" aria-label="Abrir menú">
          <Menu size={21} />
        </button>
        <div>
          <h1>{PAGE_TITLES[location.pathname] || "EduConnect"}</h1>
          <p>Bienvenido de vuelta{firstName ? `, ${firstName}` : ""} 👋</p>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="notification" aria-label="Notificaciones">
          <Bell size={21} />
          <span>3</span>
        </button>
        <div className="topbar-user">
          <div className="avatar avatar-purple">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}