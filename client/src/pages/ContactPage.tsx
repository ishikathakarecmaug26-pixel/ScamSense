import React, { useState } from "react";
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

export const ContactPage: React.FC = () => {
  // Form input state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // UI state for loading, success, and error feedback
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Styling for text fields inside light Pearl White card
  // Ensures typed text, placeholder, and labels are crisp black with high contrast
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

  // Handle input field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission to Express backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Basic frontend validation before sending
    if (formData.name.trim().length < 2) {
      setErrorMsg("Name must be at least 2 characters long.");
      return;
    }
    if (!formData.email.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }
    if (formData.subject.trim().length < 3) {
      setErrorMsg("Subject must be at least 3 characters long.");
      return;
    }
    if (formData.message.trim().length < 10) {
      setErrorMsg("Message must be at least 10 characters long.");
      return;
    }

    setLoading(true);

    try {
      // POST to backend API (proxied via Vite to http://localhost:5000/api/contact)
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show validation error from Express/Zod
        setErrorMsg(data.message || "Failed to submit message. Please try again.");
      } else {
        // Success: Show confirmation message and clear form fields
        setSuccessMsg(
          "Thank you! Your message has been sent successfully. It is now recorded in our system."
        );
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMsg(
        `Unable to connect to the server (${msg}). Please ensure the backend is running.`
      );
    } finally {
      setLoading(false);
    }
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
      <Container maxWidth="md">
        
        {/* Centered "Contact Us" Title */}
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
          Contact Us
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
          Any Queries? Fill this form
        </Typography>

        {/* Centered Contact Form Card */}
        <Card
          sx={{
            backgroundColor: "#F2F4FE", // Pearl White matching wireframe & theme
            color: "#000000",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
            overflow: "visible",
            maxWidth: "640px",
            mx: "auto",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            
            {/* Success Alert */}
            {successMsg && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                }}
              >
                {successMsg}
              </Alert>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                }}
              >
                {errorMsg}
              </Alert>
            )}

            {/* Contact Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                
                {/* Name Field */}
                <TextField
                  fullWidth
                  required
                  label="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  variant="outlined"
                  disabled={loading}
                  sx={lightInputStyles}
                />

                {/* Email Field */}
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul@example.com"
                  variant="outlined"
                  disabled={loading}
                  sx={lightInputStyles}
                />

                {/* Subject Field */}
                <TextField
                  fullWidth
                  required
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Question about UPI Scam check"
                  variant="outlined"
                  disabled={loading}
                  sx={lightInputStyles}
                />

                {/* Message Field (Multiline Textarea) */}
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="Your Message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message, query, or report here (at least 10 characters)..."
                  variant="outlined"
                  disabled={loading}
                  sx={lightInputStyles}
                />

                {/* Submit Button */}
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
                      <span>Sending Message...</span>
                    </Box>
                  ) : (
                    "Send Message"
                  )}
                </Button>

              </Stack>
            </Box>

          </CardContent>
        </Card>

      </Container>
    </Box>
  );
};