"""Private inference service. Run one Uvicorn worker to load one model."""
from contextlib import asynccontextmanager
from pathlib import Path
import asyncio
import hmac
import logging
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool
from inference import Enhancer, InvalidImage

load_dotenv(Path(__file__).with_name(".env"))
MAX_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
API_KEY = os.getenv("INFERENCE_API_KEY", "local-development-change-me")

@asynccontextmanager
async def lifespan(app):
    app.state.enhancer = Enhancer()  # Strict load failures prevent readiness.
    app.state.busy = False
    yield
    app.state.enhancer = None

app = FastAPI(title="Private PIXMambaNet inference", lifespan=lifespan,
              docs_url=None, redoc_url=None, openapi_url=None)

@app.get("/health")
def health():
    model = getattr(app.state, "enhancer", None)
    return {"ready": model is not None, "model": "PIXMambaNet",
            "device": str(model.device) if model else None,
            "checkpointTensors": model.tensor_count if model else 0}

@app.post("/predict")
async def predict(request: Request):
    if not hmac.compare_digest(request.headers.get("x-inference-key", ""), API_KEY):
        raise HTTPException(401, "Invalid inference credential.")
    if request.headers.get("content-type") not in ("image/jpeg", "image/png"):
        raise HTTPException(415, "Expected JPEG or PNG bytes.")
    # Fail fast instead of retaining an unbounded queue of large tensors/uploads.
    if app.state.busy:
        raise HTTPException(503, "Inference is busy. Retry shortly.", headers={"Retry-After": "2"})
    app.state.busy = True
    try:
        payload = bytearray()
        async with asyncio.timeout(30):
            async for chunk in request.stream():
                if len(payload) + len(chunk) > MAX_BYTES:
                    raise HTTPException(413, "Image exceeds the upload limit.")
                payload.extend(chunk)
        if not payload:
            raise HTTPException(400, "An image is required.")
        try:
            png, elapsed = await run_in_threadpool(app.state.enhancer.predict, bytes(payload))
        except InvalidImage as exc:
            raise HTTPException(422, str(exc)) from exc
        return Response(png, media_type="image/png", headers={
            "X-Inference-Time-Ms": f"{elapsed:.2f}", "X-Output-Width": "256",
            "X-Output-Height": "256", "Cache-Control": "no-store"})
    except TimeoutError as exc:
        raise HTTPException(408, "Upload timed out.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("Inference failed")
        raise HTTPException(500, "Model inference failed.") from exc
    finally:
        app.state.busy = False
