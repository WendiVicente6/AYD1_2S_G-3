import { useEffect, useState } from "react";
import { Camera, User, FileText } from "lucide-react";
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
  foto: null,
  materias: [],
  cv_pdf: null,
};

const TIPOS_FOTO_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const MAX_FOTO = 5 * 1024 * 1024;
const MAX_PDF = 10 * 1024 * 1024;

export default function RegisterTutor() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [materiasCatalogo, setMateriasCatalogo] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState("");
  const [nombrePdf, setNombrePdf] = useState("");

  useEffect(() => {
    getMaterias()
      .then(setMateriasCatalogo)
      .catch(() => setError("No fue posible cargar el catálogo de materias."));
  }, []);

  useEffect(() => {
    if (!form.foto) {
      setFotoPreview("");
      return;
    }

    const url = URL.createObjectURL(form.foto);
    setFotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [form.foto]);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onFotoChange = (e) => {
    const file = e.target.files?.[0];
    setError("");

    if (!file) {
      setForm((prev) => ({ ...prev, foto: null }));
      return;
    }

    if (!TIPOS_FOTO_PERMITIDOS.includes(file.type)) {
      setError("La fotografía debe ser un archivo JPG, PNG o WEBP.");
      e.target.value = "";
      setForm((prev) => ({ ...prev, foto: null }));
      return;
    }

    if (file.size > MAX_FOTO) {
      setError("La fotografía no debe superar los 5 MB.");
      e.target.value = "";
      setForm((prev) => ({ ...prev, foto: null }));
      return;
    }

    setForm((prev) => ({ ...prev, foto: file }));
  };

  const onPdfChange = (e) => {
    const file = e.target.files?.[0];
    setError("");

    if (!file) {
      setForm((prev) => ({ ...prev, cv_pdf: null }));
      setNombrePdf("");
      return;
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("El curriculum debe ser un archivo PDF.");
      e.target.value = "";
      setForm((prev) => ({ ...prev, cv_pdf: null }));
      setNombrePdf("");
      return;
    }

    if (file.size > MAX_PDF) {
      setError("El PDF no debe superar los 10 MB.");
      e.target.value = "";
      setForm((prev) => ({ ...prev, cv_pdf: null }));
      setNombrePdf("");
      return;
    }

    setForm((prev) => ({ ...prev, cv_pdf: file }));
    setNombrePdf(file.name);
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
    if (!form.cv_pdf) {
      setError("Debes adjuntar el PDF de tu curriculum.");
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
      setNombrePdf("");
      const fotoInput = document.getElementById("foto-registro-input");
      const pdfInput = document.getElementById("cv-pdf-input");
      if (fotoInput) fotoInput.value = "";
      if (pdfInput) pdfInput.value = "";
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
              {fotoPreview ? (
                <img src={fotoPreview} alt="Vista previa" className="foto-avatar" />
              ) : (
                <div className="foto-avatar-placeholder"><User size={32} /></div>
              )}
              <div>
                <label htmlFor="foto-registro-input" className="foto-picker-btn">
                  <Camera size={16} />
                  {fotoPreview ? "Cambiar foto" : "Subir foto"}
                </label>
                <p className="foto-picker-hint">JPG, PNG o WEBP. Máximo 5 MB.</p>
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
          <div style={{ gridColumn: "1/-1" }}>
            <label htmlFor="cv-pdf-input">
              Curriculum escaneado (PDF obligatorio)
            </label>

            <div className="foto-picker">
              <FileText size={28} />

              <div>
                <input
                  id="cv-pdf-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onPdfChange}
                  required
                />

                <p className="foto-picker-hint">
                  PDF. Máximo 10 MB. Obligatorio.
                </p>

                {nombrePdf && <p>{nombrePdf}</p>}
              </div>
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
