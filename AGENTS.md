# Reglas del proyecto Café Horizonte AI

- Stack: Node.js >= 18, CommonJS (`require`/`module.exports`). Prohibido `import` y `"type": "module"`.
- Dependencias permitidas: solo `express` y `pdfkit`. No instales nada más (ni dotenv, cors, nodemon, body-parser, uuid, TypeScript, React, Vite, ORM, SQLite, Jest, Puppeteer).
- No uses herramientas globales ni `sudo`. `npm install` una sola vez; si falla, lee el error antes de reintentar.
- Escribe cada archivo completo en una sola operación. No crees archivos fuera del árbol indicado.
- La API key vive solo en el servidor (`process.env.OPENROUTER_API_KEY`). Nunca en `public/`, nunca en logs, nunca en respuestas.
- Nunca muestres ni imprimas el contenido de `.env`.
- Inicia el servidor en segundo plano para probar (`node server.js &`) y deténlo al terminar las pruebas; antes de relanzar, libera el puerto.
- Máximo 2 intentos para arreglar un mismo error; si persiste, detente y explica.
- Si algo no está especificado, elige la opción más simple y continúa sin preguntar.
- No publiques nada en internet. No afirmes que algo funciona sin haberlo probado.
