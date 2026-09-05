import { useState } from "react";
import { setSchedule } from "../../services/scheduleService";

const DIAS = [
  { id: 1, label: "Lunes" }, { id: 2, label: "Martes" }, { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" }, { id: 5, label: "Viernes" }, { id: 6, label: "Sábado" },
  { id: 7, label: "Domingo" },
];

export default function SetSchedule() {
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleDia = (id) => {
    setDiasSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");

    if (diasSeleccionados.length === 0 || !horaInicio || !horaFin) {
      setError("Selecciona al menos un día y ambas horas.");
      return;
    }

    setLoading(true);
    try {
      const result = await setSchedule({
        dias: diasSeleccionados,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      });
      setMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="registration-page">
      <div className="registration-card">
        <h1>Establecer horario de atención</h1>
        <p>Selecciona los días y el rango de horas en que atenderás.</p>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="registration-form">
          <div className="tag-list">
            {DIAS.map(({ id, label }) => (
              <label key={id} style={{ flexDirection: "row", gap: "6px" }}>
                <input
                  type="checkbox"
                  checked={diasSeleccionados.includes(id)}
                  onChange={() => toggleDia(id)}
                />
                {label}
              </label>
            ))}
          </div>

          <label>Hora de inicio
            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </label>
          <label>Hora de fin
            <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
          </label>

          <button disabled={loading}>{loading ? "Guardando..." : "Guardar horario"}</button>
        </form>
      </div>
    </section>
  );
}