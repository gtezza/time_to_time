/**
 * Diccionario de fallback local para la resolución de zonas horarias IANA.
 * Mapea los nombres oficiales de los países (en mayúsculas tal como vienen de Supabase)
 * con una zona horaria IANA estándar y funcional.
 */
export const ianaFallback = {
    "ARGENTINA": "America/Argentina/Buenos_Aires",
    "BOLIVIA": "America/La_Paz",
    "CHILE": "America/Santiago",
    "COLOMBIA": "America/Bogota",
    "COSTA RICA": "America/Costa_Rica",
    "ECUADOR": "America/Guayaquil",
    "EL SALVADOR": "America/El_Salvador",
    "ESPAÑA": "Europe/Madrid",
    "GUATEMALA": "America/Guatemala",
    "HONDURAS": "America/Tegucigalpa",
    "MÉXICO": "America/Mexico_City",
    "NICARAGUA": "America/Managua",
    "PANAMÁ": "America/Panama",
    "PARAGUAY": "America/Asuncion",
    "PERÚ": "America/Lima",
    "PORTUGAL": "Europe/Lisbon",
    "PUERTO RICO": "America/Puerto_Rico",
    "REPÚBLICA DOMINICANA": "America/Santo_Domingo",
    "UK": "Europe/London",
    "USA": "America/New_York",
    "VENEZUELA": "America/Caracas"
};

/**
 * Obtiene la zona horaria de fallback para un país determinado.
 * @param {string} countryName - El nombre del país (insensible a mayúsculas/minúsculas).
 * @returns {string|null} La zona IANA o null si no se encuentra.
 */
export const getFallbackIana = (countryName) => {
    if (!countryName) return null;
    const normalized = countryName.toUpperCase().trim();
    return ianaFallback[normalized] || null;
};
