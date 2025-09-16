from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class RifeReq(BaseModel):
    video_url: str
    factor: int

@app.get('/health')
def health():
    return { 'ok': True, 'model': 'RIFE (stub)', 'ready': True }

@app.post('/interpolate')
def interpolate(req: RifeReq):
    # Placeholder: echo back
    return { 'video_url': req.video_url, 'new_fps': 48 if req.factor==2 else 72 }


