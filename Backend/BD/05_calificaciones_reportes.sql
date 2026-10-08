-- ============================================
-- HU-037: Calificar estudiante
-- ============================================

CREATE TABLE tcalificacion (
    id_calificacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_sesion INTEGER NOT NULL,

    estrellas INTEGER NOT NULL,

    comentario VARCHAR(300),

    fec_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT calificacion_sesion_fk
        FOREIGN KEY (id_sesion)
        REFERENCES tsesion (id_sesion),

    -- Solo se puede calificar una vez cada sesión
    CONSTRAINT calificacion_sesion_un
        UNIQUE (id_sesion),

    CONSTRAINT calificacion_estrellas_ck
        CHECK (estrellas BETWEEN 0 AND 5)
);


-- ============================================
-- HU-038: Reportar estudiante
-- ============================================

CREATE TABLE ttipo_reporte (
    id_tipo_reporte INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    txt_desc VARCHAR(100) NOT NULL
);

INSERT INTO ttipo_reporte (txt_desc)
VALUES
    ('Conducta inapropiada'),
    ('Falsificación de documentos'),
    ('Agresión verbal o física'),
    ('Robo o daño a instalaciones');


CREATE TABLE treporte (
    id_reporte INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_sesion INTEGER NOT NULL,

    id_tipo_reporte INTEGER NOT NULL,

    explicacion VARCHAR(500) NOT NULL,

    fec_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT reporte_sesion_fk
        FOREIGN KEY (id_sesion)
        REFERENCES tsesion (id_sesion),

    CONSTRAINT reporte_tipo_fk
        FOREIGN KEY (id_tipo_reporte)
        REFERENCES ttipo_reporte (id_tipo_reporte)
);