import { NavLink, useNavigate } from "react-router-dom"; // 1. Agregamos useNavigate
import { useState } from "react";

import {
  BarChart3, CalendarDays, GraduationCap, LayoutDashboard,
  LogOut, Settings, Users
} from "lucide-react";

// Los datos estáticos sí pueden quedarse aquí afuera
const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Estudiantes", icon: GraduationCap },
  { to: "/tutors", label: "Tutores", icon: Users },
  { to: "/sessions", label: "Sesiones", icon: CalendarDays },
  { to: "/reports", label: "Reportes", icon: BarChart3 },
];

export default function Sidebar() {
  // 2. Movimos los Hooks y funciones ADENTRO del componente
  const navigate = useNavigate(); 
  const [logOutError, setLogoutError] = useState("");
  const [mensajeLogout, setMensajeLogout] = useState("");

  const handleLogout = async () => {
    try {
        if (typeof logout === "function") await logout(); 
        setTimeout(() => {
            navigate("/login");
            if (typeof setCurrentUserId === "function") setCurrentUserId(null);
        }, 2000);
    } catch (err) {
        setLogoutError("Error al cerrar sesión.");
    }
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
          <div className="avatar avatar-purple">AD</div>
          <div>
            <strong>Administrador</strong>
            <span>Administrador</span>
          </div>
        </div>
        <button className="logout-button"
                    id="logout-button"
                    name="logout-button"
                    type="button"
                    onClick={handleLogout}>
          <LogOut size={18} />
          Cerrar sesión
          {logOutError && <p className="text-sm text-green-600 mt-2 text-center">{logOutError}</p>}
          {mensajeLogout && <p className="text-sm text-red-600 mt-2 text-center">{mensajeLogout}</p>}
        </button>
      </div>
    </aside>
  );
}
