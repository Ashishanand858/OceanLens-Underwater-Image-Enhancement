import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  originalName: { type: String, required: true, maxlength: 180 },
  inputBytes: Number, inputWidth: Number, inputHeight: Number,
  outputBytes: Number, outputWidth: Number, outputHeight: Number,
  inferenceMs: Number, totalMs: Number,
  // Metadata only: browser owns output bytes; no misleading persistent download URL.
  outputStored: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 604800 },
});
export default mongoose.model('Enhancement', schema);
