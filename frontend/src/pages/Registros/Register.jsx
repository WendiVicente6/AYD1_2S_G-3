import { useNavigate } from "react-router-dom";


export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-selection">
      <div className="register-card">
        <h1>Crear una cuenta</h1>

        <p>
          Selecciona el tipo de cuenta que deseas registrar.
        </p>

        <div className="role-options">

          <button
            type="button"
            onClick={() => navigate("/register/student")}
          >
            <h2>Estudiante</h2>
            <p>
              Quiero buscar y recibir tutorías académicas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/register/tutor")}
          >
            <h2>Tutor</h2>
            <p>
              Quiero ofrecer tutorías académicas.
            </p>
          </button>

        </div>
      </div>
    </div>
  );
}