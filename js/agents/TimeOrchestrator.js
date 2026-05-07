import { getGeoMetadata } from '../skills/getGeoMetadata.js';
import { utcConversionBridge } from '../skills/utcConversionBridge.js';
import { businessRuleValidator } from '../skills/businessRuleValidator.js';

export class TimeOrchestrator {
  /**
   * Triangula el horario entre múltiples actores.
   * @param {string} dateString - "YYYY-MM-DD"
   * @param {string} timeString - "HH:MM"
   * @param {Array} actors - [{ id: 1, role: 'Partner', country: 'España', region: null }]
   * @param {Object} [customGeoDatabase=null] - Base de datos de países dinámica opcional
   */
  static triangulate(dateString, timeString, actors, customGeoDatabase = null) {
    try {
      const ianas = {};
      const errors = [];

      actors.forEach(actor => {
        if (!actor.country) return;
        const meta = getGeoMetadata(actor.country, actor.region, customGeoDatabase);
        if (meta.status === "REQUIRES_REGION") {
          errors.push({ actorId: actor.id, type: "REQUIRES_REGION", regions: meta.regions });
        } else if (meta.status === "NO_TIMEZONE") {
          ianas[actor.id] = null;
        } else {
          ianas[actor.id] = meta.iana;
        }
      });

      if (errors.length > 0) {
        return { status: "MISSING_DATA", errors };
      }

      // Actor origen es siempre el primero en la lista (Partner)
      const originActor = actors[0];
      if (!originActor) return { status: "NO_ORIGIN" };
      
      if (!ianas[originActor.id]) {
        return { 
          status: "NO_ORIGIN_TIMEZONE", 
          message: `El país de origen (${originActor.country}) no tiene una zona horaria configurada.` 
        };
      }
      
      const originIana = ianas[originActor.id];
      const allIanas = [...new Set(Object.values(ianas).filter(v => v !== null))];

      const times = utcConversionBridge(dateString, timeString, originIana, allIanas);

      let globalWarning = false;
      let hasInvalidZones = actors.some(actor => actor.country && ianas[actor.id] === null);

      const results = actors.map(actor => {
        const actorIana = ianas[actor.id];
        
        if (!actorIana) {
          return {
            id: actor.id,
            role: actor.role,
            country: actor.country,
            region: actor.region,
            formattedTime: "--:--",
            dayShift: "Sin Zona",
            noTimezone: true,
            warning: null
          };
        }

        const timeData = times[actorIana];
        let warning = null;
        
        // Regla de negocio para Central (Argentina)
        if (actor.country === "Argentina") {
          const validation = businessRuleValidator(timeData.totalMinutesDay);
          if (!validation.isOptimal) {
            warning = validation.message;
            globalWarning = true;
          }
        }

        return {
          id: actor.id,
          role: actor.role,
          country: actor.country,
          region: actor.region,
          formattedTime: timeData.formatted,
          dayShift: timeData.dayShift,
          noTimezone: false,
          warning
        };
      });

      return {
        status: "SUCCESS",
        hasWarnings: globalWarning,
        hasInvalidZones,
        results
      };

    } catch (e) {
      return { status: "ERROR", message: e.message };
    }
  }
}
