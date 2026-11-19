'use strict';

// Motor de pagos: Stripe si hay clave; modo demostración si no.
async function crearSesion({ monto, descripcion }) {
  const total = Number(monto);
  if (!Number.isFinite(total) || total <= 0) {
    const error = new Error('El monto debe ser mayor que 0.');
    error.status = 400;
    throw error;
  }

  const clave = process.env.STRIPE_SECRET_KEY || '';
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const concepto = String(descripcion || 'Pedido Café Horizonte').slice(0, 100);

  if (!clave) {
    return {
      modo: 'demo',
      url: `/pago.html?monto=${encodeURIComponent(total)}&concepto=${encodeURIComponent(concepto)}`
    };
  }

  const cuerpo = new URLSearchParams();
  cuerpo.set('mode', 'payment');
  cuerpo.set('line_items[0][price_data][currency]', 'mxn');
  cuerpo.set('line_items[0][price_data][product_data][name]', concepto);
  cuerpo.set('line_items[0][price_data][unit_amount]', String(Math.round(total * 100)));
  cuerpo.set('line_items[0][quantity]', '1');
  cuerpo.set('success_url', `${base}/pago.html?estado=ok`);
  cuerpo.set('cancel_url', `${base}/pago.html?estado=cancelado`);

  let respuesta;
  try {
    respuesta = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clave}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: cuerpo
    });
  } catch (error) {
    const fallo = new Error('No se pudo conectar con el proveedor de pagos.');
    fallo.status = 502;
    throw fallo;
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const fallo = new Error(datos.error && datos.error.message ? datos.error.message : 'El pago no pudo iniciarse.');
    fallo.status = 502;
    throw fallo;
  }

  return { modo: 'stripe', url: datos.url, id: datos.id };
}

module.exports = { crearSesion };
