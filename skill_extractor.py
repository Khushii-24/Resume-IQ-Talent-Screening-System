# skill_extractor.py
import spacy
from spacy.matcher import PhraseMatcher
from typing import List

nlp = spacy.load("en_core_web_sm")

# Curated skill vocabulary — extend this list as needed
SKILL_VOCAB = [
    # Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "kotlin", "swift", "scala", "ruby", "php", "r", "matlab",
    # Web
    "react", "angular", "vue", "next.js", "html", "css", "tailwind",
    "fastapi", "flask", "django", "express", "node.js", "rest api", "graphql",
    # Data / ML
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "xgboost", "pandas",
    "numpy", "matplotlib", "seaborn", "hugging face", "llm", "openai",
    "tf-idf", "spacy", "nltk",
    # Data engineering
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "apache kafka", "apache spark", "airflow", "dbt", "snowflake",
    # Cloud / DevOps
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "github actions", "ci/cd", "linux", "bash",
    # Other
    "git", "agile", "scrum", "system design", "microservices",
]

# Build PhraseMatcher once at module load (efficient)
matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
patterns = [nlp.make_doc(skill) for skill in SKILL_VOCAB]
matcher.add("SKILLS", patterns)


def extract_skills(text: str) -> List[str]:
    """Extract skills from text using PhraseMatcher against curated vocab."""
    doc = nlp(text.lower())
    matches = matcher(doc)
    # Deduplicate preserving order
    seen = set()
    skills = []
    for _, start, end in matches:
        skill = doc[start:end].text
        if skill not in seen:
            seen.add(skill)
            skills.append(skill)
    return skills


def compute_skill_gap(resume_skills: List[str], jd_skills: List[str]):
    """
    Returns:
        matched  — skills in both resume and JD
        missing  — JD skills not in resume (the gap)
        extra    — resume skills not required by JD
    """
    resume_set = set(s.lower() for s in resume_skills)
    jd_set = set(s.lower() for s in jd_skills)

    matched = sorted(resume_set & jd_set)
    missing = sorted(jd_set - resume_set)
    extra   = sorted(resume_set - jd_set)

    match_score = round(len(matched) / len(jd_set) * 100, 1) if jd_set else 0.0

    return {
        "matched": matched,
        "missing": missing,
        "extra": extra,
        "match_score": match_score,   # % of JD skills covered
    }