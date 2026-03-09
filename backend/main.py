import os
import requests
from fastapi import FastAPI, UploadFile, Form
from pypdf import PdfReader
import re
import google.generativeai as genai
from typing import List, Dict, Any, Optional

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

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}

# Configure Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Local development helper: Load from frontend/.env if available
if not GEMINI_API_KEY:
    try:
        # Try multiple possible locations for .env
        paths = [
            os.path.join(os.path.dirname(__file__), "..", "frontend", ".env"),
            os.path.join(os.getcwd(), "frontend", ".env"),
            os.path.join(os.getcwd(), "..", "frontend", ".env"),
            ".env"
        ]
        for env_path in paths:
            if os.path.exists(env_path):
                with open(env_path, "r") as f:
                    for line in f:
                        if "GEMINI_API_KEY" in line and "=" in line:
                            val = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                GEMINI_API_KEY = val
                                os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
                                print(f"[INFO] Backend successfully loaded GEMINI_API_KEY from {env_path}")
                                break
            if GEMINI_API_KEY: break
    except Exception as e:
        print(f"[WARNING] Backend could not auto-load frontend .env: {e}")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("[INFO] Gemini AI has been configured.")
    except Exception as e:
        print(f"[ERROR] Failed to configure Gemini: {e}")
else:
    print("[WARNING] GEMINI_API_KEY is missing. AI features will be disabled.")

@app.post("/api/verify-certificate")
async def verify_certificate(file_path: str = Form(...)):
    """Re-implemented verification using Gemini for intelligent analysis."""
    print(f"[DEBUG] Received verification request for: {file_path}")
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return {"success": False, "error": "File not found"}
    
    # Attempt to extract text
    text = extract_text_from_pdf(file_path)
    print(f"[DEBUG] Extracted {len(text)} characters from PDF.")
    
    # Fallback to local logic if no API key
    if not GEMINI_API_KEY:
        print("[INFO] GEMINI_API_KEY not found. Using local fallback logic.")
        clean = text.lower()
        has_date = bool(re.search(r'(\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b)', clean))
        has_issuer = bool(re.search(r'\b(university|institute|academy|board|authority|issued|certifies|awarded|completion)\b', clean))
        confidence_score = 40 if has_date else 0
        if has_issuer: confidence_score += 50
        print(f"[DEBUG] Local verification result: isVerified={confidence_score >= 60}, score={confidence_score}")
        return {
            "success": True, 
            "isVerified": confidence_score >= 60,
            "confidenceScore": confidence_score,
            "note": "Using local fallback. Set GEMINI_API_KEY for AI verification.",
            "extracted_text": text[:200]
        }

    try:
        print("[INFO] Attempting Gemini AI verification...")
        
        # List of models to try in order of preference
        models_to_try = [
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-2.0-flash-lite',
            'gemini-pro-latest',
            'gemini-1.5-flash',
            'gemini-pro'
        ]
        
        last_error = ""
        response = None
        
        # Prepare inputs for Gemini (Multimodal Support)
        inputs = ["""
        Analyze the provided data (text or file) from a certificate. 
        Determine if it is a valid educational or professional certificate.
        
        Strictly return a JSON object with EXACTLY these keys:
        - is_valid: boolean (true if it looks like a real certificate)
        - institution: string (the school, university, or company that issued it)
        - recipient: string (the person who received it)
        - date: string (the date of issue)
        - type: string (e.g., "Bachelors", "Course Completion", "Award")
        - confidence_score: integer (0-100)
        - reasoning: string (short explanation)
        """]
        
        if len(text.strip()) < 50:
            print("[INFO] Text extraction is minimal. Sending file bytes for native PDF analysis.")
            with open(file_path, "rb") as f:
                pdf_data = f.read()
            inputs.append({
                "mime_type": "application/pdf",
                "data": pdf_data
            })
        else:
            inputs.append(f"Text to analyze:\n{text[:5000]}")

        for model_name in models_to_try:
            # Try both raw name and models/ name
            names_to_try = [model_name, f"models/{model_name}"]
            success_model = False
            for name in names_to_try:
                try:
                    print(f"[INFO] Trying model: {name}")
                    model = genai.GenerativeModel(name)
                    # Simple call to verify if model is actually accessible
                    response = model.generate_content(inputs)
                    if response:
                        print(f"[SUCCESS] Successfully used model: {name}")
                        success_model = True
                        break
                except Exception as e:
                    last_error = str(e)
                    print(f"[WARNING] Model {name} failed: {last_error}")
            if success_model:
                break
        
        if not response:
            return {"success": False, "error": f"All Gemini models failed. Last error: {last_error}"}
            
        # Extract JSON from response
        raw_output = response.text
        print(f"[DEBUG] AI Raw Response:\n{raw_output}")
        
        import json
        json_match = re.search(r'\{.*\}', raw_output, re.DOTALL)
        
        result = {}
        if json_match:
            json_str = json_match.group(0)
            try:
                result = json.loads(json_str)
                # Success parsing, but potentially missing keys
                if result.get("is_valid") and (not result.get("confidence_score") or result.get("confidence_score") == 0):
                    result["confidence_score"] = 85
            except Exception as e:
                print(f"[WARNING] JSON parse error: {e}. Falling back to regex.")
                # Last resort regex extraction
                result = {
                    "is_valid": "true" in json_str.lower(),
                    "confidence_score": 85 if "true" in json_str.lower() else 30,
                    "institution": "Unknown",
                    "recipient": "Unknown",
                    "date": "Unknown",
                    "type": "Unknown",
                    "reasoning": "Extracted with regex fallback"
                }
                # Try to extract institution
                inst_match = re.search(r'"institution":\s*"([^"]*)"', json_str)
                if inst_match: result["institution"] = inst_match.group(1)
        else:
            return {"success": False, "error": "AI response was not in JSON format"}

        print(f"[DEBUG] Final processed result: {result}")

        return {
            "success": True,
            "isVerified": result.get("is_valid", False) and result.get("confidence_score", 0) >= 60,
            "confidenceScore": result.get("confidence_score", 0),
            "details": {
                "issuer": result.get("institution", "Unknown"),
                "recipient": result.get("recipient", "Unknown"),
                "date": result.get("date", "Unknown"),
                "type": result.get("type", "Unknown")
            },
            "reasoning": result.get("reasoning", "")
        }

    except Exception as e:
        print(f"[CRITICAL] Gemini Verification Error: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
