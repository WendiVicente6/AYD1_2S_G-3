import { useEffect, useState } from "react";
import {
  getActiveTutors,
  deactivateTutor,
} from "../../services/tutorsService";

import "../Estudiantes/AprobarEstudiantes.css";

export default function VerTutores() {
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

      const data = await getActiveTutors();

      console.log("Tutores activos:", data);

      setTutores(data.tutores || []);
    } catch (error) {
      console.error("Error al cargar tutores:", error);
      setError("No fue posible cargar los tutores activos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDarDeBaja = async (id_usuario) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea dar de baja a este tutor?"
    );

    if (!confirmar) return;

    try {
      setError("");

      await deactivateTutor(id_usuario);

      setTutores((actuales) =>
        actuales.filter(
          (tutor) => tutor.id_usuario !== id_usuario
        )
      );

      alert("Tutor dado de baja correctamente.");
    } catch (error) {
      console.error("Error al dar de baja al tutor:", error);
      setError("No fue posible dar de baja al tutor.");
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Tutores</h2>
        <p>Cargando tutores...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Tutores</h2>

      {error && <p>{error}</p>}

      {tutores.length === 0 ? (
        <p>No hay tutores activos.</p>
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
                        className="btn-rechazar"
                        onClick={() =>
                          handleDarDeBaja(tutor.id_usuario)
                        }
                      >
                        Dar de baja
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
