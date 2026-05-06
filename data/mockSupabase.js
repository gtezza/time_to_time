export const geoDatabase = {
  "Argentina": { iana: "America/Argentina/Buenos_Aires", requiresRegion: false },
  "España": { iana: "Europe/Madrid", requiresRegion: false },
  "México": { iana: "America/Mexico_City", requiresRegion: false },
  "Colombia": { iana: "America/Bogota", requiresRegion: false },
  "Chile": { iana: "America/Santiago", requiresRegion: false },
  "Reino Unido": { iana: "Europe/London", requiresRegion: false },
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
