import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import apiRouter from './routes/api.js';
import { resolveHome } from './services/geocoding.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.clientOrigin }));
app.use('/api', apiRouter);

// Em produção, o mesmo servidor entrega o frontend compilado (client/dist).
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(config.port, async () => {
  console.log(`Servidor em http://localhost:${config.port}`);
  const home = await resolveHome();
  if (home.error) console.warn('[aviso]', home.error);
  else console.log(`Ponto de referência (${home.source}): ${home.address} → ${home.lat}, ${home.lng}`);
});
