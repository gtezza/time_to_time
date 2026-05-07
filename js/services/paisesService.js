import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../env/supabase_config.js';
import { geoDatabase as localGeoDatabase } from '../../data/mockDB.js';
import { getFallbackIana } from '../skills/ianaFallback.js';

let cachedGeoDatabase = null;

/**
 * Normaliza un nombre en mayúsculas a formato Capitalizado (ej. "COSTA RICA" -> "Costa Rica")
 */
const normalizarNombrePais = (nombre) => {
    if (!nombre) return '';
    // Mapeos especiales para nombres abreviados o comunes
    const mapeosEspeciales = {
        "USA": "EE. UU.",
        "UK": "Reino Unido"
    };
    const upper = nombre.toUpperCase().trim();
    if (mapeosEspeciales[upper]) {
        return mapeosEspeciales[upper];
    }
    return nombre.split(' ').map(w => {
        if (w.length === 0) return '';
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
};

export const PaisesService = {
    /**
     * Obtiene la base de datos de países unificada (desde Supabase con fallback a mockDB).
     * @returns {Promise<Object>} La geoDatabase estructurada.
     */
    async getGeoDatabase() {
        if (cachedGeoDatabase) {
            return cachedGeoDatabase;
        }

        try {
            console.log('Intentando conectar con Supabase para cargar países...');
            
            // 1. Fetch de países desde la API REST de Supabase
            const responsePaises = await fetch(
                `${SUPABASE_URL}/rest/v1/paises?select=id_pais,nombre,iana_timezone,requiere_region&order=nombre.asc`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );

            if (!responsePaises.ok) {
                throw new Error(`Error HTTP al obtener países: ${responsePaises.status}`);
            }

            const paises = await responsePaises.json();
            console.log(`Se cargaron ${paises.length} países desde Supabase.`);

            // 2. Fetch de regiones de países desde la API REST de Supabase
            const responseRegiones = await fetch(
                `${SUPABASE_URL}/rest/v1/paises_regiones?select=id_pais,nombre_region,iana_timezone`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );

            let regiones = [];
            if (responseRegiones.ok) {
                regiones = await responseRegiones.json();
                console.log(`Se cargaron ${regiones.length} regiones desde Supabase.`);
            } else {
                console.warn('No se pudieron obtener las regiones de Supabase, se continuará sin ellas.');
            }

            // 3. Agrupar regiones por id_pais
            const regionesPorPais = {};
            regiones.forEach(reg => {
                if (!regionesPorPais[reg.id_pais]) {
                    regionesPorPais[reg.id_pais] = [];
                }
                regionesPorPais[reg.id_pais].push(reg);
            });

            // 4. Construir el objeto estructurado idéntico a geoDatabase
            const dbDinamica = {};
            paises.forEach(pais => {
                const nombreKey = normalizarNombrePais(pais.nombre);
                
                // Si la zona es nula en la DB, aplicar el fallback local inteligente
                const iana = pais.iana_timezone || getFallbackIana(pais.nombre);
                
                const requiresRegion = pais.requiere_region || false;
                const regionesPais = regionesPorPais[pais.id_pais] || [];

                dbDinamica[nombreKey] = {
                    iana: iana,
                    requiresRegion: requiresRegion || regionesPais.length > 0
                };

                if (regionesPais.length > 0) {
                    dbDinamica[nombreKey].requiresRegion = true;
                    dbDinamica[nombreKey].regions = {};
                    regionesPais.forEach(r => {
                        dbDinamica[nombreKey].regions[r.nombre_region] = r.iana_timezone;
                    });
                }
            });

            cachedGeoDatabase = dbDinamica;
            console.log('Base de datos geográfica dinámica cargada exitosamente de Supabase.');
            return cachedGeoDatabase;

        } catch (error) {
            console.error('Fallo en la conexión a Supabase. Activando fallback automático a mockDB local:', error);
            cachedGeoDatabase = localGeoDatabase;
            return cachedGeoDatabase;
        }
    },

    /**
     * Limpia la caché para forzar una nueva consulta.
     */
    clearCache() {
        cachedGeoDatabase = null;
    }
};
