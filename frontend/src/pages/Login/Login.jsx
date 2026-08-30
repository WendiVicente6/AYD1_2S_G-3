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
