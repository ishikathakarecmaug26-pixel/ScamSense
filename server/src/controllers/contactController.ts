import { Request, Response } from "express"; // Express types
import { z } from "zod";                     // Zod validation library
import { RowDataPacket, ResultSetHeader } from "mysql2"; // MySQL types
import pool from "../config/db.js";          // MySQL connection pool

// ============================================================
// Zod Schemas — Validation for Contact Messages
// ============================================================

// Schema for submitting a contact message
const submitContactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),

  email: z
    .string()
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject must be at most 150 characters")
    .trim(),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be at most 2000 characters")
    .trim(),
});

// ---- Interface for Contact Message row from MySQL ----
interface ContactMessageRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: Date;
}

// ============================================================
// 1. SUBMIT CONTACT MESSAGE — Public endpoint
// ============================================================
// POST /api/contact
// Body: { name, email, subject, message }
// ============================================================
export const submitContactMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Step 1: Validate incoming payload using Zod
  const result = submitContactSchema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  // Step 2: Extract validated form fields
  const { name, email, subject, message } = result.data;

  // Step 3: Insert the contact inquiry into MySQL
  const [insertResult] = await pool.execute<ResultSetHeader>(
    "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
    [name, email, subject, message]
  );

  // Step 4: Return 201 Created confirmation
  res.status(201).json({
    success: true,
    message: "Thank you for reaching out. Your message has been received.",
    data: {
      id: insertResult.insertId,
      name,
      email,
      subject,
    },
  });
};

// ============================================================
// 2. GET ALL CONTACT MESSAGES — Admin only
// ============================================================
// GET /api/contact
// Query params: ?search=keyword
// Requires: authenticate, authorize("admin")
// ============================================================
export const getAllContactMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Step 1: Read optional query parameters
  const search = req.query.search as string | undefined;

  // Step 2: Build dynamic SQL query
  let query = "SELECT id, name, email, subject, message, created_at FROM contact_messages WHERE 1=1";
  const params: (string | number)[] = [];

  // Step 3: Search across sender name, email, subject, or message body
  if (search) {
    query += " AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)";
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard, wildcard, wildcard);
  }

  // Step 4: Order newest inquiries first
  query += " ORDER BY created_at DESC";

  // Step 5: Execute query safely using parameterized array
  const [messages] = await pool.execute<ContactMessageRow[]>(query, params);

  // Step 6: Respond with list
  res.status(200).json({
    success: true,
    message: "Contact messages retrieved successfully",
    data: messages,
  });
};

// ============================================================
// 3. GET CONTACT MESSAGE BY ID — Admin only
// ============================================================
// GET /api/contact/:id
// Requires: authenticate, authorize("admin")
// ============================================================
export const getContactMessageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Step 1: Validate message ID
  const messageId = parseInt(req.params.id as string, 10);
  if (isNaN(messageId) || messageId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid message ID",
    });
    return;
  }

  // Step 2: Query database for the specific message
  const [messages] = await pool.execute<ContactMessageRow[]>(
    "SELECT id, name, email, subject, message, created_at FROM contact_messages WHERE id = ?",
    [messageId]
  );

  if (messages.length === 0) {
    res.status(404).json({
      success: false,
      message: "Contact message not found",
    });
    return;
  }

  // Step 3: Return message details
  res.status(200).json({
    success: true,
    message: "Contact message retrieved successfully",
    data: messages[0],
  });
};

// ============================================================
// 4. DELETE CONTACT MESSAGE — Admin only
// ============================================================
// DELETE /api/contact/:id
// Requires: authenticate, authorize("admin")
// ============================================================
export const deleteContactMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Step 1: Validate message ID
  const messageId = parseInt(req.params.id as string, 10);
  if (isNaN(messageId) || messageId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid message ID",
    });
    return;
  }

  // Step 2: Check if message exists
  const [existingMessages] = await pool.execute<ContactMessageRow[]>(
    "SELECT id FROM contact_messages WHERE id = ?",
    [messageId]
  );

  if (existingMessages.length === 0) {
    res.status(404).json({
      success: false,
      message: "Contact message not found",
    });
    return;
  }

  // Step 3: Delete message from database
  await pool.execute("DELETE FROM contact_messages WHERE id = ?", [messageId]);

  res.status(200).json({
    success: true,
    message: "Contact message deleted successfully",
  });
};