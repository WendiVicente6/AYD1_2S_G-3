INSERT INTO tusuario (
    id_rol,
    nombres,
    apellidos,
    carnet,
    genero,
    direccion,
    telefono,
    fec_nac,
    correo,
    password,
    id_estado_usr,
    sn_activo
)
VALUES (
    1,
    'Administrador',
    'Administrador',
    0,
    'M',
    'Guatemala',
    '00000000',
    DATE '2000-01-01',
    'admin@EduConnect.com',
    '123',
    2,
    1
);

select * from tusuario

UPDATE tusuario
SET sn_activo = 1
WHERE id_usuario=12;

ALTER TABLE tusuario 
ADD COLUMN password_auth2 VARCHAR(250);



