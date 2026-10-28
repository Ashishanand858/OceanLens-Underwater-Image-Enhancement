import { makeId } from './id.js';
import axios from 'axios';
let sessionId;
try {
  sessionId = sessionStorage.getItem('pixmamba-session') || makeId();
  sessionStorage.setItem('pixmamba-session', sessionId);
} catch { sessionId = makeId(); }
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 130000, headers: { 'X-Session-Id': sessionId } });
export async function enhanceImage(file, signal, onProgress) {
  const body = new FormData();
  body.append('image', file);
  try {
    const response = await api.post('/api/enhance', body, { responseType: 'blob', signal,
      onUploadProgress: event => onProgress(event.total ? Math.round(event.loaded / event.total * 100) : 0) });
    if (response.data.type !== 'image/png') throw new Error('The server did not return an enhanced PNG.');
    return { blob: response.data, inferenceMs: Number(response.headers['x-inference-time-ms']),
      totalMs: Number(response.headers['x-processing-time-ms']) };
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try { const data = JSON.parse(await error.response.data.text()); error.message = data.error || error.message; } catch {}
    } else if (error.code === 'ERR_NETWORK') error.message = 'Cannot reach Express. Start the backend and try again.';
    throw error;
  }
}
export const getHealth = () => api.get('/api/health', { timeout: 5000 }).then(r => r.data);
export const getHistory = () => api.get('/api/history', { timeout: 5000 }).then(r => r.data);
