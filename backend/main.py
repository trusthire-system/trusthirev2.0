import os
from fastapi import FastAPI, UploadFile, Form
from pypdf import PdfReader
import re

app = FastAPI()

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + " "
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def clean_text(text: str) -> str:
    """Standardize text for keyword matching."""
    if not text:
        return ""
    # Lowercase and replace common separators with spaces
    text = text.lower()
    text = re.sub(r'[\/\-\,]', ' ', text)
    # Keep alphanumeric and some special chars common in tech (. for .js, + for C++)
    text = re.sub(r'[^a-z0-9\s\.\+]', '', text)
    return text.strip()

def calculate_ml_score(resume_text: str, job_requirements: str) -> float:
    if not resume_text or not job_requirements:
        return 0.0
    
    clean_resume = clean_text(resume_text)
    clean_reqs = clean_text(job_requirements)
    
    # Split into words but also look for phrases
    resume_words = set(clean_resume.split())
    req_words = [w for w in clean_reqs.split() if len(w) > 1] # ignore single chars unless +
    
    if not req_words:
        return 0.0
        
    matches = 0
    unique_reqs = set(req_words)
    
    for word in unique_reqs:
        if word in resume_words:
            matches += 1
        elif len(word) > 3 and word in clean_resume: # Substring match for longer technical terms
            matches += 0.8 # Partial credit for substring
            
    score = (matches / len(unique_reqs)) * 100
    return round(min(float(score), 100.0), 2)

def categorize_score(score: float) -> str:
    if score >= 75:
        return "HIGH_MATCH"
    elif score >= 45:
        return "MEDIUM_MATCH"
    else:
        return "LOW_MATCH"

@app.post("/api/extract")
async def extract_resume_data(
    resume_path: str = Form(...)
):
    """Phase 4 OCR: Extract raw text and suggest skills."""
    if not os.path.exists(resume_path):
        return {"success": False, "error": "File not found"}
    
    text = extract_text_from_pdf(resume_path)
    clean = clean_text(text)
    
    # Simple skill extractor based on common keywords
    common_skills = ["react", "node", "python", "javascript", "typescript", "java", "aws", "docker", "kubernetes", "sql", "nosql", "cicd", "agile", "machine learning", "frontend", "backend"]
    found_skills = [skill.title() for skill in common_skills if skill in clean]
    
    return {
        "success": True,
        "raw_text": text,
        "suggested_skills": ", ".join(found_skills)
    }

@app.post("/api/score")
async def score_resume(
    resume_path: str = Form(...),
    job_requirements: str = Form(...)
):
    """
    Given an absolute file path down to a PDF and a string of job requirements,
    this endpoint extracts the text via ML/OCR and returns a similarity score out of 100.
    """
    if not os.path.exists(resume_path):
        return {"error": f"File not found at path: {resume_path}", "score": 0, "category": "ERROR"}
    
    # Phase 4 OCR Step
    extracted_text = extract_text_from_pdf(resume_path)
    
    # ML Scoring Phase
    score = calculate_ml_score(extracted_text, job_requirements)
    category = categorize_score(score)
    
    return {
        "success": True,
        "raw_text_length": len(extracted_text),
        "score": score,
        "matchCategory": category
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
