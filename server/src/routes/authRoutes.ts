import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js"; // our controller functions
import { optionalAuthenticate } from "../middleware/authMiddleware.js"; // middleware to verify JWT if present for /me

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login 
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", logout);
// GET /api/auth/me 
router.get("/me", optionalAuthenticate, getMe);
export default router;
