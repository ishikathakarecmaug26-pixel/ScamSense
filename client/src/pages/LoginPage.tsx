import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useAuth } from "../context/AuthContext.js";

interface LoginPageProps {
  initialTab?: number;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();

  // Tab state: 0 = Login, 1 = Register
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (typeof initialTab === "number") return initialTab;
    return location.pathname === "/register" ? 1 : 0;
  });

  // Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect smoothly via useEffect (never during render)
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string })?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/scan", { replace: true });
      }
    }
  }, [user, location.state, navigate]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      // Redirect admins directly to /admin, and regular users to /scan
      if (result.data?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/scan");
      }
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (registerName.trim().length < 2) {
      setErrorMsg("Name must be at least 2 characters long.");
      return;
    }
    if (!registerEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (registerPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const result = await register(registerName, registerEmail, registerPassword);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      setSuccessMsg(
        "Account created successfully! You can now log in below with your credentials."
      );
      // Switch back to Login tab and pre-fill email
      setLoginEmail(registerEmail);
      setLoginPassword("");
      setActiveTab(0);
    }
  };

  // High-contrast styles for text fields inside light Pearl White card
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
      fontSize: "1rem",
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
        py: { xs: 6, md: 9 },
        minHeight: "calc(100vh - 64px - 180px)",
      }}
    >
      <Container maxWidth="sm">
        
        {/* Centered Page Heading */}
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
          {activeTab === 0 ? "Welcome Back" : "Create Account"}
        </Typography>

        {/* Centered Subtitle */}
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: "#A1A1AA",
            fontSize: { xs: "1.05rem", sm: "1.2rem" },
            mb: { xs: 4, md: 5 },
          }}
        >
          {activeTab === 0
            ? "Log in to view your scan history and admin privileges"
            : "Sign up to track your analyzed scam messages"}
        </Typography>

        {/* Simple & Clean Pearl White Card */}
        <Card
          sx={{
            backgroundColor: "#F2F4FE", // Pearl White matching Contact Page
            color: "#000000",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
          }}
        >
          {/* Tabs to switch between Sign In and Register */}
          <Tabs
            value={activeTab}
            onChange={(_, val) => {
              setActiveTab(val);
              setErrorMsg(null);
            }}
            variant="fullWidth"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              "& .MuiTab-root": {
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                py: 2,
                color: "#4B5563",
                "&.Mui-selected": {
                  color: "#000000",
                  backgroundColor: "#F2F4FE",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#000000",
                height: 3,
              },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Create Account" />
          </Tabs>

          <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
            
            {/* Feedback Alerts */}
            {successMsg && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: "8px" }}>
                {successMsg}
              </Alert>
            )}

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
                {errorMsg}
              </Alert>
            )}

            {/* TAB 0: LOGIN FORM */}
            {activeTab === 0 ? (
              <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email Address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. satyam@example.com"
                    variant="outlined"
                    disabled={loading}
                    sx={lightInputStyles}
                  />

                  <TextField
                    fullWidth
                    required
                    type="password"
                    label="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    variant="outlined"
                    disabled={loading}
                    sx={lightInputStyles}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      backgroundColor: "#000000",
                      color: "#FFFFFF",
                      py: 1.6,
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Signing In...</span>
                      </Box>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  {/* Switch to Register link */}
                  <Box sx={{ textAlign: "center", pt: 1 }}>
                    <Typography variant="body2" sx={{ color: "#4B5563" }}>
                      Don&apos;t have an account yet?{" "}
                      <Button
                        variant="text"
                        onClick={() => {
                          setActiveTab(1);
                          setErrorMsg(null);
                        }}
                        sx={{
                          color: "#000000",
                          fontWeight: 700,
                          p: 0,
                          minWidth: "auto",
                          textDecoration: "underline",
                        }}
                      >
                        Create one here
                      </Button>
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ) : (
              /* TAB 1: REGISTRATION FORM */
              <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Satyam Bhosale"
                    variant="outlined"
                    disabled={loading}
                    sx={lightInputStyles}
                  />

                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email Address"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="e.g. satyam@example.com"
                    variant="outlined"
                    disabled={loading}
                    sx={lightInputStyles}
                  />

                  <TextField
                    fullWidth
                    required
                    type="password"
                    label="Password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="At least 8 characters (1 upper, 1 lower, 1 number)"
                    variant="outlined"
                    disabled={loading}
                    helperText="Must be 8+ chars with uppercase, lowercase, and a number"
                    sx={lightInputStyles}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      backgroundColor: "#000000",
                      color: "#FFFFFF",
                      py: 1.6,
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Creating Account...</span>
                      </Box>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {/* Switch to Login link */}
                  <Box sx={{ textAlign: "center", pt: 1 }}>
                    <Typography variant="body2" sx={{ color: "#4B5563" }}>
                      Already have an account?{" "}
                      <Button
                        variant="text"
                        onClick={() => {
                          setActiveTab(0);
                          setErrorMsg(null);
                        }}
                        sx={{
                          color: "#000000",
                          fontWeight: 700,
                          p: 0,
                          minWidth: "auto",
                          textDecoration: "underline",
                        }}
                      >
                        Sign in here
                      </Button>
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

          </CardContent>
        </Card>

      </Container>
    </Box>
  );
};