import { useState } from "react";
import { registerTutor } from "../../services/registrationService";

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
  nro_id: "",
  dir_tutoria: "",
  anio_inicio_tutoria: "",
  u_graduacion: "",
  foto: "",
  materias: [],
};

export default function RegisterTutor() {
  const [form, setForm] = useState(initialForm);
  const [materiaInput, setMateriaInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addMateria = () => {
    if (!materiaInput || form.materias.includes(materiaInput)) return;
    setForm({ ...form, materias: [...form.materias, materiaInput] });
    setMateriaInput("");
  };

  const removeMateria = (id) =>
    setForm({ ...form, materias: form.materias.filter((m) => m !== id) });

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const result = await registerTutor(form);
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
        <h1>Registrar tutor</h1>
        <p>Completa tus datos personales y profesionales.</p>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="registration-form">
          <h2>Datos personales</h2>
          <label>Nombres<input name="nombres" value={form.nombres} onChange={update} required /></label>
          <label>Apellidos<input name="apellidos" value={form.apellidos} onChange={update} required /></label>
          <label>Carnet / ID<input name="carnet" type="number" value={form.carnet} onChange={update} required /></label>
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
          <label>Fotografía<input name="foto" type="file" accept="image/*" onChange={(e) => setForm({ ...form, foto: e.target.files?.[0]?.name || "" })} required /></label>
          <label>Correo electrónico<input name="correo" type="email" value={form.correo} onChange={update} required /></label>

          <h2>Datos del tutor</h2>
          <label>Número de identificación<input name="nro_id" type="number" value={form.nro_id} onChange={update} required /></label>
          <label>Dirección de tutoría<input name="dir_tutoria" value={form.dir_tutoria} onChange={update} placeholder="Dirección física u Online" required /></label>
          <label>Año de inicio de tutorías<input name="anio_inicio_tutoria" type="date" value={form.anio_inicio_tutoria} onChange={update} required /></label>
          <label>Universidad de graduación<input name="u_graduacion" value={form.u_graduacion} onChange={update} required /></label>

          <label>Materias que imparte
            <div className="inline-field">
              <input type="number" value={materiaInput} onChange={(e) => setMateriaInput(e.target.value)} placeholder="ID de materia" />
              <button type="button" onClick={addMateria}>Agregar</button>
            </div>
          </label>

          <div className="tag-list">
            {form.materias.map((id) => (
              <span key={id} className="tag">
                Materia #{id}
                <button type="button" onClick={() => removeMateria(id)}>×</button>
              </span>
            ))}
          </div>

          <label>Contraseña
            <input name="password" type="password" minLength="8" value={form.password} onChange={update} required />
            <small>Mínimo 8 caracteres, una mayúscula, una minúscula y un número.</small>
          </label>

          <button disabled={loading}>{loading ? "Registrando..." : "Registrar tutor"}</button>
        </form>
      </div>
    </section>
  );
}
