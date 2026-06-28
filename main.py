# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import io
from typing import List
from ml_pipeline import predict_resume, screen_candidates

# ── App setup ──────────────────────────────────────────
app = FastAPI(
    title="ResumeIQ API",
    description="AI-powered resume screening system",
    version="1.0.0"
)

# ── CORS ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # React dev server
        "http://localhost:3000",   # fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic schemas ───────────────────────────────────
class ResumeTextRequest(BaseModel):
    resume_text: str
    top_n_shap: int = 10

class CandidateItem(BaseModel):
    name: str
    text: str

class ScreenRequest(BaseModel):
    job_description: str
    candidates: List[CandidateItem]
    top_n: int = 10

# ── Utility ────────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()

# ── Health check ───────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ResumeIQ API is running"}

# ── POST /predict — single resume via text ─────────────
@app.post("/predict")
def predict_from_text(request: ResumeTextRequest):
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text cannot be empty")
    
    result = predict_resume(request.resume_text, request.top_n_shap)
    return result

# ── POST /predict/upload — single resume via PDF ───────
@app.post("/predict/upload")
async def predict_from_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()

    try:
        resume_text = extract_text_from_pdf(file_bytes)

        # ---------- DEBUG ----------
        print("\n" + "=" * 70)
        print("Filename:", file.filename)
        print("Extracted text (first 500 chars):")
        print(resume_text[:500])
        print("=" * 70)
        # ---------------------------

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {str(e)}")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="PDF appears to be empty or unreadable")

    result = predict_resume(resume_text)
    result['filename'] = file.filename
    return result

# ── POST /screen — rank multiple candidates against JD ─
@app.post("/screen")
def screen_resumes(request: ScreenRequest):
    if not request.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description cannot be empty")
    
    if len(request.candidates) == 0:
        raise HTTPException(status_code=400, detail="candidates list cannot be empty")
    
    if len(request.candidates) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 candidates per request")
    
    candidates = [
        {"name": c.name, "text": c.text}
        for c in request.candidates
    ]
    
    ranked = screen_candidates(request.job_description, candidates, request.top_n)
    
    return {
        "job_description_preview": request.job_description[:100] + "...",
        "total_candidates": len(candidates),
        "ranked_candidates": ranked
    }