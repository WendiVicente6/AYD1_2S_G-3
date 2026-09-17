import { useEffect, useState } from "react";
import { MapPin, BookOpen, CalendarClock, Search } from "lucide-react";
import { getTutoresDisponibles } from "../../services/tutorsService";
import { getMaterias } from "../../services/sessionsService";
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

const SEXO_OPCIONES = [
  { value: "", label: "Todos" },
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

export default function TutoresDisponibles() {
  const [tutores, setTutores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tutorSeleccionado, setTutorSeleccionado] = useState(null);

  const [filtros, setFiltros] = useState({
    id_materia: "",
    sexo: "",
    universidad: "",
    anios_exp_min: "",
    edad_min: "",
    edad_max: "",
  });

  useEffect(() => {
    getMaterias()
      .then(setMaterias)
      .catch(() => setMaterias([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const timeoutId = setTimeout(() => {
      getTutoresDisponibles(filtros)
        .then(setTutores)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filtros]);

  const handleFiltroChange = (campo) => (e) => {
    setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Tutores disponibles</h2>
          <p>Selecciona un tutor para ver sus horarios y su disponibilidad.</p>
        </div>
      </div>

      <div className="panel tutor-filtros">
        <div className="tutor-filtros-titulo">
          <Search size={16} /> Búsqueda avanzada
        </div>
        <div className="tutor-filtros-grid">
          <label>
            Materia
            <select value={filtros.id_materia} onChange={handleFiltroChange("id_materia")}>
              <option value="">Todas</option>
              {materias.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sexo
            <select value={filtros.sexo} onChange={handleFiltroChange("sexo")}>
              {SEXO_OPCIONES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Universidad
            <input
              type="text"
              placeholder="Ej. UES"
              value={filtros.universidad}
              onChange={handleFiltroChange("universidad")}
            />
          </label>

          <label>
            Años de experiencia (mín.)
            <input
              type="number"
              min="0"
              value={filtros.anios_exp_min}
              onChange={handleFiltroChange("anios_exp_min")}
            />
          </label>

          <label>
            Edad mínima
            <input
              type="number"
              min="0"
              value={filtros.edad_min}
              onChange={handleFiltroChange("edad_min")}
            />
          </label>

          <label>
            Edad máxima
            <input
              type="number"
              min="0"
              value={filtros.edad_max}
              onChange={handleFiltroChange("edad_max")}
            />
          </label>
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
