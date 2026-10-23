// Pruebas E2E - Carnet 201315335
//   HU-034: Calificar atención de tutoría
//   HU-035: Reportar a un tutor
//
// Requisitos: proyecto levantado con Docker (docker compose up).
// Antes de cada prueba se preparan datos propios en la base de datos
// (estudiante, tutor y una sesión atendida) y se borran la calificación
// y el reporte de la ejecución anterior, para poder correrla varias veces.

const ESTUDIANTE = {
  correo: "e2e.estudiante.201315335@test.com",
  password: "Test1234",
};
const MOTIVO_SESION = "Prueba E2E 201315335";

// Contraseña "Test1234" cifrada con werkzeug (generate_password_hash)
const PASSWORD_HASH =
  "scrypt:32768:8:1$VOONVW052bIDFJ4q$b4790589dd613013f5765be38722e9f300fa8a506f94924b0852e1b492937b58d194fe14024ea1750a0a0047f67c7154b90921f32e3ce490ce6a8f41cfc0ed74";

const ESTUDIANTE_ID = `(SELECT id_usuario FROM tusuario WHERE correo = '${ESTUDIANTE.correo}')`;
const TUTOR_ID = "(SELECT id_usuario FROM tusuario WHERE correo = 'e2e.tutor.201315335@test.com')";

const SQL_PREPARAR_DATOS = [
  // Estudiante de prueba (activo)
  `INSERT INTO tusuario (id_rol, nombres, apellidos, carnet, genero, direccion, telefono, fec_nac, correo, password, id_estado_usr, sn_activo)
   SELECT r.id_rol, 'Lucia', 'Prueba', 99201315, 'F', 'Zona 1', '55555555', DATE '2000-01-01',
          '${ESTUDIANTE.correo}', '${PASSWORD_HASH}', e.id_estado_usr, 1
   FROM trol r, testado_usr e WHERE r.txt_desc = 'Usuario' AND e.txt_desc = 'Activo'
   ON CONFLICT (correo) DO NOTHING;`,

  // Tutor de prueba (activo) con su registro en ttutor y una materia
  `INSERT INTO tusuario (id_rol, nombres, apellidos, carnet, genero, direccion, telefono, fec_nac, correo, password, id_estado_usr, sn_activo)
   SELECT r.id_rol, 'Tomas', 'Tutor E2E', 99201316, 'M', 'Zona 1', '55555555', DATE '1990-01-01',
          'e2e.tutor.201315335@test.com', '${PASSWORD_HASH}', e.id_estado_usr, 1
   FROM trol r, testado_usr e WHERE r.txt_desc = 'Tutor' AND e.txt_desc = 'Activo'
   ON CONFLICT (correo) DO NOTHING;`,
  `INSERT INTO ttutor (id_usuario, nro_id, dir_tutoria, anio_inicio_tutoria, u_graduacion)
   SELECT ${TUTOR_ID}, 99201316, 'Online', DATE '2020-01-01', 'USAC'
   ON CONFLICT (id_usuario) DO NOTHING;`,
  `INSERT INTO ttutor_materia (id_tutor, id_materia)
   SELECT ${TUTOR_ID}, (SELECT MIN(id_materia) FROM tmateria)
   ON CONFLICT DO NOTHING;`,

  // Una sesión ATENDIDA entre los dos (solo se crea la primera vez)
  `INSERT INTO tsesion (id_estudiante, id_tutor, id_materia, id_estado_sesion, fec_sesion, hora_inicio, hora_final, motivo, resumen)
   SELECT ${ESTUDIANTE_ID}, ${TUTOR_ID}, (SELECT MIN(id_materia) FROM tmateria),
          (SELECT id_estado_sesion FROM testado_sesion WHERE txt_desc = 'Completada'),
          DATE '2026-10-01', '09:00', '10:00', '${MOTIVO_SESION}', 'Repaso general'
   WHERE NOT EXISTS (SELECT 1 FROM tsesion WHERE motivo = '${MOTIVO_SESION}');`,

  // Limpia lo que dejó la ejecución anterior, para volver a calificar y reportar
  `DELETE FROM tcalificacion WHERE autor = 'estudiante'
   AND id_sesion IN (SELECT id_sesion FROM tsesion WHERE motivo = '${MOTIVO_SESION}');`,
  `DELETE FROM treporte WHERE autor = 'estudiante'
   AND id_sesion IN (SELECT id_sesion FROM tsesion WHERE motivo = '${MOTIVO_SESION}');`,
].join("\n");

function prepararDatos() {
  // La tarea "ejecutarSQL" está definida en cypress.config.js
  cy.task("ejecutarSQL", SQL_PREPARAR_DATOS);
}

function filaSesionDePrueba() {
  return cy.contains("tr", MOTIVO_SESION);
}

describe("E2E - Calificar y reportar al tutor desde el historial", () => {
  beforeEach(() => {
    prepararDatos();

    // 1. Login como estudiante
    cy.visit("/login");
    cy.get('[data-testid="email"]').type(ESTUDIANTE.correo);
    cy.get('[data-testid="password"]').type(ESTUDIANTE.password);
    cy.get('[data-testid="login-submit"]').click();
    cy.get('[data-testid="dashboard"]').should("be.visible");

    // 2. Ir al Historial de sesiones
    cy.get('[data-testid="menu-historial"]').click();
    cy.url().should("include", "/student/historial");
    filaSesionDePrueba().should("contain", "Atendida");
  });

  it("HU-034: el estudiante califica la atención del tutor", () => {
    // 3. Abrir la ventana de calificación de la sesión atendida
    filaSesionDePrueba().find('[data-testid="calificar-tutor"]').click();

    // 4. Marcar 4 estrellas y escribir un comentario
    cy.get('[data-testid="estrella-4"]').click();
    cy.contains("Calificación (4 de 5)").should("be.visible");
    cy.get('[data-testid="comentario-calificacion"]').type("Explicó muy bien los temas");

    // 5. Confirmar y verificar el mensaje y las estrellas en la tabla
    cy.get('[data-testid="confirmar-calificacion"]').click();
    cy.get('[data-testid="mensaje-exito"]').should("contain", "Tu calificación fue registrada");
    filaSesionDePrueba().find('[data-testid="calificacion-estrellas"]').should("contain", "4");
    filaSesionDePrueba().find('[data-testid="calificar-tutor"]').should("not.exist");
  });

  it("HU-035: el estudiante reporta al tutor", () => {
    // 3. Abrir la ventana de reporte de la sesión atendida
    filaSesionDePrueba().find('[data-testid="reportar-tutor"]').click();

    // 4. Elegir una categoría de las de tutor y escribir la explicación
    cy.get('[data-testid="categoria-reporte"]').should("not.be.disabled");
    cy.get('[data-testid="categoria-reporte"]').select("Impuntualidad o inasistencia");
    cy.get('[data-testid="explicacion-reporte"]').type("El tutor llegó media hora tarde a la sesión");

    // 5. Confirmar y verificar el mensaje y el estado "Reportado" en la tabla
    cy.get('[data-testid="confirmar-reporte"]').click();
    cy.get('[data-testid="mensaje-exito"]').should("contain", "Tu reporte fue enviado al administrador");
    filaSesionDePrueba().find('[data-testid="reportado"]').should("be.visible");
    filaSesionDePrueba().find('[data-testid="reportar-tutor"]').should("not.exist");
  });

  it("HU-034: la calificación se mantiene al recargar y no se puede calificar dos veces", () => {
    // 3. Calificar con 2 estrellas
    filaSesionDePrueba().find('[data-testid="calificar-tutor"]').click();
    cy.get('[data-testid="estrella-2"]').click();
    cy.get('[data-testid="confirmar-calificacion"]').click();
    cy.get('[data-testid="mensaje-exito"]').should("be.visible");

    // 4. Recargar la página: la calificación sigue guardada y ya no aparece el botón
    cy.reload();
    filaSesionDePrueba().find('[data-testid="calificacion-estrellas"]').should("contain", "2");
    filaSesionDePrueba().find('[data-testid="calificar-tutor"]').should("not.exist");
  });

  it("HU-034: cancelar la ventana de calificación no guarda nada", () => {
    // 3. Abrir la ventana, marcar estrellas y presionar Cancelar
    filaSesionDePrueba().find('[data-testid="calificar-tutor"]').click();
    cy.get('[data-testid="estrella-5"]').click();
    cy.get('[role="dialog"]').contains("button", "Cancelar").click();

    // 4. La ventana se cierra y la sesión sigue sin calificar
    cy.get('[role="dialog"]').should("not.exist");
    cy.get('[data-testid="mensaje-exito"]').should("not.exist");
    filaSesionDePrueba().find('[data-testid="calificar-tutor"]').should("be.visible");
  });

  it("HU-035: no se puede enviar un reporte sin explicación", () => {
    // 3. Abrir la ventana y elegir solo la categoría
    filaSesionDePrueba().find('[data-testid="reportar-tutor"]').click();
    cy.get('[data-testid="categoria-reporte"]').should("not.be.disabled");
    cy.get('[data-testid="categoria-reporte"]').select("Negligencia académica");

    // 4. Intentar confirmar con la explicación vacía: el formulario no se envía
    cy.get('[data-testid="confirmar-reporte"]').click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.get('[data-testid="mensaje-exito"]').should("not.exist");

    // 5. Al cerrar la ventana, la sesión sigue sin reportar
    cy.get('[role="dialog"]').contains("button", "Cancelar").click();
    filaSesionDePrueba().find('[data-testid="reportar-tutor"]').should("be.visible");
  });
});
