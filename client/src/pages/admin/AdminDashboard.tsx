// ============================================================
// AdminDashboard.tsx — Admin Control Panel
// ============================================================
// Complete management panel for ScamSense administrators:
//   1. Contact Inquiries:
//      - Search and view contact messages (no status filter / column)
//      - Delete inquiry
//   2. Platform Scans:
//      - View all scam scans executed across users
//      - View message snippet and risk verdict
//      - Delete scan record
//   3. Quizzes Manager:
//      - View all quizzes
//      - Create new quiz (Title, Category, Description)
//      - Add multiple-choice questions with correct answer
//      - Delete quiz
//   4. Articles Manager:
//      - View awareness articles
//      - Create new article (Title, Category, Content)
//      - Edit existing article
//      - Delete article
//
// Protected strictly for users with role === 'admin'.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import { useAuth } from "../../context/AuthContext.js";

// ---- Data Interfaces ----
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

interface ScanRecord {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  message_text: string;
  verdict: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "UNVERIFIED";
  created_at: string;
}

interface QuizItem {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at?: string;
}

interface ArticleItem {
  id: number;
  title: string;
  content: string;
  category: string;
  author_name?: string;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Tab State: 0 = Contact, 1 = Scans, 2 = Quizzes, 3 = Articles
  const [currentTab, setCurrentTab] = useState<number>(0);

  // Status & Feedback message on Dashboard
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Dialog-specific error message
  const [dialogError, setDialogError] = useState<string | null>(null);

  // ---- 1. Contact Messages State ----
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchContact, setSearchContact] = useState<string>("");

  // ---- 2. Platform Scans State ----
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [searchScans, setSearchScans] = useState<string>("");

  // ---- 3. Quizzes State & Modals ----
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizCategory, setNewQuizCategory] = useState("phishing");
  const [newQuizDesc, setNewQuizDesc] = useState("");

  // Add Question Modal State
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [activeQuizIdForQuestion, setActiveQuizIdForQuestion] = useState<number | null>(null);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionExplanation, setNewQuestionExplanation] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);

  // ---- 4. Articles State & Modals ----
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCategory, setArticleCategory] = useState("phishing");
  const [articleContent, setArticleContent] = useState("");

  // Search input styling on main cards
  const lightInputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#FFFFFF",
      borderRadius: "8px",
      color: "#000000",
      "& fieldset": { borderColor: "rgba(0, 0, 0, 0.25)" },
      "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.6)" },
      "&.Mui-focused fieldset": { borderColor: "#000000", borderWidth: "2px" },
    },
    "& .MuiInputBase-input": {
      color: "#000000 !important",
      WebkitTextFillColor: "#000000 !important",
      fontSize: "0.95rem",
    },
    "& .MuiInputLabel-root": { color: "#4B5563 !important" },
  };

  // High-contrast input styling for all modal dialogs
  const dialogInputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#FFFFFF",
      borderRadius: "8px",
      color: "#000000 !important",
      "& fieldset": { borderColor: "#D1D5DB" },
      "&:hover fieldset": { borderColor: "#000000" },
      "&.Mui-focused fieldset": { borderColor: "#000000", borderWidth: "2px" },
    },
    "& .MuiInputBase-input": {
      color: "#000000 !important",
      WebkitTextFillColor: "#000000 !important",
      fontSize: "0.95rem",
      fontWeight: 500,
    },
    "& .MuiInputLabel-root": {
      color: "#374151 !important",
      fontWeight: 600,
      "&.Mui-focused": { color: "#000000 !important" },
    },
  };

  // Menu popover styling for Select dropdowns
  const selectMenuProps = {
    PaperProps: {
      sx: {
        backgroundColor: "#FFFFFF !important",
        color: "#000000 !important",
        border: "1px solid #E5E7EB",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        "& .MuiMenuItem-root": {
          color: "#000000 !important",
          fontSize: "0.95rem",
          fontWeight: 500,
          "&.Mui-selected": {
            backgroundColor: "#E7FE55 !important",
            color: "#000000 !important",
            fontWeight: 700,
          },
          "&:hover": {
            backgroundColor: "#F3F4F6 !important",
            color: "#000000 !important",
          },
        },
      },
    },
  };

  // ============================================================
  // Fetch Functions
  // ============================================================

  // Fetch Contact Messages (no status column or filter)
  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      let url = "/api/contact";
      if (searchContact.trim()) {
        url += `?search=${encodeURIComponent(searchContact.trim())}`;
      }
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load contact messages", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [searchContact]);

  // Fetch Platform Scans
  const fetchScans = useCallback(async () => {
    setLoadingScans(true);
    try {
      const res = await fetch("/api/scans/all", { method: "GET", credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setScans(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load platform scans", err);
    } finally {
      setLoadingScans(false);
    }
  }, []);

  // Fetch Quizzes
  const fetchQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const res = await fetch("/api/quizzes", { method: "GET", credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setQuizzes(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  // Fetch Articles
  const fetchArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/articles", { method: "GET", credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setArticles(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load articles", err);
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  // Initial load when admin user is verified
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchMessages();
      fetchScans();
      fetchQuizzes();
      fetchArticles();
    }
  }, [user, fetchMessages, fetchScans, fetchQuizzes, fetchArticles]);

  // ============================================================
  // Contact Actions
  // ============================================================
  const handleDeleteContact = async (id: number) => {
    if (!window.confirm(`Delete message #${id}?`)) return;
    try {
      const res = await fetch(`/api/contact/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setActionFeedback({ type: "success", message: `Message #${id} deleted successfully.` });
        fetchMessages();
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to delete message." });
    }
  };

  // ============================================================
  // Scan Actions
  // ============================================================
  const handleDeleteScan = async (id: number) => {
    if (!window.confirm(`Delete scan record #${id}?`)) return;
    try {
      const res = await fetch(`/api/scans/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setActionFeedback({ type: "success", message: `Scan #${id} deleted.` });
        fetchScans();
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to delete scan." });
    }
  };

  const getVerdictChip = (verdict: ScanRecord["verdict"]) => {
    switch (verdict) {
      case "HIGH_RISK":
        return <Chip size="small" label="HIGH RISK" sx={{ backgroundColor: "#F87171", color: "#000000", fontWeight: 700 }} />;
      case "SUSPICIOUS":
        return <Chip size="small" label="SUSPICIOUS" sx={{ backgroundColor: "#FBBF24", color: "#000000", fontWeight: 700 }} />;
      case "SAFE":
        return <Chip size="small" label="SAFE" sx={{ backgroundColor: "#34D399", color: "#000000", fontWeight: 700 }} />;
      default:
        return <Chip size="small" label="UNVERIFIED" sx={{ backgroundColor: "#9CA3AF", color: "#000000", fontWeight: 700 }} />;
    }
  };

  // ============================================================
  // Quiz Actions
  // ============================================================
  const handleOpenCreateQuiz = () => {
    setNewQuizTitle("");
    setNewQuizCategory("phishing");
    setNewQuizDesc("");
    setDialogError(null);
    setQuizDialogOpen(true);
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) {
      setDialogError("Please enter a quiz title.");
      return;
    }

    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newQuizTitle.trim(),
          category: newQuizCategory.trim(),
          description: newQuizDesc.trim(),
        }),
      });

      if (res.ok) {
        setActionFeedback({ type: "success", message: "Quiz created successfully!" });
        setQuizDialogOpen(false);
        setNewQuizTitle("");
        setNewQuizDesc("");
        setDialogError(null);
        fetchQuizzes();
      } else {
        const errJson = await res.json();
        setDialogError(errJson.message || "Failed to create quiz.");
      }
    } catch {
      setDialogError("Failed to create quiz. Please try again.");
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!window.confirm(`Delete Quiz #${id} and all its questions?`)) return;
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setActionFeedback({ type: "success", message: `Quiz #${id} deleted successfully.` });
        fetchQuizzes();
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to delete quiz." });
    }
  };

  const handleOpenAddQuestion = (quizId: number) => {
    setActiveQuizIdForQuestion(quizId);
    setNewQuestionText("");
    setNewQuestionExplanation("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setCorrectOptionIdx(0);
    setDialogError(null);
    setQuestionDialogOpen(true);
  };

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizIdForQuestion) return;

    if (!newQuestionText.trim()) {
      setDialogError("Please enter question text.");
      return;
    }

    const options = [
      { option_text: option1.trim(), is_correct: correctOptionIdx === 0 },
      { option_text: option2.trim(), is_correct: correctOptionIdx === 1 },
      { option_text: option3.trim(), is_correct: correctOptionIdx === 2 },
      { option_text: option4.trim(), is_correct: correctOptionIdx === 3 },
    ].filter((o) => o.option_text.length > 0);

    if (options.length < 2) {
      setDialogError("Please provide at least 2 options for the question.");
      return;
    }

    try {
      const res = await fetch(`/api/quizzes/${activeQuizIdForQuestion}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question_text: newQuestionText.trim(),
          explanation: newQuestionExplanation.trim(),
          options,
        }),
      });

      if (res.ok) {
        setActionFeedback({ type: "success", message: "Question added to quiz successfully!" });
        setQuestionDialogOpen(false);
        setDialogError(null);
        fetchQuizzes();
      } else {
        const errJson = await res.json();
        setDialogError(errJson.message || "Failed to add question.");
      }
    } catch {
      setDialogError("Network error. Failed to add question.");
    }
  };

  // ============================================================
  // Article Actions
  // ============================================================
  const handleOpenCreateArticle = () => {
    setEditingArticleId(null);
    setArticleTitle("");
    setArticleCategory("phishing");
    setArticleContent("");
    setDialogError(null);
    setArticleDialogOpen(true);
  };

  const handleOpenEditArticle = (article: ArticleItem) => {
    setEditingArticleId(article.id);
    setArticleTitle(article.title);
    setArticleCategory(article.category);
    setArticleContent(article.content);
    setDialogError(null);
    setArticleDialogOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleContent.trim()) {
      setDialogError("Title and content cannot be empty.");
      return;
    }

    const payload = {
      title: articleTitle.trim(),
      category: articleCategory.trim(),
      content: articleContent.trim(),
    };

    try {
      let res;
      if (editingArticleId) {
        res = await fetch(`/api/articles/${editingArticleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setActionFeedback({
          type: "success",
          message: editingArticleId ? "Article updated successfully!" : "Article created successfully!",
        });
        setArticleDialogOpen(false);
        setDialogError(null);
        fetchArticles();
      } else {
        const errJson = await res.json();
        setDialogError(errJson.message || "Failed to save article.");
      }
    } catch {
      setDialogError("Network error. Failed to save article.");
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm(`Delete Article #${id}?`)) return;
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setActionFeedback({ type: "success", message: `Article #${id} deleted successfully.` });
        fetchArticles();
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to delete article." });
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12, backgroundColor: "#000000", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#E7FE55" }} />
      </Box>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Box sx={{ backgroundColor: "#000000", color: "#FFFFFF", py: 12, minHeight: "calc(100vh - 64px - 180px)" }}>
        <Container maxWidth="sm">
          <Alert severity="warning" sx={{ borderRadius: "12px", mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Administrator Access Required
            </Typography>
            <Typography variant="body2">
              You must be logged in as an <strong>Admin</strong> to view the Admin Dashboard.
            </Typography>
          </Alert>
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{ backgroundColor: "#E7FE55", color: "#000000", fontWeight: 700 }}
            >
              Go to Sign In
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#000000",
        color: "#FFFFFF",
        py: { xs: 5, md: 8 },
        minHeight: "calc(100vh - 64px - 180px)",
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontWeight: 800, fontSize: { xs: "2rem", md: "2.6rem" }, letterSpacing: "-0.5px" }}
            >
              Admin Control Panel
            </Typography>
            <Typography variant="body1" sx={{ color: "#A1A1AA" }}>
              Manage inquiries, view platform scans, and manage quizzes and articles.
            </Typography>
          </Box>
          <Chip
            label={`Admin: ${user.name}`}
            sx={{ backgroundColor: "#E7FE55", color: "#000000", fontWeight: 700, px: 1.5, py: 2, fontSize: "0.95rem" }}
          />
        </Box>

        {actionFeedback && (
          <Alert
            severity={actionFeedback.type}
            sx={{ mb: 3, borderRadius: "8px" }}
            onClose={() => setActionFeedback(null)}
          >
            {actionFeedback.message}
          </Alert>
        )}

        {/* ---------------------------------------------------- */}
        {/* Admin Navigation Tabs */}
        {/* ---------------------------------------------------- */}
        <Box sx={{ borderBottom: 1, borderColor: "rgba(255, 255, 255, 0.2)", mb: 4 }}>
          <Tabs
            value={currentTab}
            onChange={(_, val) => setCurrentTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTab-root": {
                color: "#9CA3AF",
                fontWeight: 700,
                fontSize: { xs: "0.85rem", sm: "1.05rem" },
                textTransform: "none",
                minHeight: "48px",
                minWidth: { xs: "auto", sm: 130 },
                px: { xs: 1.5, sm: 2.5 },
                "&.Mui-selected": {
                  color: "#E7FE55",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#E7FE55",
                height: 3,
              },
            }}
          >
            <Tab label={`Contact Inquiries (${messages.length})`} />
            <Tab label={`Platform Scans (${scans.length})`} />
            <Tab label={`Quizzes (${quizzes.length})`} />
            <Tab label={`Articles (${articles.length})`} />
          </Tabs>
        </Box>

        {/* ==================================================== */}
        {/* TAB 0: CONTACT INQUIRIES (No Status Column / Filter) */}
        {/* ==================================================== */}
        {currentTab === 0 && (
          <Card sx={{ backgroundColor: "#F2F4FE", color: "#000000", borderRadius: "16px", p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#000000" }}>
                Contact Messages & Inquiries
              </Typography>
              <Box sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: 280 } }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search sender, subject, or message..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  sx={lightInputStyles}
                />
              </Box>
            </Box>

            {loadingMessages ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: "#4B5563" }}>
                  No contact messages found.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ backgroundColor: "#FFFFFF", borderRadius: "8px", overflowX: "auto" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#F3F4F6" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 60 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 120 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 220 }}>Sender</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Subject & Message</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 100, textAlign: "right" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messages.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ color: "#6B7280", fontWeight: 600 }}>{item.id}</TableCell>
                        <TableCell sx={{ color: "#374151", whiteSpace: "nowrap" }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6B7280" }}>
                            {item.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                            {item.subject}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#374151", mt: 0.5 }}>
                            {item.message}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleDeleteContact(item.id)}
                            sx={{ color: "#DC2626", fontWeight: 700, "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.08)" } }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 1: PLATFORM SCANS */}
        {/* ==================================================== */}
        {currentTab === 1 && (
          <Card sx={{ backgroundColor: "#F2F4FE", color: "#000000", borderRadius: "16px", p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#000000" }}>
                All Platform Scans
              </Typography>
              <Box sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: 280 } }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Filter by user or message text..."
                  value={searchScans}
                  onChange={(e) => setSearchScans(e.target.value)}
                  sx={lightInputStyles}
                />
              </Box>
            </Box>

            {loadingScans ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : scans.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: "#4B5563" }}>
                  No scans recorded on the platform yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ backgroundColor: "#FFFFFF", borderRadius: "8px", overflowX: "auto" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#F3F4F6" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 60 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 120 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 200 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Message Text</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 140 }}>Verdict</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 90, textAlign: "right" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scans
                      .filter((s) => {
                        if (!searchScans.trim()) return true;
                        const query = searchScans.toLowerCase();
                        return (
                          s.message_text.toLowerCase().includes(query) ||
                          (s.user_name && s.user_name.toLowerCase().includes(query)) ||
                          (s.user_email && s.user_email.toLowerCase().includes(query))
                        );
                      })
                      .map((scan) => (
                        <TableRow key={scan.id} hover>
                          <TableCell sx={{ color: "#6B7280", fontWeight: 600 }}>{scan.id}</TableCell>
                          <TableCell sx={{ color: "#374151", whiteSpace: "nowrap" }}>
                            {new Date(scan.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                              {scan.user_name || "Guest / Anonymous"}
                            </Typography>
                            {scan.user_email && (
                              <Typography variant="caption" sx={{ color: "#6B7280" }}>
                                {scan.user_email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 350 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#374151",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {scan.message_text}
                            </Typography>
                          </TableCell>
                          <TableCell>{getVerdictChip(scan.verdict)}</TableCell>
                          <TableCell sx={{ textAlign: "right" }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleDeleteScan(scan.id)}
                              sx={{ color: "#DC2626", fontWeight: 700, "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.08)" } }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 2: QUIZZES MANAGER (Full CRUD) */}
        {/* ==================================================== */}
        {currentTab === 2 && (
          <Card sx={{ backgroundColor: "#F2F4FE", color: "#000000", borderRadius: "16px", p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#000000" }}>
                Quiz Management
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenCreateQuiz}
                sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700, width: { xs: "100%", sm: "auto" }, "&:hover": { backgroundColor: "#222222" } }}
              >
                + Create New Quiz
              </Button>
            </Box>

            {loadingQuizzes ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : quizzes.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: "#4B5563" }}>
                  No quizzes found. Click "+ Create New Quiz" to add one!
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ backgroundColor: "#FFFFFF", borderRadius: "8px", overflowX: "auto" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#F3F4F6" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 60 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 220 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 140 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827" }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 220, textAlign: "right" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quizzes.map((quiz) => (
                      <TableRow key={quiz.id} hover>
                        <TableCell sx={{ color: "#6B7280", fontWeight: 600 }}>{quiz.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                            {quiz.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={quiz.category.toUpperCase()} sx={{ fontWeight: 700, backgroundColor: "#E0E7FF", color: "#3730A3" }} />
                        </TableCell>
                        <TableCell sx={{ color: "#4B5563" }}>{quiz.description || "—"}</TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenAddQuestion(quiz.id)}
                            sx={{ mr: 1, borderColor: "#000000", color: "#000000", fontWeight: 700, fontSize: "0.75rem" }}
                          >
                            + Question
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            sx={{ color: "#DC2626", fontWeight: 700, fontSize: "0.75rem", "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.08)" } }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {/* ==================================================== */}
        {/* TAB 3: ARTICLES MANAGER (Full CRUD) */}
        {/* ==================================================== */}
        {currentTab === 3 && (
          <Card sx={{ backgroundColor: "#F2F4FE", color: "#000000", borderRadius: "16px", p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#000000" }}>
                Articles Management
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenCreateArticle}
                sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700, width: { xs: "100%", sm: "auto" }, "&:hover": { backgroundColor: "#222222" } }}
              >
                + Create New Article
              </Button>
            </Box>

            {loadingArticles ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : articles.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: "#4B5563" }}>
                  No articles found. Click "+ Create New Article" to add one!
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ backgroundColor: "#FFFFFF", borderRadius: "8px", overflowX: "auto" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#F3F4F6" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 60 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 280 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 140 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", width: 130 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#111827", textAlign: "right" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {articles.map((art) => (
                      <TableRow key={art.id} hover>
                        <TableCell sx={{ color: "#6B7280", fontWeight: 600 }}>{art.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                            {art.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={art.category.toUpperCase()} sx={{ fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E" }} />
                        </TableCell>
                        <TableCell sx={{ color: "#6B7280", whiteSpace: "nowrap" }}>
                          {new Date(art.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenEditArticle(art)}
                            sx={{ mr: 1, borderColor: "#000000", color: "#000000", fontWeight: 700, fontSize: "0.75rem" }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleDeleteArticle(art.id)}
                            sx={{ color: "#DC2626", fontWeight: 700, fontSize: "0.75rem", "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.08)" } }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {/* ==================================================== */}
        {/* DIALOG 1: Create New Quiz */}
        {/* ==================================================== */}
        <Dialog
          open={quizDialogOpen}
          onClose={() => setQuizDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#FFFFFF !important",
              color: "#000000 !important",
              borderRadius: "16px",
              m: { xs: 1.5, sm: 2 },
              width: { xs: "calc(100% - 24px)", sm: "auto" },
              maxHeight: "90vh",
            },
          }}
        >
          <Box component="form" onSubmit={handleCreateQuiz} sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <DialogTitle sx={{ color: "#000000 !important", fontWeight: 800, fontSize: "1.35rem", px: { xs: 1, sm: 3 } }}>
              Create New Quiz
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1, px: { xs: 1, sm: 3 }, overflowY: "auto", flex: 1 }}>
              {dialogError && (
                <Alert severity="error" sx={{ borderRadius: "8px" }}>
                  {dialogError}
                </Alert>
              )}
              <TextField
                required
                fullWidth
                label="Quiz Title"
                placeholder="e.g. Online Banking Scam Awareness"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                sx={dialogInputStyles}
              />
              <FormControl fullWidth size="small" sx={dialogInputStyles}>
                <InputLabel sx={{ color: "#374151 !important" }}>Category</InputLabel>
                <Select
                  value={newQuizCategory}
                  label="Category"
                  onChange={(e) => setNewQuizCategory(e.target.value)}
                  sx={{
                    backgroundColor: "#FFFFFF !important",
                    color: "#000000 !important",
                    "& .MuiSelect-select": {
                      color: "#000000 !important",
                      WebkitTextFillColor: "#000000 !important",
                    },
                  }}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="phishing">Phishing & Fake Links</MenuItem>
                  <MenuItem value="upi">UPI & Online Banking</MenuItem>
                  <MenuItem value="social_media">Social Media & Impersonation</MenuItem>
                  <MenuItem value="general">General Cybersecurity</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Brief summary of what this quiz covers..."
                value={newQuizDesc}
                onChange={(e) => setNewQuizDesc(e.target.value)}
                sx={dialogInputStyles}
              />
            </DialogContent>
            <DialogActions sx={{ px: { xs: 1, sm: 3 }, pb: 2, pt: 1, borderTop: "1px solid #E5E7EB" }}>
              <Button onClick={() => setQuizDialogOpen(false)} sx={{ color: "#4B5563", fontWeight: 600 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700 }}>
                Create Quiz
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* ==================================================== */}
        {/* DIALOG 2: Add Question to Quiz */}
        {/* ==================================================== */}
        <Dialog
          open={questionDialogOpen}
          onClose={() => setQuestionDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#FFFFFF !important",
              color: "#000000 !important",
              borderRadius: "16px",
              m: { xs: 1.5, sm: 2 },
              width: { xs: "calc(100% - 24px)", sm: "auto" },
              maxHeight: "92vh",
            },
          }}
        >
          <Box component="form" onSubmit={handleAddQuestionSubmit} sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column", maxHeight: "92vh" }}>
            <DialogTitle sx={{ color: "#000000 !important", fontWeight: 800, fontSize: { xs: "1.15rem", sm: "1.35rem" }, px: { xs: 1, sm: 3 } }}>
              Add Question to Quiz #{activeQuizIdForQuestion}
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, px: { xs: 1, sm: 3 }, overflowY: "auto", flex: 1 }}>
              {dialogError && (
                <Alert severity="error" sx={{ borderRadius: "8px" }}>
                  {dialogError}
                </Alert>
              )}
              <TextField
                required
                fullWidth
                label="Question Text"
                placeholder="e.g. What should you do if an SMS claims your bank account is blocked?"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                sx={dialogInputStyles}
              />

              <TextField
                fullWidth
                label="Explanation (Shown after answering)"
                placeholder="Explain why the correct answer is safe and what red flags were present..."
                value={newQuestionExplanation}
                onChange={(e) => setNewQuestionExplanation(e.target.value)}
                sx={dialogInputStyles}
              />

              <Box sx={{ mt: 1 }}>
                <FormLabel sx={{ fontWeight: 700, color: "#111827 !important", mb: 1, display: "block" }}>
                  Options (Select the radio button for the CORRECT option):
                </FormLabel>
                <RadioGroup
                  value={correctOptionIdx}
                  onChange={(e) => setCorrectOptionIdx(parseInt(e.target.value, 10))}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FormControlLabel
                          value={0}
                          control={<Radio sx={{ color: "#4B5563", "&.Mui-checked": { color: "#000000 !important" } }} />}
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label="Option 1"
                          value={option1}
                          onChange={(e) => setOption1(e.target.value)}
                          sx={dialogInputStyles}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FormControlLabel
                          value={1}
                          control={<Radio sx={{ color: "#4B5563", "&.Mui-checked": { color: "#000000 !important" } }} />}
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label="Option 2"
                          value={option2}
                          onChange={(e) => setOption2(e.target.value)}
                          sx={dialogInputStyles}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FormControlLabel
                          value={2}
                          control={<Radio sx={{ color: "#4B5563", "&.Mui-checked": { color: "#000000 !important" } }} />}
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Option 3 (Optional)"
                          value={option3}
                          onChange={(e) => setOption3(e.target.value)}
                          sx={dialogInputStyles}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FormControlLabel
                          value={3}
                          control={<Radio sx={{ color: "#4B5563", "&.Mui-checked": { color: "#000000 !important" } }} />}
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Option 4 (Optional)"
                          value={option4}
                          onChange={(e) => setOption4(e.target.value)}
                          sx={dialogInputStyles}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </RadioGroup>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 1, sm: 3 }, pb: 2, pt: 1, borderTop: "1px solid #E5E7EB" }}>
              <Button onClick={() => setQuestionDialogOpen(false)} sx={{ color: "#4B5563", fontWeight: 600 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700 }}>
                Save Question
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* ==================================================== */}
        {/* DIALOG 3: Create / Edit Article */}
        {/* ==================================================== */}
        <Dialog
          open={articleDialogOpen}
          onClose={() => setArticleDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "#FFFFFF !important",
              color: "#000000 !important",
              borderRadius: "16px",
              m: { xs: 1.5, sm: 2 },
              width: { xs: "calc(100% - 24px)", sm: "auto" },
              maxHeight: "92vh",
            },
          }}
        >
          <Box component="form" onSubmit={handleSaveArticle} sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column", maxHeight: "92vh" }}>
            <DialogTitle sx={{ color: "#000000 !important", fontWeight: 800, fontSize: { xs: "1.15rem", sm: "1.35rem" }, px: { xs: 1, sm: 3 } }}>
              {editingArticleId ? `Edit Article #${editingArticleId}` : "Create New Article"}
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1, px: { xs: 1, sm: 3 }, overflowY: "auto", flex: 1 }}>
              {dialogError && (
                <Alert severity="error" sx={{ borderRadius: "8px" }}>
                  {dialogError}
                </Alert>
              )}
              <TextField
                required
                fullWidth
                label="Article Title"
                placeholder="e.g. Recognizing Social Engineering Tactics"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                sx={dialogInputStyles}
              />
              <FormControl fullWidth size="small" sx={dialogInputStyles}>
                <InputLabel sx={{ color: "#374151 !important" }}>Category</InputLabel>
                <Select
                  value={articleCategory}
                  label="Category"
                  onChange={(e) => setArticleCategory(e.target.value)}
                  sx={{
                    backgroundColor: "#FFFFFF !important",
                    color: "#000000 !important",
                    "& .MuiSelect-select": {
                      color: "#000000 !important",
                      WebkitTextFillColor: "#000000 !important",
                    },
                  }}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="phishing">Phishing & Fake Links</MenuItem>
                  <MenuItem value="upi">UPI & Digital Payments</MenuItem>
                  <MenuItem value="social_media">Social Media & Impersonation</MenuItem>
                  <MenuItem value="general">General Cybersecurity</MenuItem>
                </Select>
              </FormControl>
              <TextField
                required
                fullWidth
                multiline
                rows={8}
                label="Article Content"
                placeholder="Write article content with clear paragraphs and points..."
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                sx={dialogInputStyles}
              />
            </DialogContent>
            <DialogActions sx={{ px: { xs: 1, sm: 3 }, pb: 2, pt: 1, borderTop: "1px solid #E5E7EB" }}>
              <Button onClick={() => setArticleDialogOpen(false)} sx={{ color: "#4B5563", fontWeight: 600 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: "#000000", color: "#FFFFFF", fontWeight: 700 }}>
                {editingArticleId ? "Update Article" : "Publish Article"}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

      </Container>
    </Box>
  );
};