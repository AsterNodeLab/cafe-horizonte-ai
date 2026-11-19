'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const DIRECTORIO = path.join(__dirname, '..', 'reportes');
const MARGEN = 48;

function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

function partesFecha(fecha = new Date()) {
  return {
    fecha: `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`,
    hora: `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`,
    sello: `${dosDigitos(fecha.getHours())}${dosDigitos(fecha.getMinutes())}${dosDigitos(fecha.getSeconds())}`
  };
}

function generarPdfInventario(items) {
  fs.mkdirSync(DIRECTORIO, { recursive: true });

  const { fecha, hora, sello } = partesFecha();
  const nombre = `inventario-${fecha}-${sello}.pdf`;
  const ruta = path.join(DIRECTORIO, nombre);

  const documento = new PDFDocument({ size: 'A4', margin: MARGEN });
  const flujo = fs.createWriteStream(ruta);
  const ancho = documento.page.width - MARGEN * 2;

  return new Promise((resolve, reject) => {
    flujo.on('finish', () => resolve({ archivo: nombre, url: `/reportes/${nombre}`, ruta }));
    flujo.on('error', reject);
    documento.on('error', reject);
    documento.pipe(flujo);

    documento.rect(0, 0, documento.page.width, documento.page.height).fill('#090c11');

    documento
      .fillColor('#5b9dff')
      .font('Courier')
      .fontSize(8)
      .text('CAFÉ HORIZONTE AI · REPORTE DE INVENTARIO', MARGEN, MARGEN, { lineBreak: false });

    documento
      .fillColor('#ffffff')
      .font('Times-Roman')
      .fontSize(26)
      .text('Inventario de insumos', MARGEN, 72, { lineBreak: false });

    documento
      .fillColor('#c9d1de')
      .font('Helvetica')
      .fontSize(10)
      .text(`${fecha} · ${hora}`, MARGEN, 106, { lineBreak: false });

    documento
      .moveTo(MARGEN, 126)
      .lineTo(MARGEN + ancho, 126)
      .lineWidth(0.75)
      .strokeColor('#1f3558')
      .stroke();

    const bajos = items.filter((item) => item.estado === 'BAJO').length;
    const tarjetas = [
      { etiqueta: 'TOTAL DE INSUMOS', valor: String(items.length) },
      { etiqueta: 'INSUMOS EN BAJO', valor: String(bajos) },
      { etiqueta: 'FECHA', valor: fecha }
    ];
    const separacion = 12;
    const anchoTarjeta = (ancho - separacion * 2) / 3;

    tarjetas.forEach((tarjeta, indice) => {
      const x = MARGEN + indice * (anchoTarjeta + separacion);
      documento.roundedRect(x, 146, anchoTarjeta, 58, 8).fill('#10151d');
      documento
        .roundedRect(x, 146, anchoTarjeta, 58, 8)
        .lineWidth(1)
        .strokeColor('#1f2733')
        .stroke();
      documento
        .fillColor('#5b9dff')
        .font('Courier')
        .fontSize(7)
        .text(tarjeta.etiqueta, x + 12, 158, { lineBreak: false });
      documento
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(tarjeta.valor, x + 12, 174, { lineBreak: false });
    });

    let y = 228;
    documento.rect(MARGEN, y, ancho, 24).fill('#10151d');
    documento.fillColor('#5b9dff').font('Courier').fontSize(8);
    documento.text('INSUMO', MARGEN + 10, y + 8, { lineBreak: false });
    documento.text('EXISTENCIA', 250, y + 8, { width: 90, align: 'right', lineBreak: false });
    documento.text('UNIDAD', 350, y + 8, { lineBreak: false });
    documento.text('ESTADO', 470, y + 8, { width: ancho - 422, align: 'right', lineBreak: false });
    y += 24;

    items.forEach((item) => {
      if (y > documento.page.height - 90) {
        documento.addPage();
        documento.rect(0, 0, documento.page.width, documento.page.height).fill('#090c11');
        y = MARGEN;
      }

      documento.fillColor('#c9d1de').font('Helvetica').fontSize(10);
      documento.text(item.insumo, MARGEN + 10, y + 7, { width: 180, lineBreak: false });
      documento.text(String(item.existencia), 250, y + 7, { width: 90, align: 'right', lineBreak: false });
      documento.text(item.unidad, 350, y + 7, { width: 100, lineBreak: false });

      documento
        .fillColor(item.estado === 'BAJO' ? '#f5b84b' : '#3ddc97')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(item.estado, 470, y + 7, { width: ancho - 422, align: 'right', lineBreak: false });

      y += 26;
      documento
        .moveTo(MARGEN, y)
        .lineTo(MARGEN + ancho, y)
        .lineWidth(0.5)
        .strokeColor('#1f2733')
        .stroke();
    });

    documento
      .fillColor('#5d6678')
      .font('Courier')
      .fontSize(7)
      .text(`GENERADO · ${fecha} ${hora} · DATOS FICTICIOS`, MARGEN, documento.page.height - 48, {
        lineBreak: false
      });

    documento.end();
  });
}

// Reporte premium de la conversación: fondo crema, tinta café y burbujas.
function generarPdfConversacion(mensajes) {
  fs.mkdirSync(DIRECTORIO, { recursive: true });

  const { fecha, hora, sello } = partesFecha();
  const nombre = `conversacion-${fecha}-${sello}.pdf`;
  const ruta = path.join(DIRECTORIO, nombre);

  const documento = new PDFDocument({ size: 'A4', margin: MARGEN });
  const flujo = fs.createWriteStream(ruta);
  const ancho = documento.page.width - MARGEN * 2;

  return new Promise((resolve, reject) => {
    flujo.on('finish', () => resolve({ archivo: nombre, url: `/reportes/${nombre}`, ruta }));
    flujo.on('error', reject);
    documento.on('error', reject);
    documento.pipe(flujo);

    function dibujarFondo() {
      documento.rect(0, 0, documento.page.width, documento.page.height).fill('#faf6ef');
    }

    dibujarFondo();

    documento
      .fillColor('#a5652f')
      .font('Courier')
      .fontSize(8)
      .text('CAFÉ HORIZONTE · ATENCIÓN AL CLIENTE', MARGEN, MARGEN, { lineBreak: false });

    documento
      .fillColor('#2e2016')
      .font('Times-Roman')
      .fontSize(26)
      .text('Tu conversación con Café Horizonte', MARGEN, 70, { lineBreak: false, width: ancho });

    documento
      .fillColor('#7c6855')
      .font('Helvetica')
      .fontSize(10)
      .text(`${fecha} · ${hora}`, MARGEN, 106, { lineBreak: false });

    documento
      .moveTo(MARGEN, 126)
      .lineTo(MARGEN + ancho, 126)
      .lineWidth(0.75)
      .strokeColor('#d5c1a4')
      .stroke();

    let y = 150;
    const anchoGlobo = ancho * 0.78;

    mensajes.forEach((mensaje) => {
      const esUsuario = mensaje.rol === 'user';
      const texto = String(mensaje.texto || '');

      documento.font('Helvetica').fontSize(10);
      const altoTexto = documento.heightOfString(texto, { width: anchoGlobo - 28 });
      const altoGlobo = altoTexto + 30;

      if (y + altoGlobo + 20 > documento.page.height - 70) {
        documento.addPage();
        dibujarFondo();
        y = MARGEN + 12;
      }

      documento
        .fillColor('#7c6855')
        .font('Courier')
        .fontSize(8)
        .text(`${esUsuario ? 'TÚ' : 'CAFÉ HORIZONTE'} · ${mensaje.hora || ''}`, MARGEN, y, {
          lineBreak: false
        });
      y += 14;

      const x = esUsuario ? MARGEN + ancho - anchoGlobo : MARGEN;
      documento.roundedRect(x, y, anchoGlobo, altoGlobo, 10).fill(esUsuario ? '#6d4326' : '#fffdf9');
      if (!esUsuario) {
        documento
          .roundedRect(x, y, anchoGlobo, altoGlobo, 10)
          .lineWidth(0.75)
          .strokeColor('#e2d4bf')
          .stroke();
      }

      documento
        .fillColor(esUsuario ? '#fffaf3' : '#4d3a2b')
        .font('Helvetica')
        .fontSize(10)
        .text(texto, x + 14, y + 12, { width: anchoGlobo - 28 });

      y += altoGlobo + 16;
    });

    documento
      .fillColor('#7c6855')
      .font('Courier')
      .fontSize(7)
      .text(`GENERADO · ${fecha} ${hora} · DATOS FICTICIOS`, MARGEN, documento.page.height - 48, {
        lineBreak: false
      });

    documento.end();
  });
}

function listar() {
  fs.mkdirSync(DIRECTORIO, { recursive: true });
  return fs
    .readdirSync(DIRECTORIO)
    .filter((nombre) => nombre.toLowerCase().endsWith('.pdf'))
    .map((nombre) => {
      const datos = fs.statSync(path.join(DIRECTORIO, nombre));
      return {
        archivo: nombre,
        url: `/reportes/${nombre}`,
        bytes: datos.size,
        fecha: datos.mtimeMs
      };
    })
    .sort((a, b) => b.fecha - a.fecha);
}

module.exports = { generarPdfInventario, generarPdfConversacion, listar };
