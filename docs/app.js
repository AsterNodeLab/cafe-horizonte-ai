'use strict';

// Versión estática para GitHub Pages: responde con el mismo conocimiento del proyecto.
const MENU = [
  { nombre: 'Café americano', precio: 45 },
  { nombre: 'Capuchino', precio: 65 },
  { nombre: 'Sándwich', precio: 89 },
  { nombre: 'Rebanada de pastel', precio: 75 }
];
const PROXIMOS = [
  { nombre: 'Latte de vainilla', precio: 70 },
  { nombre: 'Croissant de almendra', precio: 60 },
  { nombre: 'Café frío de temporada', precio: 55 },
  { nombre: 'Rebanada de pastel de limón', precio: 75 }
];
const NUMEROS = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, diez: 10 };

const mensajes = document.getElementById('mensajes');
const entrada = document.getElementById('entrada');
const formChat = document.getElementById('form-chat');
const btnImprimir = document.getElementById('btn-imprimir');
const historial = [];

function sinAcentos(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patron(producto) {
  return producto
    .split(/\s+/)
    .map((palabra) => `${escapar(palabra)}s?`)
    .join('\\s+');
}

function encontrarProducto(texto) {
  return MENU.find((producto) => new RegExp(`\\b${patron(sinAcentos(producto.nombre))}\\b`).test(texto));
}

function cantidadEn(texto, producto) {
  const palabras = Object.keys(NUMEROS).join('|');
  const coincidencia = texto.match(new RegExp(`(?:(\\d+)|(${palabras}))\\s+${patron(sinAcentos(producto.nombre))}`));
  if (!coincidencia) return 1;
  return coincidencia[1] ? Number(coincidencia[1]) : NUMEROS[coincidencia[2]];
}

function responder(mensaje) {
  const texto = sinAcentos(mensaje);

  if (/horario|abren|abiert|horas|cierr/.test(texto)) {
    return 'De lunes a viernes abrimos de 9:00 a 20:00, y sábado y domingo de 10:00 a 18:00.';
  }

  const producto = encontrarProducto(texto);
  if (producto) {
    const cantidad = cantidadEn(texto, producto);
    const total = cantidad * producto.precio;
    return cantidad === 1
      ? `${producto.nombre}: $${producto.precio} MXN.`
      : `${cantidad} × ${producto.nombre} = $${total} MXN ($${producto.precio} MXN c/u).`;
  }

  if (/domicilio|entrega a casa|delivery/.test(texto)) {
    return 'No tenemos servicio a domicilio. Puedes visitarnos en el café.';
  }

  if (/recomienda|desayun|almuerz|hambre|comer|suger/.test(texto)) {
    return 'Te recomiendo un capuchino con sándwich, $154 MXN en total.';
  }

  const futuro = PROXIMOS[0];
  return `Por ahora no vendemos eso en Café Horizonte. Puedes probar un sándwich ($89 MXN) o, próximamente, ${futuro.nombre.toLowerCase()} ($${futuro.precio} MXN).`;
}

function agregarBurbuja(texto, tipo, registrar = true) {
  const burbuja = document.createElement('div');
  burbuja.className = `burbuja burbuja--${tipo}`;
  burbuja.textContent = texto;
  mensajes.appendChild(burbuja);
  mensajes.scrollTop = mensajes.scrollHeight;
  if (registrar) {
    historial.push({ rol: tipo === 'user' ? 'user' : 'bot', texto, hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) });
  }
  return burbuja;
}

document.getElementById('cuerpo-menu').replaceChildren();
MENU.forEach((producto) => {
  const fila = document.createElement('tr');
  const nombre = document.createElement('td');
  nombre.textContent = producto.nombre;
  const precio = document.createElement('td');
  precio.className = 'numero';
  precio.textContent = `$${producto.precio}`;
  fila.append(nombre, precio);
  document.getElementById('cuerpo-menu').appendChild(fila);
});

formChat.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const mensaje = entrada.value.trim();
  if (!mensaje) return;
  entrada.value = '';
  agregarBurbuja(mensaje, 'user');
  const esperando = agregarBurbuja('Pensando…', 'pensando', false);
  setTimeout(() => {
    esperando.remove();
    agregarBurbuja(responder(mensaje), 'bot');
  }, 350);
});

document.querySelectorAll('.sugerencia').forEach((boton) => {
  boton.addEventListener('click', () => {
    entrada.value = boton.dataset.pregunta;
    formChat.requestSubmit();
  });
});

btnImprimir.addEventListener('click', () => {
  sessionStorage.setItem('cafeConversacion', JSON.stringify(historial));
  window.open('print.html', '_blank');
});

const saludo = document.querySelector('.burbuja--bot');
if (saludo) {
  historial.push({
    rol: 'bot',
    texto: saludo.textContent.replace(/\s+/g, ' ').trim(),
    hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  });
}
