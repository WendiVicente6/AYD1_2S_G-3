import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

const titles = {
  "/dashboard": "Dashboard",
  "/students": "Estudiantes",
  "/tutors": "Tutores",
  "/sessions": "Sesiones",
  "/reports": "Reportes",
};

export default function Topbar() {
  const location = useLocation();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" aria-label="Abrir menú">
          <Menu size={21} />
        </button>
        <div>
          <h1>{titles[location.pathname] || "EduConnec"}</h1>
          <p>Bienvenido de vuelta, Administrador 👋</p>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="notification" aria-label="Notificaciones">
          <Bell size={21} />
          <span>3</span>
        </button>
        <div className="topbar-user">
          <div className="avatar avatar-purple">AD</div>
          <div>
            <strong>Administrador</strong>
            <span>Administrador</span>
          </div>
        </div>
      </div>
    </header>
  );
}
