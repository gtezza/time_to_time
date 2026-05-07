/**
 * Servicio de API Externa para la resolución y validación de zonas horarias y husos horarios en tiempo real.
 * Utiliza WorldTimeAPI como fuente de verdad para obtener desfases y verificar la hora de las zonas seleccionadas.
 */
export const TimezoneApiService = {
    /**
     * Obtiene el desfase (offset) UTC en minutos para una zona horaria específica desde la API externa.
     * @param {string} ianaZone - La zona horaria IANA (ej. "America/Lima").
     * @returns {Promise<number|null>} El desfase en minutos con respecto a UTC, o null si falla.
     */
    async getOffsetMinutes(ianaZone) {
        if (!ianaZone) return null;
        try {
            console.log(`Consultando desfase en tiempo real para la zona: ${ianaZone}...`);
            const response = await fetch(`https://worldtimeapi.org/api/timezone/${ianaZone}`);
            if (!response.ok) {
                throw new Error(`Error HTTP al consultar WorldTimeAPI: ${response.status}`);
            }
            const data = await response.json();
            
            // raw_offset es el offset base en segundos
            // dst_offset es el offset de horario de verano en segundos
            const totalOffsetSeconds = (data.raw_offset || 0) + (data.dst_offset || 0);
            const totalOffsetMinutes = totalOffsetSeconds / 60;
            
            console.log(`Desfase obtenido para ${ianaZone}: ${totalOffsetMinutes} minutos (${data.utc_offset})`);
            return totalOffsetMinutes;
        } catch (error) {
            console.warn(`No se pudo obtener el desfase de la API para ${ianaZone}, se utilizará el cálculo local:`, error);
            return null;
        }
    },

    /**
     * Obtiene los datos detallados de fecha y hora actual para una zona horaria específica.
     * @param {string} ianaZone - La zona horaria IANA (ej. "Europe/Madrid").
     * @returns {Promise<Object|null>} Un objeto con la hora formateada, fecha e información de DST, o null si falla.
     */
    async getTimeDetails(ianaZone) {
        if (!ianaZone) return null;
        try {
            const response = await fetch(`https://worldtimeapi.org/api/timezone/${ianaZone}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            return {
                datetime: data.datetime,
                timezone: data.timezone,
                utc_offset: data.utc_offset,
                dst: data.dst,
                day_of_week: data.day_of_week,
                day_of_year: data.day_of_year
            };
        } catch (error) {
            console.error(`Error al obtener detalles de hora para ${ianaZone}:`, error);
            return null;
        }
    }
};
