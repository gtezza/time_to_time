-- Script para preparar la base de datos para el Triangulador de Reuniones
-- Este script asume que ya existe una tabla llamada "paises".
-- ATENCION: Reemplazar "id_pais" por el nombre real de la llave primaria de la tabla paises (ej. id, pais_id, codigo) en las referencias.

-- 1. Agregamos columnas a la tabla "paises" para soportar zonas horarias IANA
ALTER TABLE paises 
ADD COLUMN IF NOT EXISTS iana_timezone VARCHAR(100),
ADD COLUMN IF NOT EXISTS requiere_region BOOLEAN DEFAULT FALSE;

-- 2. Creamos la tabla para manejar países con múltiples zonas (ej. EE. UU., Brasil, México)
-- IMPORTANTE: Cambiar "paises(id)" si tu tabla paises no usa "id" como llave primaria, por ejemplo: paises(pais_id)
CREATE TABLE IF NOT EXISTS paises_regiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pais UUID REFERENCES paises(id_pais) ON DELETE CASCADE, -- <--- MODIFICAR AQUI SI ES NECESARIO
    nombre_region VARCHAR(100) NOT NULL,
    iana_timezone VARCHAR(100) NOT NULL
);

-- ==========================================
-- EJEMPLOS DE POBLADO DE DATOS (DATA SEEDING)
-- ==========================================
-- (Nota: Deberás reemplazar 'España', 'Argentina', etc. por cómo los tengas escritos exactamente en tu tabla)

-- Paises de zona única:
UPDATE paises SET iana_timezone = 'Europe/Madrid', requiere_region = FALSE WHERE nombre ILIKE '%España%';
UPDATE paises SET iana_timezone = 'America/Argentina/Buenos_Aires', requiere_region = FALSE WHERE nombre ILIKE '%Argentina%';
UPDATE paises SET iana_timezone = 'America/El_Salvador', requiere_region = FALSE WHERE nombre ILIKE '%El Salvador%';
UPDATE paises SET iana_timezone = 'America/Bogota', requiere_region = FALSE WHERE nombre ILIKE '%Colombia%';
UPDATE paises SET iana_timezone = 'America/Santiago', requiere_region = FALSE WHERE nombre ILIKE '%Chile%';

-- País con múltiples zonas (EE. UU.):
UPDATE paises SET requiere_region = TRUE, iana_timezone = NULL WHERE nombre ILIKE '%EE%UU%' OR nombre ILIKE '%Estados Unidos%';

-- Regiones de EE. UU. (Asegúrate de obtener el ID correcto de EE.UU. antes de insertar)
DO $$ 
DECLARE 
  eeuu_id UUID;
BEGIN
  -- IMPORTANTE: Cambiar "id" por el nombre de tu llave primaria en la tabla paises
  SELECT id_pais INTO eeuu_id FROM paises WHERE nombre ILIKE '%EE%UU%' OR nombre ILIKE '%Estados Unidos%' LIMIT 1;
  
  IF eeuu_id IS NOT NULL THEN
    INSERT INTO paises_regiones (id_pais, nombre_region, iana_timezone) VALUES
      (eeuu_id, 'Nueva York (EST)', 'America/New_York'),
      (eeuu_id, 'Chicago (CST)', 'America/Chicago'),
      (eeuu_id, 'Denver (MST)', 'America/Denver'),
      (eeuu_id, 'Los Ángeles (PST)', 'America/Los_Angeles')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
