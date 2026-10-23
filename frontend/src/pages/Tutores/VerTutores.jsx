
import { useEffect, useState } from "react";
import {
  getActiveTutors,
  deactivateTutor,
  updateTutor,
} from "../../services/tutorsService";

import "../Estudiantes/AprobarEstudiantes.css";

const fechaParaInput = (fecha) => {
  if (!fecha) return "";

  // Admite fechas ISO y fechas devueltas por Flask/Python.
  const texto = String(fecha);

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.substring(0, 10);
  }

  const fechaConvertida = new Date(texto);

  if (Number.isNaN(fechaConvertida.getTime())) return "";

  const anio = fechaConvertida.getUTCFullYear();
  const mes = String(fechaConvertida.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fechaConvertida.getUTCDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

const fechaParaTabla = (fecha) => {
  const valor = fechaParaInput(fecha);
  if (!valor) return "—";

  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
};

export default function VerTutores() {
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tutorEditar, setTutorEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarTutores();
  }, []);

  const cargarTutores = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getActiveTutors();
      setTutores(data.tutores || []);
    } catch (error) {
      console.error("Error al cargar tutores:", error);
      setError("No fue posible cargar los tutores activos.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (tutor) => {
    setTutorEditar({
      ...tutor,
      fec_nac: fechaParaInput(tutor.fec_nac),
      nombres: tutor.nombres || "",
      apellidos: tutor.apellidos || "",
      carnet: tutor.carnet || "",
      genero: tutor.genero || "",
      direccion: tutor.direccion || "",
      telefono: tutor.telefono || "",
      correo: tutor.correo || "",
    });

    setError("");
  };

  const handleCambio = (e) => {
    const { name, value } = e.target;

    setTutorEditar((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();

    if (!tutorEditar) return;

    try {
      setGuardando(true);
      setError("");

      await updateTutor(tutorEditar.id_usuario, {
        nombres: tutorEditar.nombres.trim(),
        apellidos: tutorEditar.apellidos.trim(),
        carnet: tutorEditar.carnet.trim(),
        genero: tutorEditar.genero,
        direccion: tutorEditar.direccion.trim(),
        telefono: tutorEditar.telefono.trim(),
        fec_nac: tutorEditar.fec_nac,
        correo: tutorEditar.correo.trim(),
      });

      await cargarTutores();
      setTutorEditar(null);

      alert("Tutor actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar tutor:", error);
      setError(
        error.message || "No fue posible actualizar los datos del tutor."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleDarDeBaja = async (id_usuario) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea dar de baja a este tutor?"
    );

    if (!confirmar) return;

    try {
      setError("");
      await deactivateTutor(id_usuario);

      setTutores((actuales) =>
        actuales.filter((tutor) => tutor.id_usuario !== id_usuario)
      );

      if (tutorEditar?.id_usuario === id_usuario) {
        setTutorEditar(null);
      }

      alert("Tutor dado de baja correctamente.");
    } catch (error) {
      console.error("Error al dar de baja al tutor:", error);
      setError("No fue posible dar de baja al tutor.");
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Tutores</h2>
        <p>Cargando tutores...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Tutores</h2>

      {error && <p role="alert">{error}</p>}

      {tutorEditar && (
        <form 
         className="form-editar-estudiante"
         onSubmit={handleGuardarEdicion}>
          <h3>Editar tutor</h3>

          <div>
            <label htmlFor="nombres">Nombres</label>
            <input
              id="nombres"
              name="nombres"
              value={tutorEditar.nombres}
              onChange={handleCambio}
              required
            />
          </div>

          <div>
            <label htmlFor="apellidos">Apellidos</label>
            <input
              id="apellidos"
              name="apellidos"
              value={tutorEditar.apellidos}
              onChange={handleCambio}
              required
            />
          </div>

          <div>
            <label htmlFor="carnet">Carnet</label>
            <input
              id="carnet"
              name="carnet"
              value={tutorEditar.carnet}
              onChange={handleCambio}
              required
            />
          </div>

          <div>
            <label htmlFor="genero">Género</label>
            <input
              id="genero"
              name="genero"
              value={tutorEditar.genero}
              onChange={handleCambio}
              required
            />
          </div>

          <div>
            <label htmlFor="fec_nac">Fecha de nacimiento</label>
            <input
              id="fec_nac"
              name="fec_nac"
              type="date"
              value={tutorEditar.fec_nac}
              onChange={handleCambio}
              required
            />
          </div>

          <div>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={tutorEditar.correo}
              onChange={handleCambio}
              required
              readOnly
            />
          </div>

          <div>
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              value={tutorEditar.direccion}
              onChange={handleCambio}
              required
            />
          </div>

          <div>
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              value={tutorEditar.telefono}
              onChange={handleCambio}
              required
            />
          </div>
          <div className="estudiante-acciones">
          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            className="btn-rechazar"
            onClick={() => setTutorEditar(null)}
            disabled={guardando}
          >
            Cancelar
          </button>
          </div>
        </form>
      )}

      {tutores.length === 0 ? (
        <p>No hay tutores activos.</p>
      ) : (
        <div className="estudiantes-table-container">
          <table className="estudiantes-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nombre completo</th>
                <th>Carnet</th>
                <th>Género</th>
                <th>Fecha de nacimiento</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {tutores.map((tutor, index) => (
                <tr key={tutor.id_usuario}>
                  <td>{index + 1}</td>

                  <td className="estudiante-nombre">
                    {tutor.nombres} {tutor.apellidos}
                  </td>

                  <td>{tutor.carnet}</td>
                  <td>{tutor.genero}</td>
                  <td>{fechaParaTabla(tutor.fec_nac)}</td>

                  <td className="estudiante-correo">
                    {tutor.correo}
                  </td>

                  <td>
                    <div>
                      <button
                        type="button"
                        className="btn-aprobar"
                        onClick={() => handleEditar(tutor)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn-rechazar"
                        onClick={() => handleDarDeBaja(tutor.id_usuario)}
                      >
                        Dar de baja
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
