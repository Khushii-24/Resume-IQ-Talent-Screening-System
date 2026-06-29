# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import io
from typing import List
from ml_pipeline import predict_resume, screen_candidates
from skill_extractor import extract_skills, compute_skill_gap

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
# ─── NEW ENDPOINT 1: Single resume analysis ──────────────────────────────────

@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    """
    Upload a PDF → get skills, suggested role, confidence, SHAP words.
    This is the new primary single-resume endpoint.
    """
    try:
        pdf_bytes = await file.read()
        text = extract_text_from_pdf(pdf_bytes)           # your existing helper
        cleaned = clean_text(text)                        # from ml_pipeline.py

        # ML layer — role suggestion (kept, now labeled as "suggested")
        prediction = predict_resume(cleaned)              # your existing function

        # New: skill extraction
        skills = extract_skills(cleaned)

        return {
            "status": "success",
            "skills": skills,
            "suggested_role": prediction["category"],
            "confidence": prediction["confidence"],
            "shap_words": prediction["shap_words"],
            "raw_text_preview": cleaned[:300],
        }
    except Exception as e:
        logger.error(f"/analyze error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── NEW ENDPOINT 2: Multi-candidate screening ────────────────────────────────

class ScreenRequestV2(BaseModel):
    job_description: str
    generate_summaries: bool = False

@app.post("/screen/v2")
async def screen_candidates_v2(
    job_description: str = Form(...),
    generate_summaries: bool = Form(False),
    files: List[UploadFile] = File(...),
):
    """
    JD + multiple PDFs → ranked recruiter scorecards.
    """
    try:
        jd_skills = extract_skills(job_description)
        results = []

        for file in files:
            pdf_bytes = await file.read()
            text = extract_text_from_pdf(pdf_bytes)
            cleaned = clean_text(text)

            # Skills
            resume_skills = extract_skills(cleaned)
            skill_gap = compute_skill_gap(resume_skills, jd_skills)

            # Cosine similarity (your existing logic)
            similarity = compute_cosine_similarity(cleaned, job_description)  # adjust to your fn name

            # Role suggestion
            prediction = predict_resume(cleaned)

            # Optional LLM summary
            summary = None
            if generate_summaries:
                summary = generate_candidate_summary(
                    resume_text=cleaned,
                    job_description=job_description,
                    skills=resume_skills,
                    skill_gap=skill_gap,
                    similarity=similarity,
                    suggested_role=prediction["category"],
                )

            results.append({
                "filename": file.filename,
                "skills": resume_skills,
                "skill_gap": skill_gap,
                "similarity_score": similarity,
                "suggested_role": prediction["category"],
                "confidence": prediction["confidence"],
                "shap_words": prediction["shap_words"],
                "llm_summary": summary,
            })

        # Rank by skill match_score first, then cosine similarity as tiebreak
        results.sort(key=lambda x: (
            x["skill_gap"]["match_score"],
            x["similarity_score"]
        ), reverse=True)

        return {
            "status": "success",
            "jd_skills": jd_skills,
            "candidates": results,
        }

    except Exception as e:
        logger.error(f"/screen/v2 error: {e}")
        raise HTTPException(status_code=500, detail=str(e))