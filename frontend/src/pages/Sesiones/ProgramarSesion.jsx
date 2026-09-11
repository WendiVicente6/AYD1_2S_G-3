import { useState, useEffect } from "react";
import {
  getMaterias,
  getTutoresPorMateria,
  getDisponibilidadTutor,
  crearSesion,
} from "../../services/sessionsService";

const DIAS_LABEL = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo" };

export default function ProgramarSesion() {
  const [materias, setMaterias] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);

  const [idMateria, setIdMateria] = useState("");
  const [idTutor, setIdTutor] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFinal, setHoraFinal] = useState("");
  const [motivo, setMotivo] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar materias al entrar a la página
  useEffect(() => {
    getMaterias().then(setMaterias).catch((err) => setError(err.message));
  }, []);

  // Cuando cambia la materia, cargar tutores de esa materia
  useEffect(() => {
    setIdTutor("");
    setDisponibilidad([]);
    if (!idMateria) { setTutores([]); return; }
    getTutoresPorMateria(idMateria).then(setTutores).catch((err) => setError(err.message));
  }, [idMateria]);

  // Cuando cambia el tutor, cargar su disponibilidad
  useEffect(() => {
    if (!idTutor) { setDisponibilidad([]); return; }
    getDisponibilidadTutor(idTutor).then(setDisponibilidad).catch((err) => setError(err.message));
  }, [idTutor]);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");

    if (!idMateria || !idTutor || !fecha || !horaInicio || !horaFinal) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      await crearSesion({
        id_tutor: Number(idTutor),
        id_materia: Number(idMateria),
        fecha,
        hora_inicio: horaInicio,
        hora_final: horaFinal,
        motivo,
      });
      setMessage("Sesión programada correctamente. Queda pendiente de confirmación del tutor.");
      setIdMateria(""); setIdTutor(""); setFecha(""); setHoraInicio(""); setHoraFinal(""); setMotivo("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="registration-page">
      <div className="registration-card">
        <h1>Programar sesión de tutoría</h1>
        <p>Elige materia, tutor y horario disponible.</p>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="registration-form">
          <label>Materia
            <select value={idMateria} onChange={(e) => setIdMateria(e.target.value)} required>
              <option value="">Selecciona una materia</option>
              {materias.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>
              ))}
            </select>
          </label>

          <label>Tutor
            <select value={idTutor} onChange={(e) => setIdTutor(e.target.value)} required disabled={!idMateria}>
              <option value="">{idMateria ? "Selecciona un tutor" : "Primero elige una materia"}</option>
              {tutores.map((t) => (
                <option key={t.id_tutor} value={t.id_tutor}>{t.nombres} {t.apellidos}</option>
              ))}
            </select>
          </label>

          {idTutor && (
            <div className="alert" style={{ background: "#f0f0f0" }}>
              {disponibilidad.length === 0
                ? "Este tutor no tiene horarios registrados."
                : (
                  <ul>
                    {disponibilidad.map((d) => (
                      <li key={`${d.id_horario}-${d.dia_semana}`}>
                        {DIAS_LABEL[d.dia_semana]}: {d.hora_inicio} - {d.hora_fin}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          <label>Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>

          <label>Hora de inicio
            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </label>

          <label>Hora final
            <input type="time" value={horaFinal} onChange={(e) => setHoraFinal(e.target.value)} required />
          </label>

          <label>Motivo (opcional)
            <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </label>

          <button disabled={loading}>{loading ? "Programando..." : "Programar sesión"}</button>
        </form>
      </div>
    </section>
  );
}