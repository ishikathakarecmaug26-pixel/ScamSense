// ============================================================
// quizController.ts — Handles Quiz & Question Management
// ============================================================
// This controller provides:
//   Public / User actions:
//     - getAllQuizzes:         List all available quizzes
//     - getQuizById:           Load quiz questions for taking the quiz
//                              (is_correct is hidden to prevent cheating)
//     - submitQuizAttempt:     Grade user answers on backend, store score
//     - getUserQuizAttempts:   View logged-in user's quiz attempt history
//
//   Admin / Content Manager actions:
//     - getQuizByIdAdmin:      Load quiz with is_correct visible for editing
//     - createQuiz:            Create a new quiz
//     - updateQuiz:            Update quiz title, description, category
//     - deleteQuiz:            Delete a quiz (cascades to questions & options)
//     - addQuestionToQuiz:     Add a question with multiple choice options
//     - updateQuestion:        Update question text, explanation, and options
//     - deleteQuestion:        Delete a single question
// ============================================================

import { Request, Response } from "express"; // Express types
import { z } from "zod";                     // Zod validation library
import { RowDataPacket, ResultSetHeader } from "mysql2"; // MySQL types
import pool from "../config/db.js";          // MySQL connection pool

// ============================================================
// Zod Schemas — Validation for Quiz & Questions
// ============================================================

// Schema for creating or updating a Quiz
const quizSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be at most 150 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .default(""),

  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must be at most 50 characters")
    .trim()
    .toLowerCase()
    .default("general"),
});

// Partial schema for updating a Quiz
const updateQuizSchema = quizSchema.partial();

// Schema for an individual Question Option
const optionSchema = z.object({
  option_text: z
    .string()
    .min(1, "Option text cannot be empty")
    .max(255, "Option text must be at most 255 characters")
    .trim(),

  is_correct: z.boolean(),
});

// Schema for adding a Question with Options
const addQuestionSchema = z.object({
  question_text: z
    .string()
    .min(1, "Question text cannot be empty")
    .trim(),

  explanation: z
    .string()
    .trim()
    .optional()
    .default(""),

  options: z
    .array(optionSchema)
    .min(2, "A question must have at least 2 options")
    .max(6, "A question cannot have more than 6 options")
    .refine(
      (opts) => opts.filter((opt) => opt.is_correct === true).length === 1,
      "Exactly one option must be marked as correct (is_correct: true)"
    ),
});

// Schema for updating a Question
const updateQuestionSchema = z.object({
  question_text: z.string().min(1).trim().optional(),
  explanation: z.string().trim().optional(),
  options: z
    .array(optionSchema)
    .min(2, "A question must have at least 2 options")
    .max(6, "A question cannot have more than 6 options")
    .refine(
      (opts) => opts.filter((opt) => opt.is_correct === true).length === 1,
      "Exactly one option must be marked as correct (is_correct: true)"
    )
    .optional(),
});

// Schema for submitting Quiz answers
const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive("Invalid questionId"),
        selectedOptionId: z.number().int().positive("Invalid selectedOptionId"),
      })
    )
    .min(1, "At least one answer must be provided"),
});

// ============================================================
// TypeScript Interfaces for MySQL Query Results
// ============================================================

interface QuizRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at: Date;
  updated_at: Date;
  question_count?: number;
}

interface QuestionRow extends RowDataPacket {
  id: number;
  quiz_id: number;
  question_text: string;
  explanation: string;
  created_at: Date;
}

interface OptionRow extends RowDataPacket {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: number | boolean;
}

interface AttemptRow extends RowDataPacket {
  id: number;
  quiz_id: number;
  quiz_title: string;
  quiz_category: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: Date;
}

// ============================================================
// 1. GET ALL QUIZZES — Public endpoint
// ============================================================
// GET /api/quizzes
// Returns list of quizzes with count of questions in each
// ============================================================
export const getAllQuizzes = async (_req: Request, res: Response): Promise<void> => {
  // Query quizzes and count how many questions each quiz has using LEFT JOIN & COUNT
  const [quizzes] = await pool.execute<QuizRow[]>(
    `SELECT 
       q.id, 
       q.title, 
       q.description, 
       q.category, 
       q.created_at, 
       q.updated_at,
       COUNT(ques.id) AS question_count
     FROM quizzes q
     LEFT JOIN questions ques ON q.id = ques.quiz_id
     GROUP BY q.id
     ORDER BY q.created_at DESC`
  );

  res.status(200).json({
    success: true,
    message: "Quizzes retrieved successfully",
    data: quizzes,
  });
};

// ============================================================
// 2. GET QUIZ BY ID (For Playing) — Public / User endpoint
// ============================================================
// GET /api/quizzes/:id
// IMPORTANT: Does NOT return `is_correct` or `explanation` to prevent cheating!
// ============================================================
export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate quiz ID
  const quizId = parseInt(req.params.id as string, 10);
  if (isNaN(quizId) || quizId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
    return;
  }

  // Step 2: Fetch the quiz record
  const [quizzes] = await pool.execute<QuizRow[]>(
    "SELECT id, title, description, category FROM quizzes WHERE id = ?",
    [quizId]
  );

  if (quizzes.length === 0) {
    res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
    return;
  }

  const quiz = quizzes[0];

  // Step 3: Fetch all questions for this quiz (NO explanation exposed before submission)
  const [questions] = await pool.execute<QuestionRow[]>(
    "SELECT id, question_text FROM questions WHERE quiz_id = ? ORDER BY id ASC",
    [quizId]
  );

  // If quiz has no questions yet, return empty questions array
  if (questions.length === 0) {
    res.status(200).json({
      success: true,
      message: "Quiz retrieved successfully",
      data: {
        ...quiz,
        questions: [],
      },
    });
    return;
  }

  // Step 4: Fetch options for these questions
  // Extract all question IDs into an array
  const questionIds = questions.map((q) => q.id);

  // Build placeholders for SQL IN clause: (?, ?, ?)
  const placeholders = questionIds.map(() => "?").join(", ");

  // Query options WITHOUT is_correct column so client cannot inspect network responses
  const [options] = await pool.execute<OptionRow[]>(
    `SELECT id, question_id, option_text 
     FROM question_options 
     WHERE question_id IN (${placeholders}) 
     ORDER BY id ASC`,
    questionIds
  );

  // Step 5: Group options under their corresponding question
  const questionsWithOptions = questions.map((q) => {
    return {
      id: q.id,
      question_text: q.question_text,
      options: options
        .filter((opt) => opt.question_id === q.id)
        .map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
        })),
    };
  });

  // Step 6: Return structured quiz
  res.status(200).json({
    success: true,
    message: "Quiz retrieved successfully",
    data: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      questions: questionsWithOptions,
    },
  });
};

// ============================================================
// 3. GET QUIZ BY ID (For Admin Editing) — Admin only
// ============================================================
// GET /api/quizzes/:id/admin
// Returns questions WITH `explanation` and options WITH `is_correct`
// Requires: authenticate, authorize("admin")
// ============================================================
export const getQuizByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate quiz ID
  const quizId = parseInt(req.params.id as string, 10);
  if (isNaN(quizId) || quizId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
    return;
  }

  // Step 2: Fetch quiz record
  const [quizzes] = await pool.execute<QuizRow[]>(
    "SELECT id, title, description, category, created_at, updated_at FROM quizzes WHERE id = ?",
    [quizId]
  );

  if (quizzes.length === 0) {
    res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
    return;
  }

  const quiz = quizzes[0];

  // Step 3: Fetch all questions (INCLUDING explanation)
  const [questions] = await pool.execute<QuestionRow[]>(
    "SELECT id, quiz_id, question_text, explanation, created_at FROM questions WHERE quiz_id = ? ORDER BY id ASC",
    [quizId]
  );

  if (questions.length === 0) {
    res.status(200).json({
      success: true,
      message: "Quiz retrieved for editing",
      data: {
        ...quiz,
        questions: [],
      },
    });
    return;
  }

  // Step 4: Fetch options (INCLUDING is_correct)
  const questionIds = questions.map((q) => q.id);
  const placeholders = questionIds.map(() => "?").join(", ");

  const [options] = await pool.execute<OptionRow[]>(
    `SELECT id, question_id, option_text, is_correct 
     FROM question_options 
     WHERE question_id IN (${placeholders}) 
     ORDER BY id ASC`,
    questionIds
  );

  // Step 5: Group options with their question
  const questionsWithOptions = questions.map((q) => {
    return {
      id: q.id,
      question_text: q.question_text,
      explanation: q.explanation,
      created_at: q.created_at,
      options: options
        .filter((opt) => opt.question_id === q.id)
        .map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          is_correct: Boolean(opt.is_correct),
        })),
    };
  });

  // Step 6: Return complete quiz data for admin editor
  res.status(200).json({
    success: true,
    message: "Admin quiz details retrieved successfully",
    data: {
      ...quiz,
      questions: questionsWithOptions,
    },
  });
};

// ============================================================
// 4. CREATE QUIZ — Admin only
// ============================================================
// POST /api/quizzes
// Body: { title, description?, category? }
// Requires: authenticate, authorize("admin")
// ============================================================
export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate input body
  const result = quizSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  const { title, description, category } = result.data;

  // Step 2: Insert into quizzes table
  const [insertResult] = await pool.execute<ResultSetHeader>(
    "INSERT INTO quizzes (title, description, category) VALUES (?, ?, ?)",
    [title, description || "", category || "general"]
  );

  // Step 3: Respond with 201 Created
  res.status(201).json({
    success: true,
    message: "Quiz created successfully",
    data: {
      id: insertResult.insertId,
      title,
      description,
      category,
    },
  });
};

// ============================================================
// 5. UPDATE QUIZ — Admin only
// ============================================================
// PUT /api/quizzes/:id
// Body: { title?, description?, category? }
// Requires: authenticate, authorize("admin")
// ============================================================
export const updateQuiz = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate quiz ID
  const quizId = parseInt(req.params.id as string, 10);
  if (isNaN(quizId) || quizId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
    return;
  }

  // Step 2: Validate request body
  const result = updateQuizSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  // Step 3: Check if quiz exists
  const [existingQuizzes] = await pool.execute<QuizRow[]>(
    "SELECT id FROM quizzes WHERE id = ?",
    [quizId]
  );

  if (existingQuizzes.length === 0) {
    res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
    return;
  }

  // Step 4: Build dynamic update statement
  const { title, description, category } = result.data;
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (title !== undefined) {
    updates.push("title = ?");
    values.push(title);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    values.push(description);
  }
  if (category !== undefined) {
    updates.push("category = ?");
    values.push(category);
  }

  if (updates.length === 0) {
    res.status(400).json({
      success: false,
      message: "Please provide at least one field to update",
    });
    return;
  }

  values.push(quizId);

  // Step 5: Execute update query
  await pool.execute(
    `UPDATE quizzes SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  // Step 6: Fetch and return updated quiz record
  const [updatedQuizzes] = await pool.execute<QuizRow[]>(
    "SELECT id, title, description, category, created_at, updated_at FROM quizzes WHERE id = ?",
    [quizId]
  );

  res.status(200).json({
    success: true,
    message: "Quiz updated successfully",
    data: updatedQuizzes[0],
  });
};

// ============================================================
// 6. DELETE QUIZ — Admin only
// ============================================================
// DELETE /api/quizzes/:id
// Requires: authenticate, authorize("admin")
// Note: Foreign keys ON DELETE CASCADE will automatically delete
// related questions, question_options, and quiz_attempts.
// ============================================================
export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate quiz ID
  const quizId = parseInt(req.params.id as string, 10);
  if (isNaN(quizId) || quizId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
    return;
  }

  // Step 2: Check if quiz exists
  const [existingQuizzes] = await pool.execute<QuizRow[]>(
    "SELECT id FROM quizzes WHERE id = ?",
    [quizId]
  );

  if (existingQuizzes.length === 0) {
    res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
    return;
  }

  // Step 3: Delete quiz
  await pool.execute("DELETE FROM quizzes WHERE id = ?", [quizId]);

  res.status(200).json({
    success: true,
    message: "Quiz and all its associated questions deleted successfully",
  });
};

// ============================================================
// 7. ADD QUESTION TO QUIZ — Admin only
// ============================================================
// POST /api/quizzes/:id/questions
// Body: { question_text, explanation, options: [{ option_text, is_correct }] }
// Requires: authenticate, authorize("admin")
// ============================================================
export const addQuestionToQuiz = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate quiz ID
  const quizId = parseInt(req.params.id as string, 10);
  if (isNaN(quizId) || quizId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
    return;
  }

  // Step 2: Validate question and options payload
  const result = addQuestionSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  const { question_text, explanation, options } = result.data;

  // Step 3: Check that parent quiz exists
  const [quizzes] = await pool.execute<QuizRow[]>(
    "SELECT id FROM quizzes WHERE id = ?",
    [quizId]
  );

  if (quizzes.length === 0) {
    res.status(404).json({
      success: false,
      message: "Quiz not found",
    });
    return;
  }

  // Step 4: Use a database transaction to insert question and options atomically
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [questionResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO questions (quiz_id, question_text, explanation) VALUES (?, ?, ?)",
      [quizId, question_text, explanation]
    );

    const questionId = questionResult.insertId;

    for (const opt of options) {
      await connection.execute(
        "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
        [questionId, opt.option_text, opt.is_correct ? 1 : 0]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Question and options added successfully",
      data: {
        id: questionId,
        quiz_id: quizId,
        question_text,
        explanation,
        options,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// 8. UPDATE QUESTION — Admin only
// ============================================================
// PUT /api/quizzes/questions/:questionId
// Body: { question_text?, explanation?, options? }
// Requires: authenticate, authorize("admin")
// ============================================================
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate question ID
  const questionId = parseInt(req.params.questionId as string, 10);
  if (isNaN(questionId) || questionId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid question ID",
    });
    return;
  }

  // Step 2: Validate payload
  const result = updateQuestionSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  const { question_text, explanation, options } = result.data;

  // Step 3: Check if question exists
  const [existingQuestions] = await pool.execute<QuestionRow[]>(
    "SELECT id, quiz_id FROM questions WHERE id = ?",
    [questionId]
  );

  if (existingQuestions.length === 0) {
    res.status(404).json({
      success: false,
      message: "Question not found",
    });
    return;
  }

  // Step 4: Use a database transaction to update question and options atomically
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (question_text || explanation) {
      const updates: string[] = [];
      const values: (string | number)[] = [];

      if (question_text) {
        updates.push("question_text = ?");
        values.push(question_text);
      }
      if (explanation) {
        updates.push("explanation = ?");
        values.push(explanation);
      }
      values.push(questionId);

      await connection.execute(
        `UPDATE questions SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    // Replace options if options array was provided
    if (options && options.length >= 2) {
      await connection.execute("DELETE FROM question_options WHERE question_id = ?", [
        questionId,
      ]);

      for (const opt of options) {
        await connection.execute(
          "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
          [questionId, opt.option_text, opt.is_correct ? 1 : 0]
        );
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// 9. DELETE QUESTION — Admin only
// ============================================================
// DELETE /api/quizzes/questions/:questionId
// Requires: authenticate, authorize("admin")
// ============================================================
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate question ID
  const questionId = parseInt(req.params.questionId as string, 10);
  if (isNaN(questionId) || questionId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid question ID",
    });
    return;
  }

  // Step 2: Check if question exists
  const [existingQuestions] = await pool.execute<QuestionRow[]>(
    "SELECT id FROM questions WHERE id = ?",
    [questionId]
  );

  if (existingQuestions.length === 0) {
    res.status(404).json({
      success: false,
      message: "Question not found",
    });
    return;
  }

  // Step 3: Delete question (cascade deletes question_options)
  await pool.execute("DELETE FROM questions WHERE id = ?", [questionId]);

  res.status(200).json({
    success: true,
    message: "Question deleted successfully",
  });
};

// ============================================================
// 10. SUBMIT QUIZ ATTEMPT — Authenticated User
// ============================================================
// POST /api/quizzes/:id/attempts  (or /api/quizzes/:id/submit)
// Body: { answers: [{ questionId, selectedOptionId }] }
// Requires: authenticate
// ============================================================
export const submitQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Validate quiz ID
  const quizId = parseInt(req.params.id as string, 10);
  if (isNaN(quizId) || quizId <= 0) {
    res.status(400).json({
      success: false,
      message: "Invalid quiz ID",
    });
    return;
  }

  // Step 2: Validate submission body
  const result = submitQuizSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Invalid input";
    res.status(400).json({
      success: false,
      message: firstError,
    });
    return;
  }

  const { answers } = result.data;

  // Step 3: Fetch all questions and explanations for this quiz
  const [questions] = await pool.execute<QuestionRow[]>(
    "SELECT id, question_text, explanation FROM questions WHERE quiz_id = ?",
    [quizId]
  );

  if (questions.length === 0) {
    res.status(404).json({
      success: false,
      message: "Quiz has no questions available for submission",
    });
    return;
  }

  // Step 4: Fetch all options for these questions including is_correct
  const questionIds = questions.map((q) => q.id);
  const placeholders = questionIds.map(() => "?").join(", ");

  const [options] = await pool.execute<OptionRow[]>(
    `SELECT id, question_id, option_text, is_correct 
     FROM question_options 
     WHERE question_id IN (${placeholders})`,
    questionIds
  );

  // Step 5: Evaluate user's answers against correct options
  let score = 0;
  const feedback = [];

  for (const q of questions) {
    // Find the correct option for this question
    const correctOpt = options.find(
      (opt) => opt.question_id === q.id && Boolean(opt.is_correct)
    );

    // Find what the user submitted for this question (if any)
    const userAnswer = answers.find((ans) => ans.questionId === q.id);
    const selectedOptionId = userAnswer ? userAnswer.selectedOptionId : null;

    // Check if the user's selected option matches the correct option ID
    const isCorrect =
      selectedOptionId !== null &&
      correctOpt !== undefined &&
      selectedOptionId === correctOpt.id;

    if (isCorrect) {
      score += 1;
    }

    // Append educational breakdown for this question
    feedback.push({
      questionId: q.id,
      questionText: q.question_text,
      explanation: q.explanation,
      selectedOptionId,
      correctOptionId: correctOpt ? correctOpt.id : null,
      isCorrect,
    });
  }

  const totalQuestions = questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  // Step 6: Record attempt in quiz_attempts table (if user is authenticated)
  let attemptId: number | null = null;
  if (req.user && req.user.id) {
    const userId = req.user.id;
    const [attemptResult] = await pool.execute<ResultSetHeader>(
      "INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)",
      [userId, quizId, score, totalQuestions]
    );
    attemptId = attemptResult.insertId;
  }

  // Step 7: Return score and detailed feedback
  res.status(200).json({
    success: true,
    message: "Quiz submitted and evaluated successfully",
    data: {
      attemptId,
      score,
      totalQuestions,
      percentage,
      passed: percentage >= 60, // 60% passing mark
      feedback,
    },
  });
};

// ============================================================
// 11. GET USER QUIZ ATTEMPTS — Authenticated User
// ============================================================
// GET /api/quizzes/attempts/my (also aliased under /api/quiz-attempts)
// Requires: authenticate
// ============================================================
export const getUserQuizAttempts = async (req: Request, res: Response): Promise<void> => {
  // Step 1: Get logged-in user ID
  const userId = req.user!.id;

  // Step 2: Query quiz_attempts joined with quizzes table to get quiz title
  const [attempts] = await pool.execute<AttemptRow[]>(
    `SELECT 
       qa.id, 
       qa.quiz_id, 
       q.title AS quiz_title, 
       q.category AS quiz_category,
       qa.score, 
       qa.total_questions, 
       ROUND((qa.score / qa.total_questions) * 100) AS percentage, 
       qa.created_at
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.user_id = ?
     ORDER BY qa.created_at DESC`,
    [userId]
  );

  // Step 3: Return user's past attempts
  res.status(200).json({
    success: true,
    message: "User quiz attempts retrieved successfully",
    data: attempts,
  });
};