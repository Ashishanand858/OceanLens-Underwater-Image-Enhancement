import { Router } from 'express';
import { health, enhance, history } from '../controllers/enhancementController.js';
import { upload, validateImage } from '../middleware/upload.js';
const router = Router();
// Bound memory before Multer allocates buffers. One active upload/inference per process.
let active = 0;
function admission(req, res, next) {
  if (active >= 1) return res.status(503).json({ error: 'Another image is being processed. Please retry shortly.' });
  active++;
  let released = false;
  const release = () => { if (!released) { released = true; active--; } };
  res.once('finish', release);
  res.once('close', release);
  next();
}
router.get('/health', health);
router.get('/history', history);
router.post('/enhance', admission, upload, validateImage, enhance);
export default router;
