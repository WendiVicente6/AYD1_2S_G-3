import { useEffect, useState } from "react";
import { Camera, User } from "lucide-react";
import { getPerfilTutor, updatePerfilTutor } from "../../services/tutorsService";
import { getMaterias } from "../../services/sessionsService";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  nombres: "",
  apellidos: "",
  carnet: "",
  genero: "",
  direccion: "",
  telefono: "",
  fec_nac: "",
  correo: "",
  nro_id: "",
  dir_tutoria: "",
  anio_inicio_tutoria: "",
  u_graduacion: "",
  password: "",
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

export default function PerfilTutor() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [fotoActual, setFotoActual] = useState(null);
  const [fotoNueva, setFotoNueva] = useState(null);
  const [materiasCatalogo, setMateriasCatalogo] = useState([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [perfil, materias] = await Promise.all([getPerfilTutor(), getMaterias()]);
        setForm({
          nombres: perfil.nombres || "",
          apellidos: perfil.apellidos || "",
          carnet: perfil.carnet ?? "",
          genero: perfil.genero || "",
          direccion: perfil.direccion || "",
          telefono: perfil.telefono || "",
          fec_nac: perfil.fec_nac || "",
          correo: perfil.correo || "",
          nro_id: perfil.nro_id ?? "",
          dir_tutoria: perfil.dir_tutoria || "",
          anio_inicio_tutoria: perfil.anio_inicio_tutoria || "",
          u_graduacion: perfil.u_graduacion || "",
          password: "",
          materias: perfil.materias.map((m) => m.id_materia),
        });
        setFotoActual(perfil.foto);
        setMateriasCatalogo(materias);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleMateria = (idMateria) => {
    setForm((prev) => ({
      ...prev,
      materias: prev.materias.includes(idMateria)
        ? prev.materias.filter((id) => id !== idMateria)
        : [...prev.materias, idMateria],
    }));
  };

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
    setFotoNueva(dataUrl);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (form.materias.length === 0) {
      setError("Selecciona al menos una materia que impartes.");
      return;
    }

    setGuardando(true);
    try {
      const payload = { ...form };
      if (fotoNueva) payload.foto = fotoNueva;
      if (!payload.password) delete payload.password;
      delete payload.correo;

      const result = await updatePerfilTutor(payload);
      setMensaje(result.message);
      if (fotoNueva) {
        setFotoActual(fotoNueva);
        setFotoNueva(null);
      }
      setForm((prev) => ({ ...prev, password: "" }));
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <section className="page-container"><p>Cargando perfil...</p></section>;
  }

  const fotoPreview = fotoNueva || fotoActual;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Configuración</h2>
          <p>Edita tu información personal y profesional como tutor.</p>
        </div>
      </div>

      <div className="registration-card">
        {mensaje && <div className="alert success">{mensaje}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="registration-form">
          <h2>Datos personales</h2>
          <label>Nombre<input name="nombres" value={form.nombres} onChange={update} required /></label>
          <label>Apellido<input name="apellidos" value={form.apellidos} onChange={update} required /></label>
          <label>Carnet o ID<input name="carnet" type="number" value={form.carnet} onChange={update} required /></label>
          <label>Fecha de nacimiento<input name="fec_nac" type="date" value={form.fec_nac} onChange={update} required /></label>
          <label>Género
            <select name="genero" value={form.genero} onChange={update} required>
              <option value="">Selecciona</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </label>
          <label>Dirección<input name="direccion" value={form.direccion} onChange={update} required /></label>
          <label>Teléfono<input name="telefono" value={form.telefono} onChange={update} /></label>

          <div style={{ gridColumn: "1/-1" }}>
            <div className="foto-picker">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto de perfil" className="foto-avatar" />
              ) : (
                <div className="foto-avatar-placeholder"><User size={32} /></div>
              )}
              <div>
                <label htmlFor="foto-perfil-input" className="foto-picker-btn">
                  <Camera size={16} />
                  {fotoPreview ? "Cambiar foto" : "Subir foto"}
                </label>
                <p className="foto-picker-hint">JPG, PNG o WEBP</p>
              </div>
              <input
                id="foto-perfil-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={onFotoChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <label>Correo electrónico<input value={form.correo} disabled /></label>

          <h2>Datos del tutor</h2>
          <label>Número de identificación de tutor<input name="nro_id" type="number" value={form.nro_id} onChange={update} required /></label>
          <label>Dirección de tutoría<input name="dir_tutoria" value={form.dir_tutoria} onChange={update} placeholder="Dirección física u Online" required /></label>
          <label>Año de inicio de tutorías<input name="anio_inicio_tutoria" type="date" value={form.anio_inicio_tutoria} onChange={update} required /></label>
          <label>Universidad de graduación<input name="u_graduacion" value={form.u_graduacion} onChange={update} required /></label>

          <label>Especialidad (materias que imparte)</label>
          <div className="tag-list">
            {materiasCatalogo.map((m) => (
              <label
                key={m.id_materia}
                className="tag"
                style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={form.materias.includes(m.id_materia)}
                  onChange={() => toggleMateria(m.id_materia)}
                />
                {m.nombre}
              </label>
            ))}
          </div>

          <label>Nueva contraseña
            <input name="password" type="password" minLength="8" value={form.password} onChange={update} placeholder="Dejar en blanco para no cambiarla" autoComplete="new-password" />
            <small>Si la cambias: mínimo 8 caracteres, una mayúscula, una minúscula y un número.</small>
          </label>

          <button disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
        </form>
      </div>
    </section>
  );
}
