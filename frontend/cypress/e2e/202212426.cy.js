// ============================================================
// Prueba E2E - Mario Ernesto López Pivaral - 202212426
// Módulo Tutor: calificar a un estudiante desde el Historial de Sesiones (HU-037)
//
// Antes de ejecutarla:
//   1. Levantar el sistema: docker compose up -d
//   2. Asegurar que las migraciones de BD ya esten aplicadas.
//      No hace falta ejecutar el seed manualmente: se carga antes
//      de CADA escenario mediante cy.task().
//
// Ejecutar:
//   cd frontend
//   npx cypress open
//   npx cypress run --spec cypress/e2e/202212426.cy.js --browser firefox
// ============================================================

const TUTOR = {
  correo: "tutor.e2e.mario@educonnect.com",
  password: "E2eTutor123",
};

const ESTUDIANTE = "Lucia Estudiante E2E";

const filaDelEstudiante = () =>
  cy.contains('[data-testid="fila-sesion"]', ESTUDIANTE);

describe("E2E - Calificar a un estudiante desde el historial (Tutor)", () => {
  beforeEach(() => {
    // Crear/restablecer usuarios y sesión E2E en PostgreSQL automáticamente.
    cy.task("prepararDatosE2E202212426");

    // 1. Iniciar sesión como tutor
    cy.visit("/login");
    cy.get('[data-testid="email"]').type(TUTOR.correo);
    cy.get('[data-testid="password"]').type(TUTOR.password, { log: false });
    cy.get('[data-testid="login-submit"]').click();

    // 2. Comprobar que se abrió el dashboard
    cy.get('[data-testid="dashboard"]').should("be.visible");

    // 3. Ir al Historial de Sesiones desde el menú lateral
    cy.get('[data-testid="menu-historial-de-sesiones"]').click();
    cy.url().should("include", "/tutor/historial");
  });

  it("permite cancelar el formulario sin calificar al estudiante", () => {
    // 4. La sesión completada ofrece las acciones Calificar y Reportar
    filaDelEstudiante().within(() => {
      cy.get('[data-testid="btn-calificar"]').should("be.visible").click();
    });

    // 5. Se abre el formulario de calificación del estudiante correcto
    cy.get('[data-testid="modal-calificar"]')
      .should("be.visible")
      .and("contain", ESTUDIANTE);

    // 6. Cancelar cierra el formulario
    cy.contains("button", "Cancelar").click();
    cy.get('[data-testid="modal-calificar"]').should("not.exist");

    // 7. No se registró ninguna calificación: el botón sigue disponible
    filaDelEstudiante().within(() => {
      cy.get('[data-testid="calificacion-estrellas"]').should("not.exist");
      cy.get('[data-testid="btn-calificar"]').should("be.visible");
    });
  });

  it("califica al estudiante y reemplaza el botón por la calificación", () => {
    // 4. Abrir el formulario de calificación
    filaDelEstudiante().within(() => {
      cy.get('[data-testid="btn-calificar"]').should("be.visible").click();
    });
    cy.get('[data-testid="modal-calificar"]')
      .should("be.visible")
      .and("contain", ESTUDIANTE);

    // 5. Elegir 4 estrellas y escribir un comentario
    cy.get('[data-testid="estrella-4"]').click();
    cy.get('[data-testid="comentario-calificacion"]').type(
      "Estudiante participativa. Prueba E2E."
    );

    // 6. Confirmar la calificación
    cy.get('[data-testid="confirmar-calificacion"]').click();

    // 7. El sistema confirma y cierra el formulario
    cy.get('[data-testid="mensaje-exito"]').should(
      "contain",
      "calificado correctamente"
    );
    cy.get('[data-testid="modal-calificar"]').should("not.exist");

    // 8. La fila muestra la calificación y ya no ofrece volver a calificar
    filaDelEstudiante().within(() => {
      cy.get('[data-testid="calificacion-estrellas"]').should("contain", "4");
      cy.get('[data-testid="btn-calificar"]').should("not.exist");
      cy.get('[data-testid="btn-reportar"]').should("be.visible");
    });

    // 9. La calificación quedó guardada: persiste al recargar la página
    cy.reload();
    filaDelEstudiante().within(() => {
      cy.get('[data-testid="calificacion-estrellas"]').should("contain", "4");
      cy.get('[data-testid="btn-calificar"]').should("not.exist");
    });

    // 10. Cerrar sesión y comprobar que vuelve al login
    cy.get('[data-testid="logout"]').click();
    cy.url().should("include", "/login");
    cy.get('[data-testid="login-submit"]').should("be.visible");
  });
});
