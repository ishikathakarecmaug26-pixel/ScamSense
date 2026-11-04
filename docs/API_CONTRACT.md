
# ScamSense — API Contract

## 1. Base URL

Local backend: `http://localhost:5000`

API prefix: `/api`

All request and response bodies use JSON unless otherwise specified.

## 2. Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Register a user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user and role |

Roles:
- USER
- CONTENT_MANAGER

Public registration always creates USER accounts.

## 3. Scam Analysis

### POST /api/analyze

Public endpoint. Authenticated scans are saved to personal history; guest scans are not saved.

Request:

{
  "text": "Suspicious message goes here"
}

Proposed response:

{
  "success": true,
  "analysisStatus": "COMPLETE",
  "riskScore": 65,
  "verdict": "SUSPICIOUS",
  "llm": {
    "status": "COMPLETE",
    "assessment": "SUSPICIOUS",
    "summary": "Suspicious contextual indicators found."
  },
  "rules": {
    "status": "COMPLETE",
    "findings": []
  },
  "google": {
    "status": "NO_MATCH",
    "threats": []
  }
}

The score is a backend-generated heuristic, not a scientifically calibrated probability.

Possible external-check statuses:
- COMPLETE
- NO_MATCH
- THREAT_FOUND
- NOT_APPLICABLE
- UNAVAILABLE

An unavailable service must not be reported as safe.

## 4. Scan History

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/scans | Get own scan history |
| GET | /api/scans/:id | Get scan details |
| DELETE | /api/scans/:id | Delete own scan |

Only authenticated users can access their own history.

## 5. Quiz

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/quizzes | List active quizzes |
| GET | /api/quizzes/:id | Get quiz questions and public options |
| POST | /api/quizzes/:id/attempts | Submit answers |
| GET | /api/quiz-attempts | Get own quiz history |

Correct answers must never be returned before submission.

The backend calculates scores.

## 6. Quiz Management

Only CONTENT_MANAGER can access these endpoints.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/editor/quizzes | Create quiz |
| PUT | /api/editor/quizzes/:id | Update quiz |
| DELETE | /api/editor/quizzes/:id | Delete/deactivate quiz |
| POST | /api/editor/quizzes/:id/questions | Add question |
| PUT | /api/editor/questions/:id | Update question |
| DELETE | /api/editor/questions/:id | Delete question |
| POST | /api/editor/questions/:id/options | Add option |
| PUT | /api/editor/options/:id | Update option |
| DELETE | /api/editor/options/:id | Delete option |

## 7. Contact

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/contact | Submit contact message |

## 8. General API Rules

- Use appropriate HTTP status codes.
- Validate all incoming data on the backend.
- Return consistent JSON responses.
- Never expose passwords or session secrets.
- Verify ownership before returning or deleting personal records.
- Enforce role permissions in Express middleware.
- Keep external API keys on the backend.

Note: This is the initial API contract. Changes must be agreed upon before implementation.
