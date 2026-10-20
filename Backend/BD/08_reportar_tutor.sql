-- ============================================
-- HU-035: Reportar a un tutor
-- Permite que el estudiante reporte al tutor
-- usando la misma tabla treporte de la HU-038.
-- ============================================

-- 1. Quién hizo el reporte (los de la HU-038 quedan como 'tutor')
ALTER TABLE treporte
    ADD COLUMN autor VARCHAR(10) NOT NULL DEFAULT 'tutor';

ALTER TABLE treporte
    ADD CONSTRAINT reporte_autor_ck
        CHECK (autor IN ('tutor', 'estudiante'));

-- 2. A quién va dirigida cada categoría
--    (las 4 de la HU-038 son contra estudiantes)
ALTER TABLE ttipo_reporte
    ADD COLUMN dirigido_a VARCHAR(10) NOT NULL DEFAULT 'estudiante';

ALTER TABLE ttipo_reporte
    ADD CONSTRAINT tipo_reporte_dirigido_ck
        CHECK (dirigido_a IN ('tutor', 'estudiante'));

-- 3. Categorías para reportar a un tutor
INSERT INTO ttipo_reporte (txt_desc, dirigido_a)
VALUES
    ('Ética y profesionalismo', 'tutor'),
    ('Negligencia académica', 'tutor'),
    ('Abuso y conducta inapropiada', 'tutor'),
    ('Falsificación de información', 'tutor'),
    ('Impuntualidad o inasistencia', 'tutor');
