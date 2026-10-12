import "./AprobarEstudiantes.css";
import { useEffect, useState } from "react";
import {
  getPendingStudents,
  approveStudent,
  rejectStudent,
} from "../../services/studentService";

export default function AprobarEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        const data = await getPendingStudents();
        //console.log("Estudiantes recibidos:", data);

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

  const handleApprove = async (id_usuario) => {
    try {
      await approveStudent(id_usuario);

      setEstudiantes((actuales) =>
        actuales.filter(
          (estudiante) => estudiante.id_usuario !== id_usuario
        )
      );
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
            <th>Fotografía</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {estudiantes.length === 0 ? (
            <tr>
              <td colSpan="6">
                No hay estudiantes pendientes de aprobación.
              </td>
            </tr>
          ) : (
            estudiantes.map((estudiante, index) => (
              <tr key={estudiante.id_usuario}>
                <td>
                  {index + 1}
                </td>
                <td>
                  {estudiante.nombres} {estudiante.apellidos}
                </td>

                <td>{estudiante.carnet}</td>

                <td>{estudiante.genero}</td>

                <td>{estudiante.fec_nac}</td>

                <td>{estudiante.correo}</td>

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
    </div>
  );
}