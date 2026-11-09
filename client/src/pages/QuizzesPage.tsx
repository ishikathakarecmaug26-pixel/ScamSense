// ============================================================
// QuizzesPage.tsx — Interactive Cyber Awareness Quiz Platform
// ============================================================
// Layout from Excalidraw Wireframe:
//   - Header: Centered "TAKE A QUIZ"
//   - Top Section: Simple Material UI cards listing available quizzes
//   - Active Quiz Section (Inline on the same page):
//       - Header Row: QUIZ _ NAME (left) | SCORE: (right)
//       - Main Card (Pearl White #F2F4FE):
//           - QUESTIONS (question text)
//           - OPTIONS (interactive answer choices)
//           - NEXT button (bottom right)
//       - Bottom Buttons:
//           - SUBMIT (grades attempt on backend, displays score & explanations)
//           - RETAKE (resets answers, score, and restarts question 1)
// ============================================================

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

// Quiz listing item
interface QuizSummary {
  id: number;
  title: string;
  description: string;
  category: string;
  question_count: number;
}

// Question Option
interface Option {
  id: number;
  question_id: number;
  option_text: string;
}

// Question (anti-cheat: is_correct is hidden before submit)
interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  options: Option[];
}

// Single Quiz details
interface ActiveQuiz {
  id: number;
  title: string;
  description: string;
  category: string;
  questions: Question[];
}

// Feedback item returned from server after submit
interface QuestionFeedback {
  questionId: number;
  questionText: string;
  explanation: string;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  isCorrect: boolean;
}

// Full evaluation report from backend
interface SubmissionReport {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  feedback: QuestionFeedback[];
}

export const QuizzesPage: React.FC = () => {
  // Available quizzes list
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Active quiz state (inline on the same page)
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // User's selected answers: mapping questionId -> selectedOptionId
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  // Submission result & score
  const [submitting, setSubmitting] = useState(false);
  const [submissionReport, setSubmissionReport] = useState<SubmissionReport | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/quizzes");
      const json = await res.json();
      if (res.ok && json.success) {
        setQuizzes(json.data || []);
      } else {
        setListError("Failed to load quizzes.");
      }
    } catch {
      setListError("Could not connect to quizzes server.");
    } finally {
      setListLoading(false);
    }
  };

  // Fetch available quizzes on page load
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Start a selected quiz inline on the same page
  const handleSelectQuiz = async (quizId: number) => {
    setQuizLoading(true);
    setSubmitError(null);
    setSubmissionReport(null);
    setSelectedAnswers({});
    setCurrentQIndex(0);

    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setActiveQuiz(json.data);
      } else {
        setSubmitError("Failed to load questions for this quiz.");
      }
    } catch {
      setSubmitError("Error connecting to server.");
    } finally {
      setQuizLoading(false);
    }
  };

  // Handle option selection for current question
  const handleSelectOption = (questionId: number, optionId: number) => {
    // If already submitted, prevent changing answers until retake
    if (submissionReport) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Loop back to start or stay on current
      setCurrentQIndex(0);
    }
  };

  // Submit all answers to backend for server-side grading
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitError(null);

    // Verify all questions are answered before submitting
    const unansweredQuestions = activeQuiz.questions.filter(
      (q) => !selectedAnswers[q.id] || selectedAnswers[q.id] <= 0
    );

    if (unansweredQuestions.length > 0) {
      setSubmitError(
        `Please answer all questions before submitting. (${activeQuiz.questions.length - unansweredQuestions.length}/${activeQuiz.questions.length} answered)`
      );
      return;
    }

    // Format answers array: [{ questionId, selectedOptionId }]
    const answersPayload = activeQuiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: selectedAnswers[q.id],
    }));

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Saves attempt in MySQL quiz_attempts for logged-in users
        body: JSON.stringify({ answers: answersPayload }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmissionReport(json.data);
      } else {
        setSubmitError(json.message || "Failed to evaluate quiz.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setSubmitError(`Failed to submit quiz: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Retake the quiz: resets answers, score, and brings user back to question 1
  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmissionReport(null);
    setSubmitError(null);
    setCurrentQIndex(0);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#000000",
        color: "#FFFFFF",
        py: { xs: 6, md: 8 },
        minHeight: "calc(100vh - 64px - 180px)",
      }}
    >
      <Container maxWidth="lg">
        
        {/* ======================================================== */}
        {/* Page Header matching Wireframe */}
        {/* ======================================================== */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            textAlign: "center",
            mb: 1.5,
            fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.2rem" },
            letterSpacing: "-0.5px",
          }}
        >
          TAKE A QUIZ
        </Typography>

        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: "#A1A1AA",
            fontSize: { xs: "1rem", sm: "1.15rem" },
            mb: { xs: 5, md: 6 },
          }}
        >
          Select a topic below to test and sharpen your cybersecurity instincts
        </Typography>

        {/* ======================================================== */}
        {/* 1. Multiple Quizzes Cards List */}
        {/* ======================================================== */}
        {listLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : listError ? (
          <Alert severity="error" sx={{ mb: 4, borderRadius: "8px" }}>
            {listError}
          </Alert>
        ) : (
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Grid container spacing={3}>
              {quizzes.map((quiz) => {
                const isSelected = activeQuiz?.id === quiz.id;
                return (
                  <Grid item xs={12} sm={6} key={quiz.id}>
                    <Card
                      sx={{
                        backgroundColor: "#F2F4FE", // Pearl White matching other cards
                        color: "#000000",
                        borderRadius: "14px",
                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
                        border: isSelected ? "3px solid #E7FE55" : "1px solid transparent",
                        transition: "all 0.2s ease-in-out",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.2rem" }}>
                            {quiz.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${quiz.question_count} Qs`}
                            sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700 }}
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{ color: "#4B5563", mb: 3, flexGrow: 1, lineHeight: 1.6 }}
                        >
                          {quiz.description}
                        </Typography>

                        <Button
                          variant="contained"
                          onClick={() => handleSelectQuiz(quiz.id)}
                          sx={{
                            backgroundColor: isSelected ? "#000000" : "#E7FE55",
                            color: isSelected ? "#FFFFFF" : "#000000",
                            fontWeight: 700,
                            py: 1.2,
                            borderRadius: "8px",
                            "&:hover": {
                              backgroundColor: isSelected ? "#222222" : "#d4ea45",
                            },
                          }}
                        >
                          {isSelected ? "Active Quiz" : "Start Quiz"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* ======================================================== */}
        {/* 2. Active Quiz Section (Wireframe Layout) */}
        {/* ======================================================== */}
        {quizLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !activeQuiz ? (
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: "12px",
              p: 5,
              textAlign: "center",
              border: "1px dashed rgba(255, 255, 255, 0.2)",
            }}
          >
            <Typography variant="h6" sx={{ color: "#A1A1AA" }}>
              Please select a quiz card above to begin your questions inline.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 4 }}>
            
            {/* Header Row: QUIZ _ NAME (left) | SCORE: (right) from Wireframe */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 2.5,
                px: 1,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                  letterSpacing: "-0.5px",
                }}
              >
                {activeQuiz.title.toUpperCase()}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: submissionReport ? (submissionReport.passed ? "#10B981" : "#F59E0B") : "#E7FE55",
                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                }}
              >
                SCORE:{" "}
                {submissionReport
                  ? `${submissionReport.score} / ${submissionReport.totalQuestions} (${submissionReport.percentage}%)`
                  : "--"}
              </Typography>
            </Box>

            {/* Main Question Card (Pearl White #F2F4FE) */}
            <Card
              sx={{
                backgroundColor: "#F2F4FE",
                color: "#000000",
                borderRadius: "16px",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
                mb: 3,
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
                
                {/* Active Question details */}
                {(() => {
                  const currentQ = activeQuiz.questions[currentQIndex];
                  if (!currentQ) return null;

                  const currentAnswer = selectedAnswers[currentQ.id];
                  const feedbackItem = submissionReport?.feedback.find(
                    (f) => f.questionId === currentQ.id
                  );

                  return (
                    <Box>
                      {/* Question Index Badge & Title */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <Chip
                          label={`Question ${currentQIndex + 1} of ${activeQuiz.questions.length}`}
                          sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700 }}
                        />
                        {feedbackItem && (
                          <Chip
                            label={feedbackItem.isCorrect ? "Correct (+1)" : "Incorrect (0)"}
                            sx={{
                              backgroundColor: feedbackItem.isCorrect ? "#10B981" : "#EF4444",
                              color: "#FFFFFF",
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Box>

                      {/* Question Text */}
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          color: "#000000",
                          fontSize: { xs: "1.1rem", sm: "1.3rem" },
                          lineHeight: 1.5,
                          mb: 3,
                        }}
                      >
                        {currentQ.question_text}
                      </Typography>

                      <Divider sx={{ mb: 3 }} />

                      {/* OPTIONS List */}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "#6B7280",
                          letterSpacing: "0.5px",
                          display: "block",
                          mb: 1.5,
                        }}
                      >
                        Options:
                      </Typography>

                      <RadioGroup
                        value={currentAnswer || ""}
                        onChange={(e) =>
                          handleSelectOption(currentQ.id, parseInt(e.target.value, 10))
                        }
                      >
                        <Stack spacing={2}>
                          {currentQ.options.map((option) => {
                            const isChosen = currentAnswer === option.id;
                            const isCorrectOpt = feedbackItem?.correctOptionId === option.id;
                            const isWrongOpt = feedbackItem && isChosen && !feedbackItem.isCorrect;

                            // Background and border highlighting based on submission feedback
                            let optionBg = "#FFFFFF";
                            let optionBorder = "1px solid rgba(0, 0, 0, 0.15)";
                            let optionColor = "#000000";

                            if (submissionReport) {
                              if (isCorrectOpt) {
                                optionBg = "#D1FAE5"; // Green highlight for correct choice
                                optionBorder = "2px solid #059669";
                                optionColor = "#065F46";
                              } else if (isWrongOpt) {
                                optionBg = "#FEE2E2"; // Red highlight for user's wrong choice
                                optionBorder = "2px solid #DC2626";
                                optionColor = "#991B1B";
                              }
                            } else if (isChosen) {
                              optionBg = "#FFFFFF";
                              optionBorder = "2px solid #000000";
                            }

                            return (
                              <Box
                                key={option.id}
                                onClick={() => handleSelectOption(currentQ.id, option.id)}
                                sx={{
                                  backgroundColor: optionBg,
                                  border: optionBorder,
                                  borderRadius: "10px",
                                  p: 1.8,
                                  cursor: submissionReport ? "default" : "pointer",
                                  transition: "all 0.15s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  "&:hover": {
                                    borderColor: submissionReport ? undefined : "#000000",
                                  },
                                }}
                              >
                                <FormControlLabel
                                  value={option.id}
                                  control={
                                    <Radio
                                      sx={{
                                        color: "#4B5563",
                                        "&.Mui-checked": { color: "#000000" },
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography
                                      sx={{
                                        color: optionColor,
                                        fontWeight: isChosen || isCorrectOpt ? 700 : 500,
                                        fontSize: "0.98rem",
                                      }}
                                    >
                                      {option.option_text}
                                    </Typography>
                                  }
                                  sx={{ width: "100%", m: 0 }}
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                      </RadioGroup>

                      {/* Educational Explanation (shown after submission) */}
                      {feedbackItem && (
                        <Box
                          sx={{
                            mt: 3,
                            p: 2.5,
                            backgroundColor: "#FEF3C7",
                            borderRadius: "10px",
                            borderLeft: "4px solid #D97706",
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#92400E", mb: 0.5 }}>
                            Explanation:
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#78350F", lineHeight: 1.6 }}>
                            {feedbackItem.explanation}
                          </Typography>
                        </Box>
                      )}

                      {/* NEXT Button inside card (Bottom Right) from Wireframe */}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={handleNextQuestion}
                          sx={{
                            color: "#000000",
                            borderColor: "#000000",
                            fontWeight: 700,
                            px: 3.5,
                            py: 1,
                            borderRadius: "8px",
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.08)",
                              borderColor: "#000000",
                            },
                          }}
                        >
                          {currentQIndex < activeQuiz.questions.length - 1 ? "Next Question" : "Back to First"}
                        </Button>
                      </Box>

                    </Box>
                  );
                })()}

              </CardContent>
            </Card>

            {/* Submit Error alert */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
                {submitError}
              </Alert>
            )}

            {/* Submission Success / Result Alert */}
            {submissionReport && (
              <Alert
                severity={submissionReport.passed ? "success" : "warning"}
                sx={{ mb: 3, borderRadius: "8px" }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {submissionReport.passed
                    ? "Great job! You passed the quiz."
                    : "Quiz evaluated! Review the explanations above to learn more."}
                </Typography>
                <Typography variant="body2">
                  Your score: <strong>{submissionReport.score}</strong> out of{" "}
                  <strong>{submissionReport.totalQuestions}</strong> questions (
                  {submissionReport.percentage}%).
                </Typography>
              </Alert>
            )}

            {/* Bottom Buttons: SUBMIT & RETAKE from Wireframe */}
            <Box
              sx={{
                display: "flex",
                gap: 2.5,
                justifyContent: "center",
                flexWrap: "wrap",
                mt: 3,
                mb: 6,
              }}
            >
              {/* SUBMIT Button */}
              <Button
                variant="contained"
                size="large"
                disabled={submitting || Boolean(submissionReport)}
                onClick={handleSubmitQuiz}
                sx={{
                  backgroundColor: "#E7FE55",
                  color: "#000000",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  px: 5,
                  py: 1.5,
                  borderRadius: "8px",
                  "&:hover": { backgroundColor: "#d4ea45" },
                }}
              >
                {submitting ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Grading Answers...</span>
                  </Box>
                ) : (
                  "SUBMIT"
                )}
              </Button>

              {/* RETAKE Button */}
              <Button
                variant="outlined"
                size="large"
                onClick={handleRetake}
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  px: 4,
                  py: 1.5,
                  borderRadius: "8px",
                  "&:hover": {
                    borderColor: "#FFFFFF",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                RETAKE
              </Button>
            </Box>

          </Box>
        )}

      </Container>
    </Box>
  );
};