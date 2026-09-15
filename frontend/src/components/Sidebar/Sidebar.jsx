
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/context/AuthContext";
import { useState } from "react";

import {
  BarChart3,
  CalendarDays,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
  UserRound,
  History,
  ChevronDown,
} from "lucide-react";

// Links disponibles según el rol del usuario autenticado.
const LINKS_BY_ROLE = {
  admin: [
    {
      type: "link",
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      type: "submenu",
      label: "Estudiantes",
      icon: GraduationCap,
      children: [
        {
          to: "/students",
          label: "Ver Estudiantes Activos",
        },
        {
          to: "/students/approve",
          label: "Aprobar Estudiantes",
        },
      ],
    },

    {
      type: "submenu",
      label: "Tutores",
      icon: Users,
      children: [
        {
          to: "/tutors",
          label: "Ver Tutores Activos",
        },
        {
          to: "/tutors/approve",
          label: "Aprobar Tutores",
        },
      ],
    },

    {
      type: "link",
      to: "/reports",
      label: "Reportes",
      icon: BarChart3,
    },
  ],

  tutor: [
    {
      type: "link",
      to: "/tutor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      type: "link",
      to: "/tutor/schedule",
      label: "Mi horario",
      icon: Clock,
    },
    {
      type: "link",
      to: "/sessions",
      label: "Sesiones",
      icon: CalendarDays,
    },
    {
      type: "link",
      to: "/tutor/historial",
      label: "Historial de Sesiones",
      icon: BarChart3,
    },
    {
      type: "link",
      to: "/tutor/perfil",
      label: "Mi perfil",
      icon: UserRound,
    },
  ],

  student: [
    {
      type: "link",
      to: "/student/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      type: "link",
      to: "/student/tutores",
      label: "Buscar tutores",
      icon: Search,
    },
    {
      type: "link",
      to: "/student/programar-sesion",
      label: "Programar sesión",
      icon: CalendarDays,
    },
    {
      type: "link",
      to: "/student/mis-sesiones",
      label: "Mis sesiones",
      icon: Clock,
    },
    {
      type: "link",
      to: "/student/profile",
      label: "Mi perfil",
      icon: UserRound,
    },
    {
      type: "link",
      to: "/student/historial",
      label: "Historial",
      icon: History,
    },
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

  const [openMenus, setOpenMenus] = useState({
    estudiantes: false,
    tutores: false,
  });

  const role = user?.role;
  const links = LINKS_BY_ROLE[role] || [];
  const roleLabel = ROLE_LABELS[role] || "Usuario";

  const displayName = user
    ? `${user.nombres} ${user.apellidos}`.trim()
    : "Usuario";

  const initials = getInitials(user?.nombres, user?.apellidos);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>
          Edu<span>Connect</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">MENÚ PRINCIPAL</p>

        {links.map((item) => {
          // ==========================================
          // LINK NORMAL
          // ==========================================
          if (item.type === "link") {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          // ==========================================
          // SUBMENÚ
          // ==========================================
          const Icon = item.icon;

          const menuKey =
            item.label === "Estudiantes" ? "estudiantes" : "tutores";

          const isOpen = openMenus[menuKey];

          return (
            <div key={item.label} className="sidebar-submenu">
              <button
                type="button"
                className="nav-item nav-button"
                onClick={() => toggleMenu(menuKey)}
              >
                <Icon size={19} />

                <span>{item.label}</span>

                <ChevronDown
                  size={17}
                  className={`submenu-arrow ${
                    isOpen ? "submenu-arrow-open" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="submenu-items">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        `submenu-item ${isActive ? "active" : ""}`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <p className="nav-label nav-label-spaced">SISTEMA</p>

        <button className="nav-item nav-button" type="button">
          <Settings size={19} />
          <span>Configuración</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          {user?.foto ? (
            <img
              src={user.foto}
              alt="Foto de perfil"
              className="avatar avatar-img"
            />
          ) : (
            <div className="avatar avatar-purple">{initials}</div>
          )}

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

