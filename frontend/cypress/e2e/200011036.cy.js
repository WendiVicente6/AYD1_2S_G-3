
describe('E2E - Autenticación y gestión de reportes de tutores', () => {
  const apiUrl = encodeURIComponent(
    'http://educonnect_backend:5000/api'
  );

  // PRUEBA 1: Inicio de sesión
  it('HU-001 - Debe iniciar sesión correctamente', () => {
    cy.intercept('POST', '**/api/auth/login').as('login');

    cy.visit(`/login?apiUrl=${apiUrl}`);

    cy.get('[data-testid="email"]')
      .should('be.visible')
      .type('admin@EduConnect.com');

    cy.get('[data-testid="password"]')
      .should('be.visible')
      .type('123', { log: false });

    cy.get('[data-testid="login-submit"]').click();

    cy.wait('@login', { timeout: 15000 }).then(({ response }) => {
      expect(response, 'respuesta del login').to.exist;
      expect(response.statusCode).to.eq(200);
    });

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/auth2');

    cy.screenshot('200011036-login');
  });

  // PRUEBA 2: Segunda autenticación
  it('HU-002 - Debe validar la segunda autenticación', () => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    cy.intercept('POST', '**/api/auth2').as('auth2');

    cy.visit(`/login?apiUrl=${apiUrl}`);

    cy.get('[data-testid="email"]')
      .should('be.visible')
      .type('admin@EduConnect.com');

    cy.get('[data-testid="password"]')
      .should('be.visible')
      .type('123', { log: false });

    cy.get('[data-testid="login-submit"]').click();

    cy.wait('@login', { timeout: 15000 }).then(({ response }) => {
      expect(response, 'respuesta del login').to.exist;
      expect(response.statusCode).to.eq(200);
    });

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/auth2');

    cy.get('input[type="file"]').selectFile(
      'cypress/fixtures/auth2-ayd1.txt'
    );

    cy.contains('button', 'Validar archivo').click();

    cy.wait('@auth2', { timeout: 15000 }).then(({ response }) => {
      expect(response, 'respuesta de segunda autenticación').to.exist;
      expect(response.statusCode).to.eq(200);
    });

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/admin/dashboard');

    cy.screenshot('200011036-segunda-autenticacion');
  });

  // PRUEBA 3: Rechazar un reporte pendiente
  it('HU-003 - Debe rechazar un reporte pendiente de un tutor', () => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    cy.intercept('POST', '**/api/auth2').as('auth2');

    // Autenticarse de nuevo porque esta prueba es independiente
    cy.visit(`/login?apiUrl=${apiUrl}`);

    cy.get('[data-testid="email"]')
      .should('be.visible')
      .type('admin@EduConnect.com');

    cy.get('[data-testid="password"]')
      .should('be.visible')
      .type('123', { log: false });

    cy.get('[data-testid="login-submit"]').click();

    cy.wait('@login', { timeout: 15000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/auth2');

    cy.get('input[type="file"]').selectFile(
      'cypress/fixtures/auth2-ayd1.txt'
    );

    cy.contains('button', 'Validar archivo').click();

    cy.wait('@auth2', { timeout: 15000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/admin/dashboard');

    // Interceptar la operación antes de abrir la pantalla
    cy.intercept('PATCH', '**/api/admin/reportes/*/rechazar')
      .as('rechazarReporte');

    cy.visit(`/admin/reportes-tutores?apiUrl=${apiUrl}`);

    cy.location('pathname', { timeout: 15000 })
      .should('eq', '/admin/reportes-tutores');

    cy.contains('h1', 'Reportes de tutores', {
      timeout: 15000,
    }).should('be.visible');

    cy.get('.ra-tabla tbody tr', { timeout: 15000 })
      .should('have.length.greaterThan', 0);

    // Localizar un reporte cuyo estado sea Pendiente
    cy.get('.ra-tabla tbody tr').then(($filas) => {
      const filaPendiente = [...$filas].find((fila) => {
        const celdas = fila.querySelectorAll('td');

        return (
          celdas.length >= 7 &&
          celdas[5].textContent.trim() === 'Pendiente'
        );
      });

      if (!filaPendiente) {
        const estados = [...$filas].map((fila) =>
          [...fila.querySelectorAll('td')].map((celda) =>
            celda.textContent.trim()
          )
        );

        throw new Error(
          'No hay reportes pendientes para rechazar. Filas: ' +
          JSON.stringify(estados)
        );
      }

      // Aceptar la confirmación del navegador
      cy.on('window:confirm', () => true);

      cy.wrap(filaPendiente)
        .contains('button', 'Rechazar')
        .should('be.visible')
        .click();
    });

    // Comprobar que el backend rechazó el reporte
    cy.wait('@rechazarReporte', { timeout: 15000 })
      .then(({ response }) => {
        expect(response, 'respuesta del rechazo').to.exist;
        expect(response.statusCode).to.eq(200);
        expect(response.body.ok).to.eq(true);
        expect(response.body.message).to.eq(
          'Reporte rechazado correctamente.'
        );
      });

    cy.contains(
      'p.ra-mensaje',
      'Reporte rechazado correctamente.',
      { timeout: 15000 }
    ).should('be.visible');

    cy.screenshot('200011036-rechazo-reporte-tutor');
  });
});
