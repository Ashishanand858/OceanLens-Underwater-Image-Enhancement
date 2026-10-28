# Model integration record

Source: supplied `underwater_image_enhancement(3).ipynb` and `underwater_image_enhancement(3).pth`.

- Architecture: notebook cells 16 and 18, copied verbatim to `ml-service/model_architecture.py`, with imports added. Cell numbers are zero-based.
- Input: `Image.open(...).convert("RGB")`; notebook cell 10 applies `transforms.Resize((256, 256))` then `transforms.ToTensor()`; add a batch dimension.
- Network: two convolutional encoder layers, two PixelMambaBlocks, two convolutional decoder layers, final sigmoid. The code is preserved exactly; its name does not imply an additional external Mamba implementation.
- Load: one startup initialization, CUDA if available otherwise CPU, `torch.load(..., weights_only=True)`, `load_state_dict(..., strict=True)`, then `eval()`.
- Execution: `torch.inference_mode()` replaces notebook `no_grad()` for inference-only execution. No architecture or parameter changes.
- Output: notebook cell 28 calls `transforms.ToPILImage()(out[j].cpu())`. The service uses the same conversion and encodes PNG unconditionally. No clipping/rounding/denormalization has been added.
- No EXIF auto-rotation: matches notebook loading. Browser comparison uses `image-orientation:none` to align with that convention.
- Training, metric evaluation and dataset-loading cells are not run. No external checkpoints or enhancement filters are used.
- Strict checkpoint load: 32 state dictionary tensors; no missing or unexpected keys.
- SHA-256 of original and bundled weights: `eec5fbdd4947fcdf0d360bf4b661881218676d2b29ab8e1911fd3ff3ed9b3861`.

Automated parity test instantiates the classes directly from the notebook cells, loads the same checkpoint independently, applies the notebook transform, and compares output pixels with the service pipeline. It passed on the CPU environment used for verification. This demonstrates implementation equivalence on the test input, not quantitative underwater image quality.
