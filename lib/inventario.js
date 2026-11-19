'use strict';

const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(__dirname, '..', 'conocimiento', 'inventario.md');

function errorConEstado(mensaje, estado) {
  const error = new Error(mensaje);
  error.status = estado;
  return error;
}

// La cabecera usa "Mínimo" con acento: se normaliza para buscar por nombre.
function sinAcentos(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Parsea la tabla por nombre de columna, en lugar de depender del orden.
function leer() {
  const lineas = fs.readFileSync(ARCHIVO, 'utf8').split(/\r?\n/);
  let columnas = [];
  const items = [];

  for (const lineaCruda of lineas) {
    const linea = lineaCruda.trim();
    if (!linea.startsWith('|')) continue;

    const celdas = linea.split('|').slice(1, -1).map((celda) => celda.trim());
    if (celdas.every((celda) => /^:?-{2,}:?$/.test(celda))) continue;

    if (columnas.length === 0) {
      columnas = celdas.map((celda) => sinAcentos(celda));
      continue;
    }

    const fila = {};
    columnas.forEach((columna, indice) => {
      fila[columna] = celdas[indice] === undefined ? '' : celdas[indice];
    });

    const existencia = Number(fila.existencia);
    const minimo = Number(fila.minimo);
    items.push({
      insumo: fila.insumo || '',
      existencia: Number.isFinite(existencia) ? existencia : 0,
      unidad: fila.unidad || '',
      minimo: Number.isFinite(minimo) ? minimo : 0,
      estado: existencia < minimo ? 'BAJO' : 'OK'
    });
  }

  return items;
}

function escribir(items) {
  const lineas = [
    '# Inventario de insumos',
    '',
    '| Insumo | Existencia | Unidad | Mínimo |',
    '|---|---|---|---|',
    ...items.map((item) => `| ${item.insumo} | ${item.existencia} | ${item.unidad} | ${item.minimo} |`),
    ''
  ];

  const temporal = `${ARCHIVO}.tmp`;
  fs.writeFileSync(temporal, lineas.join('\n'), 'utf8');
  fs.renameSync(temporal, ARCHIVO);
}

function aplicarMovimiento({ insumo, tipo, cantidad }) {
  const items = leer();
  const nombre = String(insumo === undefined || insumo === null ? '' : insumo).trim().toLowerCase();
  const indice = items.findIndex((item) => item.insumo.toLowerCase() === nombre);

  if (indice === -1) {
    throw errorConEstado('Ese insumo no existe en el inventario.', 400);
  }
  if (tipo !== 'entrada' && tipo !== 'salida') {
    throw errorConEstado('El tipo debe ser "entrada" o "salida".', 400);
  }

  const cantidadNumero = Number(cantidad);
  if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
    throw errorConEstado('La cantidad debe ser un número mayor que 0.', 400);
  }

  const anterior = items[indice].existencia;
  const nuevo = tipo === 'entrada' ? anterior + cantidadNumero : anterior - cantidadNumero;
  if (nuevo < 0) {
    throw errorConEstado('La salida no puede dejar la existencia en negativo.', 409);
  }

  items[indice].existencia = nuevo;
  items[indice].estado = nuevo < items[indice].minimo ? 'BAJO' : 'OK';
  escribir(items);
  return leer();
}

// Cola de promesas: los movimientos se procesan uno a la vez.
let cola = Promise.resolve();

function registrarMovimiento(datos) {
  const resultado = cola.then(() => aplicarMovimiento(datos));
  cola = resultado.catch(() => undefined);
  return resultado;
}

module.exports = { leer, registrarMovimiento };
