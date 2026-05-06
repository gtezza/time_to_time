import { getGeoMetadata } from '../skills/getGeoMetadata.js';
import { utcConversionBridge } from '../skills/utcConversionBridge.js';
import { businessRuleValidator } from '../skills/businessRuleValidator.js';

export class TimeOrchestrator {
  static planMeeting(originCountry, originRegion, timeString, destCountry, destRegion) {
    try {
      // 1. Obtener IANA de Origen
      const originMeta = getGeoMetadata(originCountry, originRegion);
      if (originMeta.status === "REQUIRES_REGION") {
        return { status: "AMBIGUITY_ORIGIN", regions: originMeta.regions };
      }

      // 2. Obtener IANA de Destino
      const destMeta = getGeoMetadata(destCountry, destRegion);
      if (destMeta.status === "REQUIRES_REGION") {
        return { status: "AMBIGUITY_DEST", regions: destMeta.regions };
      }

      // 3. Procesar las Matemáticas (Convertir horas)
      const times = utcConversionBridge(timeString, originMeta.iana, destMeta.iana);

      // 4. Validar Regla de Negocio
      const validation = businessRuleValidator(times.argentinaMinutes);

      if (!validation.isValid) {
        return {
          status: "ERROR",
          message: validation.message,
          details: times
        };
      }

      // 5. Éxito
      return {
        status: "SUCCESS",
        details: times
      };
    } catch (error) {
      return {
        status: "EXCEPTION",
        message: error.message
      };
    }
  }
}
