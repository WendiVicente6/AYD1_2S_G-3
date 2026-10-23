
// HU: el tutor registra un plan de estudio estructurado (dificultades +
// recursos recomendados) al atender una sesión.
//
// Las respuestas del backend se simulan con cy.intercept: atender una sesión
// la consume de forma permanente, así que contra la BD real la prueba solo
// podría correr una vez. Con los mocks es repetible y no depende de datos.

const TUTOR = {
  correo: "tutor.e2e@educonnect.com",
  password: "Tu12345678",
};

const SESIONES_PENDIENTES = [
  {
    id_sesion: 901,
    estudiante: "Ana López",
    materia: "Matemática Básica 1",
    motivo: "Repaso de derivadas",
    fecha: "2026-11-05",
    hora_inicio: "08:00",
    hora_final: "09:00",
    estado: "Confirmada",
  },
  {
    id_sesion: 902,
    estudiante: "Carlos Pérez",
    materia: "Física Básica",
    motivo: "Cinemática",
    fecha: "2026-11-06",
    hora_inicio: "10:00",
    hora_final: "11:00",
    estado: "Pendiente",
  },
];

function abrirAtenderSesion(estudiante) {
  cy.contains(".session-row", estudiante).contains("button", "Acciones").click();
  cy.get('[role="dialog"]').should("be.visible");
  cy.get('[role="dialog"]').contains("button", "Atender").click();
  cy.get('[role="dialog"]').contains("h2", "Atender sesión").should("be.visible");
}

describe("E2E - Plan de estudio al atender una sesión (Tutor)", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/api/auth/login", {
      statusCode: 200,
      body: {
        token: "token-e2e-tutor",
        user: { id: 50, nombres: "Tutor", apellidos: "E2E", correo: TUTOR.correo, role: "tutor" },
      },
    }).as("login");

    cy.intercept("GET", "**/api/tutor/dashboard", {
      statusCode: 200,
      body: { stats: { sesiones_pendientes: 2, estudiantes_atendidos: 0 } },
    });

    cy.intercept("GET", "**/api/tutors/sessions/pending", {
      statusCode: 200,
      body: { sesiones: SESIONES_PENDIENTES },
    }).as("pendientes");

    cy.intercept("PUT", "**/api/tutors/sessions/*/attend", {
      statusCode: 200,
      body: { message: "Sesión marcada como atendida y plan de estudio registrado." },
    }).as("atender");

    // 1. Login como tutor
    cy.visit("/login");
    cy.get('[data-testid="email"]').type(TUTOR.correo);
    cy.get('[data-testid="password"]').type(TUTOR.password);
    cy.get('[data-testid="login-submit"]').click();
    cy.wait("@login");

    cy.get('[data-testid="dashboard"]').should("be.visible");

    // 2. Ir a Sesiones pendientes
    cy.get('[data-testid="menu-sesiones"]').click();
    cy.url().should("include", "/sessions");
    cy.wait("@pendientes");
    cy.get(".session-row").should("have.length", 2);
  });

  it("exige las dificultades identificadas: no permite guardar sin ellas", () => {
    abrirAtenderSesion("Ana López");

    cy.get('textarea[placeholder^="Temas donde el estudiante"]').should("have.attr", "required");

    cy.contains("button", "Confirmar atención").click();

    // El formulario sigue abierto, el campo es inválido y no se llamó al backend
    cy.get('textarea[placeholder^="Temas donde el estudiante"]')
      .then(($el) => expect($el[0].checkValidity()).to.be.false);
    cy.get('[role="dialog"]').contains("h2", "Atender sesión").should("be.visible");
    cy.get("@atender.all").should("have.length", 0);
    cy.get(".session-row").should("have.length", 2);
  });

  it("no permite guardar un recurso recomendado incompleto", () => {
    abrirAtenderSesion("Ana López");

    cy.get('textarea[placeholder^="Temas donde el estudiante"]').type("Regla de la cadena");
    cy.contains("button", "Agregar recurso").click();

    // Recurso sin nombre ni descripción
    cy.contains("button", "Confirmar atención").click();

    cy.get('input[placeholder="Nombre del recurso"]')
      .then(($el) => expect($el[0].checkValidity()).to.be.false);
    cy.get("@atender.all").should("have.length", 0);
  });

  it("permite agregar y quitar recursos con los tipos Texto, Video, PDF y Ejercicio", () => {
    abrirAtenderSesion("Ana López");

    cy.contains("button", "Agregar recurso").click();
    cy.get('[role="dialog"] select')
      .first()
      .find("option")
      .then(($opts) => {
        expect([...$opts].map((o) => o.value)).to.deep.equal(["Texto", "Video", "PDF", "Ejercicio"]);
      });

    cy.contains("button", "Agregar recurso").click();
    cy.get('input[placeholder="Nombre del recurso"]').should("have.length", 2);

    cy.get('[aria-label="Quitar recurso"]').first().click();
    cy.get('input[placeholder="Nombre del recurso"]').should("have.length", 1);
  });

  it("registra el plan completo, marca la sesión como atendida y la quita de pendientes", () => {
    abrirAtenderSesion("Ana López");

    // 3. Dificultades identificadas (obligatorio)
    cy.get('textarea[placeholder^="Temas donde el estudiante"]')
      .type("Regla de la cadena y derivadas implícitas");

    // 4. Dos recursos recomendados
    cy.contains("button", "Agregar recurso").click();
    cy.contains("button", "Agregar recurso").click();

    cy.get('input[placeholder="Nombre del recurso"]').eq(0).type("Video de regla de la cadena");
    cy.get('[role="dialog"] select').eq(0).select("Video");
    cy.get('textarea[placeholder^="Descripción de uso"]').eq(0).type("Ver antes de la próxima sesión");

    cy.get('input[placeholder="Nombre del recurso"]').eq(1).type("Hoja de ejercicios 3");
    cy.get('[role="dialog"] select').eq(1).select("Ejercicio");
    cy.get('textarea[placeholder^="Descripción de uso"]').eq(1).type("Resolver los ejercicios 1 al 10");

    // 5. Confirmar
    cy.contains("button", "Confirmar atención").click();

    // El plan completo se envía al backend para la sesión correcta
    cy.wait("@atender").then(({ request }) => {
      expect(request.url).to.include("/tutors/sessions/901/attend");
      expect(request.body).to.deep.equal({
        dificultades: "Regla de la cadena y derivadas implícitas",
        recursos: [
          { nombre: "Video de regla de la cadena", tipo: "Video", descripcion: "Ver antes de la próxima sesión" },
          { nombre: "Hoja de ejercicios 3", tipo: "Ejercicio", descripcion: "Resolver los ejercicios 1 al 10" },
        ],
      });
    });

    // 6. Modal cerrado, mensaje de éxito y la sesión desaparece de pendientes
    cy.get('[role="dialog"]').should("not.exist");
    cy.get(".alert.success").should("contain", "atendida");
    cy.get(".session-row").should("have.length", 1);
    cy.contains(".session-row", "Ana López").should("not.exist");
    cy.contains(".session-row", "Carlos Pérez").should("be.visible");
  });

  it("permite atender una sesión solo con dificultades (recursos opcionales)", () => {
    abrirAtenderSesion("Carlos Pérez");

    cy.get('textarea[placeholder^="Temas donde el estudiante"]').type("Movimiento parabólico");
    cy.contains("button", "Confirmar atención").click();

    cy.wait("@atender").its("request.body").should("deep.equal", {
      dificultades: "Movimiento parabólico",
      recursos: [],
    });
    cy.contains(".session-row", "Carlos Pérez").should("not.exist");
  });
});
