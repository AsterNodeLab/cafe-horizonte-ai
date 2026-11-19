'use strict';

const fs = require('fs');
const path = require('path');

const DIRECTORIO = path.join(__dirname, '..', 'memoria');

function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

function fechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function horaLocal(fecha = new Date()) {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function sanitizarTema(texto) {
  return String(texto || '')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[dato]')
    .replace(/\d{8,}/g, '[dato]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function registrar({ tema, respondida }) {
  fs.mkdirSync(DIRECTORIO, { recursive: true });

  const ahora = new Date();
  const fecha = fechaLocal(ahora);
  const ruta = path.join(DIRECTORIO, `${fecha}.md`);

  if (!fs.existsSync(ruta)) {
    fs.writeFileSync(ruta, `# Memoria ${fecha}\n`, 'utf8');
  }

  const tipo = respondida === false ? 'SIN_RESPUESTA' : 'FAQ';
  const linea = `- ${horaLocal(ahora)} | ${tipo} | ${sanitizarTema(tema)}\n`;
  fs.appendFileSync(ruta, linea, 'utf8');

  return { archivo: `${fecha}.md`, linea: linea.trim() };
}

module.exports = { registrar };
