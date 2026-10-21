                                                                                                                                                                                                import { useEffect, useState } from "react";
import {
  getActiveStudents,
  deactivateStudent,
  updateStudent,
} from "../../services/studentService";

import "./AprobarEstudiantes.css";

export default function VerEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estudianteEditar, setEstudianteEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
 const formatearFechaDDMMYYYY = (fecha) => {
  if (!fecha) return "";

  const texto = String(fecha);
  let anio, mes, dia;

  // Fecha ISO: YYYY-MM-DD
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    [, anio, mes, dia] = iso;
  } else {
    // Fecha en texto, por ejemplo: Tue, 17 Aug 2004...
    const convertida = new Date(texto);

    if (Number.isNaN(convertida.getTime())) return "";

    dia = String(convertida.getUTCDate()).padStart(2, "0");
    mes = String(convertida.getUTCMonth() + 1).padStart(2, "0");
    anio = String(convertida.getUTCFullYear());
  }

  return `${dia}/${mes}/${anio}`;
};

const convertirFechaParaInput = (fecha) => {
  if (!fecha) return "";

  const texto = String(fecha);

  // Si la fecha ya viene como YYYY-MM-DD
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  // Si viene en otro formato, por ejemplo:
  // Tue, 17 Aug 2004 00:00:00 GMT
  const convertida = new Date(texto);

  if (Number.isNaN(convertida.getTime())) return "";

  const anio = convertida.getUTCFullYear();
  const mes = String(convertida.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(convertida.getUTCDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getActiveStudents();

      console.log("Estudiantes activos:", data);

      setEstudiantes(data.estudiantes || []);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      setError("No fue posible cargar los estudiantes activos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDarDeBaja = async (id_usuario) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea dar de baja a este estudiante?"
    );

    if (!confirmar) return;

    try {
      setError("");

      await deactivateStudent(id_usuario);

      setEstudiantes((actuales) =>
        actuales.filter(
          (estudiante) => estudiante.id_usuario !== id_usuario
        )
      );

      alert("Estudiante dado de baja correctamente.");
    } catch (error) {
      console.error("Error al dar de baja al estudiante:", error);
      setError("No fue posible dar de baja al estudiante.");
    }
  };


  const handleGuardarEdicion = async (e) => {
    e.preventDefault();

    if (!estudianteEditar) return;

    try {
      setGuardando(true);
      setError("");

      const respuesta = await updateStudent(
        estudianteEditar.id_usuario,
        {
          nombres: estudianteEditar.nombres,
          apellidos: estudianteEditar.apellidos,
          carnet: estudianteEditar.carnet,
          genero: estudianteEditar.genero,
          direccion: estudianteEditar.direccion,
          telefono: estudianteEditar.telefono,
          fec_nac: estudianteEditar.fec_nac,
          correo: estudianteEditar.correo
        }
      );

      const estudianteActualizado = respuesta.estudiante;

      setEstudiantes((actuales) =>
        actuales.map((estudiante) =>
          estudiante.id_usuario === estudianteActualizado.id_usuario
            ? { ...estudiante, ...estudianteActualizado }
            : estudiante
        )
      );

      setEstudianteEditar(null);
      alert("Estudiante actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar estudiante:", error);
      setError(
        error.message || "No fue posible actualizar al estudiante."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Estudiantes</h2>
        <p>Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Estudiantes</h2>

      {error && <p>{error}</p>}

      
{estudianteEditar && (
  <form onSubmit={handleGuardarEdicion} className="form-editar-estudiante">
    <h3>Editar estudiante</h3>

    <div>
      <label>Nombres</label>
      <input
        type="text"
        value={estudianteEditar.nombres || ""}
        onChange={(e) =>
          setEstudianteEditar({
            ...estudianteEditar,
            nombres: e.target.value,
          })
        }
        required
      />
    </div>

    <div>
      <label>Apellidos</label>
      <input
        type="text"
        value={estudianteEditar.apellidos || ""}
        onChange={(e) =>
          setEstudianteEditar({
            ...estudianteEditar,
            apellidos: e.target.value,
          })
        }
        required
      />
    </div>

    <div>
      <label>Carnet</label>
      <input
        type="text"
        value={estudianteEditar.carnet || ""}
        onChange={(e) =>
          setEstudianteEditar({
            ...estudianteEditar,
            carnet: e.target.value,
          })
        }
        required
      />
    </div>

    <div>
      <label>Género</label>
      <input
        type="text"
        value={estudianteEditar.genero || ""}
        onChange={(e) =>
          setEstudianteEditar({
            ...estudianteEditar,
            genero: e.target.value,
          })
        }
        required
      />
    </div>

    <div>
      <label>Dirección</label>
      <input
        type="text"
        value={estudianteEditar.direccion || ""}
        onChange={(e) =>
          setEstudianteEditar({
            ...estudianteEditar,
            direccion: e.target.value,
          })
        }
        required
      />
    </div>

    <div>
      <label>Teléfono</label>
      <input
        type="tel"
        value={estudianteEditar.telefono || ""}
        onChange={(e) =>
          setEstudianteEditar({
            ...estudianteEditar,
            telefono: e.target.value,
          })
        }
        required
      />
    </div>

    <div>
          <label>Fecha de nacimiento</label>
          <input
      type="date"
      value={convertirFechaParaInput(estudianteEditar.fec_nac)}
      onChange={(e) =>
        setEstudianteEditar({
          ...estudianteEditar,
          fec_nac: e.target.value,
        })
      }
      required
  />
    </div>

    <div>
      <label>Correo electrónico</label>
      <input
          id="correo"
          type="email"
          value={estudianteEditar.correo || ""}
          readOnly
          />
    </div>

    <div className="estudiante-acciones">
      <button type="submit" disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

      <button
        type="button"
        className="btn-rechazar"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         isabled={guardando}
        onClick={() => setEstudianteEditar(null)}
      >
        Cancelar
      </button>
    </div>
  </form>
)}


      {estudiantes.length === 0 ? (
        <p>No hay estudiantes activos.</p>
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
              {estudiantes.map((estudiante, index) => (
                <tr key={estudiante.id_usuario}>
                 <td>
                  {index + 1}
                </td>
                  <td className="estudiante-nombre">
                    {estudiante.nombres} {estudiante.apellidos}
                  </td>

                  <td>{estudiante.carnet}</td>

                  <td>{estudiante.genero}</td>

                  <td>{formatearFechaDDMMYYYY(estudiante.fec_nac)}</td>

                  <td className="estudiante-correo">
                    {estudiante.correo}
                  </td>

                  <td>
                    <div className="estudiante-acciones">
                       <button
                          type="button"
                          className="btn-aprobar"
                          //onClick={() => setEstudianteEditar({ ...estudiante })}
                          onClick={() => {console.log("Fecha recibida:", estudiante.fec_nac);
                          setEstudianteEditar({ ...estudiante });
                        }}
                        >
                          Editar
                        </button>
                      <button
                        type="button"
                        className="btn-rechazar"
                        onClick={() =>
                          handleDarDeBaja(estudiante.id_usuario)
                        }
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



