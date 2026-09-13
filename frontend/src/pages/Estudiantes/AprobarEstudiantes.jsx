import "./AprobarEstudiantes.css";
import { useEffect, useState } from "react";
import {
  getPendingStudents,
  approveStudent,
  rejectStudent,
} from "../../services/studentService";
import Dashboard from "../Dashboard/Dashboard";
import AdminDashboard from "../Dashboard/AdminDashboard";

export default function AprobarEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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


  const handleApprove = async (id_usuario) => {
  try {
    await approveStudent(id_usuario);

    setEstudiantes((actuales) =>
      actuales.filter((estudiante) => estudiante.id_usuario !== id_usuario)
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

  if (!confirmar) {
    return;
  }

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


              <button
                type="button"
                className="btn-atras"
                onClick={() => AdminDashboard}
              >
                Rechazar
              </button>

  return (
    
<div className="estudiantes-table-container">
  <table className="estudiantes-table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Carnet</th>
        <th>Género</th>
        <th>Fecha de nacimiento</th>
        <th>Correo</th>
        <th>Acciones</th>
      </tr>
    </thead>

    <tbody>
      {estudiantes.map((estudiante) => (
        <tr key={estudiante.id_usuario}>
          <td>
            <div className="estudiante-nombre">
              {estudiante.nombres} {estudiante.apellidos}
            </div>
          </td>

          <td>{estudiante.carnet}</td>

          <td>{estudiante.genero}</td>

          <td>{estudiante.fec_nac}</td>

          <td>
            <span className="estudiante-correo">
              {estudiante.correo}
            </span>
          </td>

          <td>
            <div className="estudiante-acciones">
              <button
                type="button"
                className="btn-aprobar"
                onClick={() => handleApprove(estudiante.id_usuario)}
              >
                Aprobar
              </button>

              <button
                type="button"
                className="btn-rechazar"
                onClick={() => handleReject(estudiante.id_usuario)}
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
































  );
}