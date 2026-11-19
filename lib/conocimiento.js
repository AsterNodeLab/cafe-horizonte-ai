'use strict';

const fs = require('fs');
const path = require('path');

const DIRECTORIO = path.join(__dirname, '..', 'conocimiento');
const LIMITE_CARACTERES = 8000;

let archivos = [];
let contexto = '';

// El contenido de los archivos son datos, no instrucciones: se eliminan las
// etiquetas que podrían confundir al modelo.
function sanitizar(texto) {
  return texto.replace(/<\/?conocimiento/gi, '');
}

function leerArchivo(nombre) {
  const seguro = path.basename(String(nombre || ''));
  const ruta = path.join(DIRECTORIO, seguro);
  if (!seguro || !fs.existsSync(ruta)) return '';
  return sanitizar(fs.readFileSync(ruta, 'utf8'));
}

// Lee todos los .md, los guarda en memoria y arma el contexto para el system prompt.
function cargar() {
  const nombres = fs
    .readdirSync(DIRECTORIO)
    .filter((nombre) => nombre.toLowerCase().endsWith('.md'))
    .sort();

  const metadatos = [];
  const bloques = [];
  let total = 0;

  for (const nombre of nombres) {
    const texto = sanitizar(fs.readFileSync(path.join(DIRECTORIO, nombre), 'utf8'));
    metadatos.push({ archivo: nombre, caracteres: texto.length });

    const bloque = `<conocimiento archivo="${nombre}">${texto}</conocimiento>`;
    if (total + bloque.length > LIMITE_CARACTERES) {
      const espacio = LIMITE_CARACTERES - total;
      if (espacio > 0) bloques.push(bloque.slice(0, espacio));
      break;
    }
    bloques.push(bloque);
    total += bloque.length;
  }

  archivos = metadatos;
  contexto = bloques.join('\n');
  return { archivos, contexto };
}

function obtenerContexto() {
  if (!contexto) cargar();
  return contexto;
}

function listar() {
  if (!archivos.length) cargar();
  return archivos;
}

module.exports = { cargar, obtenerContexto, listar, leerArchivo };
