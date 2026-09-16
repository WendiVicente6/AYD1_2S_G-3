import { useEffect, useState } from "react";
import {
  getTutoresPendientes,
  aprobarTutor,
  rechazarTutor,
} from "../../services/tutorsService";

import "../Estudiantes/AprobarEstudiantes.css";

export default function AprobarTutor() {
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
            
  useEffect(() => {
    cargarTutores();
  }, []);

  const cargarTutores = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTutoresPendientes();

      console.log("Tutores pendientes:", data);

      setTutores(data || []);
    } catch (error) {
      console.error("Error al cargar tutores:", error);
      setError("No fue posible cargar los tutores pendientes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id_usuario) => {
    try {
      setError("");

      await aprobarTutor(id_usuario);

      setTutores((actuales) =>
        actuales.filter((tutor) => tutor.id_usuario !== id_usuario)
      );

      alert("Tutor aprobado correctamente.");
    } catch (error) {
      console.error("Error al aprobar tutor:", error);
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

      alert("Tutor rechazado correctamente.");
    } catch (error) {
      console.error("Error al rechazar tutor:", error);
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

      {error && <p>{error}</p>}

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
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {tutores.map((tutor, index) => (
                <tr key={tutor.id_usuario}>
                                  <td>
                  {index + 1}
                </td>
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
                        className="btn-aprobar"
                        onClick={() => handleAprobar(tutor.id_usuario)}
                      >
                        Aprobar
                      </button>

                      <button
                        type="button"
                        className="btn-rechazar"
                        onClick={() => handleRechazar(tutor.id_usuario)}
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
    </div>
  );
}

