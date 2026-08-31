-- ============================================
-- ROLES
-- ============================================

INSERT INTO trol (txt_desc)
VALUES
    ('Admin'),
    ('Usuario'),
    ('Tutor');


-- ============================================
-- ESTADOS DE USUARIO
-- ============================================

INSERT INTO testado_usr (txt_desc)
VALUES
    ('Pendiente'),
    ('Activo'),
    ('Inactivo'),
    ('Rechazado');


-- ============================================
-- ESTADOS DE SESIÓN
-- ============================================

INSERT INTO testado_sesion (txt_desc)
VALUES
    ('Pendiente'),
    ('Confirmada'),
    ('Completada'),
    ('Cancelada');