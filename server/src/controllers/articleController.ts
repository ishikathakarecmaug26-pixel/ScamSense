import { Request, Response } from "express"; 
import { z } from "zod";                     
import { RowDataPacket, ResultSetHeader } from "mysql2"; 
import pool from "../config/db.js";         


// Schema for creating an article
const createArticleSchema = z.object({
  // Title must be between 1 and 150 characters
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(150, "Title must be at most 150 characters")
    .trim(),

  // Content must be at least 1 character
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .trim(),

  // Category must be a non-empty string (e.g. phishing, upi, social_media)
  category: z
    .string()
    .min(1, "Category cannot be empty")
    .max(50, "Category must be at most 50 characters")
    .trim()
    .toLowerCase(),
});

// Schema for updating an article (all fields optional, but at least one must be provided)
const updateArticleSchema = createArticleSchema.partial();

// ---- Interface for Article row returned from MySQL ----
interface ArticleRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  category: string;
  author_id: number;
  author_name?: string;
  created_at: Date;
  updated_at: Date;
}

export const getAllArticles = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Read optional query parameters for filtering
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;

  // Step 2: Build dynamic SQL query with parameters array
  // We JOIN users table to display the author's name instead of just their ID
  let query = `
    SELECT 
      a.id, 
      a.title, 
      a.content, 
      a.category, 
      a.author_id, 
      u.name AS author_name, 
      a.created_at, 
      a.updated_at
    FROM articles a
    JOIN users u ON a.author_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  // Step 3: Add category filter if provided
  if (category) {
    query += " AND a.category = ?";
    params.push(category.toLowerCase().trim());
  }

  // Step 4: Add search keyword filter if provided (searches title and content)
  if (search) {
    query += " AND (a.title LIKE ? OR a.content LIKE ?)";
    const wildcard = `%${search.trim()}%`;
    params.push(wildcard, wildcard);
  }

  // Step 5: Order newest articles first
  query += " ORDER BY a.created_at DESC";

  // Step 6: Execute the query safely using parameterized values
  const [articles] = await pool.execute<ArticleRow[]>(query, params);

  // Step 7: Send response
  res.status(200).json({
    success: true,
    message: "Articles retrieved successfully",
    data: articles,
  });
};

export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Parse and validate article ID from URL parameter
  const articleId = parseInt(req.params.id as string, 10);

  // If ID is not a valid positive number, return 400 Bad Request
  if (isNaN(articleId) || articleId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid article ID",
    });
    return;
  }

  // Step 2: Query database for the specific article with author name
  const [articles] = await pool.execute<ArticleRow[]>(
    `SELECT 
       a.id, 
       a.title, 
       a.content, 
       a.category, 
       a.author_id, 
       u.name AS author_name, 
       a.created_at, 
       a.updated_at
     FROM articles a
     JOIN users u ON a.author_id = u.id
     WHERE a.id = ?`,
    [articleId]
  );

  // Step 3: Check if article exists
  if (articles.length === 0) {
    res.status(404).json({
      success: false,
      message: "Article not found",
    });
    return;
  }

  // Step 4: Return article details
  res.status(200).json({
    success: true,
    message: "Article retrieved successfully",
    data: articles[0],
  });
};

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate request body with Zod
  const result = createArticleSchema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  // Step 2: Extract validated data
  const { title, content, category } = result.data;

  // Step 3: Get logged-in admin user ID from auth middleware
  const authorId = req.user!.id;

  // Step 4: Insert new article into MySQL database
  const [insertResult] = await pool.execute<ResultSetHeader>(
    "INSERT INTO articles (title, content, category, author_id) VALUES (?, ?, ?, ?)",
    [title, content, category, authorId]
  );

  // Step 5: Send 201 Created response with new article ID
  res.status(201).json({
    success: true,
    message: "Article created successfully",
    data: {
      id: insertResult.insertId,
      title,
      content,
      category,
      authorId,
    },
  });
};

export const updateArticle = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate article ID
  const articleId = parseInt(req.params.id as string, 10);
  if (isNaN(articleId) || articleId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid article ID",
    });
    return;
  }

  // Step 2: Validate request body
  const result = updateArticleSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  // Step 3: Ensure at least one field is provided for update
  const { title, content, category } = result.data;
  if (!title && !content && !category) {
    res.status(400).json({
      success: false,
      message: "Please provide at least one field to update",
    });
    return;
  }

  // Step 4: Check if article exists in database
  const [existingArticles] = await pool.execute<ArticleRow[]>(
    "SELECT id FROM articles WHERE id = ?",
    [articleId]
  );

  if (existingArticles.length === 0) {
    res.status(404).json({
      success: false,
      message: "Article not found",
    });
    return;
  }

  // Step 5: Build dynamic UPDATE query based on fields provided
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (title) {
    updates.push("title = ?");
    values.push(title);
  }
  if (content) {
    updates.push("content = ?");
    values.push(content);
  }
  if (category) {
    updates.push("category = ?");
    values.push(category);
  }

  // Append articleId as the WHERE parameter
  values.push(articleId);

  // Step 6: Execute update query
  await pool.execute(
    `UPDATE articles SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  // Step 7: Fetch and return updated article
  const [updatedRows] = await pool.execute<ArticleRow[]>(
    `SELECT 
       a.id, 
       a.title, 
       a.content, 
       a.category, 
       a.author_id, 
       u.name AS author_name, 
       a.created_at, 
       a.updated_at
     FROM articles a
     JOIN users u ON a.author_id = u.id
     WHERE a.id = ?`,
    [articleId]
  );

  res.status(200).json({
    success: true,
    message: "Article updated successfully",
    data: updatedRows[0],
  });
};

// ============================================================
// DELETE ARTICLE — Admin only
// ============================================================
// DELETE /api/articles/:id
// Requires: authenticate, authorize("admin")
// ============================================================
export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate article ID
  const articleId = parseInt(req.params.id as string, 10);
  if (isNaN(articleId) || articleId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid article ID",
    });
    return;
  }

  // Step 2: Check if article exists
  const [existingArticles] = await pool.execute<ArticleRow[]>(
    "SELECT id FROM articles WHERE id = ?",
    [articleId]
  );

  if (existingArticles.length === 0) {
    res.status(404).json({
      success: false,
      message: "Article not found",
    });
    return;
  }

  // Step 3: Delete the article
  await pool.execute("DELETE FROM articles WHERE id = ?", [articleId]);

  // Step 4: Return success response
  res.status(200).json({
    success: true,
    message: "Article deleted successfully",
  });
};