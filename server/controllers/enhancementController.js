import axios from 'axios';
import { performance } from 'node:perf_hooks';
import Enhancement from '../models/Enhancement.js';
import { historyAvailable, historyEnabled } from '../config/db.js';
const mlUrl = () => process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
export const validSession = value => /^[a-f0-9-]{36}$/i.test(value || '');

export async function health(req, res) {
  let model = { ready: false };
  try { model = (await axios.get(`${mlUrl()}/health`, { timeout: 2500 })).data; } catch {}
  res.status(model.ready ? 200 : 503).json({ ready: !!model.ready, backend: 'ready', model,
    history: historyEnabled() ? (historyAvailable() ? 'available' : 'unavailable') : 'disabled' });
}

export async function enhance(req, res) {
  const controller = new AbortController();
  const onClose = () => { if (!res.writableEnded) controller.abort(); };
  res.on('close', onClose);
  try {
    const response = await axios.post(`${mlUrl()}/predict`, req.file.buffer, {
      headers: { 'Content-Type': req.file.mimetype,
        'X-Inference-Key': process.env.INFERENCE_API_KEY || 'local-development-change-me' },
      responseType: 'arraybuffer', timeout: Number(process.env.ML_TIMEOUT_MS || 120000),
      maxBodyLength: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024,
      maxContentLength: 2 * 1024 * 1024, signal: controller.signal,
    });
    const png = Buffer.from(response.data);
    if (!png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      throw new Error('Inference service returned invalid output');
    }
    const inferenceMs = Number(response.headers['x-inference-time-ms']);
    const totalMs = performance.now() - req.startedAt;
    const sessionId = req.get('X-Session-Id');
    let historyStatus = historyEnabled() ? 'unavailable' : 'disabled';
    if (historyAvailable() && validSession(sessionId)) {
      // History is best effort and never holds up delivery of the enhanced image.
      historyStatus = 'pending';
      Enhancement.create({ sessionId, originalName: req.file.originalname.slice(0, 180),
        inputBytes: req.file.size, inputWidth: req.imageMetadata.width,
        inputHeight: req.imageMetadata.height, outputBytes: png.length,
        outputWidth: 256, outputHeight: 256, inferenceMs, totalMs,
      }).catch(() => console.warn('History write failed; output was still delivered.'));
    }
    res.set({ 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename="enhanced.png"',
      'X-Inference-Time-Ms': String(inferenceMs), 'X-Processing-Time-Ms': totalMs.toFixed(2),
      'X-Output-Width': '256', 'X-Output-Height': '256', 'X-History-Status': historyStatus,
      'Cache-Control': 'no-store' });
    res.send(png);
  } catch (error) {
    if (res.destroyed) return;
    const timeout = ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code);
    const upstreamStatus = error.response?.status;
    const status = timeout ? 504 : [400, 413, 415, 422, 503].includes(upstreamStatus) ? upstreamStatus : 502;
    const message = timeout ? 'Enhancement timed out. Try again or use a faster inference device.'
      : upstreamStatus === 503 ? 'The model is processing another image. Please retry shortly.'
      : upstreamStatus === 422 ? 'This image could not be decoded. Try a different JPEG or PNG.'
      : 'The inference service is unavailable. Check that the Python service is running.';
    if (status === 503) res.set('Retry-After', '2');
    res.status(status).json({ error: message });
  } finally {
    res.off('close', onClose);
  }
}

export async function history(req, res) {
  if (!historyAvailable()) return res.json({ items: [], available: false,
    reason: historyEnabled() ? 'History is temporarily unavailable.' : 'Database history is disabled.' });
  if (!validSession(req.get('X-Session-Id'))) return res.status(400).json({ error: 'A valid session ID is required.' });
  try {
    const items = await Enhancement.find({ sessionId: req.get('X-Session-Id') })
      .select('-sessionId -__v').sort({ createdAt: -1 }).limit(20).maxTimeMS(1500).lean();
    res.json({ items, available: true });
  } catch { res.json({ items: [], available: false, reason: 'History is temporarily unavailable.' }); }
}
