import os
import requests
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
    
    # Split requirements into mandatory and preferred if comma separated
    req_parts = [s.strip() for s in clean_reqs.split(',') if s.strip()]
    if not req_parts:
        req_parts = clean_reqs.split()
        
    resume_words = set(clean_resume.split())
    
    matches = 0
    total_weight = len(req_parts)
    
    for skill in req_parts:
        if skill in resume_words:
            matches += 1
        elif any(skill in word for word in resume_words if len(word) > 3):
            matches += 0.8 # Partial match for variations
        elif skill in clean_resume:
            matches += 0.9 # Substring match within the whole text
            
    score = (matches / total_weight) * 100 if total_weight > 0 else 0
    return round(min(float(score), 100.0), 2)

def categorize_score(score: float) -> str:
    if score >= 75:
        return "HIGH_MATCH"
    elif score >= 45:
        return "MEDIUM_MATCH"
    else:
        return "LOW_MATCH"

from typing import List, Dict, Any

# Domain keywords for broader extraction (Non-IT focus)
DOMAINS = {
    "Healthcare": ["patient care", "icu", "nursing", "diagnosis", "surgery", "medical record", "pediatrics"],
    "Finance": ["taxation", "auditing", "accounting", "ledger", "financial model", "investment", "cpa"],
    "Engineering": ["autocad", "machine design", "civil engineering", "thermodynamics", "structural analysis"],
    "Education": ["teaching", "curriculum", "lesson planning", "pedagogy", "student assessment"],
    "Logistics": ["supply chain", "inventory", "warehousing", "shipping", "procurement"]
}

TECH_KEYWORDS = ["react", "node", "python", "javascript", "typescript", "java", "aws", "docker", "sql", "api"]

def extract_links(text: str) -> List[str]:
    """Extract LinkedIn, GitHub and Portfolio URLs."""
    pattern = r'(https?://(?:www\.)?(?:linkedin\.com|github\.com|portfolio\.com)/[A-z0-9\-\./]+)'
    return re.findall(pattern, text.lower())

def analyze_skill_gap(resume_text: str, required_skills: str) -> List[str]:
    """Identify required skills not found in resume."""
    clean_resume = clean_text(resume_text)
    reqs = [s.strip().lower() for s in required_skills.split(',') if s.strip()]
    
    missing = []
    for skill in reqs:
        if skill not in clean_resume:
            missing.append(skill.title())
    return missing

def unspace_text(text: str) -> str:
    """Handles PDFs where characters are separated by spaces."""
    if not text:
        return ""
    # "K I S H A N  D A S" -> "KISHAN DAS"
    # Matches a letter/digit followed by exactly one space, repeated.
    text = re.sub(r'(?<=\b\w)\s(?=\w\b)', '', text)
    # Also handle the cases where it's 2 spaces between words but 1 between letters
    # "K I S H A N  D A S" -> "KISHAN DAS"
    return text

@app.post("/api/extract")
async def extract_resume_data(resume_path: str = Form(...)):
    if not os.path.exists(resume_path):
        return {"success": False, "error": "File not found"}
    
    full_text = extract_text_from_pdf(resume_path)
    # Pre-process to fix spaced-out text issues
    fixed_text = unspace_text(full_text)
    clean = clean_text(fixed_text)
    
    # Domain-independent discovery
    found_skills = []
    for domain, keywords in DOMAINS.items():
        for kw in keywords:
            if kw in clean:
                found_skills.append(kw.title())
    
    # Technical discovery
    for kw in TECH_KEYWORDS:
        if kw in clean:
            found_skills.append(kw.title())
            
    # Education discovery
    education_keywords = ["bachelor", "master", "phd", "university", "college", "degree", "diploma", "engineering", "hss", "thslc"]
    found_education = []
    for edu in education_keywords:
        if edu in clean:
            found_education.append(edu.upper())

    # Experience discovery
    # Catch numeric years
    exp_matches = re.findall(r'(\d+)\s*(year|yr|yr)', clean)
    years = max([int(m[0]) for m in exp_matches] + [0])
    # Fallback for "a year" or "one year"
    if years == 0:
        if re.search(r'\b(a|one)\b.*?\byear', clean):
            years = 1

    # Phone discovery
    # Remove all spaces for a strict check
    text_no_spaces = re.sub(r'\s+', '', fixed_text)
    # Match 10 digit numbers, optionally starting with +91 or 0
    phone_pattern = r'(?:\+?91|0)?[6-9]\d{9}'
    phone_matches = re.findall(phone_pattern, text_no_spaces)
    phone = phone_matches[0] if phone_matches else ""
    # If not found, try the raw clean text with a more flexible pattern
    if not phone:
        phone_matches = re.findall(r'\b(?:\+?\d{1,3}[- ]?)?\d{10}\b', clean)
        phone = phone_matches[0] if phone_matches else ""

    # Address discovery (Attempt)
    # Use word boundaries \b for keywords like "at" to avoid matching inside words like "communication"
    addr_pattern = r'(?i)\b(?:address|residence|location|at)\b\s*[:\-]?\s*(.*?)(?:\n\n|\r\n\r\n|\t|skills|education|experience|$)'
    addr_match = re.search(addr_pattern, fixed_text.replace('\r', ''))
    address = addr_match.group(1).strip() if addr_match else ""
    
    # Fallback address: Look for city names
    if not address or len(address) > 100: # If too long or empty, try cities
        indian_cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Noida", "Gurugram", "Kayamkulam", "Cherthala", "Kerala", "Kochi", "Thiruvananthapuram"]
        for city in indian_cities:
            if city.lower() in clean:
                address = city
                break

    links = extract_links(fixed_text)
    
    return {
        "success": True,
        "raw_text": fixed_text,
        "suggested_skills": ", ".join(list(set(found_skills))),
        "education": ", ".join(list(set(found_education))),
        "experienceYears": years,
        "phone": phone,
        "address": address,
        "links": links,
        "domain_hints": [d for d, kws in DOMAINS.items() if any(kw in clean for kw in kws)]
    }

@app.post("/api/score")
async def score_resume(
    resume_path: str = Form(...),
    job_requirements: str = Form(...),
    experience_level: str = Form(None)
):
    if not os.path.exists(resume_path):
        return {"error": "File not found", "score": 0}
    
    text = extract_text_from_pdf(resume_path)
    score = calculate_ml_score(text, job_requirements)
    skill_gap = analyze_skill_gap(text, job_requirements)
    
    # Certificate Score (Mocked)
    cert_count = len(re.findall(r'(certificate|certification|certified)', text.lower()))
    cert_score = min(cert_count * 10, 30) 
    
    # Link Extraction and Profile Validation (Requirement 9)
    links = extract_links(text)
    link_score = 0
    if links:
        link_score += 5 # Points for having links
        if any("linkedin.com" in l for l in links): link_score += 5
        if any("github.com" in l for l in links): link_score += 5
    
    # Dynamic active link validation (Requirement 9 check)
    is_identity_matched = False
    
    # Let's perform a lightweight HEAD request on the first few links to verify they exist
    links_to_check = links[:3]
    valid_links_count = 0
    
    for url in links_to_check:
        try:
            # Add a basic timeout and user-agent
            resp = requests.head(url, timeout=3, headers={'User-Agent': 'Mozilla/5.0'})
            if resp.status_code < 400:
                valid_links_count += 1
                # If the URL contains parts of candidate's name or is github/linkedin, give identity match bonus
                if "linkedin.com/in/" in url.lower() or "github.com/" in url.lower():
                    is_identity_matched = True
        except Exception:
            pass

    link_score += valid_links_count * 2
    if is_identity_matched:
        link_score += 5

    link_score = min(link_score, 20)
    
    # Experience relevance
    exp_matches = re.findall(r'(\d+)\s*(years|yrs)', text.lower())
    resume_years = max([int(m[0]) for m in exp_matches] + [0])
    
    # Try to extract required years from experience_level string
    req_years_match = re.search(r'(\d+)', experience_level or "")
    req_years = int(req_years_match.group(1)) if req_years_match else 0
    
    exp_score = 0
    if req_years > 0:
        if resume_years >= req_years:
            exp_score = 15
        elif resume_years >= req_years * 0.7:
            exp_score = 10
    elif resume_years > 0:
        exp_score = 5 # General credit for having experience

    final_score = (score * 0.5) + cert_score + link_score + exp_score
    
    return {
        "success": True,
        "matchScore": score,
        "certificateScore": cert_score,
        "linkScore": link_score,
        "finalScore": round(final_score, 2),
        "skillGap": skill_gap,
        "links": links
    }

@app.post("/api/verify-certificate")
async def verify_certificate(file_path: str = Form(...)):
    """Robust certificate verification."""
    if not os.path.exists(file_path):
        return {"success": False, "error": "File not found"}
    
    text = extract_text_from_pdf(file_path)
    clean = text.lower()
    
    # 1. Date Detection (Expanded to include months)
    has_date = bool(re.search(r'(\b\d{4}\b|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b)', clean))
    
    # 2. Issuer Detection (Expanded terminology)
    has_issuer = bool(re.search(r'\b(university|institute|academy|board|authority|issued by|certifies|awarded to|presented to|school|college|coursera|udemy|edx|microsoft|google|aws|cisco)\b', clean))
    
    # 3. Seal / Signature / Authenticity Verification
    has_seal = bool(re.search(r'\b(seal|authentic|signature|signed|director|president|dean|verified|credential|authorized|completion|certified)\b', clean))
    
    # 4. Tampering detection via PDF Metadata (only heuristic-based, removing raw text match for "edit")
    is_tampered = False
    metadata_issue = False
    try:
        reader = PdfReader(file_path)
        meta = reader.metadata
        if meta:
            producer = str(meta.get('/Producer', '')).lower()
            if 'illustrator' in producer or 'photoshop' in producer or 'gimp' in producer:
                is_tampered = True
            
            cdate = meta.get('/CreationDate')
            mdate = meta.get('/ModDate')
            if cdate and mdate and cdate != mdate:
                # Basic check, if modified date length is large and they differ
                metadata_issue = True
    except Exception:
        pass

    confidence_score = 0
    if has_date: confidence_score += 30
    if has_issuer: confidence_score += 40
    if has_seal: confidence_score += 30
    
    if is_tampered: 
        confidence_score -= 50
    elif metadata_issue:
        confidence_score -= 20
        
    return {
        "success": True,
        "extracted_text": text[:500],
        "confidenceScore": max(0, min(100, confidence_score)),
        "isVerified": confidence_score >= 70,
        "metadata": {
            "hasDate": has_date,
            "hasIssuer": has_issuer,
            "hasSeal": has_seal,
            "isTampered": is_tampered
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
