import { useEffect, useState } from "react";
import {
  getActiveStudents,
  deactivateStudent,
} from "../../services/studentService";

import "./AprobarEstudiantes.css";

export default function VerEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getActiveStudents();

      console.log("Estudiantes activos:", data);

      setEstudiantes(data.estudiantes || []);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      setError("No fue posible cargar los estudiantes activos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDarDeBaja = async (id_usuario) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea dar de baja a este estudiante?"
    );

    if (!confirmar) return;

    try {
      setError("");

      await deactivateStudent(id_usuario);

      setEstudiantes((actuales) =>
        actuales.filter(
          (estudiante) => estudiante.id_usuario !== id_usuario
        )
      );

      alert("Estudiante dado de baja correctamente.");
    } catch (error) {
      console.error("Error al dar de baja al estudiante:", error);
      setError("No fue posible dar de baja al estudiante.");
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Estudiantes</h2>
        <p>Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Estudiantes</h2>

      {error && <p>{error}</p>}

      {estudiantes.length === 0 ? (
        <p>No hay estudiantes activos.</p>
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
              {estudiantes.map((estudiante, index) => (
                <tr key={estudiante.id_usuario}>
                                    <td>
                  {index + 1}
                </td>
                  <td className="estudiante-nombre">
                    {estudiante.nombres} {estudiante.apellidos}
                  </td>

                  <td>{estudiante.carnet}</td>

                  <td>{estudiante.genero}</td>

                  <td>{estudiante.fec_nac}</td>

                  <td className="estudiante-correo">
                    {estudiante.correo}
                  </td>

                  <td>
                    <div className="estudiante-acciones">
                      <button
                        type="button"
                        className="btn-rechazar"
                        onClick={() =>
                          handleDarDeBaja(estudiante.id_usuario)
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
