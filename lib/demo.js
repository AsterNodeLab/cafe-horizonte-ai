'use strict';

const conocimiento = require('./conocimiento');

const NUMEROS = {
  un: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  doce: 12
};

function sinAcentos(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function menu() {
  const productos = [];
  for (const linea of conocimiento.leerArchivo('menu.md').split(/\r?\n/)) {
    if (!linea.trim().startsWith('|')) continue;
    const celdas = linea.split('|').slice(1, -1).map((celda) => celda.trim());
    if (celdas.length < 2) continue;

    const precio = Number(celdas[1]);
    if (!Number.isFinite(precio)) continue;

    productos.push({ nombre: celdas[0], precio, clave: sinAcentos(celdas[0]) });
  }
  return productos;
}

function patronProducto(producto) {
  return producto.clave
    .split(/\s+/)
    .map((palabra) => `${escapar(palabra)}s?`)
    .join('\\s+');
}

function encontrarProducto(texto) {
  return menu().find((producto) => new RegExp(`\\b${patronProducto(producto)}\\b`).test(texto));
}

function cantidadEn(texto, producto) {
  const palabras = Object.keys(NUMEROS).join('|');
  const coincidencia = texto.match(
    new RegExp(`(?:(\\d+)|(${palabras}))\\s+${patronProducto(producto)}`)
  );

  if (!coincidencia) return 1;
  return coincidencia[1] ? Number(coincidencia[1]) : NUMEROS[coincidencia[2]];
}

function proximamente() {
  const productos = [];
  for (const linea of conocimiento.leerArchivo('proximamente.md').split(/\r?\n/)) {
    if (!linea.trim().startsWith('|')) continue;
    const celdas = linea.split('|').slice(1, -1).map((celda) => celda.trim());
    const precio = Number(celdas[1]);
    if (celdas[0] && Number.isFinite(precio)) {
      productos.push({ nombre: celdas[0], precio });
    }
  }
  return productos;
}

function responder(mensaje) {
  const texto = sinAcentos(mensaje);
  let cuerpo;

  if (/horario|abren|abiert|horas|cierr|atienden/.test(texto)) {
    cuerpo = conocimiento.leerArchivo('negocio.md').trim();
  } else {
    const producto = encontrarProducto(texto);
    const preguntaPrecio = /precio|cuesta|vale|costo|caro|barato|pago/.test(texto);
    const mencionCantidad = /\b(un|una|dos|tres|cuatro|cinco|\d+)\b/.test(texto);

    if (producto && (preguntaPrecio || mencionCantidad)) {
      const cantidad = cantidadEn(texto, producto);
      const total = cantidad * producto.precio;
      cuerpo =
        cantidad === 1
          ? `${producto.nombre}: $${producto.precio} MXN.`
          : `${cantidad} × ${producto.nombre} = $${total} MXN ($${producto.precio} MXN c/u).`;
    } else if (/recomienda|desayun|almuerz|hambre|comer|suger/.test(texto)) {
      const productos = menu();
      const sandwich = productos.find((item) => item.clave.includes('sandwich'));
      const americano = productos.find((item) => item.clave.includes('cafe americano'));
      const capuchino = productos.find((item) => item.clave.includes('capuchino'));

      if (sandwich && (americano || capuchino)) {
        const opciones = [];
        if (americano) opciones.push(`${americano.nombre} ($${americano.precio} MXN)`);
        if (capuchino) opciones.push(`${capuchino.nombre} ($${capuchino.precio} MXN)`);
        cuerpo = `Te recomiendo un ${sandwich.nombre} ($${sandwich.precio} MXN) con ${opciones.join(' o ')}.`;
      } else {
        cuerpo = conocimiento.leerArchivo('menu.md').trim();
      }
    } else {
      const alternativas = [];
      const sandwich = menu().find((item) => item.clave.includes('sandwich'));
      const proximo = proximamente()[0];
      if (sandwich) alternativas.push(`${sandwich.nombre} ($${sandwich.precio} MXN)`);
      if (proximo) alternativas.push(`pronto ${proximo.nombre.toLowerCase()} ($${proximo.precio} MXN)`);
      cuerpo = `Por ahora no vendemos eso en Café Horizonte. ${
        alternativas.length
          ? `Puedes probar ${alternativas.join(' o ')}.`
          : 'Consulta el menú directamente en el café.'
      }`;
    }
  }

  return `[Modo demostración] ${cuerpo}`;
}

module.exports = { responder };
