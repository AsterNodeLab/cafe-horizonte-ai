'use strict';

(function () {
  const NS = 'http://www.w3.org/2000/svg';

  const elemento = (id) => document.getElementById(id);

  function texto(valor) {
    return valor === undefined || valor === null ? '' : String(valor);
  }

  function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }

  function dinero(valor) {
    return '$' + numero(valor).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function etiquetaCorta(valor, esDinero) {
    const n = numero(valor);
    const signo = esDinero ? '$' : '';
    if (Math.abs(n) >= 1000) {
      const miles = n / 1000;
      return signo + (Number.isInteger(miles) ? miles.toFixed(0) : miles.toFixed(1)) + 'k';
    }
    return signo + String(Math.round(n));
  }

  function escalaMax(valores) {
    const max = valores.reduce((mayor, valor) => Math.max(mayor, numero(valor)), 0);
    // Si no hay datos, el eje muestra cuatro divisiones para no dividir entre cero.
    if (max <= 0) return 4;
    const magnitud = Math.pow(10, Math.floor(Math.log10(max)));
    const normalizado = max / magnitud;
    const factor = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
    return factor * magnitud;
  }

  function nodoSvg(nombre, atributos) {
    const nodo = document.createElementNS(NS, nombre);
    Object.keys(atributos).forEach((clave) => nodo.setAttribute(clave, atributos[clave]));
    return nodo;
  }

  function ponerEstado(id, mensaje, tipo) {
    const nodo = elemento(id);
    nodo.textContent = mensaje;
    nodo.className = 'estado' + (tipo ? ' estado--' + tipo : '');
  }

  function prepararLienzo(svg, titulo, valores, formatoEje) {
    svg.replaceChildren();

    const tituloNodo = document.createElementNS(NS, 'title');
    tituloNodo.textContent = titulo;
    svg.appendChild(tituloNodo);

    const anchoTotal = 640;
    const altoTotal = 260;
    const margen = { top: 18, right: 14, bottom: 38, left: 52 };
    const ancho = anchoTotal - margen.left - margen.right;
    const alto = altoTotal - margen.top - margen.bottom;
    const max = escalaMax(valores);
    const y = (valor) => margen.top + alto - (numero(valor) / max) * alto;
    const divisiones = 4;

    for (let i = 0; i <= divisiones; i += 1) {
      const valor = (max / divisiones) * i;
      const yy = y(valor);
      svg.appendChild(nodoSvg('line', {
        x1: margen.left,
        y1: yy.toFixed(2),
        x2: anchoTotal - margen.right,
        y2: yy.toFixed(2),
        stroke: '#e6d9c6',
        'stroke-width': 1
      }));

      const etiqueta = nodoSvg('text', {
        x: margen.left - 8,
        y: (yy + 3).toFixed(2),
        'text-anchor': 'end',
        class: 'eje'
      });
      etiqueta.textContent = formatoEje(valor);
      svg.appendChild(etiqueta);
    }

    return { svg, margen, ancho, alto, y };
  }

  function dibujarBarras(svg, dias) {
    const totales = dias.map((dia) => numero(dia.total));
    const resumen = dias.map((dia) => texto(dia.fecha) + ': ' + dinero(dia.total)).join('. ');
    const titulo = 'Ventas por día. ' + (resumen || 'Sin datos para mostrar.');
    const lienzo = prepararLienzo(svg, titulo, totales, (valor) => etiquetaCorta(valor, true));

    const cantidad = dias.length || 1;
    const paso = lienzo.ancho / cantidad;
    const anchoBarra = Math.max(4, paso * 0.56);
    const base = lienzo.margen.top + lienzo.alto;

    dias.forEach((dia, indice) => {
      const valor = numero(dia.total);
      const altura = Math.max(2, base - lienzo.y(valor));
      const x = lienzo.margen.left + indice * paso + (paso - anchoBarra) / 2;

      lienzo.svg.appendChild(nodoSvg('rect', {
        x: x.toFixed(2),
        y: (base - altura).toFixed(2),
        width: anchoBarra.toFixed(2),
        height: altura.toFixed(2),
        rx: 3,
        class: valor > 0 ? 'barra' : 'barra-cero'
      }));

      if (valor > 0 && altura > 14) {
        const valorTexto = nodoSvg('text', {
          x: (x + anchoBarra / 2).toFixed(2),
          y: (base - altura - 5).toFixed(2),
          'text-anchor': 'middle',
          class: 'valor'
        });
        valorTexto.textContent = etiquetaCorta(valor, true);
        lienzo.svg.appendChild(valorTexto);
      }

      const fechaTexto = nodoSvg('text', {
        x: (lienzo.margen.left + indice * paso + paso / 2).toFixed(2),
        y: (base + 17).toFixed(2),
        'text-anchor': 'middle',
        class: 'fecha'
      });
      fechaTexto.textContent = texto(dia.fecha).slice(5);
      lienzo.svg.appendChild(fechaTexto);
    });
  }

  function dibujarClientes(svg, dias) {
    const clientes = dias.map((dia) => numero(dia.clientes));
    const chat = dias.map((dia) => numero(dia.clientesChat));
    const resumen = dias
      .map((dia) => texto(dia.fecha) + ': ' + numero(dia.clientes) + ' únicos, ' + numero(dia.clientesChat) + ' en chat')
      .join('. ');
    const titulo = 'Clientes por día. ' + (resumen || 'Sin datos para mostrar.');
    const lienzo = prepararLienzo(svg, titulo, clientes.concat(chat), (valor) => etiquetaCorta(valor, false));

    const cantidad = dias.length || 1;
    const paso = lienzo.ancho / cantidad;
    const xEn = (indice) => lienzo.margen.left + indice * paso + paso / 2;
    const puntos = (valores) => valores
      .map((valor, indice) => xEn(indice).toFixed(2) + ',' + lienzo.y(valor).toFixed(2))
      .join(' ');

    lienzo.svg.appendChild(nodoSvg('polyline', {
      points: puntos(clientes),
      fill: 'none',
      stroke: '#6d4326',
      'stroke-width': 2.4,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round'
    }));

    lienzo.svg.appendChild(nodoSvg('polyline', {
      points: puntos(chat),
      fill: 'none',
      stroke: '#a5652f',
      'stroke-width': 1.8,
      'stroke-dasharray': '5 4',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round'
    }));

    dias.forEach((dia, indice) => {
      const x = xEn(indice);
      const y = lienzo.y(clientes[indice]);

      lienzo.svg.appendChild(nodoSvg('circle', {
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: 3.5,
        fill: '#fffcf7',
        stroke: '#6d4326',
        'stroke-width': 2
      }));

      const valorTexto = nodoSvg('text', {
        x: x.toFixed(2),
        y: (y - 9).toFixed(2),
        'text-anchor': 'middle',
        class: 'valor'
      });
      valorTexto.textContent = String(clientes[indice]);
      lienzo.svg.appendChild(valorTexto);

      const fechaTexto = nodoSvg('text', {
        x: x.toFixed(2),
        y: (lienzo.margen.top + lienzo.alto + 17).toFixed(2),
        'text-anchor': 'middle',
        class: 'fecha'
      });
      fechaTexto.textContent = texto(dia.fecha).slice(5);
      lienzo.svg.appendChild(fechaTexto);
    });
  }

  function filaVacia(cuerpo, columnas, mensaje) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = columnas;
    celda.className = 'vacio';
    celda.textContent = mensaje;
    fila.appendChild(celda);
    cuerpo.replaceChildren(fila);
  }

  function celda(fila, valor, clase) {
    const nodo = document.createElement('td');
    nodo.textContent = texto(valor);
    if (clase) nodo.className = clase;
    fila.appendChild(nodo);
    return nodo;
  }

  function pintarResumen(resumen) {
    elemento('m-ventas-hoy').textContent = dinero(resumen.ventasHoy);
    elemento('m-ordenes-hoy').textContent = String(numero(resumen.ordenesHoy));
    elemento('m-total-general').textContent = dinero(resumen.totalGeneral);
    elemento('m-ticket').textContent = dinero(resumen.ticketPromedio);
  }

  function pintarInventario(items) {
    const cuerpo = elemento('cuerpo-inventario');
    elemento('inventario-conteo').textContent = items.length + ' INSUMOS';

    if (!items.length) {
      filaVacia(cuerpo, 5, 'No hay insumos registrados.');
      return;
    }

    cuerpo.replaceChildren();
    items.forEach((item) => {
      const fila = document.createElement('tr');
      celda(fila, item.insumo);
      celda(fila, numero(item.existencia), 'numero');
      celda(fila, item.unidad);
      celda(fila, numero(item.minimo), 'numero');

      const estado = texto(item.estado).toUpperCase() === 'BAJO' ? 'BAJO' : 'OK';
      const estadoCelda = document.createElement('td');
      const chip = document.createElement('span');
      chip.className = 'chip-estado chip-estado--' + (estado === 'OK' ? 'ok' : 'bajo');
      chip.textContent = estado;
      estadoCelda.appendChild(chip);
      fila.appendChild(estadoCelda);
      cuerpo.appendChild(fila);
    });
  }

  function pintarVentas(ventas) {
    const cuerpo = elemento('cuerpo-ventas');
    elemento('ventas-conteo').textContent = ventas.length + ' VENTAS';

    if (!ventas.length) {
      filaVacia(cuerpo, 5, 'Aún no hay ventas registradas.');
      return;
    }

    cuerpo.replaceChildren();
    ventas.forEach((venta) => {
      const fecha = new Date(venta.fecha);
      const hora = Number.isNaN(fecha.getTime())
        ? texto(venta.fecha)
        : fecha.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
      const productos = Array.isArray(venta.items)
        ? venta.items.map((item) => numero(item.cantidad) + '× ' + texto(item.producto)).join(', ')
        : '';

      const fila = document.createElement('tr');
      celda(fila, hora);
      celda(fila, venta.cliente);
      celda(fila, productos || '—');
      celda(fila, dinero(venta.total), 'numero');
      celda(fila, venta.metodo);
      cuerpo.appendChild(fila);
    });
  }

  async function cargar() {
    ponerEstado('estado-global', 'Cargando datos del panel…');
    try {
      const respuesta = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!respuesta.ok) throw new Error('No se pudo cargar el panel.');

      const datos = await respuesta.json();
      pintarResumen(datos.resumen || {});

      const dias = Array.isArray(datos.dias) ? datos.dias : [];
      dibujarBarras(elemento('graf-ventas'), dias);
      dibujarClientes(elemento('graf-clientes'), dias);

      pintarInventario(Array.isArray(datos.inventario) ? datos.inventario : []);
      pintarVentas(Array.isArray(datos.ultimasVentas) ? datos.ultimasVentas : []);

      elemento('chip-datos-texto').textContent = datos.supabase
        ? 'PANEL EN VIVO · SUPABASE'
        : 'PANEL EN VIVO · LOCAL';
      ponerEstado('estado-global', 'Datos actualizados.', 'ok');
    } catch (error) {
      ponerEstado('estado-global', 'No se pudieron cargar los datos. Recarga la página para intentarlo de nuevo.', 'error');
    }
  }

  async function registrarVenta(evento) {
    evento.preventDefault();
    const boton = elemento('btn-venta');
    const producto = elemento('v-producto').value.trim();
    const cantidad = numero(elemento('v-cantidad').value);
    const precio = numero(elemento('v-precio').value);

    if (!producto || cantidad <= 0 || precio <= 0) {
      ponerEstado('estado-venta', 'Captura un producto, una cantidad y un precio válidos.', 'error');
      return;
    }

    const total = Math.round(cantidad * precio * 100) / 100;
    boton.disabled = true;
    ponerEstado('estado-venta', 'Registrando venta…');

    try {
      const respuesta = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'mostrador',
          items: [{ producto: producto, cantidad: cantidad, precio: precio }],
          total: total,
          metodo: 'mostrador'
        })
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        throw new Error(datos.error || 'No se pudo registrar la venta.');
      }

      elemento('form-venta').reset();
      elemento('v-cantidad').value = '1';
      ponerEstado('estado-venta', 'Venta registrada por ' + dinero(total) + '.', 'ok');
      await cargar();
    } catch (error) {
      ponerEstado('estado-venta', error.message, 'error');
    } finally {
      boton.disabled = false;
    }
  }

  async function iniciarPago(evento) {
    evento.preventDefault();
    const boton = elemento('btn-pago');
    const monto = numero(elemento('p-monto').value);
    const descripcion = elemento('p-concepto').value.trim() || 'Pedido Café Horizonte';

    if (monto <= 0) {
      ponerEstado('estado-pago', 'Captura un monto mayor que cero.', 'error');
      return;
    }

    boton.disabled = true;
    ponerEstado('estado-pago', 'Preparando el pago…');

    try {
      const respuesta = await fetch('/api/pagos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: monto, descripcion: descripcion })
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        throw new Error(datos.error || 'No se pudo iniciar el pago.');
      }

      const datos = await respuesta.json();
      if (!datos.url) throw new Error('El servidor no devolvió una URL de pago.');

      ponerEstado('estado-pago', 'Abriendo la página de pago…', 'ok');
      window.open(datos.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      ponerEstado('estado-pago', error.message, 'error');
    } finally {
      boton.disabled = false;
    }
  }

  elemento('form-venta').addEventListener('submit', registrarVenta);
  elemento('form-pago').addEventListener('submit', iniciarPago);
  cargar();
})();
