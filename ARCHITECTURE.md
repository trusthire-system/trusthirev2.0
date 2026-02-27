# TrustHire Architecture

This document describes the high-level architecture of TrustHire, a universal recruitment automation platform.

## System Components

### 1. Client Side (Frontend)
- **Framework**: Next.js (as seen in the project structure).
- **Portals**:
  - **Candidate Portal**: Profile building with automated resume extraction, application tracking, and skill gap visualization.
  - **HR Dashboard**: Organizational verification, vacancy management (with vacancy-specific shortlisting), and intelligent applicant ranking.
  - **Admin Panel**: System-wide governance, firm registration approval, and platform analytics.

### 2. General Server/API (Backend)
- **Core Logic**: Handles secure authentication (password hashing, email verification tokens), and authorization.
- **Data Integrity**: Cryptographic hashing of uploaded documents (resumes, certificates) to ensure immutability and prevent tampering.
- **Verification Engine**: Automated HR domain validation (blocking public providers, matching domains with company names).

### 3. ML & Intelligent Processing Pipeline
- **Resume NLP Engine**: Uses Natural Language Processing to extract structured data (skills, experience, education) from domain-independent resumes (Healthcare, Finance, Engineering, etc.).
- **OCR & Document Validation**:
  - Extracts text from certificates using OCR.
  - Performs layout analysis and metadata inspection to generate confidence scores for credential authenticity.
- **Scoring & Ranking Engine**:
  - **Job Match Score**: Algorithm that calculates suitability based on skill overlap and experience relevance.
  - **Final Evaluation Score**: Aggregates match scores, certificate validation, and external link (LinkedIn, GitHub) verification.
  - **Vacancy-Based Shortlisting**: Automatically isolates the top 'N' candidates based on the HR-defined vacancy count.

### 4. Communication & Tracking
- **Automated Notification System**: Real-time updates via email/dashboard for application status changes.
- **Transparent Feedback Loop**: Skill gap analysis results and career guidance suggestions served to candidates.

## Data Flow for Recruitment Workflow
1. **Onboarding**: Candidates and HR register with secure verification (Email OTP/Token).
2. **Profile Creation**: 
   - Candidates upload resumes; NLP engine populates profile.
   - HR completes organizational profile; system validates company domain.
3. **Vacancy Posting**: HR posts a job with a fixed "Vacancy Count".
4. **Application**: Candidates apply; documents are hashed and stored.
5. **Intelligent Ranking**: 
   - System runs OCR on certificates and NLP on resumes.
   - Match scores and Skill Gaps are calculated.
   - Applicants are ranked; only the top N (based on vacancy count) are promoted to "System Recommended".
6. **Decision**: HR selects/rejects; notifications are triggered; candidate dashboard reflects status.

## Zero-Cost Implementation Philosophy

TrustHire is built with a commitment to **$0 operating and development costs** by leveraging the best-in-class open-source tools and generous free tiers of cloud providers.

### 1. Development & Infrastructure
- **Frontend Hosting**: Vercel/Netlify (Free Tier).
- **Backend Hosting**: Render/Railway/Fly.io (Free Tier) or self-hosted on local infrastructure during development.
- **Database**: Supabase / Neon (PostgreSQL Free Tier) or local SQLite for structured data.
- **Storage**: Supabase Storage / Uploadthing (Free Tier) for documents and assets.

### 2. Intelligent Processing (Open Source & Free APIs)
- **OCR Engine**: **Tesseract OCR** (Open Source) for certificate and resume text extraction, avoiding paid services like AWS Textract.
- **NLP & Data Extraction**: **SpaCy / NLTK** (Open Source) or **Hugging Face Inference API** (Free Tier) for structured data extraction.
- **Link Validation**: Standard HTTP libraries for status checks; Puppeteer/Playwright (Open Source) for advanced metadata verification.

### 3. Services & Communication
- **Authentication**: **NextAuth.js / Lucia Auth** (Open Source) for self-managed secure sessions.
- **Email Delivery**: **Resend / SendGrid** (Free Tier) for verification tokens and notifications.
- **Iconography & Design**: **Lucide React** and **shadcn/ui** (Open Source) for a premium look at no cost.

---
*Note: This architecture is designed to be domain-independent, supporting diverse industries from Manufacturing to Healthcare, all while maintaining a zero-cost footprint.*
