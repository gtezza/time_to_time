/**
 * Convierte un string de tiempo desde una zona base a múltiples zonas destino en una fecha específica.
 * @param {string} dateString - Fecha de la reunión en formato YYYY-MM-DD
 * @param {string} timeString - Hora de la reunión en la zona base "HH:MM"
 * @param {string} originIana - IANA timezone del actor origen
 * @param {Array<string>} targetIanas - Lista de IANA timezones a los que queremos proyectar la hora
 */
export const utcConversionBridge = (dateString, timeString, originIana, targetIanas) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Creamos una fecha "Local" arbitraria con esos datos.
  // Como new Date() toma la zona del navegador, usaremos el truco de formatear
  // en la zona solicitada para descubrir la diferencia real de minutos en ESE día específico.
  const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Mediodía UTC para evitar saltos de día por accidente
  
  const getOffsetMinutes = (iana, date) => {
     const dtf = new Intl.DateTimeFormat('en-US', {
       timeZone: iana,
       year: 'numeric', month: '2-digit', day: '2-digit',
       hour: '2-digit', minute: '2-digit', second: '2-digit',
       hour12: false
     });
     const parts = dtf.formatToParts(date);
     const get = type => parts.find(p => p.type === type).value;
     
     // La fecha interpretada como UTC de cómo se ve esa fecha en la zona destino
     const tzDate = new Date(Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')));
     return (tzDate - date) / 60000;
  };

  const originOffset = getOffsetMinutes(originIana, baseDate);
  const originMinsFromMidnight = hours * 60 + minutes;
  
  // Llevamos los minutos locales de origen a minutos absolutos UTC
  const utcMins = originMinsFromMidnight - originOffset;

  const formatMins = (m) => {
    // Normalizar a 0-1440 (24h)
    const normalized = Math.floor(m + 1440 * 10) % 1440;
    const h = Math.floor(normalized / 60).toString().padStart(2, '0');
    const min = (normalized % 60).toString().padStart(2, '0');
    
    // Para UX: Indicar si el corrimiento cambia de día
    let dayShift = "";
    if (m < 0) dayShift = " (-1 día)";
    if (m >= 1440) dayShift = " (+1 día)";

    return {
      formatted: `${h}:${min}`,
      totalMinutesDay: normalized,
      dayShift
    };
  };

  const results = {};
  
  // Calcular para cada objetivo
  targetIanas.forEach(iana => {
      const targetOffset = getOffsetMinutes(iana, baseDate);
      const targetMins = utcMins + targetOffset;
      results[iana] = formatMins(targetMins);
  });

  return results;
};
