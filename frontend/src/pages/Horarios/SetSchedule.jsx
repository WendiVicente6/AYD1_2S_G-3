import { useEffect, useState } from "react";
import { getSchedule, createSchedule, updateSchedule } from "../../services/scheduleService";

const DIAS = [
  { id: 1, label: "Lunes" }, { id: 2, label: "Martes" }, { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" }, { id: 5, label: "Viernes" }, { id: 6, label: "Sábado" },
  { id: 7, label: "Domingo" },
];

export default function SetSchedule() {
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [existeHorario, setExisteHorario] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const horario = await getSchedule();
        if (horario) {
          setExisteHorario(true);
          setDiasSeleccionados(horario.dias);
          setHoraInicio(horario.hora_inicio);
          setHoraFin(horario.hora_fin);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargandoInicial(false);
      }
    }
    cargar();
  }, []);

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
    const payload = { dias: diasSeleccionados, hora_inicio: horaInicio, hora_fin: horaFin };

    try {
      const result = existeHorario
        ? await updateSchedule(payload)
        : await createSchedule(payload);
      setMessage(result.message);
      setExisteHorario(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cargandoInicial) {
    return <section className="registration-page"><p>Cargando horario...</p></section>;
  }

  return (
    <section className="registration-page">
      <div className="registration-card">
        <h1>{existeHorario ? "Actualizar" : "Establecer"} horario de atención</h1>
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

          <button disabled={loading}>
            {loading ? "Guardando..." : existeHorario ? "Actualizar horario" : "Guardar horario"}
          </button>
        </form>
      </div>
    </section>
  );
}