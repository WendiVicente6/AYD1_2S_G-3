import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/context/AuthContext";

import {
  BarChart3, CalendarDays, Clock, GraduationCap, LayoutDashboard,
  LogOut, Settings, Users
} from "lucide-react";

// Links disponibles según el rol del usuario autenticado.
const LINKS_BY_ROLE = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/students", label: "Estudiantes", icon: GraduationCap },
    { to: "/tutors", label: "Tutores", icon: Users },
    { to: "/reports", label: "Reportes", icon: BarChart3 },
  ],
  tutor: [
    { to: "/tutor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tutor/schedule", label: "Mi horario", icon: Clock },
    { to: "/sessions", label: "Sesiones", icon: CalendarDays },
  ],
  student: [
    { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
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

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.role;
  const links = LINKS_BY_ROLE[role] || [];
  const roleLabel = ROLE_LABELS[role] || "Usuario";
  const displayName = user ? `${user.nombres} ${user.apellidos}`.trim() : "Usuario";
  const initials = getInitials(user?.nombres, user?.apellidos);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>Edu<span>Connect</span></span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">MENÚ PRINCIPAL</p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}

        <p className="nav-label nav-label-spaced">SISTEMA</p>
        <button className="nav-item nav-button" type="button">
          <Settings size={19} />
          <span>Configuración</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar avatar-purple">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
        <button
          className="logout-button"
          id="logout-button"
          name="logout-button"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}