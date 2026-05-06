import { DataSyncAgent } from '../agents/DataSyncAgent.js';

export const getGeoMetadata = (countryName, regionName = null) => {
  const data = DataSyncAgent.getCountryData(countryName);
  
  if (data.requiresRegion) {
    if (!regionName) {
      return { status: "REQUIRES_REGION", regions: Object.keys(data.regions) };
    }
    const iana = data.regions[regionName];
    if (!iana) {
      throw new Error(`Región no válida para ${countryName}`);
    }
    return { status: "OK", iana };
  }
  
  return { status: "OK", iana: data.iana };
};
