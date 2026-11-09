import { Router } from "express"; // Router to group related routes
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/articleController.js"; // article controllers
import { authenticate, authorize } from "../middleware/authMiddleware.js"; // auth middleware

// ---- Create an Express Router instance ----
const router = Router();

// ---- Public Routes (No login required) ----

// GET /api/articles — List articles with optional ?category= and ?search=
router.get("/", getAllArticles);

// GET /api/articles/:id — Read single article details
router.get("/:id", getArticleById);

// ---- Admin Routes (Login and Admin role required) ----

// POST /api/articles — Create a new article
router.post("/", authenticate, authorize("admin"), createArticle);

// PUT /api/articles/:id — Update an existing article
router.put("/:id", authenticate, authorize("admin"), updateArticle);

// DELETE /api/articles/:id — Delete an article
router.delete("/:id", authenticate, authorize("admin"), deleteArticle);

// ---- Export router to be mounted in app.ts ----
export default router;