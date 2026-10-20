-- ============================================
-- Registro de estudiante: adjuntar PDF del carnet universitario.
-- Registro de tutor: adjuntar PDF del curriculum (CV).
--
-- Estas columnas ya quedaron agregadas en
-- 01_Inicializacion_BD_postgreSQL.sql para instalaciones
-- nuevas; esta migración las agrega a bases que ya
-- existían antes de ese cambio.
-- ============================================

ALTER TABLE tusuario
    ADD COLUMN IF NOT EXISTS carnet_pdf BYTEA,
    ADD COLUMN IF NOT EXISTS carnet_pdf_nombre VARCHAR(255);

ALTER TABLE ttutor
    ADD COLUMN IF NOT EXISTS cv_pdf BYTEA,
    ADD COLUMN IF NOT EXISTS cv_pdf_nombre VARCHAR(255);
