import { Request, Response } from "express";
import { z } from "zod";
import { RowDataPacket, ResultSetHeader } from "mysql2"; 
import pool from "../config/db.js";
import { checkRegexPatterns } from "../utils/regexAnalyzer.js";
import {
  extractUrls,
  checkUrlsWithGoogleSafeBrowsing,
} from "../utils/googleSafeBrowsing.js";

//zod schema
const analyzeSchema = z.object({
  text: z
    .string()
    .min(3, "Message text must be at least 3 characters long")
    .max(4000, "Message text cannot exceed 4000 characters")
    .trim(),
});

// my sql data
interface ScanRow extends RowDataPacket {
  id: number;
  user_id: number;
  message_text: string;
  verdict: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "UNVERIFIED";
  matched_patterns: string;
  created_at: Date;
}

//analyze func
export const analyzeMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  // validate req
  const validation = analyzeSchema.safeParse(req.body);

  if (!validation.success) {
    const errorMsg = validation.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: errorMsg,
    });
    return;
  }

  const { text } = validation.data;

  // regex pattern matching
  const regexFindings = checkRegexPatterns(text);

  // extract url to givr to google
  const extractedUrls = extractUrls(text);

  // query google api
  const googleReport = await checkUrlsWithGoogleSafeBrowsing(extractedUrls);

  // - HIGH_RISK: google ko link mila
  // - SUSPICIOUS: One or more regex pattern match
  // - UNVERIFIED: URLs are present but Google checking was unavailable
  // - SAFE: no patterns found
  let verdict: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "UNVERIFIED" = "SAFE";
  const hasUncheckedUrl = googleReport.urlsChecked.some(
    (u) => u.isThreat === null
  );

  if (googleReport.hasUnsafeUrl) {
    verdict = "HIGH_RISK";
  } else if (regexFindings.length > 0) {
    verdict = "SUSPICIOUS";
  } else if (
    extractedUrls.length > 0 &&
    (googleReport.status === "NOT_CONFIGURED" ||
      googleReport.status === "UNAVAILABLE" ||
      hasUncheckedUrl)
  ) {
    verdict = "UNVERIFIED";
  } else {
    verdict = "SAFE";
  }

  // disclaimer
  const disclaimer =
    "SAFE indicates that no known scam indicators were detected; it is not a guarantee that the message is genuine.";
  let note =
    "No known scam patterns or unsafe URLs were detected in our checks.";
  if (verdict === "UNVERIFIED") {
    note =
      "Links were detected in this message, but Google Safe Browsing could not verify them (API key missing or service unavailable). Do not assume these links are safe.";
  } else if (verdict === "SUSPICIOUS") {
    note =
      "One or more common scam patterns were detected in this message. Exercise extreme caution.";
  } else if (verdict === "HIGH_RISK") {
    note =
      "Google Safe Browsing identified one or more links in this message as known malicious threats. Do NOT click these links.";
  }

  //result object
  const analysisResult = {
    verdict,
    regexFindings,
    extractedUrls,
    googleSafeBrowsing: googleReport,
    note,
    disclaimer,
  };

  // Check if the user is authenticated
  let scanId: number | null = null;

  if (req.user && req.user.id) {
    const userId = req.user.id;
    const serializedData = JSON.stringify(analysisResult);

    const [insertResult] = await pool.execute<ResultSetHeader>(
      "INSERT INTO scans (user_id, message_text, verdict, matched_patterns) VALUES (?, ?, ?, ?)",
      [userId, text, verdict, serializedData]
    );

    scanId = insertResult.insertId;
  }

  // Send response
  res.status(200).json({
    success: true,
    message: "Analysis completed successfully",
    scanId, // null for guests, numeric ID for logged-in users
    data: analysisResult,
  });
};

//get scan methdo
export const getScanHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;

  // Query scans belonging strictly to this user, newest first
  const [scans] = await pool.execute<ScanRow[]>(
    "SELECT id, message_text, verdict, created_at FROM scans WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );

  res.status(200).json({
    success: true,
    message: "Scan history retrieved successfully",
    data: scans,
  });
};

//getscan by id func only for logged in users
export const getScanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validate scan ID from URL parameter
  const scanId = parseInt(req.params.id as string, 10);
  if (isNaN(scanId) || scanId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid scan ID",
    });
    return;
  }

  // Query scan record
  const [scans] = await pool.execute<ScanRow[]>(
    "SELECT id, user_id, message_text, verdict, matched_patterns, created_at FROM scans WHERE id = ?",
    [scanId]
  );

  if (scans.length === 0) {
    res.status(404).json({
      success: false,
      message: "Scan record not found",
    });
    return;
  }

  const scan = scans[0];

  // Security Ownership Check:
  if (scan.user_id !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({
      success: false,
      message:
        "Forbidden. You do not have permission to view this scan record.",
    });
    return;
  }

  // Parse the stored JSON details
  let parsedDetails = null;
  try {
    parsedDetails = JSON.parse(scan.matched_patterns);
  } catch (err) {
    parsedDetails = scan.matched_patterns;
  }

  res.status(200).json({
    success: true,
    message: "Scan details retrieved successfully",
    data: {
      id: scan.id,
      userId: scan.user_id,
      messageText: scan.message_text,
      verdict: scan.verdict,
      details: parsedDetails,
      createdAt: scan.created_at,
    },
  });
};

//delte scan func
export const deleteScan = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validate scan ID
  const scanId = parseInt(req.params.id as string, 10);
  if (isNaN(scanId) || scanId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid scan ID",
    });
    return;
  }

  // Check if scan exists
  const [scans] = await pool.execute<ScanRow[]>(
    "SELECT id, user_id FROM scans WHERE id = ?",
    [scanId]
  );

  if (scans.length === 0) {
    res.status(404).json({
      success: false,
      message: "Scan record not found",
    });
    return;
  }

  const scan = scans[0];

  // Security Ownership Check:
  if (scan.user_id !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({
      success: false,
      message:
        "Forbidden. You do not have permission to delete this scan record.",
    });
    return;
  }

  // Delete the scan
  await pool.execute("DELETE FROM scans WHERE id = ?", [scanId]);

  res.status(200).json({
    success: true,
    message: "Scan record deleted successfully",
  });
};

//get all scans for admin
export const getAllPlatformScans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const [scans] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.user_id, u.name AS user_name, u.email AS user_email, 
            s.message_text, s.verdict, s.created_at 
     FROM scans s 
     LEFT JOIN users u ON s.user_id = u.id 
     ORDER BY s.created_at DESC`
  );

  res.status(200).json({
    success: true,
    message: "All platform scans retrieved successfully",
    data: scans,
  });
};
