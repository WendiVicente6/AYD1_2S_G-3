import { useEffect, useState } from "react";
import { Camera, User } from "lucide-react";
import { registerTutor } from "../../services/registrationService";
import { useNavigate } from "react-router-dom";
import { getMaterias } from "../../services/sessionsService";

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

const TIPOS_FOTO_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RegisterTutor() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [materiasCatalogo, setMateriasCatalogo] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMaterias()
      .then(setMateriasCatalogo)
      .catch(() => setError("No fue posible cargar el catálogo de materias."));
  }, []);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!TIPOS_FOTO_PERMITIDOS.includes(file.type)) {
      setError("La fotografía debe ser un archivo JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }

    setError("");
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, foto: dataUrl }));
  };

  const addMateria = (e) => {
    const idMateria = Number(e.target.value);
    if (!idMateria || form.materias.includes(idMateria)) return;
    setForm((prev) => ({ ...prev, materias: [...prev.materias, idMateria] }));
    e.target.value = "";
  };

  const removeMateria = (id) =>
    setForm((prev) => ({ ...prev, materias: prev.materias.filter((m) => m !== id) }));

  const materiasDisponibles = materiasCatalogo.filter(
    (m) => !form.materias.includes(m.id_materia)
  );

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.foto) {
      setError("La fotografía es obligatoria.");
      return;
    }

    if (form.materias.length === 0) {
      setError("Selecciona al menos una materia que impartes.");
      return;
    }

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
          <div style={{ gridColumn: "1/-1" }}>
            <div className="foto-picker">
              {form.foto ? (
                <img src={form.foto} alt="Vista previa" className="foto-avatar" />
              ) : (
                <div className="foto-avatar-placeholder"><User size={32} /></div>
              )}
              <div>
                <label htmlFor="foto-registro-input" className="foto-picker-btn">
                  <Camera size={16} />
                  {form.foto ? "Cambiar foto" : "Subir foto"}
                </label>
                <p className="foto-picker-hint">JPG, PNG o WEBP</p>
              </div>
              <input
                id="foto-registro-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={onFotoChange}
                style={{ display: "none" }}
              />
            </div>
          </div>
          <label>Correo electrónico<input name="correo" type="email" value={form.correo} onChange={update} required /></label>

          <h2>Datos del tutor</h2>
          <label>Número de identificación<input name="nro_id" type="number" value={form.nro_id} onChange={update} required /></label>
          <label>Dirección de tutoría<input name="dir_tutoria" value={form.dir_tutoria} onChange={update} placeholder="Dirección física u Online" required /></label>
          <label>Año de inicio de tutorías<input name="anio_inicio_tutoria" type="date" value={form.anio_inicio_tutoria} onChange={update} required /></label>
          <label>Universidad de graduación<input name="u_graduacion" value={form.u_graduacion} onChange={update} required /></label>

          <label>Materias que imparte
            <select value="" onChange={addMateria} disabled={materiasDisponibles.length === 0}>
              <option value="">
                {materiasDisponibles.length === 0 ? "Ya agregaste todas las materias" : "Selecciona una materia..."}
              </option>
              {materiasDisponibles.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>
              ))}
            </select>
          </label>

          <div className="tag-list">
            {form.materias.map((id) => {
              const materia = materiasCatalogo.find((m) => m.id_materia === id);
              return (
                <span key={id} className="tag tag-materia-seleccionada">
                  {materia ? materia.nombre : `Materia #${id}`}
                  <button type="button" onClick={() => removeMateria(id)}>×</button>
                </span>
              );
            })}
          </div>

          <label>Contraseña
            <input name="password" type="password" minLength="8" value={form.password} onChange={update} autoComplete="new-password" required />
            <small>Mínimo 8 caracteres, una mayúscula, una minúscula y un número.</small>
          </label>

          <button disabled={loading}>{loading ? "Registrando..." : "Registrar tutor"}</button>
          <button type="button" className="btn-volver-login"
            onClick={() => navigate("/login")}
          >
            ← Volver al Login
          </button>
        </form>
      </div>
    </section>
  );
}
