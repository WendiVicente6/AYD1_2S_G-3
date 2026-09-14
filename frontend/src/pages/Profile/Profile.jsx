import { useState } from "react";
import { UserRound, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    </section>
  );
}