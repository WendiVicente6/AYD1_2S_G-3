import { NavLink } from "react-router-dom";
import {
  BarChart3, CalendarDays, GraduationCap, LayoutDashboard,
  LogOut, Settings, Users
} from "lucide-react";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Estudiantes", icon: GraduationCap },
  { to: "/tutors", label: "Tutores", icon: Users },
  { to: "/sessions", label: "Sesiones", icon: CalendarDays },
  { to: "/reports", label: "Reportes", icon: BarChart3 },
];

export default function Sidebar() {
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
          <div className="avatar avatar-purple">AD</div>
          <div>
            <strong>Administrador</strong>
            <span>Administrador</span>
          </div>
        </div>
        <button className="logout-button" type="button">
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
