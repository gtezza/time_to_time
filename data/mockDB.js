export const geoDatabase = {
  "España": { iana: "Europe/Madrid", requiresRegion: false },
  "Argentina": { iana: "America/Argentina/Buenos_Aires", requiresRegion: false },
  "El Salvador": { iana: "America/El_Salvador", requiresRegion: false },
  "Colombia": { iana: "America/Bogota", requiresRegion: false },
  "Chile": { iana: "America/Santiago", requiresRegion: false },
  "México": { iana: "America/Mexico_City", requiresRegion: false },
  "Reino Unido": { iana: "Europe/London", requiresRegion: false },
  "Bolivia": { iana: "America/La_Paz", requiresRegion: false },
  "Venezuela": { iana: "America/Caracas", requiresRegion: false },
  "Perú": { iana: null, requiresRegion: false },
  "Uruguay": { iana: null, requiresRegion: false },
  "EE. UU.": { 
    requiresRegion: true,
    regions: {
      "Nueva York (EST)": "America/New_York",
      "Chicago (CST)": "America/Chicago",
      "Denver (MST)": "America/Denver",
      "Los Ángeles (PST)": "America/Los_Angeles"
    }
  }
};
