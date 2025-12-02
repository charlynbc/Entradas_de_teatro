-- Limpiar ensayos para testing fresco
DELETE FROM ensayos_generales;
ALTER SEQUENCE ensayos_generales_id_seq RESTART WITH 1;
