import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getHorarioTutor, getDisponibilidad } from "../../services/tutorsService";

const DIAS_LABEL = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export default function HorarioTutor({ tutor, onClose }) {
  // Horario general del tutor (días + rango de horas)
  const [horario, setHorario] = useState(null);
  const [loadingHorario, setLoadingHorario] = useState(true);
  const [errorHorario, setErrorHorario] = useState("");

  // Disponibilidad para una fecha concreta
  const [fecha, setFecha] = useState("");
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [errorDisp, setErrorDisp] = useState("");

  // Al abrir el modal, cargar el horario general del tutor
  useEffect(() => {
    getHorarioTutor(tutor.id_tutor)
      .then(setHorario)
      .catch((err) => setErrorHorario(err.message))
      .finally(() => setLoadingHorario(false));
  }, [tutor.id_tutor]);

  // Cada vez que cambia la fecha, consultar disponibilidad
  useEffect(() => {
    if (!fecha) {
      setDisponibilidad(null);
      return;
    }
    setLoadingDisp(true);
    setErrorDisp("");
    getDisponibilidad(tutor.id_tutor, fecha)
      .then(setDisponibilidad)
      .catch((err) => setErrorDisp(err.message))
      .finally(() => setLoadingDisp(false));
  }, [fecha, tutor.id_tutor]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Horario de {tutor.nombre_completo}</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loadingHorario && <p className="muted-text">Cargando horario...</p>}

        {!loadingHorario && errorHorario && (
          <div className="alert error">{errorHorario}</div>
        )}

        {!loadingHorario && !errorHorario && !horario && (
          <p className="muted-text">
            Este tutor todavía no ha configurado su horario de atención.
          </p>
        )}

        {!loadingHorario && horario && (
          <>
            <div className="horario-resumen">
              <p>
                <strong>Días de atención:</strong>{" "}
                {horario.dias.map((dia) => DIAS_LABEL[dia]).join(", ")}
              </p>
              <p>
                <strong>Horario:</strong> {horario.hora_inicio} - {horario.hora_fin}
              </p>
            </div>

            <label className="fecha-label">
              Consultar disponibilidad por fecha
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>

            {loadingDisp && (
              <p className="muted-text">Consultando disponibilidad...</p>
            )}

            {errorDisp && <div className="alert error">{errorDisp}</div>}

            {disponibilidad && !loadingDisp && !disponibilidad.atiende && (
              <div className="notice">
                {disponibilidad.mensaje ||
                  "El tutor no atiende el día seleccionado."}
              </div>
            )}

            {disponibilidad && !loadingDisp && disponibilidad.atiende && (
              <div className="slots-grid">
                {disponibilidad.slots.map((slot) => (
                  <div
                    key={slot.hora_inicio}
                    className={`slot slot-${slot.estado}`}
                  >
                    {slot.hora_inicio} - {slot.hora_fin}
                    <span>
                      {slot.estado === "ocupado" ? "Ocupado" : "Disponible"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
