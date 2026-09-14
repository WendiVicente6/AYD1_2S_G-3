-- ============================================
-- HU: Cancelación de sesiones (tutor / estudiante)
-- Agrega quién canceló la sesión, ya sea el tutor
-- o el estudiante de esa misma sesión.
-- ============================================

ALTER TABLE tsesion
    ADD COLUMN id_usuario_cancelacion INTEGER;

ALTER TABLE tsesion
    ADD CONSTRAINT sesion_cancelacion_fk
        FOREIGN KEY (id_usuario_cancelacion)
        REFERENCES tusuario (id_usuario);

-- Solo puede haber cancelado el tutor o el estudiante de esa sesión
ALTER TABLE tsesion
    ADD CONSTRAINT sesion_cancelacion_ck
        CHECK (
            id_usuario_cancelacion IS NULL
            OR id_usuario_cancelacion IN (id_tutor, id_estudiante)
        );
