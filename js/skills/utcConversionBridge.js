export const utcConversionBridge = (timeString, originIana, destIana) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1); // Usar mañana para evitar problemas de bordes de día
  
  const getOffsetMinutes = (iana, date) => {
     const dtf = new Intl.DateTimeFormat('en-US', {
       timeZone: iana,
       year: 'numeric', month: '2-digit', day: '2-digit',
       hour: '2-digit', minute: '2-digit', second: '2-digit',
       hour12: false
     });
     const parts = dtf.formatToParts(date);
     const get = type => parts.find(p => p.type === type).value;
     // Convertimos las partes formateadas a una fecha interpretada como UTC para calcular la diferencia
     const tzDate = new Date(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`);
     return (tzDate - date) / 60000;
  };

  const originOffset = getOffsetMinutes(originIana, baseDate);
  const destOffset = getOffsetMinutes(destIana, baseDate);
  const argentinaOffset = getOffsetMinutes("America/Argentina/Buenos_Aires", baseDate);

  const originMins = hours * 60 + minutes;
  const utcMins = originMins - originOffset;

  // Ajuste por si los minutos dan negativo al sumar, le agregamos 2 días (1440 * 2) y sacamos módulo
  const destMins = Math.floor(utcMins + destOffset + 1440 * 2) % 1440;
  const argMins = Math.floor(utcMins + argentinaOffset + 1440 * 2) % 1440;

  const formatMins = (m) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    return `${h}:${min}`;
  };

  return {
    destTime: formatMins(destMins),
    argentinaTime: formatMins(argMins),
    argentinaMinutes: argMins
  };
};
