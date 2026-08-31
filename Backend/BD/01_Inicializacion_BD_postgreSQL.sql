--create database EduConnect
--use EduConnect
-- ============================================
-- TABLAS DE CATÁLOGO
-- ============================================

CREATE TABLE trol (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    txt_desc VARCHAR(150) NOT NULL
);


CREATE TABLE testado_usr (
    id_estado_usr INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    txt_desc VARCHAR(50) NOT NULL
);


CREATE TABLE testado_sesion (
    id_estado_sesion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    txt_desc VARCHAR(150) NOT NULL
);


-- ============================================
-- USUARIOS
-- ============================================

CREATE TABLE tusuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol INTEGER NOT NULL,

    nombres VARCHAR(50) NOT NULL,
    apellidos VARCHAR(60) NOT NULL,

    carnet INTEGER NOT NULL,

    genero CHAR(1) NOT NULL,

    direccion VARCHAR(150) NOT NULL,
    telefono VARCHAR(12),

    fec_nac DATE NOT NULL,

    foto BYTEA,

    correo VARCHAR(150) NOT NULL,
    password VARCHAR(250),

    id_estado_usr INTEGER NOT NULL,

    fec_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    sn_activo INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT tusuario_carnet_un UNIQUE (carnet),

    CONSTRAINT tusuario_correo_un UNIQUE (correo),

    CONSTRAINT tusuario_rol_fk
        FOREIGN KEY (id_rol)
        REFERENCES trol (id_rol),

    CONSTRAINT tusuario_estado_fk
        FOREIGN KEY (id_estado_usr)
        REFERENCES testado_usr (id_estado_usr),

    CONSTRAINT tusuario_activo_ck
        CHECK (sn_activo IN (0, 1))
);


-- ============================================
-- TUTORES
-- ============================================

CREATE TABLE ttutor (
    id_usuario INTEGER PRIMARY KEY,

    nro_id INTEGER NOT NULL,

    dir_tutoria VARCHAR(150),

    anio_inicio_tutoria DATE NOT NULL,

    u_graduacion VARCHAR(150) NOT NULL,

    CONSTRAINT ttutor_usuario_fk
        FOREIGN KEY (id_usuario)
        REFERENCES tusuario (id_usuario)
);


-- ============================================
-- MATERIAS
-- ============================================

CREATE TABLE tmateria (
    id_materia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    txt_desc VARCHAR(200) NOT NULL
);


-- ============================================
-- RELACIÓN TUTOR - MATERIA
-- ============================================

CREATE TABLE ttutor_materia (
    id_tutor INTEGER NOT NULL,

    id_materia INTEGER NOT NULL,

    CONSTRAINT ttutor_materia_pk
        PRIMARY KEY (id_tutor, id_materia),

    CONSTRAINT tutor_materia_tutor_fk
        FOREIGN KEY (id_tutor)
        REFERENCES ttutor (id_usuario),

    CONSTRAINT tutor_materia_materia_fk
        FOREIGN KEY (id_materia)
        REFERENCES tmateria (id_materia)
);


-- ============================================
-- HORARIOS DE ATENCIÓN
-- ============================================

CREATE TABLE thorario_atencion (
    id_horario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_tutor INTEGER NOT NULL,

    hora_inicio TIME NOT NULL,

    hora_fin TIME NOT NULL,

    CONSTRAINT horario_tutor_fk
        FOREIGN KEY (id_tutor)
        REFERENCES ttutor (id_usuario),

    CONSTRAINT horario_horas_ck
        CHECK (hora_fin > hora_inicio)
);


-- ============================================
-- DÍAS DE ATENCIÓN
-- ============================================

CREATE TABLE thorario_dia (
    id_horario_dia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_horario INTEGER NOT NULL,

    dia_semana INTEGER NOT NULL,

    CONSTRAINT horario_dia_fk
        FOREIGN KEY (id_horario)
        REFERENCES thorario_atencion (id_horario),

    CONSTRAINT dia_semana_ck
        CHECK (dia_semana BETWEEN 1 AND 7)
);


-- ============================================
-- SESIONES
-- ============================================

CREATE TABLE tsesion (
    id_sesion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_estudiante INTEGER NOT NULL,

    id_tutor INTEGER NOT NULL,

    id_materia INTEGER NOT NULL,

    id_estado_sesion INTEGER NOT NULL,

    fec_sesion DATE NOT NULL,

    hora_inicio TIME NOT NULL,

    hora_final TIME NOT NULL,

    motivo VARCHAR(150),

    resumen VARCHAR(150),

    motivo_cancelacion VARCHAR(150),

    fec_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sesion_estudiante_fk
        FOREIGN KEY (id_estudiante)
        REFERENCES tusuario (id_usuario),

    -- Valida que el tutor realmente imparta esa materia
    CONSTRAINT sesion_tutor_materia_fk
        FOREIGN KEY (id_tutor, id_materia)
        REFERENCES ttutor_materia (id_tutor, id_materia),

    CONSTRAINT sesion_estado_fk
        FOREIGN KEY (id_estado_sesion)
        REFERENCES testado_sesion (id_estado_sesion),

    CONSTRAINT sesion_horas_ck
        CHECK (hora_final > hora_inicio)
);