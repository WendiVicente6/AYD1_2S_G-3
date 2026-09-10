import { useState } from "react";
import { useNavigate } from "react-router-dom";

<<<<<<< HEAD
=======

>>>>>>> 7d05358 (feat: se agrega HU-004 (autenticación del administrador))
export default function Auth2() {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!archivo) {
      setError("Debe seleccionar el archivo auth2-ayd1.txt");
      return;
    }

    if (archivo.name !== "auth2-ayd1.txt") {
      setError("El archivo debe llamarse exactamente auth2-ayd1.txt");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      setCargando(true);

      const response = await fetch(
        "http://127.0.0.1:5000/api/auth2",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error en la segunda autenticación");
        return;
      }

<<<<<<< HEAD
      navigate("/dashboard");
=======
      /*navigate("/dashboard");*/
      navigate("/admin/dashboard", { replace: true });
>>>>>>> 7d05358 (feat: se agrega HU-004 (autenticación del administrador))
    } catch (error) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">

        <div className="auth-brand">
          <div className="brand-mark">EC</div>
          <span>
            Edu<span>Connect</span>
          </span>
        </div>

        <h1>Segunda autenticación</h1>

        <p>
          Selecciona el archivo de autenticación para continuar.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>

          <label>
            Archivo de autenticación
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setArchivo(e.target.files[0])}
            />
          </label>

          {error && (
            <p style={{ color: "red", fontSize: "13px" }}>
              {error}
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={cargando}
          >
            {cargando ? "Validando..." : "Validar archivo"}
          </button>

        </form>

        <small className="auth-note">
          Se requiere una segunda autenticación para acceder al panel administrativo.
        </small>

      </section>
    </main>
  );
}