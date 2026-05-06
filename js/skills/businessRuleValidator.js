export const businessRuleValidator = (argentinaMinutes) => {
  // Las 20:00 en minutos es 20 * 60 = 1200
  const LIMIT = 1200;
  if (argentinaMinutes <= LIMIT) {
    return { isValid: true };
  } else {
    return { 
      isValid: false, 
      message: "La hora sugerida excede el límite de las 20:00 hs en Argentina. Por favor, ajuste la hora de origen para que sea más temprano."
    };
  }
};
