'use strict';

const fs = require('fs');
const path = require('path');

const conocimiento = require('./conocimiento');
const inventario = require('./inventario');
const reportes = require('./pdf');

const DIRECTORIO = path.join(__dirname, '..', 'crm');
const ARCHIVO = path.join(DIRECTORIO, 'conversaciones.json');
const MEMORIA = path.join(__dirname, '..', 'memoria');
const LIMITE_EVENTOS = 5000;

function leer() {
  if (!fs.existsSync(ARCHIVO)) return [];
  try {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function fechaLegible(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function tablaMarkdown(nombre) {
  const filas = [];
  let columnas = [];

  for (const linea of conocimiento.leerArchivo(nombre).split(/\r?\n/)) {
    if (!linea.trim().startsWith('|')) continue;
    const celdas = linea.split('|').slice(1, -1).map((celda) => celda.trim());
    if (celdas.every((celda) => /^:?-{2,}:?$/.test(celda))) continue;
    if (columnas.length === 0) {
      columnas = celdas;
      continue;
    }
    filas.push(celdas);
  }
  return filas;
}

let cola = Promise.resolve();

function registrar({ cliente, rol, texto, pdf }) {
  const tarea = cola.then(() => {
    const eventos = leer();
    eventos.push({
      cliente: String(cliente || 'anonimo').slice(0, 40),
      rol: rol === 'user' ? 'user' : 'bot',
      texto: String(texto || '').slice(0, 2000),
      pdf: pdf || null,
      fecha: new Date().toISOString()
    });

    const recientes = eventos.slice(-LIMITE_EVENTOS);
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const temporal = `${ARCHIVO}.tmp`;
    fs.writeFileSync(temporal, JSON.stringify(recientes, null, 2), 'utf8');
    fs.renameSync(temporal, ARCHIVO);
    return recientes;
  });

  cola = tarea.catch(() => undefined);
  return tarea;
}

function ultimos(cantidad = 20) {
  return leer().slice(-cantidad).reverse();
}

function resumen() {
  const eventos = leer();
  const clientes = new Set(eventos.map((evento) => evento.cliente));
  return {
    clientes: clientes.size,
    mensajes: eventos.length,
    preguntas: eventos.filter((evento) => evento.rol === 'user').length
  };
}

function construirHojas() {
  const eventos = leer();

  const porCliente = new Map();
  for (const evento of eventos) {
    const id = evento.cliente || 'anonimo';
    if (!porCliente.has(id)) {
      porCliente.set(id, { id, primera: evento.fecha, ultima: evento.fecha, mensajes: 0, preguntas: 0 });
    }
    const cliente = porCliente.get(id);
    cliente.ultima = evento.fecha;
    cliente.mensajes += 1;
    if (evento.rol === 'user') cliente.preguntas += 1;
  }

  const clientes = [['ID cliente', 'Primera interacción', 'Última interacción', 'Mensajes', 'Preguntas', 'Estado']];
  if (porCliente.size === 0) {
    clientes.push(['—', '—', '—', 0, 0, 'Sin actividad']);
  } else {
    porCliente.forEach((cliente) => {
      clientes.push([
        cliente.id,
        fechaLegible(cliente.primera),
        fechaLegible(cliente.ultima),
        cliente.mensajes,
        cliente.preguntas,
        'Activo'
      ]);
    });
  }

  const conversaciones = [['Fecha', 'ID cliente', 'Rol', 'Mensaje', 'PDF']];
  for (const evento of eventos) {
    conversaciones.push([
      fechaLegible(evento.fecha),
      evento.cliente,
      evento.rol === 'user' ? 'Cliente' : 'Café Horizonte',
      evento.texto,
      evento.pdf || ''
    ]);
  }

  const hojaInventario = [['Insumo', 'Existencia', 'Unidad', 'Mínimo', 'Estado']];
  inventario.leer().forEach((item) => {
    hojaInventario.push([item.insumo, item.existencia, item.unidad, item.minimo, item.estado]);
  });

  const menu = [['Producto', 'Precio MXN']];
  tablaMarkdown('menu.md').forEach((fila) => {
    const precio = Number(fila[1]);
    menu.push([fila[0], Number.isFinite(precio) ? precio : fila[1]]);
  });

  const proximamente = [['Producto', 'Precio previsto MXN', 'Nota']];
  tablaMarkdown('proximamente.md').forEach((fila) => {
    const precio = Number(fila[1]);
    proximamente.push([fila[0], Number.isFinite(precio) ? precio : fila[1], fila[2] || '']);
  });

  const memoria = [['Fecha', 'Hora', 'Tipo', 'Tema']];
  if (fs.existsSync(MEMORIA)) {
    for (const archivo of fs.readdirSync(MEMORIA).filter((nombre) => nombre.endsWith('.md'))) {
      const fecha = archivo.replace(/\.md$/, '');
      const contenido = fs.readFileSync(path.join(MEMORIA, archivo), 'utf8');
      for (const linea of contenido.split(/\r?\n/)) {
        const coincidencia = linea.match(/^-\s*(\d{2}:\d{2})\s*\|\s*([^|]+)\s*\|\s*(.*)$/);
        if (coincidencia) {
          memoria.push([fecha, coincidencia[1], coincidencia[2].trim(), coincidencia[3].trim()]);
        }
      }
    }
  }

  const reportesHoja = [['Archivo', 'URL', 'Tamaño (bytes)', 'Fecha']];
  reportes.listar().forEach((reporte) => {
    reportesHoja.push([
      reporte.archivo,
      reporte.url,
      reporte.bytes,
      fechaLegible(new Date(reporte.fecha).toISOString())
    ]);
  });

  return [
    { nombre: 'Clientes', filas: clientes, anchos: [20, 22, 22, 12, 12, 12] },
    { nombre: 'Conversaciones', filas: conversaciones, anchos: [22, 20, 16, 70, 14] },
    { nombre: 'Inventario', filas: hojaInventario, anchos: [26, 14, 14, 12, 12] },
    { nombre: 'Menu', filas: menu, anchos: [28, 16] },
    { nombre: 'Proximamente', filas: proximamente, anchos: [28, 20, 34] },
    { nombre: 'Memoria', filas: memoria, anchos: [14, 10, 18, 70] },
    { nombre: 'Reportes', filas: reportesHoja, anchos: [42, 48, 16, 22] }
  ];
}

module.exports = { registrar, resumen, ultimos, construirHojas };
