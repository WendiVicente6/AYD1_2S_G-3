import { useEffect, useState } from "react";
import {
  getReporteTutores,
  getReporteMaterias,
} from "../../services/reportsService";

import "./Reportes.css";

function Reportes() {
  const [tutores, setTutores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tipoReporte, setTipoReporte] = useState("tutores");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError("");

      const [respuestaTutores, respuestaMaterias] = await Promise.all([
        getReporteTutores(),
        getReporteMaterias(),
      ]);

      setTutores(respuestaTutores.tutores || []);
      setMaterias(respuestaMaterias.materias || []);
    } catch (error) {
      console.error("Error al cargar reportes:", error);
      setError("No fue posible cargar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Cargando reportes...</p>;
  }

  if (error) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
    return <p>{error}</p>;
  }

  return (
    <div className="reportes-container">
      <h1>Reportes</h1>

      {/* SELECTOR DE TIPO DE REPORTE */}
      <div className="reporte-selector">
        <label htmlFor="tipoReporte">
          Tipo de reporte
        </label>

        <select
          id="tipoReporte"
          value={tipoReporte}
          onChange={(e) => setTipoReporte(e.target.value)}
        >
          <option value="tutores">
            Tutores 
          </option>

          <option value="materias">
            Sesiones de materias
          </option>
        </select>
      </div>

      {/* REPORTE DE TUTORES */}
      {tipoReporte === "tutores" && (
        <section className="reporte-tabla">
          <h2>Tutores con más estudiantes atendidos</h2>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tutor</th>
                  <th>Estudiantes atendidos</th>
                  <th>Total de sesiones</th>
                </tr>
              </thead>

              <tbody>
                {tutores.length > 0 ? (
                  tutores.map((tutor, index) => (
                    <tr key={tutor.id_tutor}>
                      <td>{index + 1}</td>
                      <td className="estudiante-nombre">
                        {tutor.tutor}
                      </td>
                      <td>{tutor.estudiantes_atendidos}</td>
                      <td>{tutor.total_sesiones}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      No hay información disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REPORTE DE MATERIAS */}
      {tipoReporte === "materias" && (
        <section className="reporte-tabla">
          <h2>Materias con más sesiones</h2>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Materia</th>
                  <th>Total de sesiones</th>
                  <th>Estudiantes atendidos</th>
                  <th>Tutores</th>
                </tr>
              </thead>

              <tbody>
                {materias.length > 0 ? (
                  materias.map((materia, index) => (
                    <tr key={materia.id_materia}>
                      <td>{index + 1}</td>
                      <td className="estudiante-nombre">
                        {materia.materia}
                      </td>
                      <td>{materia.total_sesiones}</td>
                      <td>{materia.estudiantes_atendidos}</td>
                      <td>{materia.tutores}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      No hay información disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default Reportes;
