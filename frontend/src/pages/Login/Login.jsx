import { useState } from "react";
import { GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

      console.log("USUARIO DESDE LOGIN:", user);
      console.log("ROL:", user.role);

      if (user.role === "admin") {
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

        </form>

        <p className="login-note">
          ¿No tienes una cuenta?

          <button
            type="button"
            onClick={() => navigate("/register/tutor")}
          >
            Crear cuenta
          </button>
        </p>

      </section>
    </main>
  );
}