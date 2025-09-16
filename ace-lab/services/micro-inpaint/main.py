from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class InpaintReq(BaseModel):
    prompt: str
    seed: int | None = None
    strength: float | None = 0.8
    guidance: float | None = 2.0
    image_url: str
    mask_url: str

@app.get('/health')
def health():
    return { 'ok': True, 'model': 'SDXL-Turbo Inpaint (stub)', 'ready': True }

@app.post('/inpaint')
def inpaint(req: InpaintReq):
    # Placeholder: return the input image as a patch
    return { 'patch_url': req.image_url, 'w': 256, 'h': 256 }


