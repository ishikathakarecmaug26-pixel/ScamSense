import { Router } from "express"; // Router to group related endpoints
import {
  getAllQuizzes,
  getQuizById,
  getQuizByIdAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestionToQuiz,
  updateQuestion,
  deleteQuestion,
  submitQuizAttempt,
  getUserQuizAttempts,
} from "../controllers/quizController.js"; // quiz controllers
import { authenticate, authorize, optionalAuthenticate } from "../middleware/authMiddleware.js"; // auth middleware

// ---- Create an Express Router instance ----
const router = Router();

// ============================================================
// User & Public Routes
// ============================================================

// GET /api/quizzes — List all available quizzes
router.get("/", getAllQuizzes);

// GET /api/quizzes/attempts/my — Fetch logged-in user's quiz attempt history
// NOTE: This route MUST be defined before /:id so Express doesn't treat "attempts" as an ID!
router.get("/attempts/my", authenticate, getUserQuizAttempts);

// GET /api/quizzes/:id — Fetch quiz questions for playing (without correct answers)
router.get("/:id", getQuizById);

// POST /api/quizzes/:id/attempts — Submit answers and receive server-evaluated score
// Uses optionalAuthenticate so guests can take quizzes while logged-in users get attempts saved
router.post("/:id/attempts", optionalAuthenticate, submitQuizAttempt);

// POST /api/quizzes/:id/submit — Alias for submitQuizAttempt
router.post("/:id/submit", optionalAuthenticate, submitQuizAttempt);

// ============================================================
// Admin / Content Manager Routes
// ============================================================

// GET /api/quizzes/:id/admin — Fetch complete quiz data including is_correct for editing
router.get("/:id/admin", authenticate, authorize("admin"), getQuizByIdAdmin);

// POST /api/quizzes — Create a new quiz
router.post("/", authenticate, authorize("admin"), createQuiz);

// PUT /api/quizzes/:id — Update quiz title, description, or category
router.put("/:id", authenticate, authorize("admin"), updateQuiz);

// DELETE /api/quizzes/:id — Delete quiz and its questions/options
router.delete("/:id", authenticate, authorize("admin"), deleteQuiz);

// POST /api/quizzes/:id/questions — Add a new question with options to a quiz
router.post("/:id/questions", authenticate, authorize("admin"), addQuestionToQuiz);

// PUT /api/quizzes/questions/:questionId — Update an existing question and its options
router.put("/questions/:questionId", authenticate, authorize("admin"), updateQuestion);

// DELETE /api/quizzes/questions/:questionId — Delete a specific question
router.delete("/questions/:questionId", authenticate, authorize("admin"), deleteQuestion);

// ---- Export router to be mounted in app.ts ----
export default router;