import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";//pwd hashing
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2"; // rows from  sql
import pool from "../config/db.js";
import { env } from "../config/env.js";
import { sendWelcomeEmail } from "../utils/emailService.js";//welcome mail after registration

// Schema for the registration form
const registerSchema = z.object({
  // Name must be between 2 and 50 characters
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),

  // Email must be a valid email format
  email: z
    .string()
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  // Password must be at least 8 chars with uppercase, lowercase, and a number
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Schema for the login form
const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),

  password: z.string().min(1, "Password is required"),
});
//user row from sql so ts will know what is in user record
interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}
//helper fucn 
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([dhms])$/); 
  if (!match) return 86400; //1 day in seconds

  const num = parseInt(match[1]);
  const unit = match[2];

  // Converting to secs
  switch (unit) {
    case "d":
      return num * 24 * 60 * 60;
    case "h":
      return num * 60 * 60;
    case "m":
      return num * 60;
    case "s":
      return num;
    default:
      return 86400;
  }
}

//register func 
export const register = async (req: Request, res: Response): Promise<void> => {
  // validate incoming req body
  const result = registerSchema.safeParse(req.body);
  // If validation fails error
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }
  // exract valid data
  const { name, email, password } = result.data;
//checking if email is already assocated with exsiitng suers or not
  const [existingUsers] = await pool.execute<UserRow[]>(
    "SELECT id FROM users WHERE email = ?", 
    [email] // email i gave here separately cuz hacker dierct sus mail dalke sql injection perform karlega
  );

  // If the array has any rows, the email is already taken(no duplicate accs)
  if (existingUsers.length > 0) {
    res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
    return;
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 10);

  //Inserting user into the db
  await pool.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, "user"] // parameterized values
  );

  // Sending welcome email notification via SMTP
  await sendWelcomeEmail(email, name);

  // Send success response (we don't auto-login on registration)
  res.status(201).json({
    success: true,
    message: "Account created successfully. Please log in.",
  });
};

//login func
export const login = async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }
  const { email, password } = result.data;

  // Look upuser by email in the db
  const [users] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  // If no user found, return error
  // Saying "email not found" would let attackers discover valid email addresses
  if (users.length === 0) {
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  // get firsdt user
  const user = users[0];

//compare bcyrpt.compare 
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    // Same generic message — so attackers deosnt have specifics
    res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
    return;
  }

  // Create a JWT containing user's id, email, and role
  // jwt.sign creates a signed token
  const expiresInSeconds = parseExpiresIn(env.JWT_EXPIRES_IN);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );

  // Setting JWT as an httpOnly cookie
  res.cookie("token", token, {
    httpOnly: true, // can't be read by client-side JS
    secure: env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // protects against CSRF attacks
    maxAge: expiresInSeconds * 1000, // convert seconds to milliseconds
  });

  // Send back the user data without pwd
  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
//logout funx
export const logout = (_req: Request, res: Response): void => {
  // Clear the "token" cookie by setting it to empty with immediate expiration
  res.cookie("token", "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // expires immediately — browser will delete it
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

//get me func so current user shown
export const getMe = async (req: Request, res: Response): Promise<void> => {
  // If no valid token was present
  if (!req.user) {
    res.status(200).json({
      success: true,
      message: "No active session",
      data: null,
    });
    return;
  }

  // User is logged in
  const userId = req.user.id;

  // Query db for fresh user data
  const [users] = await pool.execute<UserRow[]>(
    "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
    [userId]
  );

  // If the user was deleted from the DB after the token was issued
  if (users.length === 0) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  // Return the user data (no pwd)
  const user = users[0];
  res.status(200).json({
    success: true,
    message: "User data retrieved successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
  });
};
