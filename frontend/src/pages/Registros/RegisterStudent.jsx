import { useState } from "react";
import { Camera, User } from "lucide-react";
import { registerStudent } from "../../services/registrationService";
import { useNavigate } from "react-router-dom";

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
  foto: "",
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

export default function RegisterStudent() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

          <div style={{ gridColumn: "1/-1" }}>
            <div className="foto-picker">
              {form.foto ? (
                <img src={form.foto} alt="Vista previa" className="foto-avatar" />
              ) : (
                <div className="foto-avatar-placeholder"><User size={32} /></div>
              )}
              <div>
                <label htmlFor="foto-estudiante-input" className="foto-picker-btn">
                  <Camera size={16} />
                  {form.foto ? "Cambiar foto" : "Subir foto"}
                </label>
                <p className="foto-picker-hint">JPG, PNG o WEBP (opcional)</p>
              </div>
              <input
                id="foto-estudiante-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={onFotoChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <label>Correo electrónico<input name="correo" type="email" value={form.correo} onChange={update} required /></label>
          <label>Contraseña
            <input name="password" type="password" minLength="8" value={form.password} onChange={update} autoComplete="new-password" required />
            <small>Mínimo 8 caracteres, una mayúscula, una minúscula y un número.</small>
          </label>

          <button disabled={loading}>{loading ? "Registrando..." : "Registrar estudiante"}</button>
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
