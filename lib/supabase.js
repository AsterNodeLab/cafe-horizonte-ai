'use strict';

// Memoria remota en Supabase usando la API REST (fetch nativo, sin dependencias).
const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const CLAVE = process.env.SUPABASE_KEY || '';

function encabezados(json = false) {
  return {
    apikey: CLAVE,
    Authorization: `Bearer ${CLAVE}`,
    ...(json ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {})
  };
}

function disponible() {
  return Boolean(URL_BASE && CLAVE);
}

async function registrar({ cliente, rol, texto, tema, respondida }) {
  if (!disponible()) return null;

  try {
    const respuesta = await fetch(`${URL_BASE}/rest/v1/memoria_chat`, {
      method: 'POST',
      headers: encabezados(true),
      body: JSON.stringify([
        { cliente_id: cliente, rol, mensaje: texto, tema: tema || null, respondida }
      ])
    });
    if (!respuesta.ok) return null;
    const datos = await respuesta.json();
    return Array.isArray(datos) ? datos[0] : null;
  } catch (error) {
    return null;
  }
}

async function obtener(limite = 20) {
  if (!disponible()) return [];

  try {
    const respuesta = await fetch(
      `${URL_BASE}/rest/v1/memoria_chat?select=cliente_id,rol,mensaje,respondida,created_at&order=created_at.desc&limit=${limite}`,
      { headers: encabezados() }
    );
    if (!respuesta.ok) return [];
    return await respuesta.json();
  } catch (error) {
    return [];
  }
}

module.exports = { disponible, registrar, obtener };
