import { useState } from "react";
import { registerStudent } from "../../services/registrationService";

const initialForm = {
  nombres: "",
  apellidos: "",
  carnet: "",
  genero: "",
  direccion: "",
  telefono: "",
  fec_nac: "",
  correo: "",
  password: "",
};

export default function RegisterStudent() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const result = await registerStudent(form);
      setMessage(result.message);
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="registration-page">
      <div className="registration-card">
        <h1>Registrar estudiante</h1>
        <p>Completa tus datos para solicitar una cuenta en EduConnect.</p>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="registration-form">
          <label>Nombres<input name="nombres" value={form.nombres} onChange={update} required /></label>
          <label>Apellidos<input name="apellidos" value={form.apellidos} onChange={update} required /></label>
          <label>Carnet<input name="carnet" type="number" value={form.carnet} onChange={update} required /></label>
          <label>Género
            <select name="genero" value={form.genero} onChange={update} required>
              <option value="">Selecciona</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </label>
          <label>Dirección<input name="direccion" value={form.direccion} onChange={update} required /></label>
          <label>Teléfono<input name="telefono" value={form.telefono} onChange={update} /></label>
          <label>Fecha de nacimiento<input name="fec_nac" type="date" value={form.fec_nac} onChange={update} required /></label>
          <label>Fotografía<input type="file" accept="image/*" disabled title="La carga se integrará con almacenamiento BYTEA." /></label>
          <label>Correo electrónico<input name="correo" type="email" value={form.correo} onChange={update} required /></label>
          <label>Contraseña
            <input name="password" type="password" minLength="8" value={form.password} onChange={update} required />
            <small>Mínimo 8 caracteres, una mayúscula, una minúscula y un número.</small>
          </label>

          <button disabled={loading}>{loading ? "Registrando..." : "Registrar estudiante"}</button>
        </form>
      </div>
    </section>
  );
}
