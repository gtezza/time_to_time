export const businessRuleValidator = (argentinaMinutes) => {
  // Horario hábil Argentina: 09:00 a 20:00 (540 a 1200 minutos)
  const START_LIMIT = 9 * 60;
  const END_LIMIT = 20 * 60;
  
  if (argentinaMinutes >= START_LIMIT && argentinaMinutes <= END_LIMIT) {
    return { isOptimal: true };
  } else {
    return { 
      isOptimal: false, 
      message: "Atención: La hora en Argentina cae fuera de la franja ideal (09:00 a 20:00). Puedes continuar, pero el horario podría ser inconveniente."
    };
  }
};
