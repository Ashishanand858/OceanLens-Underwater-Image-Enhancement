import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import routes from './routes/enhancementRoutes.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: {
  imgSrc: ["'self'", 'data:', 'blob:'],
  // Local HTTP development must not force HTTPS for assets.
  upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
} } }));
app.use((req, res, next) => { req.startedAt = performance.now(); next(); });
const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim());
app.use(cors({ origin(origin, cb) {
  cb(origin && !allowed.includes(origin) ? Object.assign(new Error('Origin is not allowed.'), { status: 403 }) : null, true);
}, exposedHeaders: ['X-Inference-Time-Ms','X-Processing-Time-Ms','X-Output-Width','X-Output-Height','X-History-Status'] }));
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a minute.' } }));
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
if (process.env.SERVE_CLIENT === 'true') {
  app.use(express.static(fileURLToPath(new URL('../client/dist', import.meta.url))));
}
app.use((error, req, res, next) => {
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.name === 'MulterError' ? 400 : error.status || 500;
  res.status(status).json({ error: status === 413 ? 'Image exceeds the upload limit (default 10 MB).'
    : status === 500 ? 'An unexpected server error occurred.' : error.message });
});
