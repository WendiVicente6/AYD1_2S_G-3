
// Estudiante de prueba propio (ver Backend/BD/09_datos_prueba_demo.sql),
// no depende de la cuenta de ningún compañero.
const ESTUDIANTE = {
  correo: "miguel.sacher92@gmail.com",
  password: "Ma12345678",
};

describe("E2E - Plan de estudio del estudiante", () => {
  beforeEach(() => {
    // 1. Login como estudiante
    cy.visit("/login");
    cy.get('[data-testid="email"]').type(ESTUDIANTE.correo);
    cy.get('[data-testid="password"]').type(ESTUDIANTE.password);
    cy.get('[data-testid="login-submit"]').click();

    cy.get('[data-testid="dashboard"]').should("be.visible");

    // 2. Ir al Historial de sesiones
    cy.get('[data-testid="menu-historial"]').click();
    cy.url().should("include", "/student/historial");
  });

  it("HU-032: muestra el plan de estudio de una sesión atendida", () => {
    // 3. Abrir "Ver plan" de la primera sesión con plan registrado
    cy.get('[data-testid="ver-plan"]').first().click();

    cy.get('[data-testid="plan-estudio"]').should("be.visible");

    // 4. Verificar que se muestran los datos pedidos por el enunciado
    cy.contains("Fecha de la última sesión").should("be.visible");
    cy.contains("Número de identificación del tutor").should("be.visible");
    cy.contains("Dificultades identificadas").should("be.visible");
    cy.contains("Recursos recomendados").should("be.visible");
    cy.get('[data-testid="recursos-lista"]').children().should("have.length.greaterThan", 0);
  });

  it("HU-033: genera el PDF del plan de estudio sin errores", () => {
    cy.get('[data-testid="ver-plan"]').first().click();
    cy.get('[data-testid="plan-estudio"]').should("be.visible");

    // 5. Dar clic en "Descargar PDF" (jsPDF genera el archivo en el navegador,
    // sin pasar por el backend) y verificar que no aparece ningún error.
    cy.get('[data-testid="descargar-pdf"]').click();

    cy.get(".alert.error").should("not.exist");
  });

  it("el botón de volver regresa al historial de sesiones", () => {
    cy.get('[data-testid="ver-plan"]').first().click();
    cy.get('[data-testid="volver-historial"]').click();

    cy.url().should("include", "/student/historial");
  });
});
