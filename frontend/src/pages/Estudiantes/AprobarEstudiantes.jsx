import "./AprobarEstudiantes.css";
import { useEffect, useState } from "react";

import {
  getPendingStudents,
  approveStudent,
  rejectStudent,
  getStudentCarnetPdf,
} from "../../services/studentService";

export default function AprobarEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Liberar la URL temporal del PDF cuando cambie o se cierre el visor.
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        const data = await getPendingStudents();
        setEstudiantes(data.estudiantes || []);
      } catch (err) {
        console.error("Error al cargar estudiantes:", err);
        setError("No fue posible cargar los estudiantes pendientes.");
      } finally {
        setLoading(false);
      }
    };

    cargarEstudiantes();
  }, []);

  const cerrarVisorPdf = () => {
    setEstudianteSeleccionado(null);
    setPdfUrl(null);
    setPdfError("");
    setLoadingPdf(false);
  };

  const handleVerPdf = async (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setPdfUrl(null);
    setPdfError("");
    setLoadingPdf(true);

    try {
      const archivo = await getStudentCarnetPdf(estudiante.id_usuario);

      if (archivo.size === 0) {
        throw new Error("El archivo PDF está vacío.");
      }

      const url = URL.createObjectURL(archivo);
      setPdfUrl(url);
    } catch (err) {
      console.error("Error al cargar el carnet PDF:", err);
      setPdfError(
        err.message || "No fue posible mostrar el carnet PDF."
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleApprove = async (id_usuario) => {
    try {
      await approveStudent(id_usuario);

      setEstudiantes((actuales) =>
        actuales.filter(
          (estudiante) => estudiante.id_usuario !== id_usuario
        )
      );

      if (estudianteSeleccionado?.id_usuario === id_usuario) {
        cerrarVisorPdf();
      }
    } catch (err) {
      console.error("Error al aprobar estudiante:", err);
      setError("No fue posible aprobar al estudiante.");
    }
  };

  const handleReject = async (id_usuario) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea rechazar la solicitud de este estudiante?"
    );

    if (!confirmar) return;

    try {
      await rejectStudent(id_usuario);

      setEstudiantes((actuales) =>
        actuales.filter(
          (estudiante) => estudiante.id_usuario !== id_usuario
        )
      );

      if (estudianteSeleccionado?.id_usuario === id_usuario) {
        cerrarVisorPdf();
      }
    } catch (err) {
      console.error("Error al rechazar estudiante:", err);
      setError("No fue posible rechazar al estudiante.");
    }
  };

  if (loading) {
    return (
      <div className="estudiantes-table-container">
        <p>Cargando estudiantes pendientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estudiantes-table-container">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="estudiantes-table-container">
      <h2>Aprobar estudiantes</h2>

      <table className="estudiantes-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Nombre</th>
            <th>Carnet</th>
            <th>Género</th>
            <th>Fecha de nacimiento</th>
            <th>Correo</th>
            <th>Documento</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {estudiantes.length === 0 ? (
            <tr>
              <td colSpan={8} className="sin-estudiantes">
                No hay estudiantes pendientes de aprobación.
              </td>
            </tr>
          ) : (
            estudiantes.map((estudiante, index) => (
              <tr key={estudiante.id_usuario}>
                <td>{index + 1}</td>

                <td className="estudiante-nombre">
                  {estudiante.nombres} {estudiante.apellidos}
                </td>

                <td>{estudiante.carnet}</td>
                <td>{estudiante.genero}</td>
                <td>
                  {estudiante.fec_nac
                    ? String(estudiante.fec_nac).slice(0, 10)
                    : "—"}
                </td>

                <td className="estudiante-correo">
                  {estudiante.correo}
                </td>

                <td>
                  <button
                    type="button"
                    className="btn-ver-pdf"
                    onClick={() => handleVerPdf(estudiante)}
                    disabled={
                      loadingPdf &&
                      estudianteSeleccionado?.id_usuario ===
                        estudiante.id_usuario
                    }
                  >
                    {loadingPdf &&
                    estudianteSeleccionado?.id_usuario ===
                      estudiante.id_usuario
                      ? "Cargando..."
                      : "Ver carnet PDF"}
                  </button>
                </td>

                <td>
                  <div className="estudiante-acciones">
                    <button
                      type="button"
                      className="btn-aprobar"
                      onClick={() =>
                        handleApprove(estudiante.id_usuario)
                      }
                    >
                      Aprobar
                    </button>

                    <button
                      type="button"
                      className="btn-rechazar"
                      onClick={() =>
                        handleReject(estudiante.id_usuario)
                      }
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {estudianteSeleccionado && (
        <section className="carnet-pdf-container">
          <div className="carnet-pdf-header">
            <div>
              <h3>Documento del estudiante</h3>
              <p>
                {estudianteSeleccionado.nombres}{" "}
                {estudianteSeleccionado.apellidos}
                {" — Carnet: "}
                {estudianteSeleccionado.carnet}
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
            <p className="pdf-mensaje">
              Cargando documento PDF...
            </p>
          )}

          {pdfError && (
            <p className="pdf-error">{pdfError}</p>
          )}

          {pdfUrl && !loadingPdf && (
            <iframe
              className="carnet-pdf-visor"
              src={pdfUrl}
              title={`Carnet PDF de ${estudianteSeleccionado.nombres} ${estudianteSeleccionado.apellidos}`}
            />
          )}
        </section>
      )}
    </div>
  );
}