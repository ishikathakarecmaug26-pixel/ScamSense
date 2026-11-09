import { Router } from "express"; // Router to group related endpoints
import {
  submitContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage,
} from "../controllers/contactController.js"; // controller functions
import { authenticate, authorize } from "../middleware/authMiddleware.js"; // auth middleware

// ---- Create an Express Router instance ----
const router = Router();

// ---- Public Route (No authentication required) ----

// POST /api/contact — Submit an inquiry or report a scam
router.post("/", submitContactMessage);

// ---- Admin Routes (Login and Admin role required) ----

// GET /api/contact — List all messages with optional ?search=
router.get("/", authenticate, authorize("admin"), getAllContactMessages);

// GET /api/contact/:id — View single message details
router.get("/:id", authenticate, authorize("admin"), getContactMessageById);

// DELETE /api/contact/:id — Delete a contact inquiry
router.delete("/:id", authenticate, authorize("admin"), deleteContactMessage);

// ---- Export router to be mounted in app.ts ----
export default router;