import multer from 'multer';
import sharp from 'sharp';
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024,
    files: 1, fields: 0, parts: 1 },
  fileFilter(req, file, cb) {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype) || !/\.(jpe?g|png)$/i.test(file.originalname)) {
      return cb(Object.assign(new Error('Choose a JPEG or PNG image.'), { status: 415 }));
    }
    cb(null, true);
  },
}).single('image');

export async function validateImage(req, res, next) {
  if (!req.file) return res.status(400).json({ error: 'An image is required in the image field.' });
  try {
    const buffer = req.file.buffer;
    const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
    if ((!png && !jpeg) || req.file.mimetype !== (png ? 'image/png' : 'image/jpeg')) {
      return res.status(415).json({ error: 'Image contents do not match a JPEG or PNG.' });
    }
    const options = { limitInputPixels: 20_000_000, failOn: 'warning' };
    const metadata = await sharp(buffer, options).metadata();
    if (!['png', 'jpeg'].includes(metadata.format) || (metadata.pages || 1) !== 1) {
      return res.status(415).json({ error: 'Use a non-animated JPEG or PNG image.' });
    }
    // Decode for validation; forward original bytes unchanged to preserve notebook preprocessing.
    await sharp(buffer, options).resize(1, 1).raw().toBuffer();
    req.imageMetadata = metadata;
    next();
  } catch {
    res.status(422).json({ error: 'Image is damaged or exceeds the 20 megapixel limit.' });
  }
}
