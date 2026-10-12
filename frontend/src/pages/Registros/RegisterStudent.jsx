import { useEffect, useState } from "react";
import { Camera, User, FileText } from "lucide-react";
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
  foto: null,
  carnet_pdf: null,
};

const TIPOS_FOTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FOTO = 5 * 1024 * 1024;
const MAX_PDF = 10 * 1024 * 1024;

export default function RegisterStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [fotoPreview, setFotoPreview] = useState("");
  const [nombrePdf, setNombrePdf] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.foto) {
      setFotoPreview("");
      return;
    }

    const url = URL.createObjectURL(form.foto);
    setFotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [form.foto]);

  const update = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const onFotoChange = (e) => {
    const file = e.target.files?.[0];
    setError("");

    if (!file) {
      setForm((prev) => ({ ...prev, foto: null }));
      return;
    }

    if (!TIPOS_FOTO_PERMITIDOS.includes(file.type)) {
      setError("La fotografía debe ser JPG, PNG o WEBP.");
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
      setForm((prev) => ({ ...prev, carnet_pdf: null }));
      setNombrePdf("");
      return;
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("El carnet universitario debe ser un archivo PDF.");
      e.target.value = "";
      setForm((prev) => ({ ...prev, carnet_pdf: null }));
      setNombrePdf("");
      return;
    }

    if (file.size > MAX_PDF) {
      setError("El PDF no debe superar los 10 MB.");
      e.target.value = "";
      setForm((prev) => ({ ...prev, carnet_pdf: null }));
      setNombrePdf("");
      return;
    }

    setForm((prev) => ({ ...prev, carnet_pdf: file }));
    setNombrePdf(file.name);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.foto) {
      setError("Debes adjuntar tu fotografía.");
      return;
    }

    if (!form.carnet_pdf) {
      setError("Debes adjuntar el PDF de tu carnet universitario.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerStudent(form);
      setMessage(result.message);
      setForm({ ...initialForm });
      setNombrePdf("");

      const fotoInput = document.getElementById("foto-estudiante-input");
      const pdfInput = document.getElementById("carnet-pdf-input");

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
        <h1>Registrar estudiante</h1>
        <p>
          Completa tus datos y adjunta tu fotografía y carnet
          universitario para solicitar una cuenta en EduConnect.
        </p>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="registration-form">
          <label>
            Nombres
            <input
              name="nombres"
              value={form.nombres}
              onChange={update}
              required
            />
          </label>

          <label>
            Apellidos
            <input
              name="apellidos"
              value={form.apellidos}
              onChange={update}
              required
            />
          </label>

          <label>
            Carnet
            <input
              name="carnet"
              type="number"
              value={form.carnet}
              onChange={update}
              required
            />
          </label>

          <label>
            Género
            <select
              name="genero"
              value={form.genero}
              onChange={update}
              required
            >
              <option value="">Selecciona</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </label>

          <label>
            Dirección
            <input
              name="direccion"
              value={form.direccion}
              onChange={update}
              required
            />
          </label>

          <label>
            Teléfono
            <input
              name="telefono"
              value={form.telefono}
              onChange={update}
            />
          </label>

          <label>
            Fecha de nacimiento
            <input
              name="fec_nac"
              type="date"
              value={form.fec_nac}
              onChange={update}
              required
            />
          </label>

          <div style={{ gridColumn: "1/-1" }}>
            <label>Fotografía del estudiante (obligatoria)</label>

            <div className="foto-picker">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Vista previa de la fotografía"
                  className="foto-avatar"
                />
              ) : (
                <div className="foto-avatar-placeholder">
                  <User size={32} />
                </div>
              )}

              <div>
                <label
                  htmlFor="foto-estudiante-input"
                  className="foto-picker-btn"
                >
                  <Camera size={16} />
                  {form.foto ? "Cambiar foto" : "Subir foto"}
                </label>

                <p className="foto-picker-hint">
                  JPG, PNG o WEBP. Máximo 5 MB. Obligatoria.
                </p>
              </div>

              <input
                id="foto-estudiante-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFotoChange}
                required
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label htmlFor="carnet-pdf-input">
              Carnet universitario escaneado (PDF obligatorio)
            </label>

            <div className="foto-picker">
              <FileText size={28} />

              <div>
                <input
                  id="carnet-pdf-input"
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

          <label>
            Correo electrónico
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={update}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              name="password"
              type="password"
              minLength={8}
              value={form.password}
              onChange={update}
              autoComplete="new-password"
              required
            />
            <small>
              Mínimo 8 caracteres, una mayúscula, una minúscula y un número.
            </small>
          </label>

          <button disabled={loading}>
            {loading ? "Registrando..." : "Registrar estudiante"}
          </button>

          <button
            type="button"
            className="btn-volver-login"
            onClick={() => navigate("/login")}
          >
            ← Volver al Login
          </button>
        </form>
      </div>
    </section>
  );
}
