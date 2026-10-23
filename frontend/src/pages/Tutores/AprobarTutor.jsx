
import { useEffect, useState } from "react";
import {
  getTutoresPendientes,
  aprobarTutor,
  rechazarTutor,
  getTutorCvPdf,
} from "../../services/tutorsService";

import "../Estudiantes/AprobarEstudiantes.css";

export default function AprobarTutor() {
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    cargarTutores();
  }, []);

  // Liberar la URL del PDF cuando cambie o se cierre el visor.
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const cargarTutores = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTutoresPendientes();
      setTutores(data || []);
    } catch (err) {
      console.error("Error al cargar tutores:", err);
      setError("No fue posible cargar los tutores pendientes.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerPdf = async (tutor) => {
    setTutorSeleccionado(tutor);
    setPdfError("");
    setPdfUrl(null);
    setLoadingPdf(true);

    try {
      const archivo = await getTutorCvPdf(tutor.id_usuario);

      if (!archivo || archivo.size === 0) {
        throw new Error("El archivo PDF del CV está vacío.");
      }

      const nuevaUrl = URL.createObjectURL(archivo);
      setPdfUrl(nuevaUrl);
    } catch (err) {
      console.error("Error al cargar el CV:", err);
      setPdfError(
        err.message || "No fue posible cargar el CV del tutor."
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  const cerrarVisorPdf = () => {
    setTutorSeleccionado(null);
    setPdfUrl(null);
    setPdfError("");
    setLoadingPdf(false);
  };

  const handleAprobar = async (id_usuario) => {
    try {
      setError("");

      await aprobarTutor(id_usuario);

      setTutores((actuales) =>
        actuales.filter((tutor) => tutor.id_usuario !== id_usuario)
      );

      if (tutorSeleccionado?.id_usuario === id_usuario) {
        cerrarVisorPdf();
      }

      alert("Tutor aprobado correctamente.");
    } catch (err) {
      console.error("Error al aprobar tutor:", err);
      setError("No fue posible aprobar al tutor.");
    }
  };

  const handleRechazar = async (id_usuario) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea rechazar a este tutor?"
    );

    if (!confirmar) return;

    try {
      setError("");

      await rechazarTutor(id_usuario);

      setTutores((actuales) =>
        actuales.filter((tutor) => tutor.id_usuario !== id_usuario)
      );

      if (tutorSeleccionado?.id_usuario === id_usuario) {
        cerrarVisorPdf();
      }

      alert("Tutor rechazado correctamente.");
    } catch (err) {
      console.error("Error al rechazar tutor:", err);
      setError("No fue posible rechazar al tutor.");
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Aprobar tutores</h2>
        <p>Cargando tutores pendientes...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Aprobar tutores</h2>

      {error && <p className="pdf-error">{error}</p>}

      {tutores.length === 0 ? (
        <p>No hay tutores pendientes de aprobación.</p>
      ) : (
        <div className="estudiantes-table-container">
          <table className="estudiantes-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nombre completo</th>
                <th>Carnet</th>
                <th>Género</th>
                <th>Fecha de nacimiento</th>
                <th>Correo</th>
                <th>CV</th>
                <th>Acciones</th>/
              </tr>
            </thead>

            <tbody>
              {tutores.map((tutor, index) => (
                <tr key={tutor.id_usuario}>
                  <td>{index + 1}</td>

                  <td className="estudiante-nombre">
                    {tutor.nombres} {tutor.apellidos}
                  </td>

                  <td>{tutor.carnet}</td>
                  <td>{tutor.genero}</td>
                      <td>{tutor.fec_nac}</td>

                  <td className="estudiante-correo">
                    {tutor.correo}
                  </td>

                  <td>
                    <div className="estudiante-acciones">
                      <button
                        type="button"
                        className="btn-ver-pdf"
                        onClick={() => handleVerPdf(tutor)}
                        disabled={
                          !tutor.cv_pdf_nombre ||
                          (loadingPdf &&
                            tutorSeleccionado?.id_usuario ===
                              tutor.id_usuario)
                        }
                      >
                        {loadingPdf &&
                        tutorSeleccionado?.id_usuario ===
                          tutor.id_usuario
                          ? "Cargando..."
                          : "Ver CV en PDF"}
                      </button>

                      <button
                        type="button"
                        className="btn-aprobar"
                        onClick={() =>
                          handleAprobar(tutor.id_usuario)
                        }
                      >
                        Aprobar
                      </button>

                      <button
                        type="button"
                        className="btn-rechazar"
                        onClick={() =>
                          handleRechazar(tutor.id_usuario)
                        }
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tutorSeleccionado && (
        <section className="carnet-pdf-container">
          <div className="carnet-pdf-header">
            <div>
              <h3>Currículum vitae del tutor</h3>

              <p>
                <strong>Nombre:</strong>{" "}
                {tutorSeleccionado.nombres}{" "}
                {tutorSeleccionado.apellidos}
              </p>

              <p>
                <strong>Archivo:</strong>{" "}
                {tutorSeleccionado.cv_pdf_nombre}
              </p>
            </div>

            <button
              type="button"
              className="btn-cerrar-pdf"
              onClick={cerrarVisorPdf}
            >
              Cerrar visor
            </button>
          </div>

          {loadingPdf && (
            <p className="pdf-mensaje">Cargando CV en PDF...</p>
          )}

          {pdfError && (
            <p className="pdf-error">{pdfError}</p>
          )}

          {pdfUrl && !loadingPdf && !pdfError && (
            <iframe
              className="carnet-pdf-visor"
              src={pdfUrl}
              title={`CV de ${tutorSeleccionado.nombres} ${tutorSeleccionado.apellidos}`}
            />
          )}
        </section>
      )}
    </div>
  );
}
