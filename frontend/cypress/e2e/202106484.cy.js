
describe("E2E - Inicio de sesión en EduConnect", () => {
  it("permite al usuario iniciar sesión y acceder al sistema", () => {
    // 1. Abrir la pantalla de inicio de sesión
    cy.visit("/login");

    // 2. Ingresar credenciales válidas de prueba
    cy.get('[data-testid="email"]')
      .type("vicentewendi39@gmail.com");

    cy.get('[data-testid="password"]')
      .type("Qw123456");

    // 3. Enviar el formulario
    cy.get('[data-testid="login-submit"]').click();

    // 4. Comprobar que se abrió el dashboard
    cy.get('[data-testid="dashboard"]').should("be.visible");

    // 5. Visitar el panel de tutores
    cy.get('[data-testid="menu-buscar-tutores"]').click();
    cy.url().should("include", "/student/tutores");  

    // 8. Cerrar sesión
    cy.get('[data-testid="logout"]').click();

    // 9. Comprobar que volvió al login
    cy.url().should("include", "/login");
    cy.get('[data-testid="login-submit"]').should("be.visible");
  });
});
