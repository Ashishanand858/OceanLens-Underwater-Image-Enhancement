# Verification report

**Historical report:** These checks ran on the original development edition. This no-tests edition omits the test files and testing dependencies; the commands below are a record, not runnable instructions for this package.

Executed on 28 October 2026 in the Linux CPU workspace.

## Passed

- `python -m pytest tests/test_model.py -q`: **7 passed**. Exact architecture AST comparison against the original notebook, strict 32-tensor checkpoint load, independent notebook-model output pixel equality, RGB/RGBA/grayscale input support, malformed input rejection, auth, repeated requests, empty/oversized payloads and busy responses.
- `npm test` in `server`: **4 passed** against the actual Express and PyTorch services, not a model mock. Readiness/history availability, repeated native PNG output and timings, invalid/mislabeled/missing/oversized/truncated uploads, denied origin, simultaneous requests and subsequent readiness.
- `npm test` in `client`: **4 passed** with explicit transport mocks. Automatic sequential multi-upload without an extra enhance click; output-based download filename/link; comparison slider clipping; side-by-side; fullscreen open/close; invalid type and size errors; API failure/retry; object URL cleanup.
- `npm run build` in `client`: production build passed.
- `python tests/run_stack.py`: passed. Express forwarded exactly the same PNG bytes as a direct Python model call. Production HTML served through Express with CSP permitting browser blob images. With history enabled and MongoDB unreachable, enhancement still returned 200. After stopping Python, readiness returned 503 and enhancement returned 502.
- Cloud browser: actual React homepage rendered successfully at desktop width; navigation and file chooser operated; uploading a text file displayed the expected validation error.
- Original and bundled model SHA-256 matched. No model retraining occurred.

One real CPU fixture request measured **191.73 ms model time / 202.85 ms total API time**. These are individual measured values, not averages, guarantees, or benchmarks on the user's hardware.

## Verification limits

- Services launched by separate tool calls are network-isolated in this workspace. Running the complete stack and API tests in one process group succeeded. The managed browser preview could not reach those private test processes, so successful enhancement display, slider dragging on a real result, and actual file downloading were **not browser-verified end to end**. Their component behavior was tested with explicit mocked transport; actual PNG production and byte forwarding were tested separately against the real model.
- Browser visual review was desktop only; responsive CSS is implemented, but device/mobile browser testing was not executed.
- No MongoDB instance/Atlas credentials were supplied. Successful database insertion/query/TTL was not exercised against a live database. Disabled and unavailable behavior was verified.
- CPU execution was tested; CUDA execution was not available.
- No separate underwater photograph or reference dataset was attached. Tests used clearly identified synthetic patterns; no claim about visual improvement, PSNR, SSIM or generalization is made.
- Windows commands were documented but not executed on Windows.
- No hosted deployment or production security/load audit was performed.

## Tested runtime

Node 24.22.1; Python 3.12; torch 2.14.1+cpu; torchvision 0.29.1+cpu; FastAPI 0.162.0; Uvicorn 0.54.0; Pillow 12.3.0; httpx 0.28.1; pytest 9.2.0; python-dotenv 1.2.4. Exact npm dependency resolutions are included in client/package-lock.json and server/package-lock.json. Python requirements intentionally permit compatible installations across CPU/CUDA; select matching torch/torchvision wheels.

One upstream Starlette test-client deprecation warning was emitted about httpx; all tests passed. No test failure is concealed as a successful check.
