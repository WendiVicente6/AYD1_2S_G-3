import { useEffect, useState } from "react";
import { MapPin, BookOpen, CalendarClock } from "lucide-react";
import { getTutoresDisponibles } from "../../services/tutorsService";
import HorarioTutor from "./HorarioTutor";

// Iniciales para la foto  cuando el tutor no tiene fotografía.
function iniciales(nombreCompleto) {
  return nombreCompleto
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TutoresDisponibles() {
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tutorSeleccionado, setTutorSeleccionado] = useState(null);

  useEffect(() => {
    getTutoresDisponibles()
      .then(setTutores)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Tutores disponibles</h2>
          <p>Selecciona un tutor para ver sus horarios y su disponibilidad.</p>
        </div>
      </div>

      {loading && <p className="muted-text">Cargando tutores...</p>}

      {!loading && error && <div className="alert error">{error}</div>}

      {!loading && !error && tutores.length === 0 && (
        <article className="empty-page">
          <div className="empty-icon">
            <BookOpen size={28} />
          </div>
          <h2>No hay tutores disponibles</h2>
          <p>Por ahora no hay tutores nuevos para mostrarte.</p>
        </article>
      )}

      {!loading && !error && tutores.length > 0 && (
        <div className="tutor-grid">
          {tutores.map((tutor) => (
            <article key={tutor.id_tutor} className="panel tutor-card">
              <div className="tutor-card-head">
                {tutor.foto ? (
                  <img
                    src={tutor.foto}
                    alt={tutor.nombre_completo}
                    className="tutor-foto"
                  />
                ) : (
                  <div className="tutor-foto tutor-foto-placeholder">
                    {iniciales(tutor.nombre_completo)}
                  </div>
                )}
                <div>
                  <strong>{tutor.nombre_completo}</strong>
                  <span className="tutor-dir">
                    <MapPin size={13} /> {tutor.direccion_tutoria}
                  </span>
                </div>
              </div>

              <div className="tutor-materias">
                {tutor.materias.length > 0 ? (
                  tutor.materias.map((materia) => (
                    <span key={materia} className="tag">
                      {materia}
                    </span>
                  ))
                ) : (
                  <span className="muted-text">Sin materias registradas</span>
                )}
              </div>

              <button
                type="button"
                className="primary-button tutor-btn"
                onClick={() => setTutorSeleccionado(tutor)}
              >
                <CalendarClock size={16} /> Ver horarios
              </button>
            </article>
          ))}
        </div>
      )}

      {tutorSeleccionado && (
        <HorarioTutor
          tutor={tutorSeleccionado}
          onClose={() => setTutorSeleccionado(null)}
        />
      )}
    </section>
  );
}
