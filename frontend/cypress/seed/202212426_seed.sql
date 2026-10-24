-- ============================================================
-- Datos de prueba para la prueba E2E 202212426.cy.js
-- Flujo: el tutor califica a un estudiante desde el Historial de Sesiones.
--
-- Se puede ejecutar todas las veces que haga falta: cada ejecucion deja
-- la sesion de prueba otra vez en estado Completada y SIN calificar,
-- que es la condicion inicial que necesita la prueba.
--
-- Credenciales del tutor de prueba:
--   correo:     tutor.e2e.mario@educonnect.com
--   contrasena: E2eTutor123
--
-- Uso (con Docker levantado):
--   psql "postgresql://postgres:postgres@localhost:5433/EduConnect" \
--        -f frontend/cypress/seed/202212426_seed.sql
-- ============================================================

DO $$
DECLARE
    v_hash        TEXT := 'scrypt:32768:8:1$ka1iZ2qyTNwdFZBb$33688cb9bbcf39b5dab948ee5e6c37c224f0ae7cac72de62430d6ef19e0b49cc9b599cc83050695716de788155206d0941f8a4b0fead0a9d1e88dd8fb47ca164';
    v_rol_tutor   INTEGER;
    v_rol_usuario INTEGER;
    v_activo      INTEGER;
    v_tutor       INTEGER;
    v_estudiante  INTEGER;
    v_materia     INTEGER;
    v_completada  INTEGER;
BEGIN
    SELECT id_rol INTO v_rol_tutor   FROM trol WHERE txt_desc = 'Tutor';
    SELECT id_rol INTO v_rol_usuario FROM trol WHERE txt_desc = 'Usuario';
    SELECT id_estado_usr INTO v_activo FROM testado_usr WHERE txt_desc = 'Activo';
    SELECT id_estado_sesion INTO v_completada FROM testado_sesion WHERE txt_desc = 'Completada';

    -- 1. Tutor de prueba (aprobado y activo)
    INSERT INTO tusuario (id_rol, nombres, apellidos, carnet, genero, direccion,
                          telefono, fec_nac, correo, password, id_estado_usr, sn_activo)
    SELECT v_rol_tutor, 'Mario', 'Tutor E2E', 990000001, 'M', 'Zona 1, Guatemala',
           '55550001', DATE '1995-05-10', 'tutor.e2e.mario@educonnect.com',
           v_hash, v_activo, 1
    WHERE NOT EXISTS (SELECT 1 FROM tusuario WHERE correo = 'tutor.e2e.mario@educonnect.com');

    UPDATE tusuario
       SET password = v_hash, id_estado_usr = v_activo, sn_activo = 1
     WHERE correo = 'tutor.e2e.mario@educonnect.com';

    SELECT id_usuario INTO v_tutor FROM tusuario
     WHERE correo = 'tutor.e2e.mario@educonnect.com';

    INSERT INTO ttutor (id_usuario, nro_id, dir_tutoria, anio_inicio_tutoria, u_graduacion)
    VALUES (v_tutor, 990001, 'Online', DATE '2020-01-15', 'Universidad de San Carlos de Guatemala')
    ON CONFLICT (id_usuario) DO NOTHING;

    -- 2. Estudiante de prueba (aprobado y activo)
    INSERT INTO tusuario (id_rol, nombres, apellidos, carnet, genero, direccion,
                          telefono, fec_nac, correo, password, id_estado_usr, sn_activo)
    SELECT v_rol_usuario, 'Lucia', 'Estudiante E2E', 990000002, 'F', 'Zona 5, Guatemala',
           '55550002', DATE '2001-03-20', 'estudiante.e2e.lucia@educonnect.com',
           v_hash, v_activo, 1
    WHERE NOT EXISTS (SELECT 1 FROM tusuario WHERE correo = 'estudiante.e2e.lucia@educonnect.com');

    SELECT id_usuario INTO v_estudiante FROM tusuario
     WHERE correo = 'estudiante.e2e.lucia@educonnect.com';

    -- 3. Materia de prueba que imparte el tutor
    INSERT INTO tmateria (nombre, txt_desc)
    SELECT 'Calculo E2E', 'Materia para pruebas E2E'
    WHERE NOT EXISTS (SELECT 1 FROM tmateria WHERE nombre = 'Calculo E2E');

    SELECT id_materia INTO v_materia FROM tmateria WHERE nombre = 'Calculo E2E';

    INSERT INTO ttutor_materia (id_tutor, id_materia)
    VALUES (v_tutor, v_materia)
    ON CONFLICT DO NOTHING;

    -- 4. Reiniciar: borrar sesiones previas entre estos dos usuarios y lo que cuelga de ellas
    DELETE FROM trecurso_plan
     WHERE id_plan IN (SELECT p.id_plan FROM tplan_estudio p
                         JOIN tsesion s ON s.id_sesion = p.id_sesion
                        WHERE s.id_tutor = v_tutor AND s.id_estudiante = v_estudiante);
    DELETE FROM tplan_estudio
     WHERE id_sesion IN (SELECT id_sesion FROM tsesion
                          WHERE id_tutor = v_tutor AND id_estudiante = v_estudiante);
    DELETE FROM tcalificacion
     WHERE id_sesion IN (SELECT id_sesion FROM tsesion
                          WHERE id_tutor = v_tutor AND id_estudiante = v_estudiante);
    DELETE FROM treporte
     WHERE id_sesion IN (SELECT id_sesion FROM tsesion
                          WHERE id_tutor = v_tutor AND id_estudiante = v_estudiante);
    DELETE FROM tsesion WHERE id_tutor = v_tutor AND id_estudiante = v_estudiante;

    -- 5. Sesion Completada y sin calificar: punto de partida de la prueba
    INSERT INTO tsesion (id_estudiante, id_tutor, id_materia, id_estado_sesion,
                         fec_sesion, hora_inicio, hora_final, motivo, resumen)
    VALUES (v_estudiante, v_tutor, v_materia, v_completada,
            DATE '2026-09-01', TIME '10:00', TIME '11:00',
            'Sesion de prueba E2E', 'Repaso de derivadas');
END
$$;
