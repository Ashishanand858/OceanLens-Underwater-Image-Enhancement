"""Notebook-identical RGB -> Resize -> ToTensor -> model -> ToPILImage."""
from io import BytesIO
from pathlib import Path
import os
import time
import warnings
import torch
from torchvision import transforms
from PIL import Image, UnidentifiedImageError
from model_architecture import PIXMambaNet

Image.MAX_IMAGE_PIXELS = 20_000_000
warnings.simplefilter("error", Image.DecompressionBombWarning)
TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor()
])

class InvalidImage(ValueError):
    pass

class Enhancer:
    def __init__(self):
        torch.set_num_threads(max(1, int(os.getenv("TORCH_NUM_THREADS", "2"))))
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model_path = Path(os.getenv("MODEL_PATH", "model/underwater_image_enhancement.pth"))
        if not model_path.is_absolute():
            model_path = Path(__file__).parent / model_path
        self.model = PIXMambaNet().to(self.device)
        state_dict = torch.load(model_path, map_location=self.device, weights_only=True)
        self.model.load_state_dict(state_dict, strict=True)
        self.model.eval()
        self.tensor_count = len(state_dict)

    def predict(self, data):
        try:
            with Image.open(BytesIO(data)) as probe:
                if probe.format not in ("JPEG", "PNG") or getattr(probe, "n_frames", 1) != 1:
                    raise InvalidImage("Use a non-animated JPEG or PNG image.")
                if probe.width * probe.height > 20_000_000:
                    raise InvalidImage("Image exceeds the 20 megapixel limit.")
                probe.verify()
            with Image.open(BytesIO(data)) as source:
                # No EXIF rotation or extra normalization: matches the notebook.
                image = source.convert("RGB")
                batch = TRANSFORM(image).unsqueeze(0).to(self.device)
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError,
                Image.DecompressionBombWarning) as exc:
            raise InvalidImage("Invalid or oversized image. Use a valid JPEG or PNG (up to 20 MP).") from exc
        if self.device.type == "cuda":
            torch.cuda.synchronize()
        start = time.perf_counter()
        with torch.inference_mode():
            out = self.model(batch)
        if self.device.type == "cuda":
            torch.cuda.synchronize()
        inference_ms = (time.perf_counter() - start) * 1000
        # The notebook's final Sigmoid supplies [0,1]; preserve its ToPILImage conversion.
        result = transforms.ToPILImage()(out[0].cpu())
        buffer = BytesIO()
        result.save(buffer, format="PNG")
        return buffer.getvalue(), inference_ms
