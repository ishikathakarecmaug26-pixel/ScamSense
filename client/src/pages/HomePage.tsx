// ============================================================
// HomePage.tsx — Home Page Component
// ============================================================
// Layout exactly matching the Excalidraw Wireframe:
//   - Left:  Hero Text title + Subtitle
//   - Right: Two stacked CTA buttons:
//              1. Learn More (links to /about)
//              2. Check Scam (primary CTA)
// ============================================================

import React from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";

export const HomePage: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#000000",
        color: "#FFFFFF",
        minHeight: "calc(100vh - 64px - 200px)", // fills space between navbar and footer
        display: "flex",
        alignItems: "center",
        py: { xs: 8, md: 14 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          {/* Left Side: Hero Text title and Subtitle */}
          <Grid item xs={12} md={7}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.4rem" },
                lineHeight: 1.2,
                mb: 2.5,
                color: "#FFFFFF",
                letterSpacing: "-0.5px",
              }}
            >
              Detect Online Scams with Confidence
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "#A1A1AA",
                fontSize: { xs: "1.05rem", sm: "1.2rem" },
                lineHeight: 1.6,
                maxWidth: "520px",
              }}
            >
              A straightforward tool to help you identify deceptive messages,
              spot suspicious links, and improve your cybersecurity awareness.
            </Typography>
          </Grid>

          {/* Right Side: Two Stacked CTA Buttons */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
          >
            <Stack spacing={2.5} sx={{ width: { xs: "100%", sm: "260px" } }}>
              {/* Button 1: Learn More */}
              <Button
                component={Link}
                to="/about"
                variant="outlined"
                fullWidth
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  py: 1.6,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  "&:hover": {
                    borderColor: "#FFFFFF",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                  },
                }}
              >
                Learn More
              </Button>

              {/* Button 2: CTA (check scam) */}
              <Button
                component={Link}
                to="/scan"
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: "#E7FE55",
                  color: "#000000",
                  py: 1.6,
                  fontSize: "1rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "#d4ea45",
                  },
                }}
              >
                Check Scam
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
