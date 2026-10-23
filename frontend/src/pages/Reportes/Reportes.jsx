
import { useEffect, useState } from "react";
import {
  getReporteTutores,
  getReporteMaterias,
  getReporteTopTutoresSesiones,
  getReporteEvolucionSesiones,
  getReporteCancelacionesMaterias,
  getReporteHorariosDemandados,
  getReporteEstudiantesSesiones,
  getReporteAsistenciaCancelacionMaterias,
  getReporteCalificacionTutores,
  getReporteCalificacionEstudiantes,
} from "../../services/reportsService";

import "./Reportes.css";

const ESTADOS = [
  { clave: "pendientes", nombre: "Pendientes" },
  { clave: "confirmadas", nombre: "Confirmadas" },
  { clave: "completadas", nombre: "Completadas" },
  { clave: "canceladas", nombre: "Canceladas" },
];

function Reportes({ tipoInicial = null }) {
  const [tutores, setTutores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [topTutores, setTopTutores] = useState([]);
  const [evolucion, setEvolucion] = useState([]);
  const [tipoReporte, setTipoReporte] = useState(tipoInicial || "tutores");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelacionesMaterias, setCancelacionesMaterias] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [estudiantesSesiones, setEstudiantesSesiones] = useState([]);
  const [asistenciaCancelacion, setAsistenciaCancelacion] = useState([]);
  const [calificacionTutores, setCalificacionTutores] = useState([]);
  const [calificacionEstudiantes, setCalificacionEstudiantes] = useState([]);

  const cargarCalificaciones = async (tipo) => {
  try {
    setLoading(true);
    setError("");

    if (tipo === "calificacion-tutores") {
      const respuesta = await getReporteCalificacionTutores();
      setCalificacionTutores(respuesta.tutores || []);
    } else if (tipo === "calificacion-estudiantes") {
      const respuesta = await getReporteCalificacionEstudiantes();
      setCalificacionEstudiantes(respuesta.estudiantes || []);
    }
  } catch (err) {
    console.error("Error al cargar calificaciones:", err);
    setError("No fue posible cargar las calificaciones.");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
      if (
    tipoInicial === "calificacion-tutores" ||
    tipoInicial === "calificacion-estudiantes"
  ) {
    setTipoReporte(tipoInicial);
    cargarCalificaciones(tipoInicial);
  } else {
    setTipoReporte("tutores");
    cargarReportes();
  }
  }, [tipoInicial]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError("");

    const [
      respuestaTutores,
      respuestaMaterias,
      respuestaTop,
      respuestaEvolucion,
      respuestaCancelaciones,
      respuestaHorarios,
      respuestaEstudiantes,
      respuestaAsistencia,
    ] = await Promise.all([
      getReporteTutores(),
      getReporteMaterias(),
      getReporteTopTutoresSesiones(),
      getReporteEvolucionSesiones(),
      getReporteCancelacionesMaterias(),
      getReporteHorariosDemandados(),
      getReporteEstudiantesSesiones(),
      getReporteAsistenciaCancelacionMaterias(),
    ]);

      setTutores(respuestaTutores.tutores || []);
      setMaterias(respuestaMaterias.materias || []);
      setTopTutores(respuestaTop.tutores || []);
      setEvolucion(respuestaEvolucion.evolucion || []);
      setCancelacionesMaterias(respuestaCancelaciones.materias || []);
      setHorarios(respuestaHorarios.horarios || []);
      setEstudiantesSesiones(respuestaEstudiantes.estudiantes || []);
      setAsistenciaCancelacion(respuestaAsistencia.materias || []);

    } catch (err) {
      console.error("Error al cargar reportes:", err);
      setError("No fue posible cargar los reportes. Verifica la conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Cargando reportes...</p>;
  }

  if (error) {
    return (
      <div className="reportes-container">
        <p role="alert">{error}</p>
        <button
        type="button"
        onClick={() =>
          tipoInicial
            ? cargarCalificaciones(tipoInicial)
            : cargarReportes()
        }
      >
        Reintentar
      </button>
      </div>
    );
  }

  const maxSesiones = Math.max(
    1,
    ...evolucion.map((semana) => Number(semana.total_sesiones) || 0)
  );

  return (
    <div className="reportes-container">
      <h1>Reportes</h1>
      {!tipoInicial && (
      <div className="reporte-selector">
        <label htmlFor="tipoReporte">Tipo de reporte</label>

        <select
          id="tipoReporte"
          value={tipoReporte}
          onChange={(e) => setTipoReporte(e.target.value)}
        >
          <option value="tutores">Tutores con más estudiantes atendidos</option>
          <option value="materias">Sesiones por materia</option>
          <option value="topTutores">Top 10 tutores por sesiones completadas</option>
          <option value="evolucion">Evolución semanal de sesiones</option>
          <option value="cancelaciones">Materias con mayor tasa de cancelación</option>
          <option value="horarios">Horarios más demandados</option>
          <option value="estudiantes">Estudiantes con más sesiones programadas</option>
          <option value="asistenciaCancelacion">Sesiones completadas frente a canceladas por materia</option>
        </select>
      </div>
      )}

      {/* REPORTE 1: TUTORES */}
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
                      <td className="estudiante-nombre">{tutor.tutor}</td>
                      <td>{tutor.estudiantes_atendidos}</td>
                      <td>{tutor.total_sesiones}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No hay información disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REPORTE 2: MATERIAS */}
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
                      <td className="estudiante-nombre">{materia.materia}</td>
                      <td>{materia.total_sesiones}</td>
                      <td>{materia.estudiantes_atendidos}</td>
                      <td>{materia.tutores}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No hay información disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REPORTE 3: TOP 10 TUTORES */}
      {tipoReporte === "topTutores" && (
        <section className="reporte-tabla">
          <h2>Top 10 tutores con más sesiones completadas</h2>
          <p className="reporte-descripcion">
            Sesiones completadas durante los últimos 30 días.
          </p>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tutor</th>
                  <th>Sesiones completadas</th>
                </tr>
              </thead>
              <tbody>
                {topTutores.length > 0 ? (
                  topTutores.map((tutor, index) => (
                    <tr key={tutor.id_tutor}>
                      <td>{index + 1}</td>
                      <td className="estudiante-nombre">{tutor.tutor}</td>
                      <td>{tutor.sesiones_atendidas}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">
                      No hay tutores disponibles para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {topTutores.length > 0 &&
            topTutores.every((tutor) => Number(tutor.sesiones_atendidas) === 0) && (
              <p className="reporte-vacio">
                Todavía no hay sesiones completadas en este período.
              </p>
            )}
        </section>
      )}

      {/* REPORTE 4: EVOLUCIÓN SEMANAL */}
      {tipoReporte === "evolucion" && (
        <section className="reporte-tabla">
          <h2>Evolución semanal de sesiones</h2>
          <p className="reporte-descripcion">
            Cantidad de sesiones por estado durante los últimos seis meses.
          </p>

          {evolucion.length === 0 ? (
            <p className="reporte-vacio">
              No hay sesiones registradas en los últimos seis meses.
              La gráfica aparecerá cuando existan datos.
            </p>
          ) : (
            <>
              <div className="grafica-leyenda">
                {ESTADOS.map((estado) => (
                  <span
                    className={`leyenda-item leyenda-${estado.clave}`}
                    key={estado.clave}
                  >
                    <span className="leyenda-color" />
                    {estado.nombre}
                  </span>
                ))}
              </div>

              <div
                className="grafica-evolucion"
                role="img"
                aria-label="Gráfica de barras con el total semanal de sesiones, separadas por estado"
              >
                {evolucion.map((semana) => {
                  const total = Number(semana.total_sesiones) || 0;

                  return (
                    <div className="grafica-semana" key={semana.semana}>
                      <div className="grafica-barras">
                        {ESTADOS.map((estado) => {
                          const cantidad = Number(semana[estado.clave]) || 0;
                          const altura =
                            cantidad === 0
                              ? 0
                              : Math.max(3, (cantidad / maxSesiones) * 180);

                          return (
                            <div
                              key={estado.clave}
                              className={`barra barra-${estado.clave}`}
                              style={{ height: `${altura}px` }}
                              title={`${estado.nombre}: ${cantidad}`}
                            />
                          );
                        })}
                      </div>

                      <strong className="grafica-total">{total}</strong>
                      <span className="grafica-fecha">
                        {new Date(`${semana.semana}T12:00:00`).toLocaleDateString(
                          "es-GT",
                          { day: "2-digit", month: "2-digit" }
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="estudiantes-table-container">
                <table className="estudiantes-table">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Total</th>
                      <th>Pendientes</th>
                      <th>Confirmadas</th>
                      <th>Completadas</th>
                      <th>Canceladas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evolucion.map((semana) => (
                      <tr key={semana.semana}>
                        <td>
                          {new Date(`${semana.semana}T12:00:00`).toLocaleDateString(
                            "es-GT",
                            { day: "2-digit", month: "long", year: "numeric" }
                          )}
                        </td>
                        <td>{semana.total_sesiones}</td>
                        <td>{semana.pendientes}</td>
                        <td>{semana.confirmadas}</td>
                        <td>{semana.completadas}</td>
                        <td>{semana.canceladas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      
      {/* REPORTE 5: CANCELACIONES POR MATERIA */}
      {tipoReporte === "cancelaciones" && (
        <section className="reporte-tabla">
          <h2>Materias con mayor tasa de cancelación</h2>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Total de sesiones</th>
                  <th>Sesiones canceladas</th>
                  <th>Tasa de cancelación</th>
                </tr>
              </thead>
              <tbody>
                {cancelacionesMaterias.length > 0 ? (
                  cancelacionesMaterias.map((materia) => (
                    <tr key={materia.id_materia}>
                      <td className="estudiante-nombre">{materia.materia}</td>
                      <td>{materia.total_sesiones}</td>
                      <td>{materia.sesiones_canceladas}</td>
                      <td>{Number(materia.tasa_cancelacion).toFixed(2)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No hay información disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REPORTE 6: HORARIOS MÁS DEMANDADOS */}
      {tipoReporte === "horarios" && (
        <section className="reporte-tabla">
          <h2>Horarios más demandados</h2>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>Hora de inicio</th>
                  <th>Total de sesiones</th>
                  <th>Completadas</th>
                  <th>Confirmadas</th>
                  <th>Pendientes</th>
                </tr>
              </thead>
              <tbody>
                {horarios.length > 0 ? (
                  horarios.map((horario) => (
                    <tr key={horario.hora_inicio}>
                      <td>{horario.hora_inicio}</td>
                      <td>{horario.total_sesiones}</td>
                      <td>{horario.completadas}</td>
                      <td>{horario.confirmadas}</td>
                      <td>{horario.pendientes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No hay información disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REPORTE 7: ESTUDIANTES CON MÁS SESIONES */}
      {tipoReporte === "estudiantes" && (
        <section className="reporte-tabla">
          <h2>Estudiantes con más sesiones programadas</h2>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Total de sesiones</th>
                  <th>Completadas</th>
                  <th>Confirmadas</th>
                  <th>Pendientes</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesSesiones.length > 0 ? (
                  estudiantesSesiones.map((estudiante) => (
                    <tr key={estudiante.id_estudiante}>
                      <td className="estudiante-nombre">
                        {estudiante.estudiante}
                      </td>
                      <td>{estudiante.total_sesiones}</td>
                      <td>{estudiante.completadas}</td>
                      <td>{estudiante.confirmadas}</td>
                      <td>{estudiante.pendientes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No hay información disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REPORTE 8: COMPLETADAS FRENTE A CANCELADAS */}
      {tipoReporte === "asistenciaCancelacion" && (
        <section className="reporte-tabla">
          <h2>Sesiones completadas frente a canceladas por materia</h2>

          <div className="estudiantes-table-container">
            <table className="estudiantes-table">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Total de sesiones</th>
                  <th>Completadas</th>
                  <th>Tasa de completadas</th>
                  <th>Canceladas</th>
                  <th>Tasa de cancelación</th>
                </tr>
              </thead>
              <tbody>
                {asistenciaCancelacion.length > 0 ? (
                  asistenciaCancelacion.map((materia) => (
                    <tr key={materia.id_materia}>
                      <td className="estudiante-nombre">{materia.materia}</td>
                      <td>{materia.total_sesiones}</td>
                      <td>{materia.sesiones_completadas}</td>
                      <td>{Number(materia.tasa_completadas).toFixed(2)}%</td>
                      <td>{materia.sesiones_canceladas}</td>
                      <td>{Number(materia.tasa_canceladas).toFixed(2)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No hay información disponible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
         )}

        {/* CALIFICACIÓN DE TUTORES */}
{tipoReporte === "calificacion-tutores" && (
  <section className="reporte-tabla">
    <h2>Calificación de tutores</h2>

    <div className="estudiantes-table-container">
      <table className="estudiantes-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tutor</th>
            <th>Materias</th>
            <th>Promedio de estrellas</th>
            <th>Total de calificaciones</th>
          </tr>
        </thead>
        <tbody>
          {calificacionTutores.length > 0 ? (
            [...calificacionTutores]
              .sort(
                (a, b) =>
                  Number(b.promedio_estrellas || 0) -
                  Number(a.promedio_estrellas || 0)
              )
              .map((tutor, index) => (
                <tr key={tutor.id_tutor ?? index}>
                  <td>{index + 1}</td>
                  <td className="estudiante-nombre">
                    {tutor.tutor || tutor.nombre || "Sin nombre"}
                  </td>
                  <td>{tutor.materias || "Sin materias"}</td>
                  <td>
                    {tutor.promedio_estrellas == null
                      ? "Sin calificaciones"
                      : `${Number(tutor.promedio_estrellas).toFixed(2)} / 5`}
                  </td>
                  <td>{tutor.total_calificaciones ?? 0}</td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="5">No hay calificaciones de tutores disponibles.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
)}

{/* CALIFICACIÓN DE ESTUDIANTES */}
{tipoReporte === "calificacion-estudiantes" && (
  <section className="reporte-tabla">
    <h2>Calificación de estudiantes</h2>

    <div className="estudiantes-table-container">
      <table className="estudiantes-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Estudiante</th>
            <th>Promedio de estrellas recibidas</th>
            <th>Total de calificaciones</th>
          </tr>
        </thead>
        <tbody>
          {calificacionEstudiantes.length > 0 ? (
            [...calificacionEstudiantes]
              .sort(
                (a, b) =>
                  Number(b.promedio_estrellas || 0) -
                  Number(a.promedio_estrellas || 0)
              )
              .map((estudiante, index) => (
                <tr key={estudiante.id_estudiante ?? index}>
                  <td>{index + 1}</td>
                  <td className="estudiante-nombre">
                    {estudiante.estudiante || estudiante.nombre || "Sin nombre"}
                  </td>
                  <td>
                    {estudiante.promedio_estrellas == null
                      ? "Sin calificaciones"
                      : `${Number(estudiante.promedio_estrellas).toFixed(2)} / 5`}
                  </td>
                  <td>{estudiante.total_calificaciones ?? 0}</td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="4">
                No hay calificaciones de estudiantes disponibles.
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
