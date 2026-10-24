import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export default {
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    video: true,

    setupNodeEvents(on, config) {
      on("task", {
        prepararDatosE2E202212426() {
          // Solo permitir datos de prueba contra la aplicacion local.
          const host = new URL(config.baseUrl).hostname;
          if (host !== "localhost" && host !== "127.0.0.1") {
            throw new Error("El seed E2E solo puede ejecutarse contra localhost.");
          }

          const rutaSQL = fileURLToPath(
            new URL("./cypress/seed/202212426_seed.sql", import.meta.url)
          );
          const sql = readFileSync(rutaSQL, "utf8");
          const resultado = spawnSync(
            "docker",
            [
              "exec", "-i", "educonnect_db", "psql", "-X",
              "-v", "ON_ERROR_STOP=1", "-U", "postgres",
              "-d", "EduConnect"
            ],
            { input: sql, encoding: "utf8", timeout: 30000 }
          );

          if (resultado.error) {
            throw new Error(`No se pudo ejecutar Docker: ${resultado.error.message}`);
          }
          if (resultado.status !== 0) {
            throw new Error(`Error preparando datos E2E: ${resultado.stderr || resultado.stdout}`);
          }
          return resultado.stdout.trim() || "Datos E2E preparados";
        },
      });
    },
  },
};
