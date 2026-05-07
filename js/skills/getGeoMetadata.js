import { geoDatabase } from '../../data/mockDB.js';

export const getGeoMetadata = (countryName, regionName = null, customGeoDatabase = null) => {
  const db = customGeoDatabase || geoDatabase;
  const data = db[countryName];
  if (!data) {
    return { status: "NO_TIMEZONE", message: `País no encontrado en la base de datos: ${countryName}` };
  }
  
  if (data.requiresRegion) {
    if (!regionName) {
      return { status: "REQUIRES_REGION", regions: Object.keys(data.regions) };
    }
    const iana = data.regions[regionName];
    if (!iana) {
      return { status: "NO_TIMEZONE", message: `Región no válida para ${countryName}` };
    }
    return { status: "OK", iana };
  }
  
  if (!data.iana) {
    return { status: "NO_TIMEZONE", message: `El país ${countryName} no tiene una zona horaria vinculada` };
  }
  
  return { status: "OK", iana: data.iana };
};
