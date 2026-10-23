-- ============================================
-- HU-034: Calificar atención de tutoría
-- Permite que el estudiante califique al tutor
-- en la misma sesión en que el tutor ya pudo
-- calificar al estudiante (HU-037).
-- ============================================

-- 1. Quién hizo la calificación
ALTER TABLE tcalificacion
    ADD COLUMN autor VARCHAR(10) NOT NULL DEFAULT 'tutor';

-- 2. Solo se permiten esos dos valores
ALTER TABLE tcalificacion
    ADD CONSTRAINT calificacion_autor_ck
        CHECK (autor IN ('tutor', 'estudiante'));

-- 3. Antes: una sola calificación por sesión
ALTER TABLE tcalificacion
    DROP CONSTRAINT calificacion_sesion_un;

-- 4. Ahora: una calificación por sesión y por autor
ALTER TABLE tcalificacion
    ADD CONSTRAINT calificacion_sesion_autor_un
        UNIQUE (id_sesion, autor);
