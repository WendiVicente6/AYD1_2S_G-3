
-- HU: Gestión administrativa de denuncias.
-- No elimina ni modifica las denuncias existentes.

ALTER TABLE public.treporte
ADD COLUMN IF NOT EXISTS estado_gestion VARCHAR(15)
NOT NULL DEFAULT 'Pendiente';

ALTER TABLE public.treporte
DROP CONSTRAINT IF EXISTS reporte_estado_gestion_ck;

ALTER TABLE public.treporte
ADD CONSTRAINT reporte_estado_gestion_ck
CHECK (
    estado_gestion IN (
        'Pendiente',
        'Rechazada',
        'Atendida'
    )
);

COMMIT;
