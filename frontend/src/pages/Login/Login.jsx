import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo: correo,
        password: password,
      }),
    });

    const data = await response.json();
if (!response.ok) {
  console.error(data.error);
  return;
}

if (data.requiere_segunda_autenticacion) {
  navigate("/auth2");
}
    //console.log(data);
  } catch (error) {
    console.error("Error al conectar con el backend:", error);
  }
};

  return (
    <main className="auth-page">
      <section className="auth-card">

        <div className="auth-brand">
          <div className="brand-mark">EC</div>
          <span>
            Edu<span>Connect</span>
          </span>
        </div>

        <h1>Iniciar sesión</h1>

        <p>
          Ingresa tus credenciales para continuar.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>

          <label>
            Correo electrónico
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            className="primary-button"
            type="submit"
          >
            Ingresar
          </button>

        </form>

        <small className="auth-note">
          Autenticación de administrador — Fase 1.
        </small>

      </section>
    </main>
  );
}






/*


import { Link } from "react-router-dom";

export default function Login() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><div className="brand-mark">EC</div><span>Edu<span>Connect</span></span></div>
        <h1>Iniciar sesión</h1>
        <p>Ingresa tus credenciales para continuar.</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label>Correo electrónico<input type="email" placeholder="correo@ejemplo.com" /></label>
          <label>Contraseña<input type="password" placeholder="••••••••" /></label>
          <button className="primary-button" type="submit">Ingresar</button>
        </form>
        <small className="auth-note">Pantalla inicial de referencia. La autenticación se conectará al backend Flask.</small>
        <Link className="back-link" to="/dashboard">Ver dashboard de demostración →</Link>
      </section>
    </main>
  );
}
*/