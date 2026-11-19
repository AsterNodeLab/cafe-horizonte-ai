# Café Horizonte AI

Asistente de atención para una cafetería ficticia. Responde preguntas usando archivos Markdown,
guarda memoria diaria, permite registrar entradas y salidas de inventario y genera reportes PDF.

## Instalar y arrancar

1. Instala las dependencias (solo `express` y `pdfkit`):

   ```bash
   npm install
   ```

2. Si quieres usar un modelo real, copia `.env.example` a `.env` y completa tu clave:

   ```bash
   copy .env.example .env
   ```

   Edita `.env` con tu `OPENROUTER_API_KEY` y el identificador exacto de un modelo de
   openrouter.ai/models en `OPENROUTER_MODEL`. **No compartas ni subas ese archivo.**
   Si no hay clave, la app funciona en modo demostración y lo avisa en la pantalla.

3. Inicia el servidor:

   ```bash
   npm start
   ```

4. Abre **http://localhost:3000**.

## Qué es cada parte

- **Frontend (`public/`):** lo que ves en el navegador: `index.html`, `styles.css` y `app.js`.
- **Backend (`server.js` y `lib/`):** recibe las peticiones, lee los archivos, habla con OpenRouter
  y genera los PDF. La clave de API solo vive aquí, en el servidor.
- **OpenRouter:** el servidor envía el system prompt (con el conocimiento) y tu mensaje a la API de
  OpenRouter y muestra la respuesta en el chat. Sin clave, `lib/demo.js` responde con las mismos
  archivos de conocimiento.
- **Conocimiento (`conocimiento/`):** archivos `.md` con horarios, menú, inventario, políticas y
  productos próximamente. Puedes editarlos y reiniciar el servidor sin cambiar código.
- **Alma (`SOUL.md`):** personalidad y reglas del asistente. Si un producto no existe, da un no
  claro y ofrece alternativas reales o productos próximos, sin decir "no tengo información".
- **Memoria (`memoria/`):** un archivo por día con los temas preguntados; oculta correos y teléfonos.
- **Reportes (`reportes/`):** los PDF de inventario generados.

## Pruebas rápidas

```bash
curl -s http://localhost:3000/api/health
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"mensaje\":\"¿Cuánto cuestan dos capuchinos?\"}"
curl -s -X POST http://localhost:3000/api/reportes/inventario
curl -s -X POST http://localhost:3000/api/reportes/conversacion -H "Content-Type: application/json" -d "{\"mensajes\":[{\"rol\":\"user\",\"texto\":\"Hola\",\"hora\":\"12:00\"}]}"
```

En **Reportes e impresión** puedes descargar el PDF del inventario, descargar el PDF de toda la
conversación o abrir una vista premium para imprimirla.

## Dashboard y pagos

- **Dashboard:** `http://localhost:3000/dashboard.html` muestra ventas e inventario en vivo,
  clientes por día, últimas ventas y un formulario para registrar ventas. Los datos salen de
  `GET /api/dashboard`.
- **Pagos:** `POST /api/pagos/crear` usa Stripe si defines `STRIPE_SECRET_KEY`; si no, devuelve una
  URL de pago de demostración en `/pago.html` (sin cargo real).

## Memoria en Supabase

- Define `SUPABASE_URL` y `SUPABASE_KEY` (clave publishable) en `.env`.
- Cada mensaje del chat se guarda también en la tabla `memoria_chat` de Supabase;
  `GET /api/memoria` devuelve los últimos registros.

## CRM en Excel

El panel interno está en **http://localhost:3000/crm.html** (no aparece en la página del cliente).
Muestra clientes únicos y últimos mensajes, y genera `crm/horizonte-crm.xlsx` con siete hojas:
Clientes, Conversaciones, Inventario, Menu, Proximamente, Memoria y Reportes. Los datos salen del
chat guardado en `crm/conversaciones.json` y de los archivos de `conocimiento/`, `memoria/` y
`reportes/`. El mismo libro se descarga con `GET /api/crm/exportar`. El identificador de cliente es
anónimo y se guarda en el navegador.

Datos ficticios · Uso educativo · E1577 Laboratorio final · Top Learning
