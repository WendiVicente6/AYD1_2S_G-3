-- ============================================
-- HU-032 / HU-036: Plan de estudio de una sesión
--
-- Campos pedidos en el enunciado de Fase 2 para "Ver Plan de Estudio":
--   - Fecha de la última sesión         -> tsesion.fec_sesion (JOIN, no se duplica aquí)
--   - Nombre completo del tutor         -> tusuario (JOIN, no se duplica aquí)
--   - Especialidad del tutor            -> tmateria de la sesión (JOIN, no se duplica aquí)
--   - Número de identificación del tutor-> ttutor.nro_id (JOIN, no se duplica aquí)
--   - Dificultades identificadas        -> tplan_estudio.dificultades
--   - Recursos recomendados, cada uno con nombre, tipo y descripción de uso
--                                        -> trecurso_plan (nombre_recurso, tipo_recurso, descripcion_uso)
-- ============================================

CREATE TABLE IF NOT EXISTS tplan_estudio (
    id_plan INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sesion INTEGER NOT NULL,
    dificultades VARCHAR(500),
    fec_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plan_estudio_sesion_fk FOREIGN KEY (id_sesion) REFERENCES tsesion (id_sesion)
);

CREATE TABLE IF NOT EXISTS trecurso_plan (
    id_recurso INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_plan INTEGER NOT NULL,
    nombre_recurso VARCHAR(150) NOT NULL,
    tipo_recurso VARCHAR(20) NOT NULL,
    descripcion_uso VARCHAR(255) NOT NULL,
    orden INTEGER,
    CONSTRAINT recurso_plan_plan_fk FOREIGN KEY (id_plan) REFERENCES tplan_estudio (id_plan),
    CONSTRAINT recurso_tipo_ck CHECK (tipo_recurso IN ('Texto', 'Video', 'PDF', 'Enlace'))
);
