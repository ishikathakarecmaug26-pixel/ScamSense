import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { useAuth } from "../context/AuthContext.js";

// Types matching the Phase 4 backend API contract
interface RegexFinding {
  patternName: string;
  matchedText: string;
  explanation: string;
}

interface ThreatReport {
  url: string;
  isThreat: boolean;
  threatDetails?: string;
}

interface GoogleSafeBrowsingReport {
  status:
    | "NOT_CONFIGURED"
    | "NOT_APPLICABLE"
    | "CHECK_COMPLETED"
    | "UNAVAILABLE";
  hasUnsafeUrl: boolean;
  threatReports: ThreatReport[];
}

interface AnalysisData {
  verdict: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "UNVERIFIED";
  regexFindings: RegexFinding[];
  extractedUrls: string[];
  googleSafeBrowsing: GoogleSafeBrowsingReport;
  note: string;
  disclaimer: string;
}

interface ScanHistoryItem {
  id: number;
  message_text: string;
  verdict: "SAFE" | "SUSPICIOUS" | "HIGH_RISK" | "UNVERIFIED";
  created_at: string;
}

export const ScanPage: React.FC = () => {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  // Input message state
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result state
  const [report, setReport] = useState<AnalysisData | null>(null);

  // Scan history state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/scans", {
        method: "GET",
        credentials: "include", // Sends JWT auth cookie
      });
      if (res.ok) {
        const body = await res.json();
        setScanHistory(body.data || []);
      }
    } catch (err) {
      console.error("Could not load scan history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history whenever user changes (or logs in)
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  // Submit message to backend POST /api/analyze
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (messageText.trim().length < 3) {
      setErrorMsg("Please enter at least 3 characters to analyze.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Sends JWT cookie so backend saves scan to scans table
        body: JSON.stringify({ text: messageText }),
      });

      const json = await response.json();

      if (!response.ok) {
        setErrorMsg(json.message || "Failed to analyze message.");
      } else {
        setReport(json.data);
        // If user is authenticated, refresh scan history immediately
        if (user) {
          loadHistory();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMsg(`Unable to connect to analysis server (${msg}).`);
    } finally {
      setLoading(false);
    }
  };

  // Helper for verdict color styling
  const getVerdictBadgeProps = (verdict: AnalysisData["verdict"]) => {
    switch (verdict) {
      case "HIGH_RISK":
        return {
          label: "HIGH RISK",
          bgColor: "#DC2626", // Red
          textColor: "#FFFFFF",
          description:
            "Dangerous threats detected. Do NOT trust or interact with this message.",
        };
      case "SUSPICIOUS":
        return {
          label: "SUSPICIOUS",
          bgColor: "#D97706", // Amber
          textColor: "#FFFFFF",
          description:
            "Common scam patterns identified. Exercise extreme caution.",
        };
      case "UNVERIFIED":
        return {
          label: "UNVERIFIED",
          bgColor: "#4B5563", // Gray
          textColor: "#FFFFFF",
          description:
            "URLs present but could not be verified by Google Safe Browsing.",
        };
      case "SAFE":
      default:
        return {
          label: "SAFE",
          bgColor: "#059669", // Emerald Green
          textColor: "#FFFFFF",
          description:
            "No known scam patterns or unsafe links detected in our checks.",
        };
    }
  };

  // Styling for text fields inside the light Pearl White card
  // Fixes text visibility: black text, visible placeholder and labels
  const lightInputStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#FFFFFF",
      borderRadius: "8px",
      color: "#000000",
      "& fieldset": {
        borderColor: "rgba(0, 0, 0, 0.25)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(0, 0, 0, 0.6)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#000000",
        borderWidth: "2px",
      },
    },
    "& .MuiInputBase-input": {
      color: "#000000 !important",
      WebkitTextFillColor: "#000000 !important",
      fontSize: "0.98rem",
      lineHeight: 1.5,
    },
    "& .MuiInputBase-input::placeholder": {
      color: "#6B7280 !important",
      opacity: 1,
    },
    "& .MuiInputLabel-root": {
      color: "#4B5563 !important",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#000000 !important",
      fontWeight: 600,
    },
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
        {/* Centered Heading */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: 1.5,
            fontSize: { xs: "2rem", sm: "2.6rem", md: "3rem" },
            letterSpacing: "-0.5px",
          }}
        >
          Validate Your Message
        </Typography>

        {/* Centered Subtitle */}
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: "#A1A1AA",
            fontSize: { xs: "1.05rem", sm: "1.2rem" },
            mb: { xs: 4, md: 6 },
          }}
        >
          Check here if msg is a scam or not?
        </Typography>

        {/* ======================================================== */}
        {/* Main Card (Pearl White #F2F4FE) from Wireframe */}
        {/* ======================================================== */}
        <Card
          sx={{
            backgroundColor: "#F2F4FE",
            color: "#000000",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            mb: { xs: 8, md: 10 },
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Grid container spacing={{ xs: 4, md: 5 }}>
              {/* ---------------------------------------------------- */}
              {/* Left Column: Enter Msg */}
              {/* ---------------------------------------------------- */}
              <Grid item xs={12} md={5}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    mb: 2,
                    fontSize: { xs: "1.3rem", md: "1.5rem" },
                  }}
                >
                  Enter Message
                </Typography>

                <Box component="form" onSubmit={handleAnalyze} noValidate>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={8}
                    label="Paste Suspicious Message / SMS / Link"
                    name="messageText"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="e.g. Your electricity will be disconnected tonight at 9:30 PM. Call 9876543210 immediately or click http://testsafebrowsing.appspot.com/s/phishing.html"
                    variant="outlined"
                    disabled={loading}
                    sx={lightInputStyles}
                  />

                  {errorMsg && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: "8px" }}>
                      {errorMsg}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{
                      mt: 3,
                      backgroundColor: "#000000",
                      color: "#FFFFFF",
                      py: 1.5,
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: "8px",
                      "&:hover": {
                        backgroundColor: "#222222",
                      },
                    }}
                  >
                    {loading ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <CircularProgress size={20} color="inherit" />
                        <span>Analyzing Message...</span>
                      </Box>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </Box>
              </Grid>

              {/* ---------------------------------------------------- */}
              {/* Right Column: MSG report */}
              {/* ---------------------------------------------------- */}
              <Grid item xs={12} md={7}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    mb: 2,
                    fontSize: { xs: "1.3rem", md: "1.5rem" },
                  }}
                >
                  Message report
                </Typography>

                {/* If no scan has been performed yet */}
                {!report ? (
                  <Box
                    sx={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      p: 4,
                      minHeight: "260px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      border: "1px dashed rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "#4B5563", mb: 1 }}
                    >
                      No Analysis Yet
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#6B7280", maxWidth: "360px" }}
                    >
                      Paste a message or URL on the left and click{" "}
                      <strong>Analyze</strong> to see regex patterns, Google
                      Safe Browsing results, and risk verdict.
                    </Typography>
                  </Box>
                ) : (
                  /* Two-box layout matching the Excalidraw Wireframe */
                  <Box
                    sx={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid rgba(0, 0, 0, 0.15)",
                      overflow: "hidden",
                    }}
                  >
                    <Grid container>
                      {/* Left Box: Verdict & Risk Level */}
                      <Grid
                        item
                        xs={12}
                        sm={4}
                        sx={{
                          p: 3,
                          backgroundColor: "#F9FAFB",
                          borderRight: { sm: "1px solid rgba(0, 0, 0, 0.12)" },
                          borderBottom: {
                            xs: "1px solid rgba(0, 0, 0, 0.12)",
                            sm: "none",
                          },
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            color: "#6B7280",
                            mb: 1.5,
                          }}
                        >
                          Verdict
                        </Typography>

                        {(() => {
                          const badge = getVerdictBadgeProps(report.verdict);
                          return (
                            <>
                              <Chip
                                label={badge.label}
                                sx={{
                                  backgroundColor: badge.bgColor,
                                  color: badge.textColor,
                                  fontWeight: 800,
                                  fontSize: "0.95rem",
                                  px: 1.5,
                                  py: 2.2,
                                  borderRadius: "8px",
                                  mb: 2,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#374151",
                                  fontSize: "0.85rem",
                                  lineHeight: 1.4,
                                }}
                              >
                                {badge.description}
                              </Typography>
                            </>
                          );
                        })()}
                      </Grid>

                      {/* Right Box: WHY verdict / BODY & DISCLAIMER */}
                      <Grid
                        item
                        xs={12}
                        sm={8}
                        sx={{ p: 3, display: "flex", flexDirection: "column" }}
                      >
                        {/* WHY verdict (Findings & Details) */}
                        <Box sx={{ mb: 2.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: "#000000",
                              textTransform: "uppercase",
                              fontSize: "0.8rem",
                              letterSpacing: "0.5px",
                              mb: 1,
                            }}
                          >
                            Analysis Findings
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ color: "#1F2937", mb: 2, fontWeight: 500 }}
                          >
                            {report.note}
                          </Typography>

                          {/* Regex Findings */}
                          {report.regexFindings.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: "#D97706",
                                  display: "block",
                                  mb: 0.8,
                                }}
                              >
                                Matched Suspicious Pattern(s):
                              </Typography>
                              {report.regexFindings.map((finding, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    backgroundColor: "#FEF3C7",
                                    borderRadius: "6px",
                                    p: 1.5,
                                    mb: 1,
                                    borderLeft: "3px solid #D97706",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, color: "#92400E" }}
                                  >
                                    {finding.patternName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#78350F", display: "block" }}
                                  >
                                    Matched: &ldquo;{finding.matchedText}&rdquo;
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#451A03",
                                      display: "block",
                                      mt: 0.5,
                                    }}
                                  >
                                    {finding.explanation}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Google Safe Browsing Findings */}
                          {report.extractedUrls.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: "#374151",
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                Link Reputation (Google Safe Browsing):
                              </Typography>
                              {report.googleSafeBrowsing.hasUnsafeUrl ? (
                                <Alert
                                  severity="error"
                                  sx={{ py: 0.5, borderRadius: "6px" }}
                                >
                                  Malicious link detected! Do not open these
                                  URLs.
                                </Alert>
                              ) : report.googleSafeBrowsing.status ===
                                "CHECK_COMPLETED" ? (
                                <Alert
                                  severity="success"
                                  sx={{ py: 0.5, borderRadius: "6px" }}
                                >
                                  Google Safe Browsing reports no known threats
                                  for detected links.
                                </Alert>
                              ) : (
                                <Alert
                                  severity="warning"
                                  sx={{ py: 0.5, borderRadius: "6px" }}
                                >
                                  Links detected, but reputation check is
                                  unavailable (
                                  {report.googleSafeBrowsing.status}).
                                </Alert>
                              )}
                            </Box>
                          )}
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* DISCLAIMER Sub-box */}
                        <Box
                          sx={{
                            backgroundColor: "#F3F4F6",
                            borderRadius: "6px",
                            p: 1.5,
                            mt: "auto",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "#4B5563",
                              display: "block",
                            }}
                          >
                            DISCLAIMER:
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#6B7280", lineHeight: 1.4 }}
                          >
                            {report.disclaimer}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* SCAN HISTORY Section from Wireframe */}
        {/* ======================================================== */}
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: 3,
            fontSize: { xs: "1.5rem", md: "2rem" },
            letterSpacing: "-0.5px",
          }}
        >
          SCAN HISTORY
        </Typography>

        <Card
          sx={{
            backgroundColor: "#F2F4FE",
            color: "#000000",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
            mb: 4,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {!isLoggedIn ? (
              /* Guest state message */
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#1F2937", mb: 1 }}
                >
                  Scan History is Available for Logged-In Users
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#4B5563", maxWidth: "480px", mx: "auto" }}
                >
                  You are currently scanning as a guest. When you create an
                  account or log in, all your analyzed messages will
                  automatically be saved here.
                </Typography>
              </Box>
            ) : historyLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : scanHistory.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="body1" sx={{ color: "#4B5563" }}>
                  You haven&apos;t scanned any messages yet. Try analyzing your
                  first message above!
                </Typography>
              </Box>
            ) : (
              /* Logged-in scan history table */
              <TableContainer
                component={Paper}
                sx={{ backgroundColor: "#FFFFFF", borderRadius: "8px" }}
              >
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                        Message Snippet
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                        Verdict
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scanHistory.map((item, index) => {
                      const badge = getVerdictBadgeProps(item.verdict);
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ color: "#6B7280" }}>
                            {index + 1}
                          </TableCell>
                          <TableCell
                            sx={{ color: "#374151", whiteSpace: "nowrap" }}
                          >
                            {new Date(item.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#111827",
                              maxWidth: "320px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.message_text}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={badge.label}
                              sx={{
                                backgroundColor: badge.bgColor,
                                color: badge.textColor,
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
