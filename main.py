# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import io
from typing import Annotated, List
from ml_pipeline import (
    predict_resume,
    predict_resume_with_skills,
    screen_candidates,
    vectorizer,
    clean_resume
)
from skill_extractor import extract_skills, compute_skill_gap
from sklearn.metrics.pairwise import cosine_similarity


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

def compute_cosine_similarity(resume_text: str, job_description: str):
    resume_vector = vectorizer.transform([clean_resume(resume_text)])
    jd_vector = vectorizer.transform([clean_resume(job_description)])

    similarity = cosine_similarity(
        resume_vector,
        jd_vector
    )[0][0]

    return round(float(similarity), 4)
    
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
@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    file_bytes = await file.read()

    resume_text = extract_text_from_pdf(file_bytes)

    result = predict_resume(resume_text)

    return {
        "filename": file.filename,
        "skills": result["skills"],
        "predicted_category": result["predicted_category"],
        "confidence": result["confidence"],
        "model_note": result["model_note"],
        "top_words": result["top_words"],
        "preview": resume_text[:300]
    }

@app.post("/screen/v2")
async def screen_v2(
    job_description: str = Form(...),
    files: List[UploadFile] = File(...),
):
    jd_skills = extract_skills(job_description)
    candidates = []
    for file in files:

        pdf_bytes = await file.read()
        resume_text = extract_text_from_pdf(pdf_bytes)
        prediction = predict_resume_with_skills(resume_text)
        similarity = compute_cosine_similarity(
            resume_text,
            job_description
        )

        skill_gap = compute_skill_gap(
            prediction["skills"],
            jd_skills
        )

        candidates.append({
            "filename": file.filename,
            "suggested_role": prediction["predicted_category"],
            "confidence": prediction["confidence"],
            "skills": prediction["skills"],
            "skill_gap": skill_gap,
            "similarity_score": similarity,
            "top_words": prediction["top_words"]
        })

    candidates.sort(

        key=lambda x: (
            x["skill_gap"]["match_score"],
            x["similarity_score"]
        ),
        reverse=True
    )

    return {
        "jd_skills": jd_skills,
        "candidates": candidates
    }
    