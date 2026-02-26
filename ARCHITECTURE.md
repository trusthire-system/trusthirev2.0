# TrustHire Architecture

This document describes the high-level architecture of the platform.

## System Components

### 1. Client Side (Frontend)
- **Web App**: Interactive interfaces tailored for specific user roles.
- **Portals**:
  - **Job Seeker Portal**: Profile building, job search, and resume upload flow.
  - **HR Dashboard**: Job posting management, applicant viewing, and ML scores display.
  - **Admin Panel**: System management and user control interfaces.

### 2. General Server/API (Backend)
- Handles user authentication, authorization, REST APIs, and core platform data.
- **Data Stores**: Using an in-memory, file-based database (e.g., SQLite, LowDB, or tinydb) for development purposes to store jobs, applicant data (excluding raw resumes), application structures, and firm configurations.

### 3. ML & Document Processing Pipeline
- **Document Uploader**: Ingests files (PDF, Docs) directly or via an API endpoint.
- **OCR Parser**: Extracts raw text, structures components from visually formatted documents to machine-readable data.
- **Scoring Engine**: Evaluates OCR data against job descriptions or industry role weights using ML algorithms to determine an "applicant match score" or "skills point score".
- **Categorization Service**: Groups applicants automatically based on thresholds from the Scoring Engine results.

## Data Flow for Resume Processing
1. The Job Seeker uploads a resume to their profile or job application.
2. The file is temporarily stored or handed off to the processing queue.
3. The OCR service parses the file to extract contact details, skills, experience, and education.
4. The ML engine scores the formatted data, allocating points based on the algorithm.
5. A combined profile (OCR + Score) is saved into the database linked to the user account.
6. When viewed by HR Users, the applicant data automatically shows up as scored and segregated.
