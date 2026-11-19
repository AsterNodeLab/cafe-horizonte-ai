'use strict';

const mensajes = document.getElementById('mensajes');
const entrada = document.getElementById('entrada');
const formChat = document.getElementById('form-chat');
const chipModo = document.getElementById('modo-chip');
const cuerpoInventario = document.getElementById('cuerpo-inventario');
const conteoInventario = document.getElementById('inventario-conteo');
const movInsumo = document.getElementById('mov-insumo');
const movTipo = document.getElementById('mov-tipo');
const movCantidad = document.getElementById('mov-cantidad');
const formMovimiento = document.getElementById('form-movimiento');
const movEstado = document.getElementById('mov-estado');
const listaReportes = document.getElementById('lista-reportes');
const btnPdf = document.getElementById('btn-pdf');
const btnPdfChat = document.getElementById('btn-pdf-chat');
const btnImprimir = document.getElementById('btn-imprimir');

const historial = [];

function horaLocal() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function clienteId() {
  let id = localStorage.getItem('cafeClienteId');
  if (!id) {
    id = `CLI-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    localStorage.setItem('cafeClienteId', id);
  }
  return id;
}

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, opciones);
  let datos;
  try {
    datos = await respuesta.json();
  } catch (error) {
    throw new Error('El servidor devolvió una respuesta inesperada.');
  }
  if (!respuesta.ok) {
    throw new Error(datos.error || 'La solicitud no pudo completarse.');
  }
  return datos;
}

function alFondo() {
  mensajes.scrollTop = mensajes.scrollHeight;
}

function agregarBurbuja(texto, tipo, urlPdf, registrar = true) {
  const burbuja = document.createElement('div');
  burbuja.className = `burbuja burbuja--${tipo}`;
  burbuja.textContent = texto;

  if (urlPdf) {
    const enlace = document.createElement('a');
    enlace.className = 'enlace-pdf';
    enlace.href = urlPdf;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = 'Abrir reporte PDF';
    burbuja.appendChild(enlace);
  }

  mensajes.appendChild(burbuja);
  alFondo();

  if (registrar) {
    historial.push({
      rol: tipo === 'user' ? 'user' : 'bot',
      texto,
      hora: horaLocal()
    });
  }
  return burbuja;
}

function mostrarEstado(texto, tipo) {
  movEstado.textContent = texto;
  movEstado.className = `estado${tipo ? ` estado--${tipo}` : ''}`;
}

function renderInventario(items) {
  cuerpoInventario.replaceChildren();

  items.forEach((item) => {
    const fila = document.createElement('tr');

    const celdaInsumo = document.createElement('td');
    celdaInsumo.textContent = item.insumo;

    const celdaExistencia = document.createElement('td');
    celdaExistencia.className = 'numero';
    celdaExistencia.textContent = item.existencia;

    const celdaUnidad = document.createElement('td');
    celdaUnidad.textContent = item.unidad;

    const celdaEstado = document.createElement('td');
    const chip = document.createElement('span');
    chip.className = `chip-estado chip-estado--${item.estado === 'BAJO' ? 'bajo' : 'ok'}`;
    chip.textContent = item.estado;
    celdaEstado.appendChild(chip);

    fila.append(celdaInsumo, celdaExistencia, celdaUnidad, celdaEstado);
    cuerpoInventario.appendChild(fila);
  });

  conteoInventario.textContent = `${items.length} insumos`;

  movInsumo.replaceChildren();
  items.forEach((item) => {
    const opcion = document.createElement('option');
    opcion.value = item.insumo;
    opcion.textContent = item.insumo;
    movInsumo.appendChild(opcion);
  });
}

function renderReportes(items) {
  listaReportes.replaceChildren();

  if (!items.length) {
    const vacio = document.createElement('li');
    vacio.className = 'vacio';
    vacio.textContent = 'Sin reportes todavía.';
    listaReportes.appendChild(vacio);
    return;
  }

  items.forEach((reporte) => {
    const fila = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.href = reporte.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = reporte.archivo;
    fila.appendChild(enlace);
    listaReportes.appendChild(fila);
  });
}

async function cargarModo() {
  try {
    const datos = await api('/api/health');
    if (datos.modo === 'demo') {
      chipModo.className = 'chip chip--warn';
      chipModo.textContent = 'MODO DEMOSTRACIÓN · SIN MODELO REAL';
    } else {
      chipModo.className = 'chip chip--ok';
      chipModo.textContent = 'ASISTENTE EN LÍNEA';
      chipModo.title = `Modelo: ${datos.modelo}`;
    }
  } catch (error) {
    chipModo.className = 'chip chip--neutro';
    chipModo.textContent = 'SIN CONEXIÓN';
  }
}

formChat.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensaje = entrada.value.trim();
  if (!mensaje) return;

  entrada.value = '';
  agregarBurbuja(mensaje, 'user');
  const esperando = agregarBurbuja('Pensando…', 'pensando', null, false);

  try {
    const datos = await api('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, clienteId: clienteId() })
    });
    esperando.remove();
    agregarBurbuja(datos.respuesta, 'bot', datos.pdf);
  } catch (error) {
    esperando.remove();
    agregarBurbuja('Lo siento, no puedo responder en este momento. Intenta de nuevo en unos segundos.', 'bot');
  }
});

document.querySelectorAll('.sugerencia').forEach((boton) => {
  boton.addEventListener('click', () => {
    entrada.value = boton.dataset.pregunta;
    formChat.requestSubmit();
  });
});

formMovimiento.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarEstado('Registrando movimiento…');

  try {
    const actualizado = await api('/api/inventario/movimiento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insumo: movInsumo.value,
        tipo: movTipo.value,
        cantidad: Number(movCantidad.value)
      })
    });
    renderInventario(actualizado);
    mostrarEstado('Movimiento registrado correctamente.', 'ok');
  } catch (error) {
    mostrarEstado(error.message, 'error');
  }
});

btnPdf.addEventListener('click', async () => {
  btnPdf.disabled = true;
  try {
    const resultado = await api('/api/reportes/inventario', { method: 'POST' });
    renderReportes(await api('/api/reportes'));
    agregarBurbuja('Reporte de inventario generado.', 'bot', resultado.url);
  } catch (error) {
    agregarBurbuja('Lo siento, no pude generar el reporte. Intenta de nuevo en unos segundos.', 'bot');
  } finally {
    btnPdf.disabled = false;
  }
});

btnPdfChat.addEventListener('click', async () => {
  btnPdfChat.disabled = true;
  try {
    const resultado = await api('/api/reportes/conversacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensajes: historial })
    });
    renderReportes(await api('/api/reportes'));
    agregarBurbuja('PDF de la conversación listo.', 'bot', resultado.url);
  } catch (error) {
    agregarBurbuja('Lo siento, no pude generar el PDF. Intenta de nuevo en unos segundos.', 'bot');
  } finally {
    btnPdfChat.disabled = false;
  }
});

btnImprimir.addEventListener('click', () => {
  sessionStorage.setItem('cafeConversacion', JSON.stringify(historial));
  window.open('/impresion.html', '_blank');
});

async function inicializar() {
  cargarModo();
  const saludo = document.querySelector('.burbuja--bot');
  if (saludo) {
    historial.push({
      rol: 'bot',
      texto: saludo.textContent.replace(/\s+/g, ' ').trim(),
      hora: horaLocal()
    });
  }

  try {
    const [inventario, reportes] = await Promise.all([
      api('/api/inventario'),
      api('/api/reportes')
    ]);
    renderInventario(inventario);
    renderReportes(reportes);
  } catch (error) {
    mostrarEstado(error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', inicializar);
