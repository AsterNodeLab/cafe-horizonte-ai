'use strict';

const fs = require('fs');
const path = require('path');

// Lee un archivo .env simple (KEY=valor) sin dependencias y sin sobrescribir
// variables que ya existan en process.env.
function cargarEnv(ruta = path.join(__dirname, '..', '.env')) {
  if (!fs.existsSync(ruta)) return;

  const lineas = fs.readFileSync(ruta, 'utf8').split(/\r?\n/);
  for (const lineaOriginal of lineas) {
    let linea = lineaOriginal.trim();
    if (!linea || linea.startsWith('#')) continue;
    if (linea.startsWith('export ')) linea = linea.slice(7).trim();

    const posicion = linea.indexOf('=');
    if (posicion === -1) continue;

    const clave = linea.slice(0, posicion).trim();
    if (!clave) continue;

    let valor = linea.slice(posicion + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    if (process.env[clave] === undefined) {
      process.env[clave] = valor;
    }
  }
}

module.exports = { cargarEnv };
