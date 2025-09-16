from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class AnimateReq(BaseModel):
    prompt: str
    seed: int | None = None
    seconds: int
    fps: int
    width: int | None = 512
    height: int | None = 512
    init_image_url: str | None = None

@app.get('/health')
def health():
    return { 'ok': True }

@app.post('/animate')
def animate(req: AnimateReq):
    # Placeholder: return a stub video url
    return { 'video_url': 'data:video/webm;base64,', 'duration_ms': req.seconds * 1000 }


