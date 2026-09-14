import { useState } from "react";
import { UserRound, Mail, Phone, MapPin, Calendar, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState({
    nombres: user?.nombres || "",
    apellidos: user?.apellidos || "",
    direccion: user?.direccion || "",
    telefono: user?.telefono || "",
    fec_nac: user?.fec_nac || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    password_actual: "",
    password_nueva: "",
    password_confirmar: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePasswordChange(e) {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.nombres.trim() || !form.apellidos.trim()) {
      setError("Nombres y apellidos son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await updateProfile(form);
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const { password_actual, password_nueva, password_confirmar } = passwordForm;

    if (!password_actual || !password_nueva || !password_confirmar) {
      setPasswordError("Completa los tres campos para cambiar la contraseña.");
      return;
    }

    if (password_nueva !== password_confirmar) {
      setPasswordError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    if (!PASSWORD_RE.test(password_nueva)) {
      setPasswordError("La nueva contraseña debe tener mínimo 8 caracteres, una minúscula, una mayúscula y un número.");
      return;
    }

    try {
      setPasswordLoading(true);
      await updateProfile({ password_actual, password_nueva });
      setPasswordSuccess("Contraseña actualizada correctamente.");
      setPasswordForm({ password_actual: "", password_nueva: "", password_confirmar: "" });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Mi perfil</h2>
          <p>Consulta y actualiza tus datos personales.</p>
        </div>
      </div>

      <article className="panel">
        {error && <div className="alert">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <label>Correo electrónico</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input type="email" value={user?.correo || ""} disabled />
          </div>

          <label>Nombres</label>
          <div className="input-wrap">
            <UserRound size={18} />
            <input name="nombres" value={form.nombres} onChange={handleChange} />
          </div>

          <label>Apellidos</label>
          <div className="input-wrap">
            <UserRound size={18} />
            <input name="apellidos" value={form.apellidos} onChange={handleChange} />
          </div>

          <label>Teléfono</label>
          <div className="input-wrap">
            <Phone size={18} />
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </div>

          <label>Dirección</label>
          <div className="input-wrap">
            <MapPin size={18} />
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </div>

          <label>Fecha de nacimiento</label>
          <div className="input-wrap">
            <Calendar size={18} />
            <input type="date" name="fec_nac" value={form.fec_nac} onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Cambiar contraseña</h3>
            <p>Actualiza tu contraseña de acceso.</p>
          </div>
        </div>

        {passwordError && <div className="alert">{passwordError}</div>}
        {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

        <form onSubmit={handlePasswordSubmit}>
          <label>Contraseña actual</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              type="password"
              name="password_actual"
              value={passwordForm.password_actual}
              onChange={handlePasswordChange}
              autoComplete="current-password"
            />
          </div>

          <label>Nueva contraseña</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              type="password"
              name="password_nueva"
              value={passwordForm.password_nueva}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
          </div>

          <label>Confirmar nueva contraseña</label>
          <div className="input-wrap">
            <Lock size={18} />
            <input
              type="password"
              name="password_confirmar"
              value={passwordForm.password_confirmar}
              onChange={handlePasswordChange}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={passwordLoading}>
            {passwordLoading ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </article>
    </section>
  );
}