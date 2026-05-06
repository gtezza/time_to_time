import { geoDatabase } from '../data/mockSupabase.js';

export class DataSyncAgent {
  static getCountryData(countryName) {
    const data = geoDatabase[countryName];
    if (!data) {
      throw new Error(`País no encontrado en la base de datos: ${countryName}`);
    }
    return data;
  }
}
