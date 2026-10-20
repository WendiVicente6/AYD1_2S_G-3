-- ============================================
-- HU-036: el enunciado pide los tipos de recurso
-- Texto, Video, PDF, Ejercicio (no "Enlace", como
-- quedó por error en 06_crear_plan_estudio.sql).
-- Esta migración corrige el CHECK para quien ya
-- haya corrido la 06 contra su base local.
-- ============================================

ALTER TABLE trecurso_plan
    DROP CONSTRAINT IF EXISTS recurso_tipo_ck;

ALTER TABLE trecurso_plan
    ADD CONSTRAINT recurso_tipo_ck
        CHECK (tipo_recurso IN ('Texto', 'Video', 'PDF', 'Ejercicio'));
