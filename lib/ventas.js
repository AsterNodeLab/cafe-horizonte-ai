'use strict';

const fs = require('fs');
const path = require('path');

const DIRECTORIO = path.join(__dirname, '..', 'crm');
const ARCHIVO = path.join(DIRECTORIO, 'ventas.json');

function leer() {
  if (!fs.existsSync(ARCHIVO)) return [];
  try {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function claveDia(fecha) {
  const d = new Date(fecha);
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

function registrar({ cliente, items, total, metodo }) {
  const lista = items || [];
  const monto = Number(total);
  if (!lista.length || !Number.isFinite(monto) || monto <= 0) {
    const error = new Error('La venta debe tener productos y un total mayor que 0.');
    error.status = 400;
    throw error;
  }

  const venta = {
    id: `V-${Date.now()}`,
    cliente: String(cliente || 'anonimo').slice(0, 40),
    items: lista.map((item) => ({
      producto: String(item.producto || '').slice(0, 80),
      cantidad: Number(item.cantidad) || 1,
      precio: Number(item.precio) || 0
    })),
    total: monto,
    metodo: String(metodo || 'mostrador'),
    fecha: new Date().toISOString()
  };

  const ventas = leer();
  ventas.push(venta);
  fs.mkdirSync(DIRECTORIO, { recursive: true });
  const temporal = `${ARCHIVO}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(ventas.slice(-2000), null, 2), 'utf8');
  fs.renameSync(temporal, ARCHIVO);
  return venta;
}

function porDia(dias = 7) {
  const mapa = new Map();
  const hoy = new Date();
  for (let i = dias - 1; i >= 0; i -= 1) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    mapa.set(claveDia(d), { fecha: claveDia(d), total: 0, ventas: 0, clientes: new Set() });
  }

  for (const venta of leer()) {
    const clave = claveDia(venta.fecha);
    if (!mapa.has(clave)) continue;
    const dia = mapa.get(clave);
    dia.total += Number(venta.total) || 0;
    dia.ventas += 1;
    dia.clientes.add(venta.cliente);
  }

  return [...mapa.values()].map((dia) => ({
    fecha: dia.fecha,
    total: Math.round(dia.total * 100) / 100,
    ventas: dia.ventas,
    clientes: dia.clientes.size
  }));
}

function resumen() {
  const ventas = leer();
  const hoy = claveDia(new Date());
  const deHoy = ventas.filter((venta) => claveDia(venta.fecha) === hoy);
  const total = ventas.reduce((suma, venta) => suma + (Number(venta.total) || 0), 0);
  return {
    ventasHoy: deHoy.reduce((suma, venta) => suma + (Number(venta.total) || 0), 0),
    ordenesHoy: deHoy.length,
    totalGeneral: Math.round(total * 100) / 100,
    ticketPromedio: ventas.length ? Math.round((total / ventas.length) * 100) / 100 : 0
  };
}

function ultimas(cantidad = 10) {
  return leer().slice(-cantidad).reverse();
}

module.exports = { registrar, porDia, resumen, ultimas };
