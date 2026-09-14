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
    'scrypt:32768:8:1$tQZulU9RXtXHzfBC$7a8570a58d99470042e71162541be93543ac5f8a855c02f7e4f7025471d355a2b05f1e585226f041d75904a7081d108fb7f82140120360183b1e7b311dbfaae4',
    2,
    1
);

select * from tusuario

UPDATE tusuario
SET sn_activo = 1
WHERE id_usuario=12;

ALTER TABLE tusuario 
ADD COLUMN password_auth2 VARCHAR(250);



