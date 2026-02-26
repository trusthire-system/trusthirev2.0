# TrustHire Setup & Development Roadmap

## Phase 1: Planning and Setup (Current)
- [x] Initial project documentation (README, ARCHITECTURE, TODO).
- [ ] Initialize code repository and commit starting files.
- [x] Determine remaining stack technologies (Frontend, Backend API, ML/OCR tech). Database chosen: In-memory file-based DB for development. Frontend Next.js.
- [x] Setup initial projects for Frontend and Backend servers.

## Phase 2: Core User & Database Architecture
- [x] Design comprehensive database schema for roles (Admin, HR User, Job Seeker).
- [x] Implement user registration, login workflows, and authentication.
- [x] Build role-based access control (RBAC).
- [x] Develop dynamic profile forms (skill setup, work experience, basic info).

## Phase 3: Job Listings & Applications
- [x] Develop the HR Portal endpoints to post and manage jobs.
- [x] Develop the Job Seeker portals to browse, apply, and search for jobs.
- [x] File upload integration for candidate resumes (connecting to cloud storage).

## Phase 4: Core Logic (ML & OCR Engine)
- [x] Setup Python/ML backend service or microservice for processing uploaded files.
- [x] Integrate OCR reading software (Tesseract, AWS Textract, etc.) to handle document ingestion.
- [x] Define point-scoring logic or design ML model to grade candidate experience versus job requirements.
- [x] Send analysis scores back to core database to segment and tag applications automatically.

## Phase 5: Recruiter & Admin Activities
- [x] Implement dashboards for HR users to review segregated and top-scoring applicants based on ML points.
- [x] Add approve/reject functionality for job requests.
- [x] Complete the Admin Portal allowing firm approval and oversight across platform users.

## Phase 6: Finalization & Deployment
- [x] Complete UI design implementation across devices.
- [x] Set up testing systems.
- [x] Deployment of services via cloud orchestration (AWS/GCP/Vercel).
