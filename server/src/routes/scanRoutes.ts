import { Router } from "express";
import {
  analyzeMessage,
  getScanHistory,
  getScanById,
  deleteScan,
  getAllPlatformScans,
} from "../controllers/scanController.js";
import {
  authenticate,
  optionalAuthenticate,
  authorize,
} from "../middleware/authMiddleware.js";

export const scanRouter = Router();

// GET /api/scans/all — Admin
scanRouter.get("/all", authenticate, authorize("admin"), getAllPlatformScans);

// GET /api/scans 
scanRouter.get("/", authenticate, getScanHistory);

// GET /api/scans/:id 
scanRouter.get("/:id", authenticate, getScanById);

// DELETE /api/scans/:id 
scanRouter.delete("/:id", authenticate, deleteScan);

export const analyzeRouter = Router();

// POST /api/analyze
analyzeRouter.post("/", optionalAuthenticate, analyzeMessage);
