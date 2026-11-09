// ============================================================
// AboutPage.tsx — About Us Page Component
// ============================================================
// Layout exactly matching the Excalidraw Wireframe:
//   - Centered "About Us" heading
//   - "Our Goal" section (Heading on left, Goal text on right)
//   - Centered "How ScamSense Helps" heading
//   - Three horizontal Cards on desktop:
//       1. Message & URL Analysis
//       2. Quizzes
//       3. Articles
// ============================================================

import React from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { ArrowForwardIcon } from "../components/common/Icons.js";

export const AboutPage: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#000000",
        color: "#FFFFFF",
        py: { xs: 6, md: 9 },
        minHeight: "calc(100vh - 64px - 200px)",
      }}
    >
      <Container maxWidth="lg">
        
        {/* Centered "About Us" Heading */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: { xs: 6, md: 8 },
            letterSpacing: "-0.5px",
          }}
        >
          About Us
        </Typography>

        {/* "Our Goal" Section: Left label + Right text */}
        <Box sx={{ mb: { xs: 8, md: 10 } }}>
          <Grid container spacing={{ xs: 2, md: 4 }} alignItems="flex-start">
            <Grid item xs={12} md={3}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", md: "1.8rem" },
                  color: "#FFFFFF",
                }}
              >
                Our Goal
              </Typography>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography
                variant="body1"
                sx={{
                  color: "#D4D4D8",
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  lineHeight: 1.8,
                }}
              >
                ScamSense was created to help people identify common digital scams
                and improve their cybersecurity awareness. In a digital world where
                fraudulent messages, fake lotteries, and deceptive links are increasingly
                common, our goal is to provide simple, accessible tools and educational
                resources that empower everyday users to protect themselves online.
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Centered "How ScamSense Helps" Heading */}
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: { xs: 4, md: 6 },
            fontSize: { xs: "1.6rem", md: "2rem" },
          }}
        >
          How ScamSense Helps
        </Typography>

        {/* 3 Horizontal Cards (with flow arrows on desktop) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 3, md: 2 },
          }}
        >
          {/* Card 1: Message & URL Analysis */}
          <Card
            component={Link}
            to="/scan"
            sx={{
              backgroundColor: "#F2F4FE", // Pearl White from DESIGN_SYSTEM.md
              color: "#000000",           // Dark high-contrast text
              borderRadius: "12px",
              width: "100%",
              flex: 1,
              minHeight: "180px",
              textDecoration: "none",
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 6px 20px rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  mb: 1.5,
                  fontSize: "1.1rem",
                }}
              >
                Message & URL Analysis
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#333333",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                Check suspicious messages for known scam patterns and verify
                website links with Google Safe Browsing reputation checks.
              </Typography>
            </CardContent>
          </Card>

          {/* Arrow 1 (Desktop only) */}
          <Box sx={{ display: { xs: "none", md: "flex" }, color: "rgba(255, 255, 255, 0.4)", px: 0.5 }}>
            <ArrowForwardIcon sx={{ fontSize: 28 }} />
          </Box>

          {/* Card 2: Quizzes */}
          <Card
            component={Link}
            to="/quizzes"
            sx={{
              backgroundColor: "#F2F4FE", // Pearl White from DESIGN_SYSTEM.md
              color: "#000000",           // Dark high-contrast text
              borderRadius: "12px",
              width: "100%",
              flex: 1,
              minHeight: "180px",
              textDecoration: "none",
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 6px 20px rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  mb: 1.5,
                  fontSize: "1.1rem",
                }}
              >
                Quizzes
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#333333",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                Practice identifying real-world fraud scenarios and test your
                security instincts through interactive multiple-choice questions.
              </Typography>
            </CardContent>
          </Card>

          {/* Arrow 2 (Desktop only) */}
          <Box sx={{ display: { xs: "none", md: "flex" }, color: "rgba(255, 255, 255, 0.4)", px: 0.5 }}>
            <ArrowForwardIcon sx={{ fontSize: 28 }} />
          </Box>

          {/* Card 3: Articles */}
          <Card
            component={Link}
            to="/articles"
            sx={{
              backgroundColor: "#F2F4FE", // Pearl White from DESIGN_SYSTEM.md
              color: "#000000",           // Dark high-contrast text
              borderRadius: "12px",
              width: "100%",
              flex: 1,
              minHeight: "180px",
              textDecoration: "none",
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 6px 20px rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  mb: 1.5,
                  fontSize: "1.1rem",
                }}
              >
                Articles
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#333333",
                  lineHeight: 1.6,
                  fontSize: "0.95rem",
                }}
              >
                Read clear, beginner-friendly educational articles breaking down
                common phishing methods, UPI fraud, and online safety tips.
              </Typography>
            </CardContent>
          </Card>
        </Box>

      </Container>
    </Box>
  );
};