import { useState } from "react";
import { GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link } from 'react-router-dom';


const dashboardForRole = {
  admin: "/admin/dashboard",
  student: "/student/dashboard",
  tutor: "/tutor/dashboard",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!correo.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(correo.trim(), password);

      //console.log("USUARIO DESDE LOGIN:", user);
      //console.log("ROL:", user.role);

      if (user.role === "admin" && import.meta.env.VITE_DEMO_MODE === "false") {
        navigate("/auth2", { replace: true });
      } else {
        navigate(
          dashboardForRole[user.role] || "/login",
          { replace: true }
        );
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">

        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h1>EduConnect</h1>
            <p>Plataforma de gestión académica</p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Iniciar sesión</h2>
          <p>Ingresa con las credenciales de tu cuenta.</p>
        </div>

        {error && (
          <div className="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label>Correo electrónico</label>

          <div className="input-wrap">
            <Mail size={18} />

            <input
              data-testid="email"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="username"
            />
          </div>

          <label>Contraseña</label>

          <div className="input-wrap">
            <LockKeyhole size={18} />

            <input
              data-testid="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

        </form>

        {import.meta.env.VITE_DEMO_MODE !== "false" && (
          <div style={{ marginTop: 20, padding: 14, background: "#eff6ff", borderRadius: 10, fontSize: 13 }}>
            <strong>Demostración para evaluación</strong>
            <p style={{ margin: "5px 0 9px" }}>Contraseña de todas las cuentas: <b>Demo12345!</b></p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[ ["Admin", "admin@demo.com"], ["Tutor", "tutor@demo.com"], ["Estudiante", "estudiante@demo.com"] ].map(([role, email]) => (
                <button key={role} type="button" style={{ width: "auto", padding: "7px 10px", background: "#1e40af", fontSize: 12 }} onClick={() => { setCorreo(email); setPassword("Demo12345!"); }}>{role}</button>
              ))}
            </div>
          </div>
        )}

        <p className="login-note">
          ¿No tienes una cuenta?

          <Link to="/register">
            Crear cuenta
          </Link>
        </p>

      </section>
    </main>
  );
}