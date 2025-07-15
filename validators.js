// Fonctions de validation extraites de App.js
export const validators = {
  required: (value) => value && value.toString().trim().length > 0,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  positiveNumber: (value) => validators.number(value) && parseFloat(value) > 0,
  date: (value) => !isNaN(Date.parse(value)),
  futureDate: (value) => validators.date(value) && new Date(value) <= new Date(),
  minLength: (min) => (value) => value && value.length >= min,
  maxLength: (max) => (value) => value && value.length <= max,
  range: (min, max) => (value) => {
    const num = parseFloat(value);
    return validators.number(value) && num >= min && num <= max;
  }
}; 