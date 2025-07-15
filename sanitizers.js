// Fonctions de sanitization extraites de App.js
export const sanitizers = {
  text: (value) => value.toString().trim().replace(/[<>]/g, ''),
  number: (value) => parseFloat(value) || 0,
  currency: (value) => Math.round(parseFloat(value) * 100) / 100
}; 